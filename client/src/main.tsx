import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

// Importar a correção de storage antes de qualquer outro código
// Isso irá prevenir erros de "Access to storage is not allowed from this context"
import './lib/storage-patch';

console.log("[Inicialização] Storage patch carregado - corrigindo erros de Storage API");

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
