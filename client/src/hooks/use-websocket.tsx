/**
 * @file use-websocket.tsx
 * @description Implementação otimizada de WebSocket para toda a aplicação
 * 
 * - Versão 2.0 com controle dedicado de ciclo de vida do WebSocket
 * - Prevenção de conexões duplicadas
 * - Throttling inteligente para mensagens
 * - Gestão centralizada de eventos WebSocket 
 * - Suporte a reconexão automática
 */

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
  sendWebSocketMessage: (message: WebSocketMessage) => void;
  lastMessage: WebSocketMessage | null;
  connectionError: string | null;
  addMessageHandler: (handlerId: string, handler: (message: WebSocketMessage) => void) => void;
  removeMessageHandler: (handlerId: string) => void;
}

// Criar o contexto do WebSocket
const WebSocketContext = createContext<WebSocketContextType | null>(null);

// Provider para o contexto do WebSocket
export function WebSocketProvider({ children }: { children: ReactNode }): JSX.Element {
  const { user } = useAuth();
  const { toast } = useToast();
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const messageHandlers = useRef<Record<string, (message: WebSocketMessage) => void>>({});
  
  // Função para conectar ao WebSocket
  const connectWebSocket = () => {
    if (!user) return;
    
    // Evitar múltiplas tentativas de conexão
    if (ws.current && (ws.current.readyState === WebSocket.CONNECTING || ws.current.readyState === WebSocket.OPEN)) {
      console.log("Conexão WebSocket já existe, não reconectando");
      return;
    }
    
    try {
      // Construir a URL do WebSocket
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      
      // Garantir que temos um host para conexão
      // Para replit, usamos o host da janela atual
      const currentHost = window.location.host;
      
      // Verificar que temos um host válido
      if (!currentHost) {
        console.error("[WS] Erro: Não foi possível determinar o host para WebSocket");
        setConnectionError("Erro ao obter host para WebSocket");
        return;
      }
      
      // Criar URL com um token único para evitar problemas de cache
      const token = `${Math.random().toString(36).substring(2, 10)}${Date.now().toString(36)}`;
      // Usar o caminho /ws na URL principal para garantir conexão WebSocket consistente
      let wsUrl = "";
      
      try {
        // Construir URL segura com verificações de fallback
        let port = "5000"; // Porta padrão do servidor
        
        // Garantir que temos um host válido e usar uma abordagem mais robusta
        if (currentHost && currentHost.length > 0) {
          // Usar host atual, garantindo que o caminho comece com /ws
          wsUrl = `${protocol}//${currentHost}/ws?token=${token}`;
          console.log("[WS] Usando URL com host atual:", wsUrl);
        } else {
          // Fallback absoluto para desenvolvimento local apenas como último recurso
          // Usando uma URL que sabemos que é válida e com porta correta para desenvolvimento
          wsUrl = `${protocol}//localhost:5000/ws?token=${token}`;
          console.log("[WS] Usando URL local fallback:", wsUrl);
        }
        
        // Verificação final mais robusta com tentativa de corrigir URLs inválidas
        if (!wsUrl) {
          throw new Error("URL WebSocket não pôde ser gerada");
        }
        
        // Remover partes indefinidas da URL, se houver
        if (wsUrl.includes("undefined")) {
          console.warn("[WS] Corrigindo URL com valores indefinidos:", wsUrl);
          wsUrl = wsUrl.replace(/undefined/g, "").replace(/::/, ":").replace(/\/\//g, "/").replace(/:\//g, "://");
          console.log("[WS] URL corrigida:", wsUrl);
          
          // Se ainda estiver inválida após correções, usar URL padrão para o host atual
          if (!wsUrl || wsUrl.includes("undefined")) {
            wsUrl = `${protocol}//${window.location.host}/ws?token=${token}`;
            console.log("[WS] Usando URL de fallback final:", wsUrl);
          }
        }
      } catch (urlError) {
        console.error("[WS] Erro ao construir URL do WebSocket:", urlError);
        setConnectionError(`Erro ao construir URL do WebSocket: ${urlError}`);
        return;
      }
      
      // Fechar conexão existente se houver
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.close();
      }
      
      // Usar try/catch específico para criação de WebSocket
      try {
        // Criar nova conexão
        ws.current = new WebSocket(wsUrl);
      } catch (wsError) {
        console.error("[WS] Erro ao criar objeto WebSocket:", wsError);
        setConnectionError(`Erro ao criar WebSocket: ${wsError}`);
        return;
      }
      
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
      
      // Cache para evitar processamento de mensagens duplicadas
      const processedMessages = new Set<string>();
      
      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          // Ignorar a maior parte das mensagens de sistema nos logs para reduzir ruído
          const ignoreLogs = ['heartbeat', 'ping', 'pong', 'admin_chat_register', 'chat_register', 'admin_request_conversations'];
          const isSystemMessage = ignoreLogs.includes(message.type);
          
          // Criar ID único para rastreamento de mensagens
          const messageId = `${message.type}_${message.timestamp || Date.now()}`;
          
          // Mensagens importantes (não-sistema) recebem log detalhado
          if (!isSystemMessage) {
            console.log(`[WS] Mensagem recebida (${messageId}):`, message.type, 
              message.conversationId ? `conversa: ${message.conversationId}` : '',
              message.message ? `conteúdo: ${typeof message.message === 'string' ? message.message.substring(0, 30) : 'objeto'}` : ''
            );
          }
          
          // Verificar se esta mensagem já foi processada recentemente (prevenção duplicação)
          if (processedMessages.has(messageId)) {
            if (!isSystemMessage) {
              console.warn(`[WS] Ignorando mensagem duplicada: ${messageId}`);
            }
            return;
          }
          
          // Adicionar ao cache de mensagens processadas
          processedMessages.add(messageId);
          
          // Limitar tamanho do cache para evitar crescimento ilimitado
          if (processedMessages.size > 1000) {
            // Converter para array, remover primeiras 500 entradas e reconverter para Set
            const messagesArray = Array.from(processedMessages);
            processedMessages.clear();
            messagesArray.slice(500).forEach(id => processedMessages.add(id));
          }
          
          // Atualizar estado com a mensagem recebida de forma imediata
          setLastMessage(message);
          
          // Executar handlers específicos para esta mensagem
          Object.values(messageHandlers.current).forEach(handler => {
            try {
              handler(message);
            } catch (handlerError) {
              console.error("Erro em handler de mensagem:", handlerError);
            }
          });
          
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
        
        // Tentar reconectar após um atraso, incluindo para rotas admin 
        // (precisamos de WebSocket para todas as partes do aplicativo)
        if (!reconnectTimeout.current && user) {
          console.log("Agendando reconexão...");
          reconnectTimeout.current = setTimeout(() => {
            reconnectTimeout.current = null;
            console.log("Tentando reconectar WebSocket...");
            connectWebSocket();
          }, 3000); // Reconectar após 3 segundos para maior rapidez
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
  
  // Função aprimorada para enviar mensagens com melhor feedback
  const sendMessage = (message: WebSocketMessage) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      // Log para depuração de mensagens importantes
      if (!['ping', 'heartbeat', 'pong'].includes(message.type)) {
        console.log(`[WS] Enviando mensagem: ${message.type}`, message);
      }
      
      // Enviar a mensagem com tratamento de erro robusto
      try {
        ws.current.send(JSON.stringify(message));
        return true;
      } catch (sendError) {
        console.error(`[WS] Erro ao enviar mensagem ${message.type}:`, sendError);
        setConnectionError(`Erro ao enviar: ${sendError}`);
        return false;
      }
    } else {
      // Informar sobre o estado da conexão para depuração
      const state = ws.current ? ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'][ws.current.readyState] : 'NULL';
      console.warn(`[WS] Não foi possível enviar mensagem - WebSocket em estado: ${state}`);
      
      setConnectionError(`WebSocket não está conectado (estado: ${state})`);
      
      // Tentar reconectar se a conexão estiver fechada
      if (!ws.current || ws.current.readyState === WebSocket.CLOSED) {
        console.log("[WS] Tentando reconectar automaticamente...");
        connectWebSocket();
      }
      
      return false;
    }
  };
  
  // Alias para sendMessage para compatibilidade com a interface
  const sendWebSocketMessage = sendMessage;
  
  // Adicionar um manipulador de mensagens
  const addMessageHandler = (handlerId: string, handler: (message: WebSocketMessage) => void) => {
    messageHandlers.current[handlerId] = handler;
  };
  
  // Remover um manipulador de mensagens
  const removeMessageHandler = (handlerId: string) => {
    if (messageHandlers.current[handlerId]) {
      delete messageHandlers.current[handlerId];
    }
  };
  
  // Conectar/desconectar quando o usuário mudar
  useEffect(() => {
    console.log(`[WS] Efeito do usuário executado: ${user?.id ? `usuário ${user.id} (${user.role})` : 'sem usuário'}`);
    
    // Um contador de conexão para evitar condições de corrida
    const connectionAttempt = Date.now();
    const attemptId = `conn-${connectionAttempt}`;
    
    if (user) {
      // Colocar em uma função assíncrona para melhor controle
      const setupConnection = async () => {
        // Se alguém já está tentando conectar, aguardar
        if (ws.current && ws.current.readyState === WebSocket.CONNECTING) {
          console.log(`[WS:${attemptId}] Aguardando conexão pendente...`);
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Agora conectar
        console.log(`[WS:${attemptId}] Iniciando conexão para usuário ${user.id} (${user.role})`);
        connectWebSocket();
        console.log(`[WS:${attemptId}] Conexão WebSocket iniciada`);
      };
      
      // Iniciar processo de conexão
      setupConnection();
    } else {
      // Fechar conexão existente se houver
      if (ws.current) {
        console.log("[WS] Fechando conexão WebSocket (usuário desconectado)");
        ws.current.close();
      }
      setConnected(false);
    }
    
    // Limpeza
    return () => {
      console.log(`[WS:${attemptId}] Limpando efeito de conexão`);
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
        reconnectTimeout.current = null;
      }
      
      // Não fechar a conexão no cleanup - isso pode causar desconexões inesperadas
      // durante re-renderizações. Deixamos a conexão ser gerenciada pelo próximo efeito.
    };
  }, [user?.id]);
  
  // Manter a conexão ativa enviando pings periódicos e limitar duplicações de tentativas
  useEffect(() => {
    if (!connected) return;
    
    // Anti-duplicação: usar um ID exclusivo para esta instância do efeito
    const pingId = `ping-${Date.now()}`;
    console.log(`[WS:${pingId}] Iniciando pings periódicos`);
    
    // Verificar imediatamente se a conexão está viva e enviar um ping inicial
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      console.log(`[WS:${pingId}] Enviando ping inicial para verificar conexão`);
      try {
        ws.current.send(JSON.stringify({ 
          type: "ping", 
          timestamp: new Date().toISOString() 
        }));
      } catch (err) {
        console.error("[WS] Erro ao enviar ping inicial:", err);
      }
    }
    
    const pingInterval = setInterval(() => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        // Adicionar timestamp para tornar cada mensagem única
        try {
          sendMessage({ 
            type: "ping", 
            timestamp: new Date().toISOString() 
          });
        } catch (pingError) {
          console.error("[WS] Erro ao enviar ping periódico:", pingError);
        }
      }
    }, 25000); // A cada 25 segundos (ligeiramente mais frequente)
    
    return () => {
      console.log(`[WS:${pingId}] Parando pings periódicos`);
      clearInterval(pingInterval);
    };
  }, [connected]);
  
  return (
    <WebSocketContext.Provider value={{ 
      connected, 
      sendMessage, 
      sendWebSocketMessage,
      lastMessage, 
      connectionError,
      addMessageHandler,
      removeMessageHandler
    }}>
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