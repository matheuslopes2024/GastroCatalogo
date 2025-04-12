import React, { useEffect } from 'react';
import AdminLayout from '@/components/admin/admin-layout';
import AdminChatDashboard from '@/components/admin/admin-chat-dashboard';
import { SimpleAdminChatProvider } from '@/hooks/use-simple-admin-chat';
import adminChatRealTimeSync from '@/lib/admin-chat-realtime-sync';

export default function ChatAdminPage() {
  // Aplicar correção WebSocket e iniciar sistema de sincronização em tempo real
  useEffect(() => {
    console.log('[AdminChat] Inicializando página de chat administrativo...');

    // 1. Aplicar patch para interceptar a criação do WebSocket
    if (typeof window !== 'undefined' && window.WebSocket) {
      console.log('[WS:patch] Aplicando correção WebSocket...');
      const originalWebSocket = window.WebSocket;
      
      // Função que corrige a URL do WebSocket
      const CustomWebSocket = function(url: string | URL, protocols?: string | string[]) {
        // Corrigir URLs incorretas que usam /?token= em vez de /ws?token=
        if (url && typeof url === 'string' && url.includes('/?token=')) {
          console.warn('[WS:patch] Corrigindo URL WebSocket incorreta', url);
          url = url.replace('/?token=', '/ws?token=');
          console.info('[WS:patch] URL corrigida:', url);
        }
        
        // Chamar o construtor original com a URL corrigida
        return new originalWebSocket(url, protocols);
      };
      
      // Copiar propriedades estáticas do WebSocket original
      CustomWebSocket.prototype = originalWebSocket.prototype;
      CustomWebSocket.CONNECTING = originalWebSocket.CONNECTING;
      CustomWebSocket.OPEN = originalWebSocket.OPEN;
      CustomWebSocket.CLOSING = originalWebSocket.CLOSING;
      CustomWebSocket.CLOSED = originalWebSocket.CLOSED;
      
      // Substituir o construtor WebSocket com nossa versão personalizada
      // @ts-ignore - Ignoramos o erro de tipo aqui pois sabemos que funciona
      window.WebSocket = CustomWebSocket;
      
      console.info('[WS:patch] Patch de WebSocket instalado para corrigir URL');
    }

    // 2. Iniciar sistema avançado de sincronização em tempo real
    console.log('[AdminChat] Iniciando sistema avançado de sincronização em tempo real');
    adminChatRealTimeSync.startAdminChatSync();
    
    // Sincronização inicial forçada
    setTimeout(() => {
      adminChatRealTimeSync.synchronizeAdminChat();
    }, 1000);

    // Limpar recursos ao desmontar o componente
    return () => {
      console.log('[AdminChat] Desmontando página de chat administrativo, parando sincronização');
      adminChatRealTimeSync.stopAdminChatSync();
    };
  }, []);

  return (
    <SimpleAdminChatProvider>
      <AdminLayout 
        title="Chat de Suporte" 
        breadcrumbs={[{ title: 'Chat', href: '/admin/chat' }]}
      >
        <div className="h-[calc(100vh-185px)]">
          <AdminChatDashboard />
        </div>
      </AdminLayout>
    </SimpleAdminChatProvider>
  );
}