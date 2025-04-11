import { createContext, ReactNode, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "./use-auth";
import { useToast } from "@/hooks/use-toast";
import { playNotificationSound } from "@/components/sounds/notification-sound";

// Tipos para as mensagens do WebSocket
export type WebSocketMessage = {
  type: string;
  [key: string]: any;
};

// Interface para o contexto do WebSocket
interface WebSocketContextType {
  connected: boolean;
  sendMessage: (message: WebSocketMessage) => void;
  lastMessage: WebSocketMessage | null;
  connectionError: string | null;
}

// Criar o contexto do WebSocket
const WebSocketContext = createContext<WebSocketContextType | null>(null);

// Provider para o contexto do WebSocket
export function WebSocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // Função para conectar ao WebSocket
  const connectWebSocket = () => {
    if (!user) return;
    
    try {
      // Construir a URL do WebSocket
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      // Fechar conexão existente se houver
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.close();
      }
      
      // Criar nova conexão
      ws.current = new WebSocket(wsUrl);
      
      // Configurar manipuladores de eventos
      ws.current.onopen = () => {
        console.log("WebSocket conectado!");
        setConnected(true);
        setConnectionError(null);
        
        // Enviar autenticação
        if (ws.current && ws.current.readyState === WebSocket.OPEN && user) {
          ws.current.send(JSON.stringify({
            type: "auth",
            userId: user.id,
            userRole: user.role
          }));
        }
        
        // Limpar timeout de reconexão
        if (reconnectTimeout.current) {
          clearTimeout(reconnectTimeout.current);
          reconnectTimeout.current = null;
        }
      };
      
      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log("Mensagem WebSocket recebida:", message);
          setLastMessage(message);
          
          // Tratar mensagens especiais
          if (message.type === "error") {
            toast({
              title: "Erro",
              description: message.message,
              variant: "destructive"
            });
          } else if (message.type === "new_message" && message.message) {
            // Notificar sobre nova mensagem se não for a conversa ativa
            if (!document.hasFocus() || message.conversationId !== message.activeConversationId) {
              const sender = message.senderName || 'Alguém';
              toast({
                title: `Nova mensagem de ${sender}`,
                description: `${message.message.substring(0, 50)}${message.message.length > 50 ? '...' : ''}`,
              });
              
              // Reproduzir som de notificação usando o gerador de som
              playNotificationSound(0.5);
            }
          } else if (message.type === "conversation_update") {
            // Notificar sobre uma nova conversa iniciada
            toast({
              title: "Nova conversa",
              description: "Uma nova conversa foi iniciada"
            });
          }
        } catch (error) {
          console.error("Erro ao processar mensagem WebSocket:", error);
        }
      };
      
      ws.current.onclose = (event) => {
        console.log("WebSocket desconectado:", event);
        setConnected(false);
        
        // Tentar reconectar após um atraso
        if (!reconnectTimeout.current && user) {
          reconnectTimeout.current = setTimeout(() => {
            reconnectTimeout.current = null;
            console.log("Tentando reconectar WebSocket...");
            connectWebSocket();
          }, 5000); // Reconectar após 5 segundos
        }
      };
      
      ws.current.onerror = (event) => {
        console.error("Erro WebSocket:", event);
        setConnectionError("Erro na conexão WebSocket");
        setConnected(false);
      };
    } catch (error) {
      console.error("Erro ao conectar WebSocket:", error);
      setConnectionError(`Erro ao conectar: ${error}`);
      setConnected(false);
    }
  };
  
  // Função para enviar mensagens
  const sendMessage = (message: WebSocketMessage) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      setConnectionError("WebSocket não está conectado");
      // Tentar reconectar
      connectWebSocket();
    }
  };
  
  // Conectar/desconectar quando o usuário mudar
  useEffect(() => {
    if (user) {
      connectWebSocket();
    } else {
      // Fechar conexão existente se houver
      if (ws.current) {
        ws.current.close();
      }
      setConnected(false);
    }
    
    // Limpeza
    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [user?.id]);
  
  // Manter a conexão ativa enviando pings periódicos
  useEffect(() => {
    if (!connected) return;
    
    const pingInterval = setInterval(() => {
      sendMessage({ type: "ping" });
    }, 30000); // A cada 30 segundos
    
    return () => clearInterval(pingInterval);
  }, [connected]);
  
  return (
    <WebSocketContext.Provider value={{ connected, sendMessage, lastMessage, connectionError }}>
      {children}
    </WebSocketContext.Provider>
  );
}

// Hook para utilizar o contexto do WebSocket
export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket deve ser usado dentro de um WebSocketProvider");
  }
  return context;
}