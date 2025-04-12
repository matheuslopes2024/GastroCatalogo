/**
 * @file admin-chat-realtime-monitor.tsx
 * @description Monitoramento em tempo real para o chat administrativo
 */

import React, { useState, useEffect } from 'react';
import { useAdminChat } from '@/hooks/use-admin-chat';
import { queryClient } from '@/lib/queryClient';

/**
 * Componente invisível que monitora eventos do chat administrativo
 * e garante que as conversas e mensagens sejam sempre atualizadas
 * automaticamente sem precisar atualizar a página
 */
export default function AdminChatRealtimeMonitor() {
  // Buscar métodos e dados do hook de chat administrativo
  const { refreshConversations, activeConversation } = useAdminChat();
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());
  
  // Efeito para iniciar sistema de monitoramento em tempo real
  useEffect(() => {
    // Verificar se há uma conversa ativa para monitorar
    const conversationId = activeConversation?.id;
    
    console.log(`[MonitorRealtime] Iniciando monitoramento${conversationId ? ` para conversa ${conversationId}` : ' global'}`);
    
    // Função para forçar atualização dos dados
    const forceUpdate = () => {
      const now = Date.now();
      // Evitar atualizações muito frequentes (mínimo 3 segundos entre atualizações)
      if (now - lastUpdate > 3000) {
        console.log('[MonitorRealtime] Forçando atualização dos dados');
        refreshConversations();
        setLastUpdate(now);
        
        // Invalidar consultas React Query
        if (conversationId) {
          queryClient.invalidateQueries({
            queryKey: ['/api/admin/chat/messages', conversationId]
          });
        }
        
        queryClient.invalidateQueries({
          queryKey: ['/api/admin/chat/conversations']
        });
      }
    };
    
    // Registrar para eventos personalizados de atualizações
    const handleMessagesUpdated = () => {
      console.log('[MonitorRealtime] Evento de mensagens atualizadas detectado');
      forceUpdate();
    };
    
    const handleConversationsUpdated = () => {
      console.log('[MonitorRealtime] Evento de conversas atualizadas detectado');
      forceUpdate();
    };
    
    // Adicionar listeners para eventos personalizados
    window.addEventListener('admin-chat:messages-updated', handleMessagesUpdated);
    window.addEventListener('admin-chat:conversations-updated', handleConversationsUpdated);
    
    // Configurar verificação periódica a cada 10 segundos
    const intervalId = setInterval(() => {
      console.log('[MonitorRealtime] Verificação periódica');
      forceUpdate();
    }, 10000);
    
    // Limpar recursos ao desmontar
    return () => {
      console.log('[MonitorRealtime] Desmontando monitor em tempo real');
      clearInterval(intervalId);
      window.removeEventListener('admin-chat:messages-updated', handleMessagesUpdated);
      window.removeEventListener('admin-chat:conversations-updated', handleConversationsUpdated);
    };
  }, [activeConversation, refreshConversations, lastUpdate]);
  
  // Monitor não renderiza nada
  return null;
}