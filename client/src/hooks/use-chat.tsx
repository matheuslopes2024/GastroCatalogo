import { 
  createContext, 
  useContext, 
  ReactNode, 
  useState, 
  useEffect,
  useCallback,
  useMemo,
  useRef
} from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { UserRole } from "@shared/schema";
import { useWebSocket, WebSocketMessage } from "@/hooks/use-websocket";

export interface ChatMessage {
  id: number;
  message: string;
  createdAt: Date;
  senderId: number;
  receiverId: number;
  conversationId: number | null;
  isRead: boolean;
  attachmentUrl: string | null;
  attachmentType: string | null;
  attachmentData: string | null;
  attachmentSize: number | null;
}

export interface ChatConversation {
  id: number;
  participantIds: number[];
  lastMessageId: number | null;
  lastActivityAt: Date;
  subject: string | null;
  isActive: boolean;
  createdAt: Date;
  _lastMessage?: ChatMessage;
  _participants?: {
    id: number;
    name: string;
    username: string;
    email: string;
    role: string;
    companyName: string | null;
    unreadCount?: number;
  }[];
}

export interface Attachment {
  data: string;
  type: string;
  name: string;
  size: number;
}

type ChatContextType = {
  isOpen: boolean;
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  activeConversation: ChatConversation | null;
  activeConversationId?: number; // Para compatibilidade com componentes existentes
  setActiveConversation: (conversation: ChatConversation | null) => void;
  conversations: ChatConversation[];
  messages: ChatMessage[];
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  sendMessage: (message: string, attachment?: Attachment) => Promise<void>;
  markMessagesAsRead: (messageIds: number[]) => Promise<void>;
  startNewConversation: (receiverId: number, initialMessage: string, attachment?: Attachment) => Promise<void>;
  startConversationWithAdmin: (initialMessage: string, attachment?: Attachment) => Promise<void>;
  refreshConversations: () => void;
  refreshMessages: () => void;
  unreadCount: number;
  conversationType: "all" | "user" | "supplier";
  setConversationType: (type: "all" | "user" | "supplier") => void;
  openChatWithAdmin: () => void; // Novo método para abrir chat com admin diretamente
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [activeConversation, setActiveConversation] = useState<ChatConversation | null>(null);
  const [conversationType, setConversationType] = useState<"all" | "user" | "supplier">("all");
  
  // Integração com WebSocket
  const { 
    connected: wsConnected, 
    sendMessage: wsSendMessage, 
    lastMessage: wsLastMessage,
    connectionError: wsError
  } = useWebSocket();
  const lastHandledMessageId = useRef<string | null>(null);

  const { 
    data: conversations = [], 
    isLoading: isLoadingConversations,
    refetch: refreshConversations
  } = useQuery({
    queryKey: ["/api/chat/conversations"],
    queryFn: async () => {
      if (!user) return [];
      const res = await apiRequest("GET", "/api/chat/conversations");
      const data = await res.json();
      return data;
    },
    enabled: !!user,
  });

  const { 
    data: messages = [], 
    isLoading: isLoadingMessages,
    refetch: refreshMessages
  } = useQuery({
    queryKey: ["/api/chat/messages", activeConversation?.id],
    queryFn: async () => {
      if (!user || !activeConversation) return [];
      const res = await apiRequest(
        "GET", 
        `/api/chat/messages?conversationId=${activeConversation.id}`
      );
      const data = await res.json();
      return data;
    },
    enabled: !!user && !!activeConversation,
  });

  // Filtrar conversas com base no tipo selecionado (para administradores)
  const filteredConversations = useMemo(() => {
    if (!user || user.role !== UserRole.ADMIN || conversationType === "all") {
      return conversations;
    }

    return conversations.filter(conversation => {
      const participants = conversation._participants || [];
      if (conversationType === "supplier") {
        return participants.some(p => p.role === UserRole.SUPPLIER);
      } else if (conversationType === "user") {
        return participants.every(p => p.role !== UserRole.SUPPLIER);
      }
      return true;
    });
  }, [conversations, conversationType, user]);

  // Calcular o número total de mensagens não lidas
  const unreadCount = useMemo(() => {
    return filteredConversations.reduce((total, conv) => {
      const unreadCount = conv._participants?.find(p => p.id !== user?.id)?.unreadCount || 0;
      return total + unreadCount;
    }, 0);
  }, [filteredConversations, user?.id]);

  const openChat = useCallback(() => setIsOpen(true), []);
  const closeChat = useCallback(() => setIsOpen(false), []);
  const toggleChat = useCallback(() => setIsOpen(prev => !prev), []);

  // Enviar mensagem
  const sendMessageMutation = useMutation({
    mutationFn: async ({ 
      message, 
      conversationId, 
      receiverId,
      attachment
    }: { 
      message: string; 
      conversationId?: number; 
      receiverId?: number;
      attachment?: Attachment;
    }) => {
      if (!user) throw new Error("Usuário não autenticado");
      
      const payload: any = {
        message,
        senderId: user.id,
      };
      
      if (conversationId) {
        payload.conversationId = conversationId;
      }
      
      if (receiverId) {
        payload.receiverId = receiverId;
      }
      
      if (attachment) {
        payload.attachmentData = attachment.data;
        payload.attachmentType = attachment.type;
        payload.attachmentSize = attachment.size;
      }
      
      const res = await apiRequest("POST", "/api/chat/messages", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/messages", activeConversation?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/conversations"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao enviar mensagem",
        description: error.message || "Ocorreu um erro ao enviar sua mensagem",
        variant: "destructive",
      });
    },
  });

  // Iniciar nova conversa
  const startConversationMutation = useMutation({
    mutationFn: async ({ 
      receiverId, 
      message,
      attachment
    }: { 
      receiverId: number; 
      message: string;
      attachment?: Attachment;
    }) => {
      if (!user) throw new Error("Usuário não autenticado");
      
      // 1. Criar conversa
      const conversationRes = await apiRequest("POST", "/api/chat/conversations", {
        participantIds: [user.id, receiverId],
      });
      
      const conversation = await conversationRes.json();
      
      // 2. Enviar mensagem inicial
      const messagePayload: any = {
        message,
        senderId: user.id,
        receiverId,
        conversationId: conversation.id,
      };
      
      if (attachment) {
        messagePayload.attachmentData = attachment.data;
        messagePayload.attachmentType = attachment.type;
        messagePayload.attachmentSize = attachment.size;
      }
      
      await apiRequest("POST", "/api/chat/messages", messagePayload);
      
      return conversation;
    },
    onSuccess: (data) => {
      setActiveConversation(data);
      queryClient.invalidateQueries({ queryKey: ["/api/chat/conversations"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao iniciar conversa",
        description: error.message || "Ocorreu um erro ao iniciar a conversa",
        variant: "destructive",
      });
    },
  });

  // Marcar mensagens como lidas
  const markAsReadMutation = useMutation({
    mutationFn: async (messageIds: number[]) => {
      if (!messageIds.length) return;
      
      await apiRequest("POST", "/api/chat/messages/read", { messageIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/conversations"] });
    }
  });

  // Marcar mensagens não lidas como lidas quando a conversa é aberta
  useEffect(() => {
    if (!activeConversation || !messages.length) return;
    
    const unreadMessages = messages.filter(
      m => !m.isRead && m.senderId !== user?.id
    );
    
    if (unreadMessages.length > 0) {
      const messageIds = unreadMessages.map(m => m.id);
      markAsReadMutation.mutate(messageIds);
    }
  }, [activeConversation, messages, user?.id, markAsReadMutation]);
  
  // Integrar com WebSocket para notificações em tempo real
  useEffect(() => {
    if (!wsConnected || !user) return;
    
    // Avisar ao servidor que este cliente está pronto para receber mensagens
    wsSendMessage({ 
      type: "chat_register",
      userId: user.id
    });
    
  }, [wsConnected, user, wsSendMessage]);
  
  // Processar mensagens recebidas por WebSocket
  useEffect(() => {
    if (!wsLastMessage || !user) return;
    
    // Garantir que não processamos a mesma mensagem duas vezes
    const messageId = `${wsLastMessage.type}_${wsLastMessage.timestamp || Date.now()}`;
    if (lastHandledMessageId.current === messageId) return;
    lastHandledMessageId.current = messageId;
    
    // Processar diferentes tipos de mensagens
    if (wsLastMessage.type === "new_message") {
      // Recebemos uma nova mensagem
      queryClient.invalidateQueries({ queryKey: ["/api/chat/messages", activeConversation?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/conversations"] });
      
      // Se a mensagem for para a conversa ativa, marcá-la como lida
      if (activeConversation && wsLastMessage.conversationId === activeConversation.id) {
        if (wsLastMessage.messageId) {
          markAsReadMutation.mutate([wsLastMessage.messageId]);
        }
      }
    } else if (wsLastMessage.type === "message_read") {
      // Alguém leu uma mensagem
      queryClient.invalidateQueries({ queryKey: ["/api/chat/conversations"] });
    } else if (wsLastMessage.type === "conversation_update") {
      // Uma conversa foi atualizada
      queryClient.invalidateQueries({ queryKey: ["/api/chat/conversations"] });
    }
    
  }, [wsLastMessage, activeConversation, user, queryClient, markAsReadMutation]);

  // Métodos de interface pública
  const sendMessage = useCallback(async (message: string, attachment?: Attachment) => {
    if (!activeConversation) {
      throw new Error("Nenhuma conversa ativa");
    }
    
    if (!message.trim() && !attachment) {
      throw new Error("Mensagem vazia");
    }
    
    const otherParticipant = activeConversation._participants?.find(p => p.id !== user?.id);
    if (!otherParticipant) {
      throw new Error("Destinatário não encontrado");
    }
    
    const messageData = { 
      message, 
      conversationId: activeConversation.id,
      receiverId: otherParticipant.id,
      attachment
    };
    
    // 1. Enviar via API REST
    const result = await sendMessageMutation.mutateAsync(messageData);
    
    // 2. Notificar via WebSocket (envio instantâneo para outros clientes conectados)
    if (wsConnected) {
      wsSendMessage({
        type: "send_message",
        messageData: {
          ...messageData,
          id: result.id,
          senderId: user?.id
        }
      });
    }
    
    return result;
  }, [activeConversation, user?.id, sendMessageMutation, wsConnected, wsSendMessage]);

  const startNewConversation = useCallback(async (receiverId: number, initialMessage: string, attachment?: Attachment) => {
    // 1. Criar a conversa via API REST
    const conversation = await startConversationMutation.mutateAsync({ 
      receiverId, 
      message: initialMessage, 
      attachment 
    });
    
    // 2. Notificar via WebSocket para atualização em tempo real
    if (wsConnected && user) {
      wsSendMessage({
        type: "conversation_created",
        conversationId: conversation.id,
        participantIds: [user.id, receiverId]
      });
    }
    
    setIsOpen(true);
    return conversation;
  }, [startConversationMutation, wsConnected, wsSendMessage, user]);

  // Função específica para iniciar conversa com administrador
  const startConversationWithAdmin = useCallback(async (initialMessage: string, attachment?: Attachment) => {
    try {
      // Buscar usuário administrador (ID 1 é o admin padrão)
      const adminId = 1; // Assumimos que ID 1 é o admin padrão

      // 1. Criar conversa via API REST
      const conversation = await startConversationMutation.mutateAsync({ 
        receiverId: adminId, 
        message: initialMessage,
        attachment 
      });
      
      // 2. Notificar via WebSocket para atualização em tempo real
      if (wsConnected && user) {
        wsSendMessage({
          type: "conversation_created",
          conversationId: conversation.id,
          participantIds: [user.id, adminId],
          priority: "high" // Priorizar conversa com admin
        });
      }
      
      setIsOpen(true);
      toast({
        title: "Mensagem enviada com sucesso",
        description: "Um administrador irá atendê-lo em breve",
      });
      
      return conversation;
    } catch (error: any) {
      toast({
        title: "Erro ao contatar administrador",
        description: error.message || "Ocorreu um erro ao iniciar a conversa",
        variant: "destructive",
      });
      throw error;
    }
  }, [startConversationMutation, wsConnected, wsSendMessage, user, toast]);

  // Atalho para abrir chat diretamente com administrador
  const openChatWithAdmin = useCallback(() => {
    setIsOpen(true);
    // Verificamos se já existe uma conversa com o admin
    const adminConversation = conversations.find(conv => {
      return conv._participants?.some(p => p.role === UserRole.ADMIN);
    });
    
    if (adminConversation) {
      setActiveConversation(adminConversation);
    }
    // Se não existir, o usuário verá a lista de conversas e poderá iniciar uma nova
  }, [conversations, setIsOpen]);

  const markMessagesAsRead = useCallback(async (messageIds: number[]) => {
    if (!messageIds.length) return;
    
    // 1. Marcar via API REST
    await markAsReadMutation.mutateAsync(messageIds);
    
    // 2. Notificar via WebSocket que mensagens foram lidas
    if (wsConnected && user) {
      wsSendMessage({
        type: "message_read",
        userId: user.id,
        messageIds: messageIds
      });
    }
  }, [markAsReadMutation, wsConnected, wsSendMessage, user]);

  // Para compatibilidade com componentes existentes
  const activeConversationId = activeConversation?.id;

  return (
    <ChatContext.Provider
      value={{
        isOpen,
        openChat,
        closeChat,
        toggleChat,
        activeConversation,
        activeConversationId,
        setActiveConversation,
        conversations: filteredConversations,
        messages,
        isLoadingConversations,
        isLoadingMessages,
        sendMessage,
        markMessagesAsRead,
        startNewConversation,
        startConversationWithAdmin,
        openChatWithAdmin,
        refreshConversations,
        refreshMessages,
        unreadCount,
        conversationType,
        setConversationType,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  
  if (!context) {
    // Criamos um contexto padrão para permitir o uso em componentes não envolvidos pelo provider
    return {
      isOpen: false,
      openChat: () => {},
      closeChat: () => {},
      toggleChat: () => {},
      activeConversation: null,
      activeConversationId: undefined,
      setActiveConversation: () => {},
      conversations: [],
      messages: [],
      isLoadingConversations: false,
      isLoadingMessages: false,
      sendMessage: async () => {},
      markMessagesAsRead: async () => {},
      startNewConversation: async () => {},
      startConversationWithAdmin: async () => {},
      openChatWithAdmin: () => {},
      refreshConversations: () => {},
      refreshMessages: () => {},
      unreadCount: 0,
      conversationType: "all" as const,
      setConversationType: () => {},
    };
  }
  
  return context;
}