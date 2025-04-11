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

  // Estado local para conversas para evitar o loop infinito de requests
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  
  // Carregar conversas uma vez e via WebSocket
  useEffect(() => {
    if (!user || user.role !== UserRole.ADMIN) return;
    
    const fetchConversations = async () => {
      setIsLoadingConversations(true);
      try {
        const response = await apiRequest('GET', '/api/admin/chat/conversations');
        const data = await response.json();
        console.log('Conversas carregadas via API:', data.length);
        setConversations(data);
      } catch (error) {
        console.error('Erro ao buscar conversas:', error);
        
        // Se falhar, tenta usar o websocket como fallback
        sendWebSocketMessage({
          type: 'admin_request_conversations'
        });
        
        // Não faz retry automático
      } finally {
        setIsLoadingConversations(false);
      }
    };
    
    // Busca inicial
    fetchConversations();
    
    // Configura um refresh periódico de 30 segundos
    const interval = setInterval(() => {
      fetchConversations();
    }, 60000); // 1 minuto
    
    return () => clearInterval(interval);
  }, [user, sendWebSocketMessage]);

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
      // Atualizar conversas manualmente sem usar queryClient
      apiRequest('GET', '/api/admin/chat/conversations')
        .then(response => response.json())
        .then(conversations => {
          console.log('Conversas atualizadas após marcar mensagens como lidas:', conversations.length);
          setConversations(conversations);
        })
        .catch(error => {
          console.error('Erro ao recarregar conversas:', error);
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

  // Enviar mensagem - implementação modificada para evitar requisições em cascata
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
    
    try {
      // Enviar mensagem diretamente sem usar mutação para evitar invalidações
      const response = await apiRequest('POST', '/api/admin/chat/send-message', newMessage);
      const sentMessage = await response.json();
      
      // Atualizar estado local de mensagens manualmente
      const updatedMessages = [...messages, sentMessage];
      queryClient.setQueryData(['/api/admin/chat/messages', activeConversation.id, messagesLimit], updatedMessages);
      
      // Atualizar lista de conversas manualmente
      apiRequest('GET', '/api/admin/chat/conversations')
        .then(response => response.json())
        .then(conversations => {
          console.log('Conversas atualizadas após enviar mensagem:', conversations.length);
          setConversations(conversations);
        })
        .catch(error => {
          console.error('Erro ao recarregar conversas após enviar mensagem:', error);
        });
        
      return sentMessage;
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: 'Erro ao enviar mensagem',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      });
      throw error;
    }
  }, [activeConversation, user, messages, queryClient, messagesLimit, toast]);

  // Mutation para criar nova conversa
  const createConversationMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest('POST', '/api/admin/chat/conversations', { participantId: userId });
      return response.json();
    },
    onSuccess: (data: ChatConversation) => {
      // Atualizar conversas manualmente sem invalidar queries
      apiRequest('GET', '/api/admin/chat/conversations')
        .then(response => response.json())
        .then(conversations => {
          console.log('Conversas atualizadas após criar conversa:', conversations.length);
          setConversations(conversations);
          setActiveConversation(data);
        })
        .catch(error => {
          console.error('Erro ao recarregar conversas após criar conversa:', error);
          // Ainda define a conversa ativa mesmo se falhar a atualização da lista
          setActiveConversation(data);
        });
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
          // Atualizar conversas diretamente
          apiRequest('GET', '/api/admin/chat/conversations')
            .then(response => response.json())
            .then(conversations => {
              console.log('Conversas recarregadas após nova mensagem:', conversations.length);
              setConversations(conversations);
            })
            .catch(error => {
              console.error('Erro ao recarregar conversas:', error);
            });
          
          if (activeConversation && data.message.conversationId === activeConversation.id) {
            // Atualizar mensagens diretamente
            apiRequest('GET', `/api/admin/chat/messages?conversationId=${activeConversation.id}&limit=${messagesLimit}`)
              .then(response => response.json())
              .then(messages => {
                console.log('Mensagens atualizadas após nova mensagem:', messages.length);
                queryClient.setQueryData(
                  ['/api/admin/chat/messages', activeConversation.id, messagesLimit],
                  messages
                );
              })
              .catch(error => {
                console.error('Erro ao recarregar mensagens:', error);
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
          console.log('Conversas atualizadas via WebSocket:', data.conversations.length);
          setConversations(data.conversations);
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
  // Removido o useEffect disparado por mudanças em messages.length para evitar loop
  useEffect(() => {
    if (activeConversation && !isLoadingMessages && !isFetchingMessages) {
      markAllAsRead();
    }
  }, [activeConversation, isLoadingMessages, isFetchingMessages, markAllAsRead]);

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