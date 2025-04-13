import { useState, useEffect, useRef } from "react";
import { Search, ArrowRight, Loader2 } from "lucide-react";
import { useNavigate } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { useDebounce } from "@/hooks/use-debounce";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface SmartSearchResult {
  id: number;
  name: string;
  slug: string;
  imageUrl?: string;
  category?: string;
  price?: string;
  categoryId?: number;
}

export function SmartSearchBar() {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Controle de foco no input ao abrir o diálogo
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  // Shortcut para abrir a pesquisa com Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Busca em tempo real usando a API enquanto o usuário digita
  const { data: searchResults, isLoading } = useQuery<SmartSearchResult[]>({
    queryKey: ["/api/search-suggestions", debouncedSearchTerm],
    enabled: debouncedSearchTerm.length > 1,
    queryFn: async () => {
      try {
        const res = await apiRequest(
          "GET", 
          `/api/search-suggestions?q=${encodeURIComponent(debouncedSearchTerm)}`
        );
        
        if (!res.ok) {
          throw new Error("Erro ao buscar sugestões");
        }
        
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Erro ao buscar sugestões de pesquisa:", error);
        return [];
      }
    }
  });

  // Função para executar a busca
  const handleSearch = () => {
    if (value.trim()) {
      setOpen(false);
      navigate(`/busca?q=${encodeURIComponent(value.trim())}`);
    }
  };

  // Função para selecionar um resultado e navegar para ele
  const handleSelect = (selectedValue: string, productSlug?: string) => {
    setOpen(false);
    
    if (productSlug) {
      navigate(`/produto/${productSlug}`);
    } else {
      setValue(selectedValue);
      navigate(`/busca?q=${encodeURIComponent(selectedValue)}`);
    }
  };

  return (
    <>
      {/* Barra de pesquisa visível */}
      <div className="relative w-full">
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
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch();
            }
          }}
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
          <Button 
            size="sm" 
            onClick={handleSearch}
            variant="ghost" 
            className="h-7 px-2 bg-primary/10 hover:bg-primary/20 text-primary"
          >
            Buscar
          </Button>
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

          {searchResults && searchResults.length > 0 && (
            <>
              <CommandGroup heading="Produtos">
                {searchResults.map((result) => (
                  <CommandItem
                    key={result.id}
                    value={result.name}
                    onSelect={() => handleSelect(result.name, result.slug)}
                    className="flex items-center py-2"
                  >
                    {result.imageUrl && (
                      <div className="h-10 w-10 rounded-md overflow-hidden mr-3 border flex-shrink-0">
                        <img 
                          src={result.imageUrl} 
                          alt={result.name} 
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex flex-col flex-1 truncate">
                      <span className="font-medium truncate">{result.name}</span>
                      <div className="flex justify-between w-full text-sm text-gray-500">
                        <span>{result.category}</span>
                        {result.price && <span>{result.price}</span>}
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
        </CommandList>
      </CommandDialog>
    </>
  );
}