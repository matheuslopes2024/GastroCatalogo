/**
 * @file storage-patch.ts
 * @description Implementa uma solução para o erro "Access to storage is not allowed from this context"
 * 
 * Este arquivo cria um substituto para localStorage e sessionStorage que funciona mesmo
 * em contextos restritos como os usados pelo Stripe.js ou outros scripts de terceiros
 * que tentam acessar storage mas estão rodando em contextos isolados.
 * 
 * - Funciona como um polyfill que previne erros
 * - Implementa a mesma API do Storage padrão
 * - É ativado apenas quando detecta problemas de acesso
 */

// Referência para o console original para depuração
const originalConsole = console;

// Interface básica para armazenamento em memória
export interface MemoryStorage {
  data: Record<string, string>;
  length: number;
  clear(): void;
  getItem(key: string): string | null;
  key(index: number): string | null;
  removeItem(key: string): void;
  setItem(key: string, value: string): void;
}

/**
 * Cria um storage em memória que implementa a mesma API do localStorage/sessionStorage
 * mas não depende de acesso ao DOM ou contexto do navegador
 */
export function createMemoryStorage(): MemoryStorage {
  return {
    data: {},
    length: 0,
    clear() { this.data = {}; this.length = 0; },
    getItem(key: string) { return this.data[key] === undefined ? null : this.data[key]; },
    key(index: number) { return Object.keys(this.data)[index] || null; },
    removeItem(key: string) { delete this.data[key]; this.length = Object.keys(this.data).length; },
    setItem(key: string, value: string) { this.data[key] = String(value); this.length = Object.keys(this.data).length; }
  };
}

/**
 * Aplicar o patch para substituir os storages se necessário
 * Esta função tentará detectar se é possível acessar os storages nativos
 * e caso contrário substituirá por uma versão em memória
 */
export function applyStoragePatch(): void {
  // Só executar no navegador
  if (typeof window === 'undefined') return;

  try {
    // Verificar se já existe uma substituição
    if ((window as any).__storagePatchApplied) return;

    // Storages alternativos
    const localStorageMemory = createMemoryStorage();
    const sessionStorageMemory = createMemoryStorage();

    // Verificar se há problemas de acesso aos storages nativos
    let needToReplace = false;
    try {
      // Tentar acessar para verificar erros
      window.localStorage.getItem('test');
      window.sessionStorage.getItem('test');
    } catch (e) {
      originalConsole.warn('Detectado problema de acesso a localStorage/sessionStorage, usando substituto seguro');
      needToReplace = true;
    }

    // Aplicar substituição se necessário
    if (needToReplace) {
      try {
        Object.defineProperty(window, 'localStorage', {
          value: localStorageMemory,
          writable: false,
          configurable: true
        });
        Object.defineProperty(window, 'sessionStorage', {
          value: sessionStorageMemory,
          writable: false,
          configurable: true
        });
        (window as any).__storagePatchApplied = true;
        originalConsole.log('Storage patch aplicado com sucesso');
      } catch (e) {
        originalConsole.error('Erro ao substituir APIs de storage:', e);
      }
    }
  } catch (e) {
    originalConsole.error('Erro ao aplicar storage patch:', e);
  }
}

// Função para chamada externa a partir de qualquer componente
export function ensureSafeStorage(): void {
  applyStoragePatch();
}

// Auto-execução quando importado
applyStoragePatch();

export default {
  ensureSafeStorage,
  applyStoragePatch,
  createMemoryStorage
};