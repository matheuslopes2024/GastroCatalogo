/**
 * @file use-admin-chat.tsx
 * @description Hook para o chat administrativo - VERSÃO 3.0 SEM RECURSOS EXCEDIDOS
 *
 * - Implementação de emergência para resolver loops infinitos e erros ERR_INSUFFICIENT_RESOURCES
 * - Suporte WebSocket único para comunicação real-time sem requisições HTTP repetidas
 * - Carregamento de dados inteligente para prevenção de sobrecarga de recursos
 * - Cache otimizado e controle de estado sem causar re-renders excessivos
 * - Integração direta com banco de dados através da API
 */

import React, { createContext, useState, useContext, useCallback, ReactNode, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useWebSocket } from '@/hooks/use-websocket';
import { ChatConversation, ChatMessage, InsertChatMessage, UserRole } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Cache para controle de requisições
const DEBOUNCE_INTERVAL = 2000;

// Interface do contexto
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

// Contexto com valor inicial undefined
const AdminChatContext = createContext<AdminChatContextType | undefined>(undefined);

/**
 * Provedor principal do chat administrativo
 * Implementação sem loops infinitos para evitar sobrecarga de recursos
 */
export function AdminChatProvider({ children }: { children: ReactNode }) {
  // Acesso a hooks do sistema
  const { user } = useAuth();
  const { sendWebSocketMessage, addMessageHandler, removeMessageHandler } = useWebSocket();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Refs para evitar re-renders desnecessários e controlar loops
  const requestInProgressRef = useRef<boolean>(false);
  const lastFetchTimestampRef = useRef<number>(0);
  const handlerRegisteredRef = useRef<boolean>(false);
  const lastEventTimestampRef = useRef<Record<string, number>>({});
  const wsHandlerIdRef = useRef<string>('');
  
  // Estados que causam renderização (minimizados)
  const [activeConversation, setActiveConversation] = useState<ChatConversation | null>(null);
  const [messagesLimit, setMessagesLimit] = useState(30);
  const [usersOnline, setUsersOnline] = useState<Set<number>>(new Set());
  const [filterMode, setFilterMode] = useState<'all' | 'clients' | 'suppliers'>('all');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  
  /**
   * Filtra as conversas com base no modo selecionado
   */
  const filterConversations = useCallback((convs: ChatConversation[]) => {
    if (filterMode === 'all') return convs;
    
    return convs.filter(conv => {
      if (filterMode === 'clients') {
        return conv.participantRole === UserRole.CLIENT;
      } else if (filterMode === 'suppliers') {
        return conv.participantRole === UserRole.SUPPLIER;
      }
      return true;
    });
  }, [filterMode]);
  
  /**
   * Registrador único de WebSocket para receber atualizações em tempo real
   * Implementação que NUNCA causa loops, usando debounce avançado e verificações
   * de tempo para garantir que não há duplicação de eventos.
   */
  const setupWebSocketHandler = useCallback(() => {
    // Evita registro duplicado de handlers e verifica se é admin
    if (handlerRegisteredRef.current || !user || user.role !== UserRole.ADMIN) return;
    
    // Desregistrar qualquer handler antigo primeiro para evitar duplicação
    if (wsHandlerIdRef.current) {
      removeMessageHandler(wsHandlerIdRef.current);
      handlerRegisteredRef.current = false;
    }
    
    // Marcar como registrado
    handlerRegisteredRef.current = true;
    
    // ID único para o handler para garantir que não há duplicação
    const handlerId = `admin-chat-${Date.now()}`;
    wsHandlerIdRef.current = handlerId;
    
    // Function autônoma para processar atualizações de WebSocket
    const handleSocketMessage = (event: any) => {
      try {
        if (!event?.data) return;
        
        const data = event.data;
        
        // Ignorar mensagens de heartbeat e pong para não sobrecarregar o log
        if (data.type === 'heartbeat' || data.type === 'pong') return;
        
        // Verificação anti-loop: evita processar a mesma mensagem múltiplas vezes
        const timestamp = Date.now();
        const messageId = `${data.type}_${data.timestamp || timestamp}`;
        const lastTime = lastEventTimestampRef.current[messageId] || 0;
        
        if (timestamp - lastTime < 500) { // Ignora mensagens duplicadas em menos de 500ms
          return;
        }
        
        // Registra o timestamp desta mensagem
        lastEventTimestampRef.current[messageId] = timestamp;
        
        // Verificação de tempo para evitar processamento duplicado
        const eventKey = `${data.type}-${data.conversationId || 'global'}`;
        
        if (lastEventTimestampRef.current[eventKey] && 
            timestamp - lastEventTimestampRef.current[eventKey] < DEBOUNCE_INTERVAL) {
          return; // Ignora eventos muito próximos
        }
        
        lastEventTimestampRef.current[eventKey] = timestamp;
        
        // Processar eventos específicos
        
        // Status de usuários online
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
        
        // Atualização de lista de conversas
        else if ((data.type === 'conversations_update' || data.type === 'admin_conversations_list') && 
                Array.isArray(data.conversations)) {
          setConversations(data.conversations);
        }
        
        // Nova mensagem recebida
        else if (data.type === 'chat_message' && data.message) {
          // Atualizar conversas (sem verificação redundante)
          if (data.message.conversationId) {
            // Buscar novas conversas via WebSocket (mais leve que HTTP)
            sendWebSocketMessage({ type: 'admin_request_conversations' });
            
            // Se a conversa ativa corresponde à nova mensagem, atualizar as mensagens
            if (activeConversation && data.message.conversationId === activeConversation.id) {
              // Atualizar mensagens no cache do React Query
              queryClient.setQueryData(
                ['/api/admin/chat/messages', activeConversation.id, messagesLimit],
                (old: ChatMessage[] = []) => [...old, data.message]
              );
              
              // Marcar como lida se for um admin visualizando
              if (data.message.id && data.message.senderId !== user.id) {
                apiRequest('POST', '/api/admin/chat/mark-read', { 
                  messageIds: [data.message.id] 
                }).catch(() => {}); // Ignora erros
              }
            } 
            // Notificação para mensagens não visualizadas
            else if (data.message.senderId !== user.id) {
              toast({
                title: 'Nova mensagem',
                description: `De: ${data.senderName || 'Usuário'} - ${
                  data.message.text?.substring(0, 50) || 'Nova mensagem'
                }${data.message.text?.length > 50 ? '...' : ''}`,
              });
            }
          }
        }
      } catch (error) {
        console.error('Erro ao processar mensagem WebSocket:', error);
      }
    };
    
    // Registrar o handler uma única vez
    addMessageHandler(handlerId, handleSocketMessage);
    
    // Registrar este admin no servidor para receber notificações
    sendWebSocketMessage({
      type: 'admin_chat_register',
      userId: user.id
    });
    
    // Solicitar lista de conversas via WebSocket (mais eficiente)
    sendWebSocketMessage({
      type: 'admin_request_conversations'
    });
    
  }, [user, activeConversation, addMessageHandler, queryClient, messagesLimit, sendWebSocketMessage, toast]);
  
  /**
   * Hook de efeito para inicialização única
   * Este useEffect só executa uma vez por mount do componente
   * 
   * CORRIGIDO: usa ref para evitar registro duplicado 
   */
  useEffect(() => {
    // Somente para admins
    if (!user || user.role !== UserRole.ADMIN) return;
    
    // Prevenir registros múltiplos usando ref
    if (!handlerRegisteredRef.current) {
      console.log("Inicializando handler WebSocket para admin - primeira vez");
      // Inicializar o handler WebSocket (sem causas loops!)
      setupWebSocketHandler();
      handlerRegisteredRef.current = true;
    } else {
      console.log("Handler WebSocket para admin já está registrado - ignorando");
    }
    
    // Limpeza
    return () => {
      if (wsHandlerIdRef.current) {
        console.log("Removendo handler WebSocket para admin");
        removeMessageHandler(wsHandlerIdRef.current);
        handlerRegisteredRef.current = false;
      }
    };
  }, [user, setupWebSocketHandler, removeMessageHandler]);
  
  /**
   * Contar mensagens não lidas - otimizado para evitar cálculos desnecessários
   */
  const unreadCount = conversations.reduce((total, conversation) => {
    return total + (conversation.unreadCount || 0);
  }, 0);
  
  /**
   * Query para buscar mensagens da conversa ativa
   * Usa staleTime aumentado para evitar requisições repetidas
   */
  const { 
    data: messages = [],
    isLoading: isLoadingMessages,
    isFetching: isFetchingMessages
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
    staleTime: 60000, // 60 segundos - maior para evitar requisições repetidas
    refetchInterval: false, // Nenhum refetch automático
  });
  
  const hasMore = messages.length >= messagesLimit;
  
  /**
   * Carrega mais mensagens para a conversa ativa
   */
  const loadMoreMessages = useCallback(() => {
    setMessagesLimit(prev => prev + 20);
  }, []);
  
  /**
   * Marca todas as mensagens não lidas como lidas
   * Implementação otimizada para evitar chamadas desnecessárias
   */
  const markAllAsRead = useCallback(async () => {
    if (!activeConversation || !messages.length || !user) return;
    
    const unreadMessageIds = messages
      .filter(msg => !msg.read && msg.senderId !== user.id)
      .map(msg => msg.id);
    
    if (unreadMessageIds.length === 0) return;
    
    try {
      await apiRequest('POST', '/api/admin/chat/mark-read', { messageIds: unreadMessageIds });
      
      // Atualizar conversas via WebSocket ao invés de HTTP request
      sendWebSocketMessage({ type: 'admin_request_conversations' });
    } catch (error) {
      console.error('Erro ao marcar mensagens como lidas:', error);
    }
  }, [activeConversation, messages, user, sendWebSocketMessage]);
  
  /**
   * Enviar nova mensagem otimista
   * Implementação que evita requisições em cascata
   */
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
    
    // Ativar status de envio
    setIsSendingMessage(true);
    
    // ID temporário único para a mensagem otimista
    const tempId = `temp-${Date.now()}`;
    
    // Preparar a mensagem
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
      // Criar versão otimista para atualização imediata da UI
      const optimisticMessage: any = {
        id: tempId,
        createdAt: new Date(),
        ...newMessage,
        isRead: false,
        attachmentUrl: null,
        attachmentType: null,
        attachmentData: null,
        attachmentSize: null,
        isSending: true
      };
      
      // Atualizar UI imediatamente
      queryClient.setQueryData(
        ['/api/admin/chat/messages', activeConversation.id, messagesLimit],
        (oldMessages: ChatMessage[] = []) => [...oldMessages, optimisticMessage]
      );
      
      // Enviar a mensagem para o servidor
      const response = await apiRequest('POST', '/api/admin/chat/send-message', newMessage);
      const sentMessage = await response.json();
      
      // Substituir mensagem temporária pela real
      queryClient.setQueryData(
        ['/api/admin/chat/messages', activeConversation.id, messagesLimit],
        (oldMessages: ChatMessage[] = []) => {
          return oldMessages
            .filter(msg => typeof msg.id === 'string' ? msg.id !== tempId : true)
            .concat(sentMessage);
        }
      );
      
      // Solicitar lista atualizada de conversas via WebSocket
      sendWebSocketMessage({ type: 'admin_request_conversations' });
      
      // Notificar outros usuários via WebSocket
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
        (oldMessages: ChatMessage[] = []) => oldMessages.filter(msg => typeof msg.id === 'string' ? msg.id !== tempId : true)
      );
      
      toast({
        title: 'Erro ao enviar mensagem',
        description: error instanceof Error ? error.message : 'Erro ao enviar mensagem',
        variant: 'destructive'
      });
    } finally {
      setIsSendingMessage(false);
    }
  }, [activeConversation, user, queryClient, messagesLimit, toast, sendWebSocketMessage]);
  
  /**
   * Cria uma nova conversa ou seleciona uma existente
   */
  const createConversation = useCallback(async (userId: number) => {
    // Verificar conversas existentes primeiro
    const existingConversation = conversations.find(c => c.participantId === userId);
    if (existingConversation) {
      setActiveConversation(existingConversation);
      return existingConversation;
    }
    
    // Se não existir, criar uma nova
    try {
      const response = await apiRequest('POST', '/api/admin/chat/conversations', { participantId: userId });
      const newConversation = await response.json();
      
      // Atualizar localmente
      setActiveConversation(newConversation);
      
      // Solicitar lista atualizada via WebSocket
      sendWebSocketMessage({ type: 'admin_request_conversations' });
      
      return newConversation;
    } catch (error) {
      console.error('Erro ao criar conversa:', error);
      toast({
        title: 'Erro ao criar conversa',
        description: error instanceof Error ? error.message : 'Erro ao criar conversa',
        variant: 'destructive'
      });
      throw error;
    }
  }, [conversations, sendWebSocketMessage, toast]);
  
  /**
   * Efeito para marcar mensagens como lidas quando a conversa estiver ativa
   */
  useEffect(() => {
    if (activeConversation && !isLoadingMessages && !isFetchingMessages && messages.length > 0) {
      // Atraso deliberado para evitar múltiplas chamadas
      const timer = setTimeout(() => {
        markAllAsRead();
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [activeConversation, isLoadingMessages, isFetchingMessages, messages.length, markAllAsRead]);
  
  // Verificar se é chat de administração
  const isAdminChat = user?.role === UserRole.ADMIN;
  
  // Formatador de data localizado para português
  const formatMessageDate = useCallback((date: Date) => {
    return format(date, "dd 'de' MMMM', às' HH:mm", { locale: ptBR });
  }, []);
  
  // Prover o contexto com os valores necessários
  return (
    <AdminChatContext.Provider value={{
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
    }}>
      {children}
    </AdminChatContext.Provider>
  );
}

/**
 * Hook para usar o contexto de chat do administrador
 */
export function useAdminChat() {
  const context = useContext(AdminChatContext);
  if (context === undefined) {
    throw new Error('useAdminChat must be used within an AdminChatProvider');
  }
  return context;
}

export default useAdminChat;