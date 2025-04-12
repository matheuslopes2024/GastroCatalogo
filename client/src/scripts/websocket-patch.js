/**
 * Patch para corrigir problemas de conexão WebSocket no Admin
 */

(function() {
  // Precisamos interceptar a criação do WebSocket
  const originalWebSocket = window.WebSocket;
  
  window.WebSocket = function(url, protocols) {
    // Corrigir URLs incorretas que usam /?token= em vez de /ws?token=
    if (url && url.includes('/?token=')) {
      console.warn('[WS:patch] Corrigindo URL WebSocket incorreta', url);
      url = url.replace('/?token=', '/ws?token=');
      console.info('[WS:patch] URL corrigida:', url);
    }
    
    // Chamar o construtor original com a URL corrigida
    return new originalWebSocket(url, protocols);
  };
  
  // Manter as propriedades estáticas do WebSocket
  window.WebSocket.CONNECTING = originalWebSocket.CONNECTING;
  window.WebSocket.OPEN = originalWebSocket.OPEN;
  window.WebSocket.CLOSING = originalWebSocket.CLOSING;
  window.WebSocket.CLOSED = originalWebSocket.CLOSED;
  
  console.info('[WS:patch] Patch de WebSocket instalado para corrigir URL');
})();