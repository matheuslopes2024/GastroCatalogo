/**
 * @file admin-chat-realtime-sync.ts
 * @description Sistema de sincronização em tempo real para o chat administrativo
 */

import { queryClient } from './queryClient';

// Estado interno
let activeConversationId: number | null = null;

/**
 * Registra atividade do usuário no chat administrativo
 */
export function registerAdminChatActivity(conversationId?: number): void {
  console.log('[ChatSync] Atividade registrada', conversationId);
  
  if (conversationId) {
    activeConversationId = conversationId;
  }
}

/**
 * Sincroniza dados do chat administrativo
 */
export function synchronizeAdminChat(): void {
  // 1. Sincronizar lista de conversas
  syncConversationsList();
  
  // 2. Sincronizar mensagens da conversa ativa
  if (activeConversationId !== null) {
    syncActiveConversation(activeConversationId);
  }
}

/**
 * Inicia o sistema de sincronização em tempo real
 */
export function startAdminChatSync(): void {
  console.log('[ChatSync] Sistema de sincronização iniciado');
}

/**
 * Para o sistema de sincronização em tempo real
 */
export function stopAdminChatSync(): void {
  console.log('[ChatSync] Sistema de sincronização parado');
}

/**
 * Sincroniza a lista de conversas
 */
function syncConversationsList(): void {
  const cacheKey = '/api/admin/chat/conversations';
  
  console.log('[ChatSync] Sincronizando lista de conversas');
  queryClient.invalidateQueries({queryKey: [cacheKey]})
    .then(() => {
      console.log('[ChatSync] Lista de conversas sincronizada com sucesso');
    })
    .catch(error => {
      console.error('[ChatSync] Erro ao sincronizar lista de conversas:', error);
    });
}

/**
 * Sincroniza a conversa ativa
 */
function syncActiveConversation(conversationId: number): void {
  console.log(`[ChatSync] Sincronizando mensagens da conversa: ${conversationId}`);
  queryClient.invalidateQueries({
    queryKey: ['/api/admin/chat/messages', conversationId]
  })
    .then(() => {
      console.log(`[ChatSync] Mensagens da conversa ${conversationId} sincronizadas`);
    })
    .catch(error => {
      console.error(`[ChatSync] Erro ao sincronizar mensagens: ${error}`);
    });
}

/**
 * Marca conversa ativa atual
 */
export function setActiveConversation(conversationId: number | null): void {
  activeConversationId = conversationId;
  if (conversationId !== null) {
    registerAdminChatActivity(conversationId);
  }
}

// Exportar para uso em componentes
export default {
  startAdminChatSync,
  stopAdminChatSync,
  synchronizeAdminChat,
  registerAdminChatActivity,
  setActiveConversation
};