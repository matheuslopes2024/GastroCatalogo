/**
 * @file SmartSearchBar.tsx
 * @description Barra de pesquisa avançada com sugestões em tempo real, histórico e filtros
 * Versão 2.1 com melhorias de desempenho, tratamento de erros e acessibilidade
 */

import { useState, useEffect, useRef, useCallback, memo } from "react";
import { Search, ArrowRight, Loader2, History, Tag, X, Info, AlertTriangle } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { 
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator
} from "@/components/ui/command";
import { useDebounce } from "@/hooks/use-debounce";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { ErrorBoundary } from "@/components/ui/error-boundary";

// Interface para o resultado da busca
interface SmartSearchResult {
  id: number;
  name: string;
  slug: string;
  imageUrl?: string;
  category?: string;
  price?: string;
  categoryId?: number;
  supplierId?: number;
  supplierName?: string;
  discount?: number;
  rating?: number;
}

// Interface para categorias populares
interface PopularCategory {
  id: number;
  name: string;
  count: number;
}

// Quantidade máxima de itens no histórico
const MAX_SEARCH_HISTORY = 10;

// Component de histórico de busca
const SearchHistory = memo(({ 
  history, 
  onSelect, 
  onClear 
}: { 
  history: string[], 
  onSelect: (term: string) => void,
  onClear: (term?: string) => void
}) => {
  if (!history.length) return null;

  return (
    <CommandGroup heading="Histórico de Pesquisa" className="relative">
      <div className="absolute right-2 top-0">
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 px-2 text-xs"
          onClick={() => onClear()}
        >
          Limpar
        </Button>
      </div>
      {history.map((term, i) => (
        <CommandItem 
          key={`history-${i}`}
          value={`history-${term}`}
          onSelect={() => onSelect(term)}
          className="flex items-center"
        >
          <History className="mr-2 h-4 w-4 opacity-50" />
          <span className="flex-1 truncate">{term}</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onClear(term);
            }}
            className="h-6 w-6 p-0 rounded-full opacity-50 hover:opacity-100"
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Remover</span>
          </Button>
        </CommandItem>
      ))}
    </CommandGroup>
  );
});

// Componente para tratamento de erros na busca
const SearchErrorHandler = memo(({ error, retry }: { error: Error | null, retry: () => void }) => {
  if (!error) return null;
  
  return (
    <div className="p-4 border rounded-md bg-destructive/10 text-sm my-2 mx-3">
      <div className="flex items-center text-destructive mb-2">
        <AlertTriangle className="h-4 w-4 mr-2" />
        <strong>Erro ao buscar sugestões</strong>
      </div>
      <p className="text-sm mb-2">{error.message}</p>
      <Button size="sm" variant="outline" onClick={retry}>
        Tentar novamente
      </Button>
    </div>
  );
});

// Componente principal de busca
export const SmartSearchBar = memo(function SmartSearchBar() {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [value, setValue] = useState("");
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    try {
      // Carregar histórico do localStorage
      const savedHistory = localStorage.getItem('gastro_search_history');
      return savedHistory ? JSON.parse(savedHistory) : [];
    } catch (e) {
      console.error("Erro ao carregar histórico de busca:", e);
      return [];
    }
  });
  const [lastError, setLastError] = useState<Error | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchBarRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Controle de foco no input ao abrir o diálogo
  useEffect(() => {
    if (open && inputRef.current) {
      // Pequeno atraso para garantir que o diálogo está totalmente aberto
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Guardar o histórico no localStorage quando mudar
  useEffect(() => {
    try {
      localStorage.setItem('gastro_search_history', JSON.stringify(searchHistory));
    } catch (e) {
      console.error("Erro ao salvar histórico de busca:", e);
    }
  }, [searchHistory]);

  // Shortcut para abrir a pesquisa com Ctrl+K ou /
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Não ativar se estiver em um input, textarea ou elemento editável
      if (
        e.target instanceof HTMLInputElement || 
        e.target instanceof HTMLTextAreaElement || 
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }
      
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Busca em tempo real usando a API enquanto o usuário digita
  const { 
    data: searchResults, 
    isLoading, 
    error, 
    refetch 
  } = useQuery<SmartSearchResult[]>({
    queryKey: ["/api/search-suggestions", debouncedSearchTerm],
    enabled: debouncedSearchTerm.length > 1,
    queryFn: async ({ queryKey }) => {
      try {
        setLastError(null);
        const [_, term] = queryKey;
        if (!term || (typeof term === 'string' && term.length < 2)) {
          return [];
        }
        
        // Usamos apiRequest em vez de fetch para aproveitar as configurações de tratamento de erros
        const res = await apiRequest(
          'GET', 
          `/api/search-suggestions?q=${encodeURIComponent(term as string)}`,
          undefined,
          { 'Cache-Control': 'no-cache' }
        );
        
        if (!res.ok) {
          const errorMessage = `Erro ${res.status}: ${res.statusText}`;
          console.error("Erro ao buscar sugestões:", errorMessage);
          throw new Error(errorMessage);
        }
        
        const data = await res.json();
        
        // Validar e garantir que temos um array (defesa contra dados incorretos)
        if (!Array.isArray(data)) {
          console.warn("API retornou formato inesperado para sugestões:", typeof data);
          return [];
        }
        
        return data as SmartSearchResult[];
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error("Erro desconhecido");
        console.error("Erro ao buscar sugestões de pesquisa:", errorObj);
        setLastError(errorObj);
        return [];
      }
    },
    // Configurações de cache e retry
    retry: 1,
    refetchOnWindowFocus: false,
    staleTime: 60000, // 1 minuto
    gcTime: 300000, // 5 minutos
    throwOnError: false
  });

  // Busca de categorias populares para sugestões
  const { data: popularCategories } = useQuery<PopularCategory[]>({
    queryKey: ["/api/popular-categories"],
    enabled: open && debouncedSearchTerm.length < 2,
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/popular-categories');
        if (!res.ok) return [];
        
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      } catch (e) {
        console.error("Erro ao buscar categorias populares:", e);
        return [];
      }
    },
    staleTime: 1000 * 60 * 60, // 1 hora
    throwOnError: false
  });

  // Função para adicionar termo ao histórico
  const addToHistory = useCallback((term: string) => {
    if (!term.trim()) return;
    
    setSearchHistory(prev => {
      // Remover ocorrências anteriores do mesmo termo
      const filtered = prev.filter(item => item.toLowerCase() !== term.toLowerCase());
      // Adicionar ao início e limitar o tamanho
      return [term, ...filtered].slice(0, MAX_SEARCH_HISTORY);
    });
  }, []);

  // Função para limpar todo o histórico ou um item específico
  const clearHistory = useCallback((term?: string) => {
    if (term) {
      setSearchHistory(prev => prev.filter(item => item !== term));
    } else {
      setSearchHistory([]);
      toast({
        title: "Histórico limpo",
        description: "Seu histórico de pesquisa foi removido"
      });
    }
  }, [toast]);

  // Função para executar a busca
  const handleSearch = useCallback(() => {
    if (value.trim()) {
      setOpen(false);
      // Adicionar ao histórico
      addToHistory(value.trim());
      // Navegar para a página de resultados
      setLocation(`/busca?q=${encodeURIComponent(value.trim())}`);
    }
  }, [value, addToHistory, setLocation]);

  // Função para selecionar um resultado e navegar para ele
  const handleSelect = useCallback((selectedValue: string, productSlug?: string) => {
    setOpen(false);
    
    // Adicionar ao histórico
    addToHistory(selectedValue);
    
    if (productSlug) {
      setLocation(`/produto/${productSlug}`);
    } else {
      setValue(selectedValue);
      setLocation(`/busca?q=${encodeURIComponent(selectedValue)}`);
    }
  }, [addToHistory, setLocation]);

  // Selecionar um termo do histórico
  const handleSelectHistory = useCallback((term: string) => {
    setSearchTerm(term);
    setValue(term);
  }, []);

  // Selecionar uma categoria
  const handleSelectCategory = useCallback((categoryId: number, categoryName: string) => {
    setOpen(false);
    addToHistory(categoryName);
    setLocation(`/busca?categoria=${categoryId}`);
  }, [addToHistory, setLocation]);

  return (
    <ErrorBoundary
      fallback={
        <div className="relative w-full">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Pesquisar equipamentos e produtos..."
            className="w-full pl-10 pr-24 py-2 border border-gray-200 rounded-lg"
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-7 px-2 bg-primary/10 hover:bg-primary/20 text-primary"
            >
              Buscar
            </Button>
          </div>
        </div>
      }
    >
      {/* Barra de pesquisa visível */}
      <div className="relative w-full" ref={searchBarRef}>
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          <Search className="h-4 w-4" />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onClick={() => setOpen(true)}
          placeholder="Pesquisar equipamentos, utensílios, produtos... (Ctrl+K)"
          className="w-full pl-10 pr-24 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 shadow-sm hover:shadow-md"
          aria-label="Barra de pesquisa"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch();
            }
          }}
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="sm" 
                  onClick={handleSearch}
                  variant="ghost" 
                  className="h-7 px-2 bg-primary/10 hover:bg-primary/20 text-primary"
                  aria-label="Iniciar pesquisa"
                >
                  Buscar
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Pesquisar produtos</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Painel de busca avançada com sugestões em tempo real */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <CommandInput
            ref={inputRef}
            value={searchTerm}
            onValueChange={setSearchTerm}
            placeholder="Digite o que você procura..."
            className="flex-1 focus:outline-none"
          />
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        </div>
        <CommandList>
          {/* Exibir erros se ocorrerem */}
          {(error || lastError) && (
            <SearchErrorHandler error={error || lastError} retry={() => refetch()} />
          )}
          
          <CommandEmpty>
            {debouncedSearchTerm.length > 0 ? (
              <div className="py-6 text-center text-sm">
                <p>Nenhum resultado encontrado para "{debouncedSearchTerm}"</p>
                <p className="text-gray-500 mt-1">
                  Tente termos mais gerais ou verifique a ortografia
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    setValue(debouncedSearchTerm);
                    handleSelect(debouncedSearchTerm);
                  }}
                >
                  Buscar por "{debouncedSearchTerm}" <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            ) : (
              <p className="py-6 text-center text-sm">
                Digite para buscar produtos...
              </p>
            )}
          </CommandEmpty>

          {/* Histórico de pesquisa */}
          {searchHistory.length > 0 && debouncedSearchTerm.length < 2 && (
            <>
              <SearchHistory 
                history={searchHistory} 
                onSelect={handleSelectHistory} 
                onClear={clearHistory} 
              />
              <CommandSeparator />
            </>
          )}

          {/* Sugestões baseadas na pesquisa */}
          {searchResults && searchResults.length > 0 && (
            <>
              <CommandGroup heading="Produtos">
                {searchResults.map((result) => (
                  <CommandItem
                    key={`product-${result.id}`}
                    value={`product-${result.name}`}
                    onSelect={() => handleSelect(result.name, result.slug)}
                    className="flex items-center py-2"
                  >
                    {result.imageUrl && (
                      <div className="h-10 w-10 rounded-md overflow-hidden mr-3 border flex-shrink-0">
                        <img 
                          src={result.imageUrl} 
                          alt={result.name} 
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div className="flex flex-col flex-1 truncate min-w-0">
                      <span className="font-medium truncate">{result.name}</span>
                      <div className="flex justify-between w-full text-sm text-gray-500">
                        <span className="truncate mr-2">{result.category}</span>
                        {result.price && (
                          <span className="whitespace-nowrap">
                            {formatCurrency(Number(result.price))}
                            {result.discount && result.discount > 0 && (
                              <Badge variant="outline" className="ml-1 px-1 text-xs bg-green-50 text-green-600 border-green-200">
                                -{result.discount}%
                              </Badge>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>

              <div className="p-2 text-center">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setValue(debouncedSearchTerm);
                    handleSelect(debouncedSearchTerm);
                  }}
                >
                  Ver todos os resultados para "{debouncedSearchTerm}"
                </Button>
              </div>
            </>
          )}

          {/* Categorias populares (quando não há pesquisa) */}
          {popularCategories && popularCategories.length > 0 && debouncedSearchTerm.length < 2 && (
            <CommandGroup heading="Categorias Populares">
              <div className="flex flex-wrap gap-2 p-2">
                {popularCategories.map((category) => (
                  <Badge 
                    key={`category-${category.id}`}
                    variant="secondary"
                    className="cursor-pointer py-1 hover:bg-secondary/80 transition-colors"
                    onClick={() => handleSelectCategory(category.id, category.name)}
                  >
                    <Tag className="mr-1 h-3 w-3" />
                    {category.name}
                  </Badge>
                ))}
              </div>
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </ErrorBoundary>
  );
});