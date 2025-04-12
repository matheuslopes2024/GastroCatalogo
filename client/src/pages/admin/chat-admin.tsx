import React, { useEffect } from 'react';
import AdminLayout from '@/components/admin/admin-layout';
import AdminChatDashboard from '@/components/admin/admin-chat-dashboard';
import { AdminChatProvider } from '@/hooks/use-admin-chat';

export default function ChatAdminPage() {
  // Aplicar correção WebSocket ao montar a página
  useEffect(() => {
    // Aplicar patch para interceptar a criação do WebSocket
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

    // Nenhuma limpeza necessária ao desmontar, pois o patch deve permanecer ativo
  }, []);

  return (
    <AdminChatProvider>
      <AdminLayout 
        title="Chat de Suporte" 
        breadcrumbs={[{ title: 'Chat', href: '/admin/chat' }]}
      >
        <div className="h-[calc(100vh-185px)]">
          <AdminChatDashboard />
        </div>
      </AdminLayout>
    </AdminChatProvider>
  );
}