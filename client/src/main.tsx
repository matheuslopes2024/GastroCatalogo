import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import App from "./App";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

// Importar a correção de storage antes de qualquer outro código
// Isso irá prevenir erros de "Access to storage is not allowed from this context"
import './lib/storage-patch';

console.log("[Inicialização] Storage patch carregado - corrigindo erros de Storage API");

// Captura de erros global para exibir logs de erros mais detalhados
window.addEventListener('error', (event) => {
  console.error('[ERRO GLOBAL]', event.error);
  // Não bloqueia o processamento padrão do erro
  return false;
});

// Captura de promessas rejeitadas não tratadas
window.addEventListener('unhandledrejection', (event) => {
  console.error('[PROMESSA NÃO TRATADA]', event.reason);
  // Não bloqueia o processamento padrão do erro
  return false;
});

const rootElement = document.getElementById("root");

// Verificação adicional para garantir que o elemento root existe
if (!rootElement) {
  console.error("Elemento root não encontrado! A aplicação não pode ser inicializada.");
} else {
  try {
    const root = createRoot(rootElement);
    root.render(
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </StrictMode>
    );
    console.log("[Inicialização] Aplicação renderizada com sucesso no modo estrito");
  } catch (error) {
    console.error("[ERRO CRÍTICO DE INICIALIZAÇÃO]", error);
  }
}
