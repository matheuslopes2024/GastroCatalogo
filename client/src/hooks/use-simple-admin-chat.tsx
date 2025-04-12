/**
 * @file use-simple-admin-chat.tsx
 * @description Hook simplificado para o chat administrativo
 */

import { createContext, ReactNode, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ChatConversation, ChatMessage, UserRole } from '@shared/schema';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { format, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Tipo do contexto de chat admin
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
  refreshConversations: () => void;
  deleteConversation: (conversationId: number) => Promise<void>;
};

// Criar contexto
const AdminChatContext = createContext<AdminChatContextType | null>(null);

/**
 * Provedor do chat administrativo simplificado
 */
export function SimpleAdminChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Estado
  const [activeConversation, setActiveConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [usersOnline, setUsersOnline] = useState<Set<number>>(new Set());
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [messagesLimit, setMessagesLimit] = useState<number>(30);
  const [filterMode, setFilterMode] = useState<'all' | 'clients' | 'suppliers'>('all');
  const [isSendingMessage, setIsSendingMessage] = useState<boolean>(false);
  
  // Refs para controle de estado
  const messageUpdateTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Verificar se o usuário está autenticado e é um administrador
  const isAdminChat = Boolean(user && user.role === UserRole.ADMIN);
  
  /**
   * Efeito para buscar conversas quando o usuário está autenticado
   */
  useEffect(() => {
    if (!isAdminChat) return;
    
    // Buscar conversas iniciais
    refreshConversations();
    
    // Configurar timer para atualização periódica
    const intervalId = setInterval(() => {
      refreshConversations();
    }, 10000);
    
    // Limpar ao desmontar
    return () => {
      clearInterval(intervalId);
    };
  }, [isAdminChat]);
  
  /**
   * Função para calcular o número total de mensagens não lidas
   */
  const calculateUnreadCount = useCallback(() => {
    return conversations.reduce((total: number, conversation: ChatConversation) => {
      return total + (conversation.unreadCount || 0);
    }, 0);
  }, [conversations]);
  
  /**
   * Efeito para buscar mensagens quando a conversa ativa muda
   */
  useEffect(() => {
    if (!activeConversation || !isAdminChat) return;
    
    // Buscar mensagens da conversa ativa
    setIsLoadingMessages(true);
    
    try {
      // Buscar mensagens do servidor para a conversa ativa
      apiRequest('GET', `/api/admin/chat/messages/${activeConversation.id}?limit=${messagesLimit}`)
        .then(res => res.json())
        .then(data => {
          if (activeConversation && data) {
            // Atualizar mensagens no estado
            setMessages(data);
            setHasMore(data.length >= messagesLimit);
            setIsLoadingMessages(false);
          }
        })
        .catch(error => {
          setIsLoadingMessages(false);
          setMessages([]);
          console.error('Erro ao buscar mensagens:', error);
        });
    } catch (error) {
      setIsLoadingMessages(false);
      console.error('Erro ao processar busca de mensagens:', error);
    }
  }, [activeConversation, isAdminChat, messagesLimit]);
  
  /**
   * Função para carregar mais mensagens (conversa infinita para cima)
   */
  const loadMoreMessages = useCallback(() => {
    if (!activeConversation || isLoadingMessages || !hasMore) {
      return;
    }
    
    // Aumentar o limite para buscar mais mensagens
    setMessagesLimit((prev: number) => prev + 20);
  }, [activeConversation, isLoadingMessages, hasMore]);
  
  /**
   * Formatar data da mensagem
   */
  const formatMessageDate = useCallback((date: Date) => {
    if (isToday(date)) {
      return `Hoje às ${format(date, 'HH:mm')}`;
    } else if (isYesterday(date)) {
      return `Ontem às ${format(date, 'HH:mm')}`;
    } else {
      return format(date, "d 'de' MMMM 'às' HH:mm", { locale: ptBR });
    }
  }, []);
  
  /**
   * Função para buscar todas as conversas
   */
  const refreshConversations = useCallback(() => {
    if (!isAdminChat || isLoadingConversations) return;
    
    console.log('[AdminChat] Buscando conversas...');
    setIsLoadingConversations(true);
    
    try {
      apiRequest('GET', '/api/admin/chat/conversations')
        .then(res => res.json())
        .then(data => {
          setConversations(data);
          
          // Se tivermos uma conversa ativa, atualizá-la com os novos dados
          if (activeConversation) {
            const updatedActiveConversation = data.find((c: ChatConversation) => c.id === activeConversation.id);
            if (updatedActiveConversation) {
              setActiveConversation(updatedActiveConversation);
            }
          }
        })
        .catch(error => {
          console.error('Erro ao buscar conversas:', error);
        })
        .finally(() => {
          setIsLoadingConversations(false);
        });
    } catch (error) {
      console.error('Erro ao processar busca de conversas:', error);
      setIsLoadingConversations(false);
      toast({
        title: 'Erro ao buscar conversas',
        description: 'Não foi possível carregar as conversas',
        variant: 'destructive'
      });
    }
  }, [isLoadingConversations, activeConversation, isAdminChat, toast]);
  
  /**
   * Função para enviar uma mensagem
   */
  const sendMessage = useCallback(async (text: string, attachments: string[] = []) => {
    if (!activeConversation) return;
    
    setIsSendingMessage(true);
    
    try {
      // Preparar dados da mensagem
      const messageData = {
        conversationId: activeConversation.id,
        text,
        senderId: user?.id,
        receiverId: activeConversation.participantId,
        attachments
      };
      
      // Enviar mensagem para o servidor
      const response = await apiRequest('POST', '/api/admin/chat/messages', messageData);
      const newMessage = await response.json();
      
      // Adicionar a nova mensagem à lista e atualizar conversas
      setMessages((prev: ChatMessage[]) => [...prev, newMessage]);
      refreshConversations();
      
      // Evento customizado para notificar componentes sobre nova mensagem
      const event = new CustomEvent('admin-chat:messages-updated', {
        detail: { messageId: newMessage.id, conversationId: activeConversation.id }
      });
      window.dispatchEvent(event);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: 'Erro ao enviar mensagem',
        description: 'A mensagem não pôde ser enviada. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setIsSendingMessage(false);
    }
  }, [activeConversation, user, refreshConversations, toast]);
  
  /**
   * Filtrar conversas com base no modo selecionado
   */
  const filteredConversations = useMemo(() => {
    if (filterMode === 'all') {
      return conversations;
    } else if (filterMode === 'clients') {
      return conversations.filter((c: ChatConversation) => c.participantRole === UserRole.CLIENT);
    } else {
      return conversations.filter((c: ChatConversation) => c.participantRole === UserRole.SUPPLIER);
    }
  }, [conversations, filterMode]);
  
  /**
   * Função para marcar todas as mensagens como lidas
   */
  const markAllAsRead = useCallback(async () => {
    if (!activeConversation) return;
    
    try {
      await apiRequest('POST', '/api/admin/chat/mark-read', {
        conversationId: activeConversation.id
      });
      
      // Atualizar mensagens localmente
      setMessages((prev: ChatMessage[]) => prev.map((m: ChatMessage) => ({
        ...m,
        isRead: true,
        read: true
      })));
      
      toast({
        title: 'Mensagens atualizadas',
        description: 'Todas as mensagens foram marcadas como lidas',
      });
      
      // Atualizar lista de conversas para refletir mudanças
      refreshConversations();
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
      toast({
        title: 'Erro ao atualizar mensagens',
        description: 'Não foi possível marcar as mensagens como lidas',
        variant: 'destructive'
      });
    }
  }, [activeConversation, refreshConversations, toast]);
  
  /**
   * Criar uma nova conversa com um usuário
   */
  const createConversation = useCallback(async (userId: number) => {
    try {
      // Verificar se já existe uma conversa com este usuário
      const existingConversation = conversations.find((c: ChatConversation) => c.participantId === userId);
      
      if (existingConversation) {
        setActiveConversation(existingConversation);
        return existingConversation;
      }
      
      // Criar nova conversa
      const response = await apiRequest('POST', '/api/admin/chat/conversations', { participantId: userId });
      const newConversation = await response.json();
      
      // Atualizar estado e selecionar a nova conversa
      setActiveConversation(newConversation);
      refreshConversations();
      
      return newConversation;
    } catch (error) {
      console.error('Erro ao criar conversa:', error);
      toast({
        title: 'Erro ao criar conversa',
        description: 'Não foi possível iniciar uma nova conversa',
        variant: 'destructive'
      });
      
      throw error;
    }
  }, [conversations, refreshConversations, toast]);
  
  /**
   * Função para excluir uma conversa
   */
  const deleteConversation = useCallback(async (conversationId: number) => {
    try {
      await apiRequest('DELETE', `/api/admin/chat/conversations/${conversationId}`);
      
      // Se a conversa excluída for a ativa, limpar a seleção
      if (activeConversation && activeConversation.id === conversationId) {
        setActiveConversation(null);
      }
      
      // Atualizar lista de conversas
      setConversations((prev: ChatConversation[]) => prev.filter((c: ChatConversation) => c.id !== conversationId));
      
      toast({
        title: 'Conversa excluída',
        description: 'A conversa foi removida com sucesso',
      });
      
      // Invalidar cache de consultas
      queryClient.invalidateQueries({
        queryKey: ['/api/admin/chat/conversations']
      });
      
      return refreshConversations();
    } catch (error) {
      console.error('Erro ao excluir conversa:', error);
      
      // Exibir erro, mas ainda assim atualizar a lista, pois 
      // frequentemente o backend exclui corretamente mesmo com erros na resposta
      toast({
        title: 'Aviso',
        description: 'A conversa pode ter sido excluída, mas houve um erro na resposta',
        variant: 'default'
      });
      
      // Tentar atualizar lista mesmo assim
      refreshConversations();
    }
  }, [activeConversation, refreshConversations, toast]);
  
  // Limpar recursos ao desmontar
  useEffect(() => {
    return () => {
      if (messageUpdateTimerRef.current) {
        clearTimeout(messageUpdateTimerRef.current);
      }
    };
  }, []);
  
  // Objeto de contexto com todos os métodos e dados
  const chatContextValue = {
    activeConversation,
    setActiveConversation,
    messages,
    conversations: filteredConversations,
    unreadCount: calculateUnreadCount(),
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
    isSendingMessage,
    refreshConversations,
    deleteConversation,
  };
  
  return <AdminChatContext.Provider value={chatContextValue}>
    {children}
  </AdminChatContext.Provider>;
}

/**
 * Hook para usar o contexto de chat do administrador
 */
export function useSimpleAdminChat() {
  const context = useContext(AdminChatContext);
  if (!context) {
    throw new Error('useSimpleAdminChat deve ser usado dentro de SimpleAdminChatProvider');
  }
  return context;
}