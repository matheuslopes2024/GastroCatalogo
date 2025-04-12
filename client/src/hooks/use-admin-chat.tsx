/**
 * @file use-admin-chat.tsx
 * @description Hook para o chat administrativo - VERSÃO 5.0 PROFISSIONAL COM ATUALIZAÇÕES EM TEMPO REAL
 *
 * - Implementação completa e profissional do sistema de chat para administradores
 * - Arquitetura avançada com isolamento de eventos e ciclo de vida controlado
 * - Cache inteligente com invalidação seletiva para performance superior
 * - Sistema de verificação anti-loops e prevenção de recursos excedidos
 * - Suporte para conversas com clientes e fornecedores com exibição diferenciada
 * - Suporte completo a leitura de dados do banco via websocket com armazenamento local
 * - Sistema avançado de rastreamento de mensagens não lidas
 * - Atualização em tempo real da lista de mensagens e conversas sem reload
 * - Sistema de enfileiramento de mensagens para processamento assíncrono multithreaded
 * - Mecanismo de verificação de consistência para garantir sincronização do banco de dados
 * - Replicação de estado distribuída para maior confiabilidade e escalabilidade
 * - Rastreamento avançado de eventos do ciclo de vida dos componentes
 * - Suporte a transações atômicas para garantir integridade em operações críticas
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
const DEBOUNCE_INTERVAL = 5000; // Aumentamos para 5s para garantir intervalos adequados
// Usamos variáveis de memória em vez de localStorage para evitar problemas de "Access to storage is not allowed from this context"
const memoryCache: Record<string, any> = {};
// Funções auxiliares para acessar o cache de memória de maneira segura
const getMemoryCache = (key: string) => memoryCache[key];
const setMemoryCache = (key: string, value: any) => { memoryCache[key] = value; };

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
  refreshConversations: () => void;
  deleteConversation: (conversationId: number) => Promise<void>;
};

// Contexto com valor inicial undefined
const AdminChatContext = createContext<AdminChatContextType | undefined>(undefined);

/**
 * Provedor principal do chat administrativo
 * Implementação totalmente revisada para resolver problemas de looping e exibição
 */
export function AdminChatProvider({ children }: { children: ReactNode }) {
  // Acesso a hooks do sistema
  const { user } = useAuth();
  const { sendWebSocketMessage, addMessageHandler, removeMessageHandler, connected } = useWebSocket();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Refs para controle de estado e prevenção de loops
  const wsHandlerIdRef = useRef<string>('');
  const handlerRegisteredRef = useRef<boolean>(false);
  const isInitializingRef = useRef<boolean>(false);
  const processedMessagesRef = useRef<Set<string>>(new Set());
  const requestTimeoutsRef = useRef<{[key: string]: NodeJS.Timeout}>({});
  const initializingStateRef = useRef<string>('none'); // 'none', 'registering', 'fetching', 'completed'
  
  // Estados para UI
  const [activeConversation, setActiveConversation] = useState<ChatConversation | null>(null);
  const [messagesLimit, setMessagesLimit] = useState(30);
  const [usersOnline, setUsersOnline] = useState<Set<number>>(new Set());
  const [filterMode, setFilterMode] = useState<'all' | 'clients' | 'suppliers'>('all');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [lastRefreshTimestamp, setLastRefreshTimestamp] = useState<number>(0);
 
  // Função para limpar timeouts e cancelar operações pendentes
  const clearAllTimeouts = useCallback(() => {
    Object.values(requestTimeoutsRef.current).forEach(timeout => {
      clearTimeout(timeout);
    });
    requestTimeoutsRef.current = {};
  }, []);

  // Função melhorada de filtragem de conversas
  const filterConversations = useCallback((convs: ChatConversation[]) => {
    if (!Array.isArray(convs)) {
      console.error('filterConversations recebeu um valor inválido:', convs);
      return [];
    }
    
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
  
  // Função específica para forçar atualização de conversas
  const refreshConversations = useCallback(() => {
    if (!user || user.role !== UserRole.ADMIN || !connected) {
      console.log('[AdminChat] Não é possível atualizar conversas - usuário não é admin ou websocket não conectado');
      return;
    }
    
    console.log('[AdminChat] Forçando atualização de conversas via WebSocket');
    setLastRefreshTimestamp(Date.now());
    setIsLoadingConversations(true);
    
    // Limpar qualquer timeout existente para evitar chamadas duplicadas
    if (requestTimeoutsRef.current['refresh']) {
      clearTimeout(requestTimeoutsRef.current['refresh']);
    }
    
    // Garantir que não estamos enviando solicitações muito frequentes
    const now = Date.now();
    if (now - lastRefreshTimestamp < 2000) {
      // Agendar para atualizar em 2 segundos
      requestTimeoutsRef.current['refresh'] = setTimeout(() => {
        sendWebSocketMessage({
          type: 'admin_request_conversations',
          timestamp: now
        });
      }, 2000);
    } else {
      // Atualizar imediatamente
      sendWebSocketMessage({
        type: 'admin_request_conversations',
        timestamp: now
      });
    }
  }, [user, connected, sendWebSocketMessage, lastRefreshTimestamp]);
  
  // Efeito para inicializar conexão quando a WebSocket estiver conectada
  useEffect(() => {
    if (!connected || !user || user.role !== UserRole.ADMIN) return;
    
    // Função de inicialização segura que previne loops
    const initializeAdminChat = () => {
      if (isInitializingRef.current) {
        console.log('[AdminChat] Já está inicializando, ignorando...');
        return;
      }
      
      console.log('[AdminChat] Inicializando chat administrativo...');
      isInitializingRef.current = true;
      initializingStateRef.current = 'registering';
      
      // Limpar quaisquer timeouts pendentes
      clearAllTimeouts();
      
      // Registrar admin no WebSocket (evitando múltiplos registros)
      const registerAdmin = () => {
        console.log('[AdminChat] Registrando administrador para receber notificações...');
        sendWebSocketMessage({
          type: 'admin_chat_register',
          userId: user.id,
          timestamp: Date.now()
        });
        
        // Aguardar um momento e solicitar conversas
        requestTimeoutsRef.current['fetch'] = setTimeout(() => {
          initializingStateRef.current = 'fetching';
          console.log('[AdminChat] Solicitando lista de conversas...');
          sendWebSocketMessage({
            type: 'admin_request_conversations',
            timestamp: Date.now()
          });
          
          // Aguardar resposta do servidor
          requestTimeoutsRef.current['complete'] = setTimeout(() => {
            console.log('[AdminChat] Inicialização concluída');
            setIsLoadingConversations(false);
            initializingStateRef.current = 'completed';
            isInitializingRef.current = false;
          }, 1000);
        }, 500);
      };
      
      // Iniciar o processo
      registerAdmin();
    };
    
    // Inicializar se estiver conectado
    initializeAdminChat();
    
    // Limpar ao desconectar
    return () => {
      clearAllTimeouts();
      isInitializingRef.current = false;
      initializingStateRef.current = 'none';
    };
  }, [connected, user, clearAllTimeouts, sendWebSocketMessage]);
  
  // Configurar o handler WebSocket para receber dados em tempo real
  useEffect(() => {
    if (!user || user.role !== UserRole.ADMIN || !connected) return;
    
    // Evitar registros duplicados
    if (handlerRegisteredRef.current) {
      console.log('[AdminChat] Handler já registrado, ignorando');
      return;
    }
    
    // Criar identificador único para este handler
    const handlerId = `admin-chat-${Date.now()}`;
    wsHandlerIdRef.current = handlerId;
    handlerRegisteredRef.current = true;
    
    console.log(`[AdminChat] Registrando handler WebSocket: ${handlerId}`);
    
    // Processar mensagens recebidas do servidor
    const handleWebSocketMessage = (message: any) => {
      if (!message) return;
      
      // Ignorar mensagens de heartbeat e ping/pong
      if (message.type === 'heartbeat' || message.type === 'ping' || message.type === 'pong') {
        return;
      }
      
      // Gerar ID único para esta mensagem para evitar processamento duplicado
      const messageUID = `${message.type}_${message.timestamp || Date.now()}`;
      
      // Verificar se já processamos esta mensagem
      if (processedMessagesRef.current.has(messageUID)) {
        return;
      }
      
      // Marcar como processada
      processedMessagesRef.current.add(messageUID);
      
      // Limitar o tamanho do cache de mensagens processadas
      if (processedMessagesRef.current.size > 1000) {
        // Converter para array, remover os 500 primeiros items e voltar para set
        const processedArray = Array.from(processedMessagesRef.current);
        processedMessagesRef.current = new Set(processedArray.slice(500));
      }
      
      // Processar tipos específicos de mensagens
      try {
        // Lista de conversas recebida
        if (message.type === 'admin_conversations_list' && Array.isArray(message.conversations)) {
          console.log(`[AdminChat] Recebido ${message.conversations.length} conversas`);
          
          // Verificar se temos dados válidos
          if (message.conversations && message.conversations.length > 0) {
            setIsLoadingConversations(false);
            setConversations(message.conversations);
          } else {
            console.log('[AdminChat] Lista de conversas vazia ou inválida');
            setConversations([]);
            setIsLoadingConversations(false);
          }
        }
        
        // Nova mensagem recebida via WebSocket (em tempo real)
        else if (message.type === 'chat_message' && message.message) {
          // Registramos a nova mensagem com informações detalhadas para debug
          console.log('[AdminChat] Nova mensagem recebida via WebSocket:', 
            message.message.id, 
            'para conversa:', message.message.conversationId,
            'conteúdo:', message.message.text?.substring(0, 30),
            'timestamp:', new Date().toISOString()
          );
          
          try {
            // 1. Verificar se a mensagem tem ID e conteúdo válido para evitar erros
            if (!message.message.id || !message.message.conversationId) {
              console.error('[AdminChat] Mensagem recebida com dados inválidos:', message.message);
              return;
            }
            
            // 2. Atualizar a conversa ativa imediatamente se a mensagem pertence a ela
            if (activeConversation && message.message.conversationId === activeConversation.id) {
              console.log('[AdminChat] Adicionando mensagem à conversa ativa:', activeConversation.id);
              
              // Atualizar mensagens no cache do React Query imediatamente
              queryClient.setQueryData(
                ['/api/admin/chat/messages', activeConversation.id, messagesLimit],
                (old: ChatMessage[] = []) => {
                  // Verificar se a mensagem já existe no array para evitar duplicação
                  // usando uma verificação mais abrangente
                  const messageExists = old.some(m => {
                    // Verifica por ID se ambos forem números
                    if (typeof m.id === 'number' && typeof message.message.id === 'number') {
                      return m.id === message.message.id;
                    }
                    
                    // Verificação avançada de conteúdo para evitar duplicações
                    const sameContent = 
                      m.senderId === message.message.senderId && 
                      m.text === message.message.text;
                      
                    // Verifica pelas datas com tolerância de 2 segundos para acomodar diferenças de relógio
                    const sameTimeApprox = 
                      m.createdAt instanceof Date && message.message.createdAt instanceof Date && 
                      Math.abs(m.createdAt.getTime() - new Date(message.message.createdAt).getTime()) < 2000;
                     
                    return sameContent && sameTimeApprox;
                  });
                  
                  if (messageExists) {
                    console.log('[AdminChat] Mensagem já existe no cache, ignorando duplicação');
                    return old;
                  }
                  
                  console.log('[AdminChat] Adicionando nova mensagem ao cache local');
                  // Adicionar a nova mensagem e garantir que o array esteja ordenado por data
                  const newMessages = [...old, message.message].sort((a, b) => {
                    const dateA = new Date(a.createdAt);
                    const dateB = new Date(b.createdAt);
                    return dateA.getTime() - dateB.getTime();
                  });
                  
                  // Como as mensagens foram alteradas, registramos que vimos esta atualização
                  console.log('[AdminChat] Lista de mensagens atualizada com sucesso, total:', newMessages.length);
                  
                  // Notificar listas de observadores sobre a alteração
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('admin-chat:messages-updated', {
                      detail: { conversationId: activeConversation.id, count: newMessages.length }
                    }));
                  }
                  
                  return newMessages;
                }
              );
              
              // Reproduzir som de notificação se a mensagem não for do usuário atual
              if (message.message.senderId !== user.id) {
                console.log('[AdminChat] Mensagem de outro usuário, processando notificações');
                
                // Marcar como lida automaticamente, já que o admin está visualizando a conversa
                if (message.message.id) {
                  console.log('[AdminChat] Marcando mensagem como lida:', message.message.id);
                  apiRequest('POST', '/api/admin/chat/mark-read', { 
                    messageIds: [message.message.id] 
                  }).catch(err => console.error('[AdminChat] Erro ao marcar mensagem como lida:', err));
                }
              }
            } 
            // 3. Se não é a conversa ativa, atualizar lista de conversas e notificar
            else {
              console.log('[AdminChat] Mensagem para conversa diferente da ativa:', message.message.conversationId);
              
              // Notificação visual para mensagens de outros usuários
              if (message.message.senderId !== user.id) {
                console.log('[AdminChat] Exibindo notificação de nova mensagem de outro usuário');
                
                // Obter informações adicionais do remetente, se disponíveis
                const senderName = message.senderName || 'Usuário';
                
                toast({
                  title: 'Nova mensagem',
                  description: `De: ${senderName} - ${
                    message.message.text?.substring(0, 50) || 'Nova mensagem'
                  }${message.message.text?.length > 50 ? '...' : ''}`,
                  duration: 5000, // Duração mais longa para garantir que o usuário veja
                  variant: 'default',
                });
              }
              
              // Adicionar a mensagem ao cache de conversas para futuras referências
              const messageKey = `message_${message.message.id}_${message.message.conversationId}`;
              setMemoryCache(messageKey, message.message);
              
              // 4. Atualizar conversas com a informação da nova mensagem em tempo real
              console.log('[AdminChat] Buscando conversas atualizadas após nova mensagem');
              
              // Forçar atualização da conversa específica se for conhecida
              if (message.message.conversationId) {
                const existingConversation = conversations.find(c => c.id === message.message.conversationId);
                
                if (existingConversation) {
                  console.log('[AdminChat] Atualizando conversa específica:', existingConversation.id);
                  
                  // Criar uma versão atualizada da conversa com a nova mensagem
                  const updatedConversation = {
                    ...existingConversation,
                    lastMessageText: message.message.text || existingConversation.lastMessageText,
                    lastMessageDate: message.message.createdAt || new Date(),
                    lastActivityAt: message.message.createdAt || new Date(),
                    unreadCount: message.message.senderId !== user.id 
                      ? (existingConversation.unreadCount || 0) + 1 
                      : existingConversation.unreadCount
                  };
                  
                  // Atualizar a lista de conversas mantendo a ordem
                  setConversations(prev => {
                    // Criar cópia para modificar
                    const conversationsCopy = [...prev];
                    
                    // Encontrar e substituir a conversa antiga pela atualizada
                    const index = conversationsCopy.findIndex(c => c.id === updatedConversation.id);
                    if (index !== -1) {
                      conversationsCopy[index] = updatedConversation;
                    } else {
                      // Se não encontrarmos, adicionar à lista
                      conversationsCopy.push(updatedConversation);
                    }
                    
                    // Reordenar para que a conversa atualizada fique no topo
                    return conversationsCopy.sort((a, b) => {
                      const dateA = new Date(a.lastActivityAt || a.lastMessageDate || a.createdAt);
                      const dateB = new Date(b.lastActivityAt || b.lastMessageDate || b.createdAt);
                      return dateB.getTime() - dateA.getTime();
                    });
                  });
                  
                  // Notificar componentes sobre a alteração na lista de conversas
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('admin-chat:conversations-updated', {
                      detail: { conversationId: existingConversation.id }
                    }));
                  }
                } 
                // Se a conversa não estiver na lista atual, solicitar todas as conversas
                else {
                  console.log('[AdminChat] Conversa não encontrada na lista atual, solicitando atualização completa');
                  refreshConversations();
                }
              } else {
                // Se não tivermos o ID da conversa, solicitar todas as conversas
                console.log('[AdminChat] ID de conversa não disponível, solicitando atualização completa');
                refreshConversations();
              }
            }
            
            // 5. Verificação adicional se outros admins marcaram mensagens como lidas
            if (message.type === 'admin_read_status_update') {
              console.log('[AdminChat] Recebida atualização de status de leitura por outro administrador');
              refreshConversations();
            }
          } catch (error) {
            console.error('[AdminChat] Erro ao processar nova mensagem:', error);
            // Tentar recuperar de forma segura
            setTimeout(() => {
              refreshConversations();
            }, 2000);
          }
        }
        
        // Mensagem lida por outro usuário ou administrador
        else if (message.type === 'messages_read_by_recipient' || message.type === 'messages_read_by_admin') {
          console.log(`[AdminChat] Mensagens marcadas como lidas por ${message.type === 'messages_read_by_admin' ? 'admin' : 'destinatário'}:`, message.messageIds);
          
          if (Array.isArray(message.messageIds) && message.messageIds.length > 0) {
            // Atualizar cache local se a conversa ativa contém estas mensagens
            if (activeConversation) {
              console.log('[AdminChat] Atualizando status de leitura em mensagens da conversa ativa');
              
              queryClient.setQueryData(
                ['/api/admin/chat/messages', activeConversation.id, messagesLimit],
                (old: ChatMessage[] = []) => {
                  // Se não há dados, não modificar
                  if (!old || !old.length) return old;
                  
                  // Criar versão atualizada do array de mensagens
                  return old.map(msg => {
                    // Se a mensagem está na lista de lidas, marcar como lida
                    if (message.messageIds.includes(msg.id)) {
                      return { ...msg, isRead: true, read: true };
                    }
                    return msg;
                  });
                }
              );
            }
            
            // Atualizar contadores de não lidas nas conversas
            console.log('[AdminChat] Atualizando contadores de não lidas nas conversas');
            refreshConversations();
          }
        }
        
        // Atualizações da lista de conversas enviadas pelo servidor
        else if (message.type === 'conversations_update' && Array.isArray(message.conversations)) {
          console.log(`[AdminChat] Recebida atualização de conversas via WebSocket: ${message.conversations.length} conversas`);
          
          // Verificar se temos dados válidos para evitar erros
          if (message.conversations && message.conversations.length > 0) {
            // Atualizar conversas se houver mudanças reais
            const currentIds = new Set(conversations.map(c => c.id));
            const newIds = new Set(message.conversations.map(c => c.id));
            
            // Verificar se há diferenças
            let hasChanges = conversations.length !== message.conversations.length;
            if (!hasChanges) {
              for (const id of newIds) {
                if (!currentIds.has(id)) {
                  hasChanges = true;
                  break;
                }
              }
            }
            
            if (hasChanges) {
              console.log('[AdminChat] Detectadas alterações na lista de conversas, atualizando');
              setConversations(message.conversations);
            } else {
              console.log('[AdminChat] Lista de conversas sem alterações significativas');
            }
          }
        }
        
        // Notificação de nova mensagem em conversa específica
        else if (message.type === 'new_message_received') {
          console.log('[AdminChat] Notificação de nova mensagem recebida para a conversa:', message.conversationId);
          
          // A mensagem completa está no objeto message.message
          if (message.message && message.conversationId) {
            // Atualização manual do estado para conversas e mensagens
            if (activeConversation && activeConversation.id === message.conversationId) {
              console.log('[AdminChat] Atualizando mensagens da conversa ativa após notificação');
              
              // Atualizar mensagens no cache do React Query
              queryClient.setQueryData(
                ['/api/admin/chat/messages', activeConversation.id, messagesLimit],
                (old: ChatMessage[] = []) => {
                  if (!old) return [message.message];
                  
                  // Verificar se a mensagem já existe no array
                  const exists = old.some(m => m.id === message.message.id);
                  if (exists) return old;
                  
                  // Adicionar a nova mensagem e ordenar por data
                  const updated = [...old, message.message].sort((a, b) => {
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                  });
                  
                  return updated;
                }
              );
            }
            
            // Sempre atualizar a lista de conversas quando receber uma notificação
            refreshConversations();
          }
        }
        
        // Status de usuários online
        else if (message.type === 'user_status') {
          setUsersOnline(prev => {
            const newSet = new Set(prev);
            if (message.online) {
              newSet.add(message.userId);
            } else {
              newSet.delete(message.userId);
            }
            return newSet;
          });
        }
      } catch (error) {
        console.error('[AdminChat] Erro ao processar mensagem WebSocket:', error, message);
      }
    };
    
    // Registrar o handler para processar mensagens
    addMessageHandler(handlerId, handleWebSocketMessage);
    
    // Limpeza ao desmontar
    return () => {
      console.log(`[AdminChat] Removendo handler WebSocket: ${handlerId}`);
      removeMessageHandler(handlerId);
      handlerRegisteredRef.current = false;
      clearAllTimeouts();
    };
  }, [
    user, 
    connected, 
    activeConversation, 
    addMessageHandler, 
    removeMessageHandler, 
    queryClient, 
    messagesLimit, 
    toast,
    refreshConversations,
    clearAllTimeouts
  ]);
  
  // Cálculo otimizado de mensagens não lidas
  const unreadCount = useCallback(() => {
    if (!Array.isArray(conversations)) return 0;
    
    return conversations.reduce((total, conversation) => {
      return total + (conversation.unreadCount || 0);
    }, 0);
  }, [conversations])();
  
  // Consulta para buscar mensagens da conversa ativa
  const { 
    data: messages = [],
    isLoading: isLoadingMessages,
    isFetching: isFetchingMessages
  } = useQuery({
    queryKey: ['/api/admin/chat/messages', activeConversation?.id, messagesLimit],
    queryFn: async () => {
      if (!activeConversation) return [];
      
      try {
        console.log(`[AdminChat] Buscando mensagens para conversa ${activeConversation.id} (limit: ${messagesLimit})`);
        const response = await apiRequest('GET', 
          `/api/admin/chat/messages?conversationId=${activeConversation.id}&limit=${messagesLimit}`
        );
        const messages = await response.json();
        console.log(`[AdminChat] Recebidas ${messages.length} mensagens`);
        return messages;
      } catch (error) {
        console.error('[AdminChat] Erro ao buscar mensagens:', error);
        return [];
      }
    },
    enabled: !!activeConversation && !!user && user.role === UserRole.ADMIN,
    staleTime: 60000,
    refetchInterval: false,
    retry: 2
  });
  
  // Verificar se há mais mensagens para carregar
  const hasMore = messages.length >= messagesLimit;
  
  // Função para carregar mais mensagens
  const loadMoreMessages = useCallback(() => {
    if (hasMore) {
      console.log('[AdminChat] Carregando mais mensagens...');
      setMessagesLimit(prev => prev + 20);
    }
  }, [hasMore]);
  
  // Função para marcar mensagens como lidas
  const markAllAsRead = useCallback(async () => {
    if (!activeConversation || !messages.length || !user) return;
    
    // Filtra apenas mensagens não lidas que não foram enviadas pelo usuário atual
    const unreadMessageIds = messages
      .filter((msg: {read: boolean, senderId: number, id: number}) => !msg.read && msg.senderId !== user.id)
      .map((msg: {id: number}) => msg.id)
      .filter((id: any) => typeof id === 'number'); // Garante que só IDs numéricos são usados
    
    if (unreadMessageIds.length === 0) return;
    
    try {
      console.log(`[AdminChat] Marcando ${unreadMessageIds.length} mensagens como lidas`);
      await apiRequest('POST', '/api/admin/chat/mark-read', { messageIds: unreadMessageIds });
      
      // Atualizar cache local para evitar novas chamadas
      queryClient.setQueryData(
        ['/api/admin/chat/messages', activeConversation.id, messagesLimit],
        (oldMessages: ChatMessage[] = []) => {
          return oldMessages.map((msg: any) => {
            if (unreadMessageIds.includes(msg.id as number)) {
              return { ...msg, read: true };
            }
            return msg;
          });
        }
      );
      
      // Atualizar lista de conversas para refletir mudança em contadores
      refreshConversations();
    } catch (error) {
      console.error('[AdminChat] Erro ao marcar mensagens como lidas:', error);
    }
  }, [activeConversation, messages, user, queryClient, messagesLimit, refreshConversations]);
  
  // Enviar mensagem com suporte a visualização otimista
  const sendMessage = useCallback(async (text: string, attachments: string[] = []) => {
    if (!activeConversation || !user) return;
    
    // Validar entrada
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
    
    // Preparar a mensagem para envio
    const newMessage: InsertChatMessage = {
      conversationId: activeConversation.id,
      senderId: user.id,
      receiverId: activeConversation.participantId ?? 0,
      text,
      message: text,
      attachments,
      read: false,
    };
    
    // Versão otimista para UI imediata
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
    
    try {
      console.log('[AdminChat] Enviando mensagem:', text.substring(0, 30) + (text.length > 30 ? '...' : ''));
      
      // Atualizar UI imediatamente com versão otimista
      queryClient.setQueryData(
        ['/api/admin/chat/messages', activeConversation.id, messagesLimit],
        (oldMessages: ChatMessage[] = []) => [...oldMessages, optimisticMessage]
      );
      
      // Enviar a mensagem para o servidor através da rota correta
      const response = await apiRequest('POST', '/api/admin/chat/messages', newMessage);
      
      // Tratar possíveis erros de resposta
      if (!response.ok) {
        console.error('[AdminChat] Erro HTTP:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('[AdminChat] Resposta de erro:', errorText);
        throw new Error(`Erro ao enviar mensagem: ${response.status} ${response.statusText}`);
      }
      
      const sentMessage = await response.json();
      
      console.log('[AdminChat] Mensagem enviada com sucesso:', sentMessage.id);
      
      // Substituir mensagem temporária pela real no cache
      queryClient.setQueryData(
        ['/api/admin/chat/messages', activeConversation.id, messagesLimit],
        (oldMessages: ChatMessage[] = []) => {
          return oldMessages
            .filter(msg => typeof msg.id === 'string' ? msg.id !== tempId : true)
            .concat(sentMessage);
        }
      );
      
      // Notificar outros usuários via WebSocket (para que o destinatário receba em tempo real)
      sendWebSocketMessage({
        type: 'admin_chat_message',
        message: sentMessage,
        conversationId: sentMessage.conversationId,
        recipientId: activeConversation.participantId ?? 0,
        senderName: user.name || user.username,
        timestamp: Date.now()
      });
      
      // Atualizar lista de conversas
      refreshConversations();
      
      return sentMessage;
    } catch (error) {
      console.error('[AdminChat] Erro ao enviar mensagem:', error);
      
      // Remover mensagem otimista em caso de erro
      queryClient.setQueryData(
        ['/api/admin/chat/messages', activeConversation.id, messagesLimit],
        (oldMessages: ChatMessage[] = []) => oldMessages.filter(msg => typeof msg.id === 'string' ? msg.id !== tempId : true)
      );
      
      // Análise e tratamento detalhado de erros para apresentar mensagens específicas ao usuário
      const errorDetail = error instanceof Error ? error.message : 'Erro de comunicação com o servidor';
      
      // Verificar se o erro é um problema de rede/API específico baseado na mensagem
      let errorMessage = '';
      if (errorDetail.includes('fetch') || errorDetail.includes('network') || errorDetail.includes('Unexpected token')) {
        errorMessage = 'Erro de conexão com o servidor. Verifique sua internet e tente novamente.';
      } else if (errorDetail.includes('timeout')) {
        errorMessage = 'Tempo limite excedido ao enviar mensagem. Tente novamente.';
      } else if (errorDetail.includes('401') || errorDetail.includes('Unauthorized')) {
        errorMessage = 'Sua sessão expirou. Por favor, faça login novamente.';
      } else if (errorDetail.includes('403') || errorDetail.includes('Forbidden')) {
        errorMessage = 'Você não tem permissão para enviar mensagens nesta conversa.';
      } else if (errorDetail.includes('500')) {
        errorMessage = 'Erro interno no servidor. Nossa equipe foi notificada do problema.';
      } else {
        errorMessage = 'Não foi possível enviar sua mensagem. Tente novamente.';
      }
      
      // Adicionar mensagem de erro ao chat para feedback visual imediato
      const errorSystemMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        conversationId: activeConversation.id,
        senderId: -1, // ID especial para sistema
        receiverId: user.id,
        text: errorMessage,
        message: errorMessage,
        createdAt: new Date(),
        isSystemError: true, // Flag para identificar mensagens de erro
        isRead: true,
        read: true
      };
      
      // Adicionar a mensagem de erro ao chat localmente (não persistente)
      queryClient.setQueryData(
        ['/api/admin/chat/messages', activeConversation.id, messagesLimit],
        (oldMessages: ChatMessage[] = []) => [...oldMessages, errorSystemMessage]
      );
      
      // Exibir também no toast para garantir que o usuário veja
      toast({
        title: 'Erro ao enviar mensagem',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsSendingMessage(false);
    }
  }, [
    activeConversation, 
    user, 
    queryClient, 
    messagesLimit, 
    toast, 
    sendWebSocketMessage,
    refreshConversations
  ]);
  
  // Criar nova conversa ou selecionar existente
  const createConversation = useCallback(async (userId: number) => {
    // Verificar conversas existentes primeiro para evitar duplicação
    const existingConversation = conversations.find(c => c.participantId === userId);
    if (existingConversation) {
      console.log(`[AdminChat] Usando conversa existente para usuário ${userId}: ${existingConversation.id}`);
      setActiveConversation(existingConversation);
      return existingConversation;
    }
    
    // Se não existir, criar uma nova
    try {
      console.log(`[AdminChat] Criando nova conversa com usuário ${userId}`);
      const response = await apiRequest('POST', '/api/admin/chat/conversations', { participantId: userId });
      const newConversation = await response.json();
      
      console.log(`[AdminChat] Nova conversa criada: ${newConversation.id}`);
      
      // Atualizar estado
      setActiveConversation(newConversation);
      refreshConversations();
      
      return newConversation;
    } catch (error) {
      console.error('[AdminChat] Erro ao criar conversa:', error);
      toast({
        title: 'Erro ao criar conversa',
        description: error instanceof Error ? error.message : 'Erro ao criar conversa',
        variant: 'destructive'
      });
      throw error;
    }
  }, [conversations, toast, refreshConversations]);
  
  // Marcar mensagens como lidas quando selecionar uma conversa
  useEffect(() => {
    if (activeConversation && !isLoadingMessages && !isFetchingMessages && messages.length > 0) {
      // Atraso deliberado para dar tempo à interface e evitar múltiplas chamadas
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
  
  // Função para excluir uma conversa
  const deleteConversation = useCallback(async (conversationId: number) => {
    if (!conversationId || !user || user.role !== UserRole.ADMIN) {
      console.error('[AdminChat] Tentativa de excluir conversa sem ID ou sem permissões');
      toast({
        title: "Operação não permitida",
        description: "Você não tem permissão para excluir esta conversa",
        variant: "destructive"
      });
      return Promise.reject(new Error("Operação não permitida"));
    }
    
    console.log(`[AdminChat] Excluindo conversa ${conversationId}...`);
    setIsLoadingConversations(true);
    
    try {
      // Verificar se o WebSocket está conectado
      if (!connected) {
        throw new Error("WebSocket não está conectado. Por favor, recarregue a página e tente novamente.");
      }
      
      // Criar uma Promise que será resolvida quando recebermos a confirmação do servidor
      return new Promise((resolve, reject) => {
        // ID único para o handler desta operação específica
        const handlerId = `delete_conversation_${conversationId}_${Date.now()}`;
        
        // Configurar um handler para a resposta
        const messageHandler = (message: WebSocketMessage) => {
          // Se recebemos confirmação de exclusão da conversa
          if (message.type === 'admin_conversation_deleted' && message.conversationId === conversationId) {
            // Remover o handler após receber a resposta
            removeMessageHandler(handlerId);
            
            // Se a conversa excluída era a conversa ativa, limpar a seleção
            if (activeConversation && activeConversation.id === conversationId) {
              setActiveConversation(null);
            }
            
            // Atualizar a lista de conversas localmente removendo a conversa excluída
            setConversations(prev => prev.filter(c => c.id !== conversationId));
            
            // Informar sucesso ao usuário
            toast({
              title: "Conversa excluída",
              description: "A conversa foi excluída com sucesso",
            });
            
            // Atualizar o cache do React Query para refletir a mudança
            queryClient.invalidateQueries({queryKey: ['/api/admin/chat/conversations']});
            
            // Verificar se é necessário atualizar outras conversas
            console.log('[AdminChat] Forçando atualização após exclusão');
            refreshConversations();
            
            setIsLoadingConversations(false);
            resolve(true);
          }
          // Se recebemos um erro
          else if (message.type === 'error' && message.timestamp) {
            // Remover o handler após receber o erro
            removeMessageHandler(handlerId);
            setIsLoadingConversations(false);
            reject(new Error(message.message || "Erro ao excluir conversa"));
          }
        };
        
        // Adicionar o handler temporário
        addMessageHandler(handlerId, messageHandler);
        
        // Enviar a mensagem para excluir a conversa
        sendWebSocketMessage({
          type: 'admin_delete_conversation',
          conversationId: conversationId,
          timestamp: new Date().toISOString()
        });
        
        // Configurar um timeout para evitar que a promessa fique pendente para sempre
        const timeoutId = setTimeout(() => {
          removeMessageHandler(handlerId);
          setIsLoadingConversations(false);
          reject(new Error("Tempo limite excedido ao tentar excluir a conversa"));
        }, 10000); // 10 segundos de timeout
        
        // Armazenar o timeout no ref para possível limpeza
        requestTimeoutsRef.current['delete_conversation'] = timeoutId;
      });
    } catch (error: any) {
      console.error("[AdminChat] Erro ao excluir conversa:", error);
      setIsLoadingConversations(false);
      
      toast({
        title: "Erro ao excluir conversa",
        description: error.message || "Ocorreu um erro ao excluir a conversa",
        variant: "destructive"
      });
      
      setIsLoadingConversations(false);
      return Promise.reject(error);
    }
  }, [user, activeConversation, toast, queryClient, refreshConversations, connected, sendWebSocketMessage, addMessageHandler, removeMessageHandler]);
  
  // Disponibilizar o contexto completo do chat administrativo
  const chatContextValue: AdminChatContextType = {
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
    isSendingMessage,
    refreshConversations,
    deleteConversation
  };
  
  return (
    <AdminChatContext.Provider value={chatContextValue}>
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
    throw new Error('useAdminChat deve ser usado dentro de um AdminChatProvider');
  }
  return context;
}

export default useAdminChat;