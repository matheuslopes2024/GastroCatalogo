import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "./use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "./use-toast";
import { ChatMessage, ChatConversation } from "@shared/schema";
import { WebSocket as WSType } from 'ws';

// Tipos
type MessageAttachment = {
  url: string | null;
  type: string | null;
  data: string | null;
  size: number | null;
};

type MessageData = {
  message: string;
  senderId: number;
  receiverId: number;
  conversationId?: number | null;
  attachment?: MessageAttachment;
};

type ChatContextType = {
  isOpen: boolean;
  messages: ChatMessage[];
  conversations: ChatConversation[];
  activeConversationId: number | null;
  isLoading: boolean;
  unreadCount: number;
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  sendMessage: (text: string, attachment?: File | null) => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  setActiveConversation: (conversationId: number | null) => void;
  markAsRead: (messageIds: number[]) => Promise<void>;
  createConversation: (participantId: number, subject?: string) => Promise<ChatConversation>;
};

// Valores padrão do contexto
const defaultContextValue: ChatContextType = {
  isOpen: false,
  messages: [],
  conversations: [],
  activeConversationId: null,
  isLoading: false,
  unreadCount: 0,
  openChat: () => {},
  closeChat: () => {},
  toggleChat: () => {},
  sendMessage: async () => {},
  loadMoreMessages: async () => Promise.resolve(),
  setActiveConversation: () => {},
  markAsRead: async () => Promise.resolve(),
  createConversation: async () => ({ id: 0 } as ChatConversation),
};

// Criando o contexto
export const ChatContext = createContext<ChatContextType>(defaultContextValue);

// Provedor de chat
export function ChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const socketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Função para abrir conexão com WebSocket
  const connectWebSocket = useCallback(() => {
    if (!user || socketRef.current) return;
    
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws`;
      
      const socket = new WebSocket(wsUrl);
      
      socket.onopen = () => {
        console.log('WebSocket conectado');
        // Enviar identificação do usuário
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({
            type: 'identify',
            userId: user.id,
            role: user.role
          }));
        }
      };
      
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'message') {
            const newMessage = data.message as ChatMessage;
            
            // Adicionar mensagem apenas se for para a conversa ativa ou aumentar contador
            if (newMessage.conversationId === activeConversationId) {
              setMessages(prev => [...prev, newMessage]);
              // Marcar como lida automaticamente se o chat estiver aberto
              if (isOpen && newMessage.senderId !== user?.id) {
                markAsRead([newMessage.id]);
              }
            } else if (newMessage.receiverId === user?.id && !newMessage.isRead) {
              setUnreadCount(prev => prev + 1);
            }
            
            // Atualizar a lista de conversas se a mensagem for de uma conversa existente
            if (newMessage.conversationId) {
              setConversations(prev => {
                const updatedConversations = [...prev];
                const index = updatedConversations.findIndex(
                  conv => conv.id === newMessage.conversationId
                );
                
                if (index !== -1) {
                  updatedConversations[index] = {
                    ...updatedConversations[index],
                    lastMessageId: newMessage.id,
                    lastActivityAt: newMessage.createdAt
                  };
                }
                
                return updatedConversations;
              });
            }
          }
        } catch (error) {
          console.error('Erro ao processar mensagem WebSocket:', error);
        }
      };
      
      socket.onclose = () => {
        console.log('WebSocket desconectado');
        socketRef.current = null;
        // Reconectar após um tempo
        setTimeout(connectWebSocket, 3000);
      };
      
      socket.onerror = (error) => {
        console.error('Erro no WebSocket:', error);
        socket.close();
      };
      
      socketRef.current = socket;
    } catch (error) {
      console.error('Erro ao conectar WebSocket:', error);
    }
  }, [user, activeConversationId, isOpen]);
  
  // Conectar websocket quando usuário estiver autenticado
  useEffect(() => {
    if (user) {
      connectWebSocket();
      
      // Buscar conversas
      fetchConversations();
      
      // Buscar contador de não lidas
      fetchUnreadCount();
    }
    
    return () => {
      // Fechar a conexão ao desmontar
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [user, connectWebSocket]);
  
  // Buscar mensagens quando a conversa ativa mudar
  useEffect(() => {
    if (activeConversationId) {
      setOffset(0);
      setHasMore(true);
      setMessages([]);
      fetchMessages();
    } else {
      setMessages([]);
    }
  }, [activeConversationId]);
  
  // Rolar para o final quando novas mensagens chegarem
  useEffect(() => {
    if (messagesEndRef.current && isOpen) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);
  
  // Funções para manipular o chat
  const openChat = useCallback(() => {
    setIsOpen(true);
  }, []);
  
  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);
  
  const toggleChat = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);
  
  // Funções para API
  const fetchMessages = async () => {
    if (!user || !activeConversationId || isLoading || !hasMore) return;
    
    setIsLoading(true);
    
    try {
      const response = await apiRequest(
        'GET',
        `/api/chat/messages?conversationId=${activeConversationId}&offset=${offset}&limit=20`
      );
      
      const data = await response.json();
      
      if (data.length < 20) {
        setHasMore(false);
      }
      
      if (offset === 0) {
        setMessages(data);
      } else {
        setMessages(prev => [...data, ...prev]);
      }
      
      // Marcar mensagens como lidas automaticamente
      const unreadMessages = data
        .filter((msg: ChatMessage) => msg.receiverId === user.id && !msg.isRead)
        .map((msg: ChatMessage) => msg.id);
        
      if (unreadMessages.length > 0) {
        markAsRead(unreadMessages);
      }
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
      toast({
        title: "Erro ao carregar mensagens",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadMoreMessages = async () => {
    if (!hasMore || isLoading) return;
    setOffset(prev => prev + 20);
    await fetchMessages();
  };
  
  const fetchConversations = async () => {
    if (!user) return;
    
    try {
      const response = await apiRequest('GET', '/api/chat/conversations');
      const data = await response.json();
      setConversations(data);
      
      // Se não houver conversa ativa e houver conversas disponíveis, selecione a primeira
      if (!activeConversationId && data.length > 0) {
        setActiveConversationId(data[0].id);
      }
    } catch (error) {
      console.error('Erro ao buscar conversas:', error);
    }
  };
  
  const fetchUnreadCount = async () => {
    if (!user) return;
    
    try {
      const response = await apiRequest('GET', '/api/chat/unread-count');
      const data = await response.json();
      setUnreadCount(data.count);
    } catch (error) {
      console.error('Erro ao buscar contagem de não lidas:', error);
    }
  };
  
  const markAsRead = async (messageIds: number[]) => {
    if (!user || messageIds.length === 0) return;
    
    try {
      await apiRequest('POST', '/api/chat/mark-as-read', { messageIds });
      
      // Atualizar estado local
      setMessages(prev => 
        prev.map(msg => 
          messageIds.includes(msg.id) ? { ...msg, isRead: true } : msg
        )
      );
      
      // Atualizar contagem de não lidas
      fetchUnreadCount();
    } catch (error) {
      console.error('Erro ao marcar mensagens como lidas:', error);
    }
  };
  
  const createConversation = async (participantId: number, subject?: string): Promise<ChatConversation> => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }
    
    try {
      const response = await apiRequest('POST', '/api/chat/conversations', {
        participantIds: [user.id, participantId],
        subject: subject || null
      });
      
      const conversation = await response.json();
      
      // Adicionar à lista e definir como ativa
      setConversations(prev => [conversation, ...prev]);
      setActiveConversationId(conversation.id);
      
      return conversation;
    } catch (error) {
      console.error('Erro ao criar conversa:', error);
      toast({
        title: "Erro ao criar conversa",
        description: "Não foi possível iniciar uma nova conversa. Tente novamente mais tarde.",
        variant: "destructive"
      });
      throw error;
    }
  };
  
  const sendMessage = async (text: string, attachment: File | null = null) => {
    if (!user || !text.trim()) return;
    
    let conversationId = activeConversationId;
    let receiverId: number;
    
    // Determinar o destinatário baseado na conversa atual
    if (conversationId) {
      const conversation = conversations.find(c => c.id === conversationId);
      if (!conversation) return;
      
      // Encontrar o outro participante que não é o usuário atual
      receiverId = conversation.participantIds.find(id => id !== user.id) || 0;
      if (!receiverId) return;
    } else {
      // Se não houver conversa ativa, isso não deveria acontecer no fluxo normal
      toast({
        title: "Erro ao enviar mensagem",
        description: "Nenhuma conversa selecionada",
        variant: "destructive"
      });
      return;
    }
    
    // Preparar dados de anexo se houver
    let attachmentData: MessageAttachment | undefined;
    
    if (attachment) {
      try {
        const reader = new FileReader();
        const fileDataPromise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
        });
        
        reader.readAsDataURL(attachment);
        const fileData = await fileDataPromise;
        
        attachmentData = {
          data: fileData,
          type: attachment.type,
          url: null,
          size: attachment.size
        };
      } catch (error) {
        console.error('Erro ao processar anexo:', error);
        toast({
          title: "Erro no anexo",
          description: "Não foi possível processar o arquivo anexado",
          variant: "destructive"
        });
        return;
      }
    }
    
    // Dados da mensagem
    const messageData: MessageData = {
      message: text,
      senderId: user.id,
      receiverId,
      conversationId
    };
    
    if (attachmentData) {
      messageData.attachment = attachmentData;
    }
    
    try {
      const response = await apiRequest('POST', '/api/chat/messages', messageData);
      const newMessage = await response.json();
      
      // Adicionar a mensagem localmente para feedback imediato
      setMessages(prev => [...prev, newMessage]);
      
      // Atualizar a conversa na lista
      setConversations(prev => {
        const updatedConversations = [...prev];
        const index = updatedConversations.findIndex(
          conv => conv.id === conversationId
        );
        
        if (index !== -1) {
          updatedConversations[index] = {
            ...updatedConversations[index],
            lastMessageId: newMessage.id,
            lastActivityAt: new Date()
          };
          
          // Mover conversa para o topo
          const [conversation] = updatedConversations.splice(index, 1);
          updatedConversations.unshift(conversation);
        }
        
        return updatedConversations;
      });
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: "Erro ao enviar mensagem",
        description: "Sua mensagem não pôde ser enviada. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  return (
    <ChatContext.Provider
      value={{
        isOpen,
        messages,
        conversations,
        activeConversationId,
        isLoading,
        unreadCount,
        openChat,
        closeChat,
        toggleChat,
        sendMessage,
        loadMoreMessages,
        setActiveConversation: setActiveConversationId,
        markAsRead,
        createConversation
      }}
    >
      {children}
      <div ref={messagesEndRef} />
    </ChatContext.Provider>
  );
}

// Hook personalizado
export function useChat() {
  const context = useContext(ChatContext);
  
  if (!context) {
    throw new Error('useChat deve ser usado dentro de um ChatProvider');
  }
  
  return context;
}