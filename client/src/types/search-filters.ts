import { ProductSortTypeValue } from "@shared/schema";

/**
 * Interface robusta para os filtros de busca de produtos
 * Todas as propriedades são opcionais, mas fortemente tipadas
 */
export interface SearchFilters {
  // Filtros de preço
  minPrice?: number;
  maxPrice?: number;
  
  // Filtros de avaliação
  rating?: number;
  
  // Filtros de disponibilidade e promoção
  inStock?: boolean;
  hasDiscount?: boolean;
  
  // Filtros por fornecedor/marca
  supplierId?: number;
  brandId?: number;
  
  // Ordenação
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  
  // Filtros de características e categorias
  features?: string[];
  additionalCategories?: number[];
  
  // Filtros adicionais
  createdAfter?: Date;
  includeInactive?: boolean;
}

/**
 * Enumeração para opções de ordenação disponíveis na interface
 */
export enum SortOption {
  PRICE_ASC = "price-asc",
  PRICE_DESC = "price-desc",
  RATING_DESC = "rating-desc",
  NAME_ASC = "name-asc",
  CREATED_DESC = "createdAt-desc",
  POPULARITY_DESC = "popularity-desc"
}

/**
 * Mapeamento das opções de ordenação para a interface de usuário
 */
export const sortOptionLabels: Record<SortOption, string> = {
  [SortOption.PRICE_ASC]: "Menor preço",
  [SortOption.PRICE_DESC]: "Maior preço",
  [SortOption.RATING_DESC]: "Melhor avaliação",
  [SortOption.NAME_ASC]: "Nome (A-Z)",
  [SortOption.CREATED_DESC]: "Mais recentes",
  [SortOption.POPULARITY_DESC]: "Mais populares"
};

/**
 * Analisa a opção de ordenação para obter campo e direção
 * @param sortOption Opção de ordenação selecionada
 * @returns Objeto com o campo e direção de ordenação
 */
export function parseSortOption(sortOption: string): { 
  field: string; 
  direction: 'asc' | 'desc' 
} {
  const [field, direction] = sortOption.split('-');
  return { 
    field,
    direction: (direction as 'asc' | 'desc') || 'asc'
  };
}

/**
 * Verifica se há filtros aplicados
 * @param filters Objeto de filtros a ser verificado
 * @returns true se houver pelo menos um filtro aplicado
 */
export function hasActiveFilters(filters: SearchFilters): boolean {
  return Object.entries(filters).some(([key, value]) => {
    // Ignorar chaves específicas que não são consideradas filtros ativos
    if (key === 'sortBy' || key === 'sortDirection') {
      return false;
    }
    
    // Verificar se o valor é significativo
    if (value === undefined || value === null) {
      return false;
    }
    
    // Para arrays, verificar se não está vazio
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    
    // Para outros valores, considerar como filtro ativo
    return true;
  });
}

/**
 * Converte os filtros para query params para a URL
 * @param filters Objeto de filtros a ser convertido
 * @returns URLSearchParams com os filtros
 */
export function filtersToQueryParams(filters: SearchFilters): URLSearchParams {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      // Tratar arrays
      if (Array.isArray(value)) {
        if (value.length > 0) {
          params.append(key, JSON.stringify(value));
        }
      }
      // Tratar datas
      else if (value instanceof Date) {
        params.append(key, value.toISOString());
      }
      // Outros valores
      else {
        params.append(key, String(value));
      }
    }
  });
  
  return params;
}

/**
 * Converte query params da URL para o objeto de filtros
 * @param searchParams URLSearchParams a serem convertidos
 * @returns Objeto SearchFilters com os valores dos parâmetros
 */
export function queryParamsToFilters(searchParams: URLSearchParams): SearchFilters {
  const filters: SearchFilters = {};
  
  // Extrair e converter parâmetros de busca
  if (searchParams.get('minPrice')) {
    filters.minPrice = parseFloat(searchParams.get('minPrice')!);
  }
  
  if (searchParams.get('maxPrice')) {
    filters.maxPrice = parseFloat(searchParams.get('maxPrice')!);
  }
  
  if (searchParams.get('rating')) {
    filters.rating = parseFloat(searchParams.get('rating')!);
  }
  
  if (searchParams.get('inStock')) {
    const inStockValue = searchParams.get('inStock');
    filters.inStock = inStockValue === 'true' || inStockValue === '1';
  }
  
  if (searchParams.get('hasDiscount')) {
    const discountValue = searchParams.get('hasDiscount');
    filters.hasDiscount = discountValue === 'true' || discountValue === '1';
  }
  
  if (searchParams.get('supplierId')) {
    filters.supplierId = parseInt(searchParams.get('supplierId')!);
  }
  
  if (searchParams.get('brandId')) {
    filters.brandId = parseInt(searchParams.get('brandId')!);
  }
  
  if (searchParams.get('sortBy')) {
    filters.sortBy = searchParams.get('sortBy')!;
  }
  
  if (searchParams.get('sortDirection')) {
    filters.sortDirection = searchParams.get('sortDirection') as 'asc' | 'desc';
  }
  
  if (searchParams.get('additionalCategories')) {
    try {
      const categoriesJson = searchParams.get('additionalCategories')!;
      filters.additionalCategories = JSON.parse(categoriesJson);
    } catch (error) {
      console.error('Erro ao analisar additionalCategories:', error);
    }
  }
  
  if (searchParams.get('features')) {
    try {
      const featuresJson = searchParams.get('features')!;
      filters.features = JSON.parse(featuresJson);
    } catch (error) {
      console.error('Erro ao analisar features:', error);
    }
  }
  
  if (searchParams.get('createdAfter')) {
    try {
      filters.createdAfter = new Date(searchParams.get('createdAfter')!);
    } catch (error) {
      console.error('Erro ao analisar createdAfter:', error);
    }
  }
  
  if (searchParams.get('includeInactive')) {
    filters.includeInactive = searchParams.get('includeInactive') === 'true';
  }
  
  return filters;
}