/**
 * @file use-admin-chat.tsx
 * @description Hook profissional para gerenciar o chat do painel de administração 
 * *** VERSÃO COMPLETA 2.0 - RECONSTRUÇÃO TOTAL SEM LOOPS ***
 * 
 * Implementa:
 * - Suporte a conversas para clientes e fornecedores
 * - Integração com WebSocket para comunicação em tempo real
 * - Sistema de notificação de novas mensagens
 * - UI otimista para melhor experiência do usuário
 * - Zero loops de requisição ou atualizações em cascata
 * - Formatação de mensagens em português
 */

import React, { createContext, useState, useContext, useCallback, ReactNode, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useWebSocket } from '@/hooks/use-websocket';
import { ChatConversation, ChatMessage, InsertChatMessage, UserRole } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Chave de localStorage para rastrear inicialização
const ADMIN_CHAT_INITIALIZED_KEY = 'adminChatInitialized';

// Tipos para o contexto do chat administrativo
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
  formatMessageDate: (date: Date) => string;
  isSendingMessage: boolean;
};

// Criar contexto com undefined como valor inicial
const AdminChatContext = createContext<AdminChatContextType | undefined>(undefined);

// Provider do contexto
export function AdminChatProvider({ children }: { children: ReactNode }) {
  // Hooks e estados
  const { user } = useAuth();
  const { sendWebSocketMessage, addMessageHandler, removeMessageHandler } = useWebSocket();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Gerenciamento de estado com useRef para evitar loops de renderização
  const isInitializedRef = useRef<boolean>(false);
  const isLoadingRef = useRef<boolean>(false);
  const webSocketHandlerIdRef = useRef<string>('');
  const conversationsRef = useRef<ChatConversation[]>([]);
  const lastProcessedEventsRef = useRef<Record<string, number>>({});
  
  // Estados React que causam renderização
  const [activeConversation, setActiveConversation] = useState<ChatConversation | null>(null);
  const [messagesLimit, setMessagesLimit] = useState(30);
  const [usersOnline, setUsersOnline] = useState<Set<number>>(new Set());
  const [filterMode, setFilterMode] = useState<'all' | 'clients' | 'suppliers'>('all');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  
  // Função para atualizar conversas de forma segura
  const updateConversations = useCallback((newConversations: ChatConversation[]) => {
    // Verifica se há alterações reais antes de atualizar o estado
    if (JSON.stringify(conversationsRef.current) !== JSON.stringify(newConversations)) {
      conversationsRef.current = newConversations;
      setConversations(newConversations);
    }
  }, []);

  // Filtragem de conversas
  const filterConversations = useCallback((conversations: ChatConversation[]) => {
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
  }, [filterMode]);

  // Fetcher de conversas otimizado que não causa loops
  const fetchConversations = useCallback(async (force = false) => {
    // Evita requisições simultâneas
    if (isLoadingRef.current && !force) return;
    
    isLoadingRef.current = true;
    setIsLoadingConversations(true);
    
    try {
      const response = await apiRequest('GET', '/api/admin/chat/conversations');
      const data = await response.json();
      console.log('Conversas carregadas via API:', data.length);
      updateConversations(data);
    } catch (error) {
      console.error('Erro ao buscar conversas:', error);
      
      // Fallback para WebSocket só se for uma falha inicial
      if (force) {
        sendWebSocketMessage({ type: 'admin_request_conversations' });
      }
    } finally {
      isLoadingRef.current = false;
      setIsLoadingConversations(false);
    }
  }, [sendWebSocketMessage, updateConversations]);

  // Inicializador seguro de WebSocket que só executa uma vez
  const initializeWebSocketHandler = useCallback(() => {
    if (!user || user.role !== UserRole.ADMIN || isInitializedRef.current) return;
    
    // Marcar como inicializado
    isInitializedRef.current = true;
    
    // Criar um ID único para o handler
    const handlerId = `adminChat-${Date.now()}`;
    webSocketHandlerIdRef.current = handlerId;
    
    // Handler de eventos WebSocket
    const handleWebSocketMessage = (event: any) => {
      try {
        if (!event?.data || typeof event.data !== 'object') return;
        const data = event.data;
        
        // Debounce básico para evitar reprocessamento
        const eventKey = `${data.type}-${data.conversationId || 'global'}`;
        const now = Date.now();
        if (lastProcessedEventsRef.current[eventKey] && 
            now - lastProcessedEventsRef.current[eventKey] < 1000) {
          return;
        }
        lastProcessedEventsRef.current[eventKey] = now;
        
        // Ignorar logs de heartbeat para não poluir o console
        if (data.type !== 'heartbeat' && data.type !== 'pong') {
          console.log('AdminChat: Evento WebSocket recebido:', data.type);
        }
        
        // Atualizar status de usuários online
        if (data.type === 'user_status' && typeof data.online === 'boolean') {
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
        
        // Atualizar lista de conversas recebida via WebSocket
        if (data.type === 'conversations_update' && Array.isArray(data.conversations)) {
          updateConversations(data.conversations);
        }
        
        // Processar nova mensagem recebida
        if (data.type === 'chat_message' && data.message) {
          // Atualizar lista de conversas após um pequeno delay
          setTimeout(() => fetchConversations(), 300);
          
          // Se a conversa estiver ativa, adicionar a mensagem ao cache
          if (activeConversation && data.message.conversationId === activeConversation.id) {
            // Atualizar cache de mensagens sem fazer nova requisição
            queryClient.setQueryData(
              ['/api/admin/chat/messages', activeConversation.id, messagesLimit],
              (old: ChatMessage[] = []) => [...old, data.message]
            );
            
            // Marcar como lida automaticamente
            if (data.message.id && data.message.senderId !== user?.id) {
              apiRequest('POST', '/api/admin/chat/mark-read', { 
                messageIds: [data.message.id] 
              });
            }
          } 
          // Notificar se for mensagem de outro usuário e conversa não estiver ativa
          else if (data.message.senderId !== user?.id) {
            toast({
              title: 'Nova mensagem',
              description: `De: ${data.senderName || 'Usuário'} - ${
                data.message.text?.substring(0, 50) || 'Nova mensagem'
              }${data.message.text?.length > 50 ? '...' : ''}`,
            });
          }
        }
      } catch (error) {
        console.error('Erro ao processar evento WebSocket:', error);
      }
    };
    
    // Registrar o handler
    addMessageHandler(handlerId, handleWebSocketMessage);
    
    // Registrar o admin para receber notificações
    setTimeout(() => {
      sendWebSocketMessage({
        type: 'admin_chat_register',
        userId: user.id
      });
      
      // Solicitar a lista inicial de conversas
      fetchConversations(true);
    }, 500);
    
  }, [user, addMessageHandler, fetchConversations, sendWebSocketMessage, activeConversation, queryClient, messagesLimit, toast, updateConversations]);
  
  // Inicialização única ao montar o componente
  useEffect(() => {
    if (!user || user.role !== UserRole.ADMIN) return;
    
    // Limpar marcador inicial se existir
    localStorage.removeItem(ADMIN_CHAT_INITIALIZED_KEY);
    
    // Inicializar o sistema
    initializeWebSocketHandler();
    
    return () => {
      // Remover handler ao desmontar
      if (webSocketHandlerIdRef.current) {
        removeMessageHandler(webSocketHandlerIdRef.current);
      }
      
      // Reiniciar estado
      isInitializedRef.current = false;
      isLoadingRef.current = false;
    };
  }, [user, initializeWebSocketHandler, removeMessageHandler]);
  
  // Contar mensagens não lidas
  const unreadCount = conversations.reduce((total, conversation) => {
    return total + (conversation.unreadCount || 0);
  }, 0);

  // Queries e mutations
  const { 
    data: messages = [],
    isLoading: isLoadingMessages,
    isFetching: isFetchingMessages,
  } = useQuery({
    queryKey: ['/api/admin/chat/messages', activeConversation?.id, messagesLimit],
    queryFn: async () => {
      if (!activeConversation) return [];
      
      const response = await apiRequest('GET', 
        `/api/admin/chat/messages?conversationId=${activeConversation.id}&limit=${messagesLimit}`
      );
      return response.json() as Promise<ChatMessage[]>;
    },
    enabled: !!activeConversation,
    staleTime: 30000, // 30 segundos
  });

  // Verificar se há mais mensagens para carregar
  const hasMore = messages.length >= messagesLimit;

  // Carregar mais mensagens
  const loadMoreMessages = useCallback(() => {
    setMessagesLimit(prev => prev + 30);
  }, []);

  // Marcar mensagens como lidas
  const markAsReadMutation = useMutation({
    mutationFn: async (messageIds: number[]) => {
      if (!messageIds.length) return null;
      const response = await apiRequest('POST', '/api/admin/chat/mark-read', { messageIds });
      return response.json();
    },
    onSuccess: () => {
      fetchConversations();
    },
  });

  // Marcar todas as mensagens como lidas
  const markAllAsRead = useCallback(async () => {
    if (!activeConversation || !messages.length) return;
    
    const unreadMessages = messages
      .filter(msg => !msg.read && msg.senderId !== user?.id)
      .map(msg => msg.id);
    
    if (unreadMessages.length > 0) {
      await markAsReadMutation.mutateAsync(unreadMessages);
    }
  }, [activeConversation, messages, markAsReadMutation, user?.id]);

  // Função otimizada para enviar mensagem com UI otimista
  const sendMessage = useCallback(async (text: string, attachments: string[] = []) => {
    if (!activeConversation || !user) return;
    if (!text.trim() && (!attachments || attachments.length === 0)) {
      toast({
        title: 'Mensagem vazia',
        description: 'Não é possível enviar uma mensagem vazia.',
        variant: 'destructive'
      });
      return;
    }
    
    // Ativar animação de envio
    setIsSendingMessage(true);
    
    // Preparar nova mensagem
    const newMessage: InsertChatMessage = {
      conversationId: activeConversation.id,
      senderId: user.id,
      receiverId: activeConversation.participantId ?? 0,
      text,
      message: text,
      attachments,
      read: false,
    };
    
    try {
      // Criar mensagem otimista para UI imediata
      const optimisticMessage: any = {
        id: `temp-${Date.now()}`,
        createdAt: new Date(),
        ...newMessage,
        isRead: false,
        attachmentUrl: null,
        attachmentType: null,
        attachmentData: null,
        attachmentSize: null,
        isSending: true, // Para mostrar indicador de envio
      };
      
      // Atualizar UI imediatamente
      queryClient.setQueryData(
        ['/api/admin/chat/messages', activeConversation.id, messagesLimit], 
        (oldMessages: ChatMessage[] = []) => [...oldMessages, optimisticMessage]
      );
      
      // Enviar para o servidor
      const response = await apiRequest('POST', '/api/admin/chat/send-message', newMessage);
      const sentMessage = await response.json();
      
      // Substituir mensagem temporária pela real
      queryClient.setQueryData(
        ['/api/admin/chat/messages', activeConversation.id, messagesLimit], 
        (oldMessages: ChatMessage[] = []) => {
          return oldMessages
            .filter(msg => msg.id !== optimisticMessage.id)
            .concat(sentMessage);
        }
      );
      
      // Atualizar lista de conversas
      fetchConversations();
      
      // Notificar via WebSocket
      sendWebSocketMessage({
        type: 'admin_chat_message',
        message: sentMessage,
        conversationId: sentMessage.conversationId,
        recipientId: activeConversation.participantId ?? 0,
        senderName: user.name || user.username
      });
      
      return sentMessage;
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      
      // Remover mensagem otimista em caso de erro
      queryClient.setQueryData(
        ['/api/admin/chat/messages', activeConversation.id, messagesLimit], 
        (oldMessages: ChatMessage[] = []) => oldMessages.filter(msg => msg.id !== `temp-${Date.now()}`)
      );
      
      toast({
        title: 'Erro ao enviar mensagem',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      });
    } finally {
      setIsSendingMessage(false);
    }
  }, [activeConversation, user, queryClient, messagesLimit, toast, sendWebSocketMessage, fetchConversations]);

  // Criar nova conversa
  const createConversationMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest('POST', '/api/admin/chat/conversations', { participantId: userId });
      return response.json();
    },
    onSuccess: (data: ChatConversation) => {
      // Atualizar lista de conversas e selecionar a nova
      fetchConversations();
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

  // Criar ou selecionar conversa existente
  const createConversation = useCallback(async (userId: number) => {
    // Verificar se já existe conversa com este usuário
    const existingConversation = conversations.find(c => c.participantId === userId);
    if (existingConversation) {
      setActiveConversation(existingConversation);
      return existingConversation;
    }
    
    // Criar nova conversa
    return await createConversationMutation.mutateAsync(userId);
  }, [conversations, createConversationMutation]);

  // Marcar mensagens como lidas quando a conversa estiver ativa
  useEffect(() => {
    if (activeConversation && !isLoadingMessages && !isFetchingMessages && messages.length > 0) {
      const timeoutId = setTimeout(() => {
        markAllAsRead();
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [activeConversation, isLoadingMessages, isFetchingMessages, messages.length, markAllAsRead]);

  // Verificar se é admin
  const isAdminChat = user?.role === UserRole.ADMIN;
  
  // Formatador de data
  const formatMessageDate = useCallback((date: Date) => {
    return format(date, "dd 'de' MMMM', às' HH:mm", { locale: ptBR });
  }, []);

  // Fornecer contexto
  return (
    <AdminChatContext.Provider 
      value={{
        activeConversation,
        setActiveConversation,
        messages,
        conversations: filterConversations(conversations),
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
        setFilterMode,
        formatMessageDate,
        isSendingMessage
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