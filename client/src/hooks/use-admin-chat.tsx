import React, { createContext, useState, useContext, useCallback, ReactNode, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useWebSocket } from '@/hooks/use-websocket';
import { ChatConversation, ChatMessage, InsertChatMessage, UserRole } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Tipagem para o contexto
type AdminChatContextType = {
  activeConversation: ChatConversation | null;
  messages: ChatMessage[];
  conversations: ChatConversation[];
  unreadCount: number;
  usersOnline: Set<number>;
  sendMessage: (text: string, attachments?: string[]) => Promise<void>;
  loadMoreMessages: () => void;
  setActiveConversation: (conversation: ChatConversation | null) => void;
  hasMore: boolean;
  isLoadingMessages: boolean;
  isLoadingConversations: boolean;
  isAdminChat: boolean;
  markAllAsRead: () => Promise<void>;
  createConversation: (userId: number) => Promise<ChatConversation>;
  filterMode: 'all' | 'clients' | 'suppliers';
  setFilterMode: (mode: 'all' | 'clients' | 'suppliers') => void;
};

const AdminChatContext = createContext<AdminChatContextType | undefined>(undefined);

// Provedor do contexto
export function AdminChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { sendWebSocketMessage, addMessageHandler, removeMessageHandler } = useWebSocket();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeConversation, setActiveConversation] = useState<ChatConversation | null>(null);
  const [messagesLimit, setMessagesLimit] = useState(30);
  const [usersOnline, setUsersOnline] = useState<Set<number>>(new Set());
  const [filterMode, setFilterMode] = useState<'all' | 'clients' | 'suppliers'>('all');

  // Filtragem de conversas baseada no modo selecionado
  const filterConversations = (conversations: ChatConversation[]) => {
    if (filterMode === 'all') return conversations;
    
    return conversations.filter(conv => {
      const participantRole = conv.participantRole;
      if (filterMode === 'clients') {
        return participantRole === UserRole.CLIENT;
      } else if (filterMode === 'suppliers') {
        return participantRole === UserRole.SUPPLIER;
      }
      return true;
    });
  };

  // Obter conversas
  const { 
    data: conversations = [], 
    isLoading: isLoadingConversations 
  } = useQuery({
    queryKey: ['/api/admin/chat/conversations'],
    queryFn: async () => {
      if (!user || user.role !== UserRole.ADMIN) return [];
      
      try {
        const response = await apiRequest('GET', '/api/admin/chat/conversations');
        const data = await response.json();
        return data as ChatConversation[];
      } catch (error) {
        console.error('Erro ao buscar conversas:', error);
        
        // Se falhar, tenta usar o websocket como fallback
        sendWebSocketMessage({
          type: 'admin_request_conversations'
        });
        
        return [];
      }
    },
    enabled: !!user && user.role === UserRole.ADMIN,
    staleTime: 10000, // 10 segundos para reduzir a frequência de requisições
    refetchInterval: 30000, // 30 segundos para refresh periódico
  });

  // Filtrar conversas
  const filteredConversations = filterConversations(conversations);

  // Contar mensagens não lidas
  const unreadCount = conversations.reduce((total, conversation) => {
    return total + (conversation.unreadCount || 0);
  }, 0);

  // Obter mensagens para a conversa ativa
  const { 
    data: messages = [],
    isLoading: isLoadingMessages,
    isFetching: isFetchingMessages,
    refetch: refetchMessages,
  } = useQuery({
    queryKey: ['/api/admin/chat/messages', activeConversation?.id, messagesLimit],
    queryFn: async () => {
      if (!activeConversation) return [];
      
      const response = await apiRequest('GET', `/api/admin/chat/messages?conversationId=${activeConversation.id}&limit=${messagesLimit}`);
      const data = await response.json();
      return data as ChatMessage[];
    },
    enabled: !!activeConversation,
  });

  // Verificar se há mais mensagens para carregar
  const hasMore = messages.length >= messagesLimit;

  // Carregar mais mensagens
  const loadMoreMessages = useCallback(() => {
    setMessagesLimit(prev => prev + 30);
  }, []);

  // Mutação para enviar mensagem
  const sendMessageMutation = useMutation({
    mutationFn: async (newMessage: InsertChatMessage) => {
      const response = await apiRequest('POST', '/api/admin/chat/messages', newMessage);
      return response.json();
    },
    onSuccess: (data: ChatMessage) => {
      queryClient.invalidateQueries({
        queryKey: ['/api/admin/chat/messages', activeConversation?.id]
      });
      queryClient.invalidateQueries({
        queryKey: ['/api/admin/chat/conversations']
      });
      
      // Notificar via WebSocket
      sendWebSocketMessage({
        type: 'admin_chat_message',
        message: data,
        conversationId: data.conversationId,
        recipientId: activeConversation?.participantId ?? 0
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao enviar mensagem',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutação para marcar mensagens como lidas
  const markAsReadMutation = useMutation({
    mutationFn: async (messageIds: number[]) => {
      if (!messageIds.length) return null;
      
      const response = await apiRequest('POST', '/api/admin/chat/mark-read', { messageIds });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/admin/chat/conversations']
      });
    },
  });

  // Marcar todas as mensagens como lidas na conversa ativa
  const markAllAsRead = useCallback(async () => {
    if (!activeConversation) return;
    
    const unreadMessages = messages
      .filter(msg => !msg.read && msg.senderId !== user?.id)
      .map(msg => msg.id);
    
    if (unreadMessages.length > 0) {
      await markAsReadMutation.mutateAsync(unreadMessages);
    }
  }, [activeConversation, messages, markAsReadMutation, user?.id]);

  // Enviar mensagem
  const sendMessage = useCallback(async (text: string, attachments: string[] = []) => {
    if (!activeConversation || !user) return;
    
    const newMessage: InsertChatMessage = {
      conversationId: activeConversation.id,
      senderId: user.id,
      receiverId: activeConversation.participantId ?? 0,
      text,
      message: text, // Campo obrigatório que estava faltando
      attachments,
      read: false,
    };
    
    await sendMessageMutation.mutateAsync(newMessage);
  }, [activeConversation, user, sendMessageMutation]);

  // Mutation para criar nova conversa
  const createConversationMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest('POST', '/api/admin/chat/conversations', { participantId: userId });
      return response.json();
    },
    onSuccess: (data: ChatConversation) => {
      queryClient.invalidateQueries({
        queryKey: ['/api/admin/chat/conversations']
      });
      setActiveConversation(data);
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar conversa',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Função para criar nova conversa
  const createConversation = useCallback(async (userId: number) => {
    // Verificar se já existe conversa com este usuário
    const existingConversation = conversations.find(c => c.participantId === userId);
    if (existingConversation) {
      setActiveConversation(existingConversation);
      return existingConversation;
    }
    
    return await createConversationMutation.mutateAsync(userId);
  }, [conversations, createConversationMutation]);

  // Lidar com eventos de WebSocket
  useEffect(() => {
    // Handler seguro para mensagens
    const handleMessage = (event: any) => {
      try {
        if (!event || typeof event !== 'object') return;
        
        const data = event.data;
        if (!data || typeof data !== 'object') return;
        
        // Atualizar usuários online
        if (data.type === 'user_status' && data.online !== undefined) {
          setUsersOnline(prev => {
            const newSet = new Set(prev);
            if (data.online) {
              newSet.add(data.userId);
            } else {
              newSet.delete(data.userId);
            }
            return newSet;
          });
        }
        
        // Receber nova mensagem de chat (do cliente ou fornecedor)
        if (data.type === 'chat_message' && data.message) {
          queryClient.invalidateQueries({
            queryKey: ['/api/admin/chat/conversations']
          });
          
          if (activeConversation && data.message.conversationId === activeConversation.id) {
            queryClient.invalidateQueries({
              queryKey: ['/api/admin/chat/messages', activeConversation.id]
            });
            
            // Marcar mensagem como lida se a conversa estiver aberta
            if (data.message.id) {
              markAsReadMutation.mutate([data.message.id]);
            }
          } else {
            // Mostrar notificação
            toast({
              title: 'Nova mensagem',
              description: `De: ${data.senderName || 'Usuário'} - ${data.message.text?.substring(0, 50) || 'Nova mensagem'}${data.message.text?.length > 50 ? '...' : ''}`,
            });
          }
        }
        
        // Atualização de conversas
        if (data.type === 'conversations_update' && Array.isArray(data.conversations)) {
          queryClient.setQueryData(
            ['/api/admin/chat/conversations'],
            data.conversations
          );
        }
      } catch (error) {
        console.error('Erro ao processar mensagem WebSocket:', error);
      }
    };
    
    addMessageHandler('adminChat', handleMessage);
    
    // Se for admin, registrar no servidor
    if (user && user.role === UserRole.ADMIN) {
      sendWebSocketMessage({
        type: 'admin_chat_register',
        userId: user.id
      });
      
      // Solicitar atualização de conversas
      sendWebSocketMessage({
        type: 'admin_request_conversations'
      });
    }
    
    return () => {
      removeMessageHandler('adminChat');
    };
  }, [addMessageHandler, removeMessageHandler, sendWebSocketMessage, user, queryClient, activeConversation, markAsReadMutation, toast]);

  // Auto-marcar mensagens como lidas quando a conversa estiver ativa
  useEffect(() => {
    if (activeConversation && !isLoadingMessages && !isFetchingMessages) {
      markAllAsRead();
    }
  }, [activeConversation, messages.length, isLoadingMessages, isFetchingMessages, markAllAsRead]);

  // Determina se este é o chat de administração
  const isAdminChat = user?.role === UserRole.ADMIN;

  // Fornecer contexto
  return (
    <AdminChatContext.Provider 
      value={{
        activeConversation,
        setActiveConversation,
        messages,
        conversations: filteredConversations,
        unreadCount,
        usersOnline,
        sendMessage,
        loadMoreMessages,
        hasMore,
        isLoadingMessages,
        isLoadingConversations,
        isAdminChat,
        markAllAsRead,
        createConversation,
        filterMode,
        setFilterMode
      }}
    >
      {children}
    </AdminChatContext.Provider>
  );
}

// Hook para usar o contexto
export function useAdminChat() {
  const context = useContext(AdminChatContext);
  if (context === undefined) {
    throw new Error('useAdminChat must be used within an AdminChatProvider');
  }
  return context;
}

export default useAdminChat;