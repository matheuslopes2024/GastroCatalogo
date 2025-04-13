import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Star, X } from "lucide-react";
import { Category } from "@shared/schema";
import { SearchFilters, hasActiveFilters } from "@/types/search-filters";

interface SearchFiltersSummaryProps {
  filters: SearchFilters;
  categories?: Category[];
  suppliers?: any[];
  onRemoveFilter: (filterKey: string, value?: any) => void;
}

export function SearchFiltersSummary({ 
  filters, 
  categories = [],
  suppliers = [],
  onRemoveFilter 
}: SearchFiltersSummaryProps) {
  const hasFilters = hasActiveFilters(filters);
  
  // Ordenação
  const getSortLabel = () => {
    if (!filters.sortBy) return null;
    
    const direction = filters.sortDirection === 'desc' ? 'decrescente' : 'crescente';
    
    switch (filters.sortBy) {
      case 'price':
        return `Preço ${direction}`;
      case 'rating':
        return `Melhor avaliação`;
      case 'name':
        return `Nome (A-Z)`;
      case 'createdAt':
        return 'Mais recentes';
      case 'popularity':
        return 'Mais populares';
      default:
        return `${filters.sortBy} ${direction}`;
    }
  };
  
  if (!hasFilters) {
    return null;
  }
  
  return (
    <div className="flex flex-wrap items-center gap-2 my-4">
      <span className="text-sm font-medium text-gray-500 mr-1">Filtros aplicados:</span>
      
      {/* Preço */}
      {(filters.minPrice !== undefined || filters.maxPrice !== undefined) && (
        <Badge variant="outline" className="px-3 py-1 flex items-center gap-1">
          <span>Preço: {filters.minPrice !== undefined ? formatCurrency(filters.minPrice) : 'R$ 0'} - {filters.maxPrice !== undefined ? formatCurrency(filters.maxPrice) : 'sem limite'}</span>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-4 w-4 ml-1 text-gray-500 hover:text-red-500"
            onClick={() => {
              onRemoveFilter('minPrice');
              onRemoveFilter('maxPrice');
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      )}
      
      {/* Ordenação */}
      {filters.sortBy && (
        <Badge variant="outline" className="px-3 py-1 flex items-center gap-1">
          <span>Ordenado por: {getSortLabel()}</span>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-4 w-4 ml-1 text-gray-500 hover:text-red-500"
            onClick={() => {
              onRemoveFilter('sortBy');
              onRemoveFilter('sortDirection');
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      )}
      
      {/* Avaliação */}
      {filters.rating !== undefined && (
        <Badge variant="outline" className="px-3 py-1 flex items-center gap-1">
          <span className="flex items-center gap-1">
            Avaliação: {filters.rating}+
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
          </span>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-4 w-4 ml-1 text-gray-500 hover:text-red-500"
            onClick={() => onRemoveFilter('rating')}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      )}
      
      {/* Em estoque */}
      {filters.inStock && (
        <Badge variant="outline" className="px-3 py-1 flex items-center gap-1">
          <span>Em estoque</span>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-4 w-4 ml-1 text-gray-500 hover:text-red-500"
            onClick={() => onRemoveFilter('inStock')}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      )}
      
      {/* Em promoção */}
      {filters.hasDiscount && (
        <Badge variant="outline" className="px-3 py-1 flex items-center gap-1 bg-green-50">
          <span>Com desconto</span>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-4 w-4 ml-1 text-gray-500 hover:text-red-500"
            onClick={() => onRemoveFilter('hasDiscount')}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      )}
      
      {/* Fornecedor */}
      {filters.supplierId !== undefined && (
        <Badge variant="outline" className="px-3 py-1 flex items-center gap-1">
          <span>
            Fornecedor: {
              suppliers.find(s => s.id === filters.supplierId)?.name || 
              `ID ${filters.supplierId}`
            }
          </span>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-4 w-4 ml-1 text-gray-500 hover:text-red-500"
            onClick={() => onRemoveFilter('supplierId')}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      )}
      
      {/* Categorias adicionais */}
      {filters.additionalCategories && filters.additionalCategories.length > 0 && (
        <Badge variant="outline" className="px-3 py-1 flex items-center gap-1">
          <span>
            Categorias: {
              filters.additionalCategories.map(id => 
                categories.find(c => c.id === id)?.name || `ID ${id}`
              ).join(', ')
            }
          </span>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-4 w-4 ml-1 text-gray-500 hover:text-red-500"
            onClick={() => onRemoveFilter('additionalCategories')}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      )}
    </div>
  );
}