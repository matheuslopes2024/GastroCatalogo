import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Category } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";
import { Search, Filter, CircleCheck, Star, CircleDollarSign, Truck, CalendarCheck, CircleX, ArrowUpDown } from "lucide-react";

// Importando a interface e funções de gerenciamento de filtros
import { SearchFilters, SortOption, sortOptionLabels, parseSortOption } from "@/types/search-filters";

interface FilterPanelProps {
  categories?: Category[]; 
  suppliers?: any[];
  filters: SearchFilters;
  onFilterChange: (filters: SearchFilters) => void;
  onClearFilters: () => void;
  onApplyFilters: () => void;
  totalResults?: number;
  loading?: boolean;
}

export function FilterPanel({
  categories = [],
  suppliers = [],
  filters,
  onFilterChange,
  onClearFilters,
  onApplyFilters,
  totalResults = 0,
  loading = false
}: FilterPanelProps) {
  const [priceRange, setPriceRange] = useState<[number, number]>([
    filters.minPrice || 0, 
    filters.maxPrice || 1000
  ]);
  
  // Mapeando as opções de ordenação a partir da enumeração
  const sortOptions = Object.values(SortOption).map(value => ({
    value,
    label: sortOptionLabels[value]
  }));
  
  // Função para atualizar o filtro de ordenação
  const handleSortChange = (value: string) => {
    const { field, direction } = parseSortOption(value);
    onFilterChange({
      ...filters,
      sortBy: field,
      sortDirection: direction
    });
  };
  
  // Função para formatar os valores de preço
  const formatPriceLabel = (value: number) => {
    return formatCurrency(value);
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <Filter className="mr-2 h-5 w-5 text-primary" />
          Filtros Avançados
        </h3>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onClearFilters}
          className="text-gray-500 hover:text-red-500"
        >
          <CircleX className="mr-1 h-4 w-4" />
          Limpar
        </Button>
      </div>
      
      <Separator className="my-3" />
      
      {/* Resultados e botão de aplicar filtros */}
      <div className="flex flex-col mb-6">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">
            {loading 
              ? "Buscando produtos..." 
              : `${totalResults} ${totalResults === 1 ? 'resultado encontrado' : 'resultados encontrados'}`}
          </span>
          <Button 
            size="sm" 
            onClick={onApplyFilters}
            disabled={loading}
          >
            <Search className="mr-1 h-4 w-4" />
            Aplicar Filtros
          </Button>
        </div>
      </div>
      
      <Accordion type="multiple" defaultValue={["ordenacao", "preco", "filtros-rapidos"]}>
        {/* Ordenação */}
        <AccordionItem value="ordenacao">
          <AccordionTrigger className="py-3">
            <span className="flex items-center">
              <ArrowUpDown className="mr-2 h-4 w-4 text-primary" />
              Ordenação
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="py-2">
              <Select 
                value={`${filters.sortBy || 'price'}-${filters.sortDirection || 'asc'}`}
                onValueChange={handleSortChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </AccordionContent>
        </AccordionItem>
        
        {/* Preço */}
        <AccordionItem value="preco">
          <AccordionTrigger className="py-3">
            <span className="flex items-center">
              <CircleDollarSign className="mr-2 h-4 w-4 text-primary" />
              Faixa de Preço
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="py-4">
              <div className="mb-6">
                <Slider
                  min={0}
                  max={10000}
                  step={50}
                  value={priceRange}
                  onValueChange={(value) => {
                    setPriceRange(value as [number, number]);
                    onFilterChange({
                      ...filters,
                      minPrice: value[0], 
                      maxPrice: value[1]
                    });
                  }}
                  className="mt-2"
                />
                <div className="flex justify-between mt-2 text-sm text-gray-500">
                  <span>{formatPriceLabel(priceRange[0])}</span>
                  <span>{formatPriceLabel(priceRange[1])}</span>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        
        {/* Filtros Rápidos */}
        <AccordionItem value="filtros-rapidos">
          <AccordionTrigger className="py-3">
            <span className="flex items-center">
              <CircleCheck className="mr-2 h-4 w-4 text-primary" />
              Filtros Rápidos
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 py-2">
              {/* Em promoção */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="hasDiscount" className="text-sm font-medium">
                    Em promoção
                  </Label>
                </div>
                <Switch 
                  id="hasDiscount" 
                  checked={filters.hasDiscount} 
                  onCheckedChange={(checked) => {
                    onFilterChange({...filters, hasDiscount: checked});
                  }}
                />
              </div>
              
              {/* Em estoque */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="inStock" className="text-sm font-medium">
                    Produtos em estoque
                  </Label>
                </div>
                <Switch 
                  id="inStock" 
                  checked={filters.inStock} 
                  onCheckedChange={(checked) => {
                    onFilterChange({...filters, inStock: checked});
                  }}
                />
              </div>
              
              {/* Rating mínimo */}
              <div className="pt-2">
                <Label htmlFor="rating" className="text-sm font-medium block mb-2">
                  Avaliação mínima
                </Label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      className={`flex items-center justify-center w-10 h-10 rounded-full border ${
                        (filters.rating || 0) >= rating
                          ? "bg-primary text-white border-primary"
                          : "bg-white text-gray-400 border-gray-200"
                      }`}
                      onClick={() => onFilterChange({...filters, rating})}
                    >
                      <Star className="h-5 w-5" fill={(filters.rating || 0) >= rating ? "white" : "none"} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        
        {/* Fornecedores */}
        {suppliers && suppliers.length > 0 && (
          <AccordionItem value="fornecedores">
            <AccordionTrigger className="py-3">
              <span className="flex items-center">
                <Truck className="mr-2 h-4 w-4 text-primary" />
                Fornecedores
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="py-2 space-y-2">
                {suppliers.map((supplier) => (
                  <div key={supplier.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`supplier-${supplier.id}`}
                      checked={filters.supplierId === supplier.id}
                      onCheckedChange={(checked) => {
                        onFilterChange({
                          ...filters, 
                          supplierId: checked ? supplier.id : undefined
                        });
                      }}
                    />
                    <Label htmlFor={`supplier-${supplier.id}`} className="text-sm">
                      {supplier.companyName || supplier.name}
                    </Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
        
        {/* Categorias Adicionais */}
        {categories && categories.length > 0 && (
          <AccordionItem value="categorias-adicionais">
            <AccordionTrigger className="py-3">
              <span className="flex items-center">
                <CalendarCheck className="mr-2 h-4 w-4 text-primary" />
                Categorias
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="py-2 space-y-2">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`category-${category.id}`}
                      checked={filters.additionalCategories?.includes(category.id)}
                      onCheckedChange={(checked) => {
                        const current = filters.additionalCategories || [];
                        const updated = checked
                          ? [...current, category.id]
                          : current.filter(id => id !== category.id);
                        
                        onFilterChange({
                          ...filters, 
                          additionalCategories: updated.length ? updated : undefined
                        });
                      }}
                    />
                    <Label htmlFor={`category-${category.id}`} className="text-sm">
                      {category.name}
                    </Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  );
}