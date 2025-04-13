import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { 
  Category, 
  Product 
} from "@shared/schema";
import { SearchLayout } from "@/components/search/search-layout";
import { FilterPanel, SearchFilters } from "@/components/search/filter-panel";
import { SearchFiltersSummary } from "@/components/search/search-filters-summary";
import { SearchResultsGrid } from "@/components/search/search-results-grid";

export default function SearchResults() {
  // Obter parâmetros da URL
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(location.split('?')[1] || '');
  
  // Extrair os parâmetros básicos da URL
  const query = searchParams.get('q') || '';
  const categoryParam = searchParams.get('categoria') || '';
  const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
  
  // Estados
  const [searchTerm, setSearchTerm] = useState(query);
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [currentPage, setCurrentPage] = useState(page);
  
  // Estado dos filtros avançados
  const [filters, setFilters] = useState<SearchFilters>({
    sortBy: searchParams.get('sortBy') || 'price',
    sortDirection: searchParams.get('sortDirection') || 'asc',
    minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined,
    maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined,
    rating: searchParams.get('rating') ? parseFloat(searchParams.get('rating')!) : undefined,
    inStock: searchParams.get('inStock') === 'true',
    hasDiscount: searchParams.get('hasDiscount') === 'true',
    supplierId: searchParams.get('supplierId') ? parseInt(searchParams.get('supplierId')!) : undefined,
    additionalCategories: searchParams.get('additionalCategories') 
      ? JSON.parse(searchParams.get('additionalCategories')!) 
      : undefined
  });
  
  // Número de itens por página
  const itemsPerPage = 12;
  
  // Obter todas as categorias
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });
  
  // Obter categoria atual (se uma estiver selecionada)
  const { data: currentCategory } = useQuery<Category>({
    queryKey: ["/api/categories", selectedCategory],
    enabled: !!selectedCategory && selectedCategory !== "0",
    queryFn: async ({ queryKey }) => {
      const [_, categoryId] = queryKey;
      // Se o categoryId for numérico, buscar por id
      if (!isNaN(Number(categoryId))) {
        const response = await fetch(`/api/categories/${categoryId}`);
        if (!response.ok) throw new Error('Categoria não encontrada');
        return response.json();
      }
      // Caso contrário, buscar por slug
      const response = await fetch(`/api/categories/${categoryId}`);
      if (!response.ok) throw new Error('Categoria não encontrada');
      return response.json();
    }
  });
  
  // Obter lista de fornecedores para os filtros
  const { data: suppliers } = useQuery({
    queryKey: ["/api/suppliers-info"],
    queryFn: async () => {
      const response = await fetch("/api/suppliers-info");
      if (!response.ok) {
        return [];
      }
      return response.json();
    }
  });
  
  // Busca avançada de produtos com filtros do backend
  const {
    data: productsResponse,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["/api/products", { 
      search: query,
      categoryId: selectedCategory !== "0" ? selectedCategory : undefined,
      page: currentPage,
      limit: itemsPerPage,
      ...filters
    }],
    queryFn: async ({ queryKey }) => {
      // Extrair parâmetros de consulta da queryKey
      const [_, params] = queryKey;
      // @ts-ignore - params é um objeto complexo
      const queryParams = params as any;
      
      // Construir URL de consulta com parâmetros
      let url = "/api/products";
      const urlParams = new URLSearchParams();
      
      // Adicionar todos os parâmetros à URL
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          // Tratar arrays (como additionalCategories)
          if (Array.isArray(value)) {
            urlParams.append(key, JSON.stringify(value));
          } else {
            urlParams.append(key, String(value));
          }
        }
      });
      
      const queryString = urlParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
      
      console.log("[DEBUG] Enviando request para:", url);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error("Falha ao buscar produtos");
      }
      
      const result = await response.json();
      console.log("[DEBUG] Resposta da API de produtos:", result);
      return result;
    },
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    staleTime: 60000, // 1 minuto
  });
  
  // Extrair produtos e metadados da resposta
  const products = productsResponse?.data || [];
  const totalResults = productsResponse?.meta?.totalCount || 0;
  const totalPages = Math.ceil(totalResults / itemsPerPage);
  const hasMorePages = currentPage < totalPages;
  
  // Função para atualizar a URL com os filtros atuais
  const updateUrl = () => {
    const newParams = new URLSearchParams();
    
    // Parâmetros básicos
    if (query) newParams.append('q', query);
    if (selectedCategory && selectedCategory !== "0") newParams.append('categoria', selectedCategory);
    if (currentPage > 1) newParams.append('page', currentPage.toString());
    
    // Adicionar todos os filtros à URL
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value) && value.length > 0) {
          newParams.append(key, JSON.stringify(value));
        } else if (!Array.isArray(value)) {
          newParams.append(key, String(value));
        }
      }
    });
    
    // Atualizar a URL sem recarregar a página
    const newUrl = `/busca?${newParams.toString()}`;
    setLocation(newUrl);
  };
  
  // Formulário de busca
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Atualizar estados e disparar nova busca
    setCurrentPage(1);
    
    // Os filtros existentes são mantidos
    updateUrl();
    refetch();
  };
  
  // Gerenciamento de filtros
  const handleFilterChange = (newFilters: SearchFilters) => {
    setFilters(newFilters);
  };
  
  // Aplicar filtros
  const applyFilters = () => {
    setCurrentPage(1);
    updateUrl();
    refetch();
  };
  
  // Remover um filtro específico
  const removeFilter = (filterKey: string, value?: any) => {
    const updatedFilters = { ...filters };
    
    if (filterKey === 'additionalCategories' && value !== undefined) {
      // Remover apenas uma categoria específica
      updatedFilters.additionalCategories = filters.additionalCategories?.filter(
        cat => cat !== value
      );
      if (updatedFilters.additionalCategories?.length === 0) {
        updatedFilters.additionalCategories = undefined;
      }
    } else {
      // Remover o filtro completamente
      // @ts-ignore - filterKey é dinâmico
      updatedFilters[filterKey] = undefined;
    }
    
    setFilters(updatedFilters);
    setCurrentPage(1);
    
    // Aplicar imediatamente
    setTimeout(() => {
      updateUrl();
      refetch();
    }, 0);
  };
  
  // Limpar todos os filtros
  const clearAllFilters = () => {
    setFilters({});
    setCurrentPage(1);
    
    // Manter apenas a busca e categoria
    const newParams = new URLSearchParams();
    if (query) newParams.append('q', query);
    if (selectedCategory && selectedCategory !== "0") newParams.append('categoria', selectedCategory);
    
    setLocation(`/busca?${newParams.toString()}`);
    refetch();
  };
  
  // Carregar mais resultados (paginação)
  const loadMoreResults = () => {
    setCurrentPage(prev => prev + 1);
    const newParams = new URLSearchParams(location.split('?')[1] || '');
    newParams.set('page', (currentPage + 1).toString());
    setLocation(`/busca?${newParams.toString()}`);
    refetch();
  };
  
  // Atualizar estados quando a URL mudar
  useEffect(() => {
    setSearchTerm(query);
    setSelectedCategory(categoryParam || "0");
    setCurrentPage(page);
    
    // Atualizar filtros da URL
    const newFilters: SearchFilters = {
      sortBy: searchParams.get('sortBy') || undefined,
      sortDirection: searchParams.get('sortDirection') || undefined,
      minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined,
      maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined,
      rating: searchParams.get('rating') ? parseFloat(searchParams.get('rating')!) : undefined,
      inStock: searchParams.get('inStock') === 'true',
      hasDiscount: searchParams.get('hasDiscount') === 'true',
      supplierId: searchParams.get('supplierId') ? parseInt(searchParams.get('supplierId')!) : undefined,
      additionalCategories: searchParams.get('additionalCategories')
        ? JSON.parse(searchParams.get('additionalCategories')!)
        : undefined
    };
    
    // Filtrar valores undefined/null
    Object.keys(newFilters).forEach(key => {
      // @ts-ignore - key é dinâmico
      if (newFilters[key] === undefined || newFilters[key] === null) {
        // @ts-ignore - key é dinâmico
        delete newFilters[key];
      }
    });
    
    setFilters(newFilters);
  }, [query, categoryParam, page, location]);

  // Componente de cabeçalho do layout de busca (formulário de busca)
  const searchHeader = (
    <form onSubmit={handleSearch} className="flex gap-4 max-w-2xl">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <Input
          type="text"
          placeholder="Buscar produtos..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <Button type="submit">Buscar</Button>
    </form>
  );
  
  // Componente de sidebar do layout de busca (painel de filtros)
  const searchSidebar = (
    <FilterPanel
      categories={categories || []}
      suppliers={suppliers || []}
      filters={filters}
      onFilterChange={handleFilterChange}
      onClearFilters={clearAllFilters}
      onApplyFilters={applyFilters}
      totalResults={totalResults}
      loading={isLoading}
    />
  );

  return (
    <SearchLayout
      header={searchHeader}
      sidebar={searchSidebar}
    >
      {/* Título e resumo dos resultados */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">
          {currentCategory ? 
            `${currentCategory.name}` : 
            query ? 
              `Resultados para "${query}"` : 
              "Todos os produtos"}
        </h1>
        
        {/* Resumo dos filtros aplicados */}
        <SearchFiltersSummary 
          filters={filters} 
          categories={categories}
          suppliers={suppliers}
          onRemoveFilter={removeFilter}
        />
      </div>
      
      {/* Resultados da busca */}
      <SearchResultsGrid
        products={products}
        isLoading={isLoading}
        error={error as Error}
        onLoadMore={loadMoreResults}
        hasMore={hasMorePages}
        emptyMessage={
          Object.keys(filters).length > 0
            ? "Nenhum produto encontrado com os filtros selecionados. Tente ajustar seus critérios de busca."
            : "Nenhum produto encontrado. Tente buscar por outros termos."
        }
      />
    </SearchLayout>
  );
}
