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
  content: string; // Para compatibilidade com ExtendedChatMessage
  createdAt: Date;
  senderId: number;
  receiverId: number;
  conversationId: number | null;
  isRead: boolean;
  attachmentUrl: string | null;
  attachmentType: string | null;
  attachmentData: string | null;
  attachmentSize: number | null;
  senderName?: string; // Para compatibilidade com chat-message-components
  attachments?: any[]; // Para compatibilidade com chat-message-components
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
  // Campos adicionais para o status da conversa
  acceptedByAdmin?: boolean;
  adminId?: number;
  // Campos opcionais para compatibilidade com API
  participantRole?: string | null;
  participantId?: number | null;
  participantName?: string | null;
  unreadCount?: number;
}

export interface Attachment {
  data: string | null;
  type: string | null;
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
  selectConversation: (conversation: ChatConversation) => void; // Novo método para selecionar conversa
  conversations: ChatConversation[];
  messages: ChatMessage[];
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  sendMessage: (params: { message: string; conversationId?: number; receiverId?: number; attachment?: Attachment; }) => Promise<void>;
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

    return conversations.filter((conversation: ChatConversation) => {
      const participants = conversation._participants || [];
      if (conversationType === "supplier") {
        return participants.some((p: {role: string}) => p.role === UserRole.SUPPLIER);
      } else if (conversationType === "user") {
        return participants.every((p: {role: string}) => p.role !== UserRole.SUPPLIER);
      }
      return true;
    });
  }, [conversations, conversationType, user]);

  // Calcular o número total de mensagens não lidas
  const unreadCount = useMemo(() => {
    return filteredConversations.reduce((total: number, conv: ChatConversation) => {
      const unreadCount = conv._participants?.find((p: {id: number}) => p.id !== user?.id)?.unreadCount || 0;
      return total + unreadCount;
    }, 0);
  }, [filteredConversations, user?.id]);

  const openChat = useCallback(() => setIsOpen(true), []);
  const closeChat = useCallback(() => setIsOpen(false), []);
  const toggleChat = useCallback(() => setIsOpen(prev => !prev), []);

  // Enviar mensagem ao servidor
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
        text: message, // Campo text obrigatório pelo schema
        senderId: user.id,
      };
      
      if (conversationId) {
        payload.conversationId = conversationId;
        
        // Adicionar lógica para determinar o destinatário quando apenas o conversationId é fornecido
        if (!receiverId && activeConversation) {
          // Extrair o destinatário com base nos participantes da conversa ativa
          const otherParticipantId = activeConversation.participantIds.find(id => id !== user.id);
          if (otherParticipantId) {
            payload.receiverId = otherParticipantId;
            console.log("Destinatário determinado automaticamente:", otherParticipantId);
          } else {
            console.warn("Não foi possível determinar o destinatário na conversa:", conversationId);
            // Tente usar admin ID 1 como fallback para conversas com fornecedores
            if (user.role === 'SUPPLIER' || user.role === 'supplier') {
              payload.receiverId = 1; // Admin ID padrão
              console.log("Usando admin ID 1 como destinatário padrão para fornecedor");
            }
          }
        }
      }
      
      if (receiverId) {
        payload.receiverId = receiverId;
      }
      
      if (attachment) {
        payload.attachmentData = attachment.data;
        payload.attachmentType = attachment.type;
        payload.attachmentSize = attachment.size;
      }
      
      // Verificação final para garantir que há um destinatário válido
      if (!payload.receiverId && !payload.conversationId) {
        throw new Error("Destinatário não encontrado. É necessário fornecer um receiverId ou conversationId válido.");
      }
      
      console.log("Enviando mensagem com payload:", {
        ...payload, 
        message: payload.message.substring(0, 20) + "...",
        attachmentData: payload.attachmentData ? "[DADOS ANEXO]" : null
      });
      
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
        text: message, // Campo text é obrigatório pelo schema
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
    
    // Buffering para agrupar mensagens não lidas e marcá-las em uma única requisição
    const unreadMessages = messages.filter(
      (m: ChatMessage) => !m.isRead && m.senderId !== user?.id
    );
    
    // Se existem mensagens não lidas
    if (unreadMessages.length > 0) {
      const messageIds = unreadMessages.map((m: ChatMessage) => m.id);
      
      // Debounce da marcação de leitura para evitar múltiplas requisições
      const handler = setTimeout(() => {
        markAsReadMutation.mutate(messageIds);
      }, 300);
      
      return () => clearTimeout(handler);
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
    
    console.log("Processando mensagem WebSocket:", wsLastMessage);
    
    // Processar diferentes tipos de mensagens
    if (wsLastMessage.type === "new_message_received") {
      // Recebemos uma nova mensagem
      console.log("Nova mensagem recebida via WebSocket:", wsLastMessage.message);
      
      // Atualizar mensagens e conversas
      queryClient.invalidateQueries({ queryKey: ["/api/chat/messages", activeConversation?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/conversations"] });
      
      // Se a mensagem for para a conversa ativa, marcá-la como lida
      if (activeConversation && wsLastMessage.conversationId === activeConversation.id) {
        if (wsLastMessage.message?.id) {
          markAsReadMutation.mutate([wsLastMessage.message.id]);
        }
      }
      
      // Atualizar notificações de som ou visuais
      if (wsLastMessage.message?.senderId !== user.id) {
        // Tocar som ou mostrar notificação
        // ...
      }
    } else if (wsLastMessage.type === "message_sent") {
      console.log("Mensagem enviada confirmada pelo servidor:", wsLastMessage.message);
      // A mensagem que enviamos foi confirmada pelo servidor
      // Atualizar o estado local
      queryClient.invalidateQueries({ queryKey: ["/api/chat/messages", activeConversation?.id] });
      
    } else if (wsLastMessage.type === "messages_marked_read") {
      // Mensagens marcadas como lidas
      queryClient.invalidateQueries({ queryKey: ["/api/chat/conversations"] });
    } else if (wsLastMessage.type === "conversations_update") {
      // Lista de conversas foi atualizada
      console.log("Lista de conversas atualizada:", wsLastMessage.conversations);
      queryClient.invalidateQueries({ queryKey: ["/api/chat/conversations"] });
    } else if (wsLastMessage.type === "conversation_accepted_by_admin") {
      // Um administrador aceitou a conversa
      console.log("Conversa aceita pelo administrador:", wsLastMessage);
      queryClient.invalidateQueries({ queryKey: ["/api/chat/conversations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/messages", wsLastMessage.conversationId] });
      
      toast({
        title: "Administrador online",
        description: "Um administrador aceitou sua conversa e está disponível para ajudar",
        variant: "default",
      });
    }
    
  }, [wsLastMessage, activeConversation, user, queryClient, markAsReadMutation]);

  // Métodos de interface pública
  const sendMessage = useCallback(async (params: { 
    message: string; 
    conversationId?: number; 
    receiverId?: number; 
    attachment?: Attachment 
  }) => {
    // Garantir que temos uma conversa ativa, ou usando a fornecida nos parâmetros
    const convId = params.conversationId || activeConversation?.id;
    if (!convId) {
      throw new Error("Nenhuma conversa ativa");
    }
    
    if (!params.message?.trim() && !params.attachment) {
      throw new Error("Mensagem vazia");
    }
    
    // Determinar o receiverId (destinatário)
    let receiverId = params.receiverId;
    if (!receiverId && activeConversation) {
      // Verificamos se temos os participantes disponíveis
      if (activeConversation._participants?.length) {
        const otherParticipant = activeConversation._participants.find(p => p.id !== user?.id);
        if (otherParticipant) {
          receiverId = otherParticipant.id;
        }
      }
      
      // Se ainda não temos receiverId, verificamos se é uma conversa com admin
      if (!receiverId && activeConversation.participantRole === 'ADMIN') {
        // Se estamos falando com um admin (caso de fornecedor->admin), usamos o ID 1 (admin padrão)
        receiverId = 1; // ID do administrador padrão do sistema
        console.log("Definindo destinatário como admin padrão (ID=1)");
      } else if (!receiverId && activeConversation.participantId) {
        // Se temos um participantId, usamos ele
        receiverId = activeConversation.participantId;
        console.log(`Usando participantId ${receiverId} como destinatário`);
      } else if (!receiverId) {
        // Último recurso: buscar nos IDs de participantes qualquer um que não seja o usuário atual
        const participantIds = activeConversation.participantIds || [];
        const otherId = participantIds.find(id => id !== user?.id);
        if (otherId) {
          receiverId = otherId;
          console.log(`Usando participantIds ${receiverId} como destinatário`);
        } else {
          throw new Error("Destinatário não encontrado - verifique se há participantes na conversa");
        }
      }
    }
    
    const messageData = { 
      message: params.message, 
      text: params.message, // Campo text obrigatório pelo schema
      conversationId: convId,
      receiverId: receiverId,
      attachment: params.attachment
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

  // Método para selecionar uma conversa existente
  const selectConversation = useCallback((conversation: ChatConversation) => {
    setActiveConversation(conversation);
    
    // Marcar as mensagens não lidas como lidas quando selecionar a conversa
    // A marcação efetiva ocorrerá no useEffect que monitora as mensagens não lidas
    console.log(`Selecionando conversa ${conversation.id}`);
    
    // Notificar via WebSocket que o usuário está visualizando a conversa
    if (wsConnected && user) {
      wsSendMessage({
        type: "conversation_opened",
        conversationId: conversation.id,
        userId: user.id
      });
    }
  }, [setActiveConversation, wsConnected, wsSendMessage, user]);

  // Atalho para abrir chat diretamente com administrador
  const openChatWithAdmin = useCallback(() => {
    setIsOpen(true);
    // Verificamos se já existe uma conversa com o admin
    const adminConversation = conversations.find((conv: ChatConversation) => {
      return conv._participants?.some((p: {role: string}) => p.role === UserRole.ADMIN);
    });
    
    if (adminConversation) {
      setActiveConversation(adminConversation);
    }
    // Se não existir, o usuário verá a lista de conversas e poderá iniciar uma nova
  }, [conversations, setIsOpen]);

  // Buffer para acumular mensagens a serem marcadas como lidas
  const messagesToMarkRef = useRef<Set<number>>(new Set());
  const markingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Versão otimizada da função markMessagesAsRead
  const markMessagesAsRead = useCallback(async (messageIds: number[]) => {
    if (!messageIds.length) return;
    
    // Adicionar IDs ao buffer
    messageIds.forEach(id => messagesToMarkRef.current.add(id));
    
    // Cancelar timeout anterior se existir
    if (markingTimeoutRef.current) {
      clearTimeout(markingTimeoutRef.current);
    }
    
    // Configurar novo timeout para processar em lote
    markingTimeoutRef.current = setTimeout(async () => {
      const idsToMark = Array.from(messagesToMarkRef.current);
      
      if (idsToMark.length) {
        // Limpar buffer
        messagesToMarkRef.current.clear();
        
        // 1. Marcar via API REST
        await markAsReadMutation.mutateAsync(idsToMark);
        
        // 2. Notificar via WebSocket que mensagens foram lidas
        if (wsConnected && user) {
          wsSendMessage({
            type: "message_read",
            userId: user.id,
            messageIds: idsToMark
          });
        }
      }
      
      markingTimeoutRef.current = null;
    }, 300); // Esperar 300ms para agrupar múltiplas chamadas
    
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
        selectConversation,
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
      selectConversation: () => {},
      conversations: [],
      messages: [],
      isLoadingConversations: false,
      isLoadingMessages: false,
      sendMessage: async (params: any) => {},
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