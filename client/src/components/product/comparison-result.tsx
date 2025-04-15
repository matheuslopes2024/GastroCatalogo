import { Link } from "wouter";
import { Check, Star, Store, Tag } from "lucide-react";
import { Product, Category } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";

interface ComparisonResultProps {
  product: Product;
  isBestPrice?: boolean;
  showDebugInfo?: boolean;
}

export function ComparisonResult({ 
  product, 
  isBestPrice = false,
  showDebugInfo = true // Habilitar depuração por padrão para identificar problemas
}: ComparisonResultProps) {
  // Buscar informações do fornecedor
  const { data: supplier, isLoading: isLoadingSupplier } = useQuery({
    queryKey: ["/api/suppliers-info", product.supplierId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/suppliers-info?ids=${product.supplierId}`);
        if (!response.ok) {
          throw new Error("Erro ao carregar informações do fornecedor");
        }
        const suppliers = await response.json();
        return suppliers?.length > 0 ? suppliers[0] : null;
      } catch (error) {
        console.error("Erro ao buscar informações do fornecedor:", error);
        return null;
      }
    }
  });
  
  // Buscar informações da categoria principal
  const { data: category } = useQuery<Category>({
    queryKey: ["/api/categories", product.categoryId],
    queryFn: async () => {
      const response = await fetch(`/api/categories/${product.categoryId}`);
      if (!response.ok) {
        throw new Error("Erro ao carregar informações da categoria");
      }
      return response.json();
    }
  });

  /**
   * Processador avançado de features do produto
   * 
   * Esta implementação lida com diferentes formatos de dados de features:
   * 1. Arrays de strings simples
   * 2. Arrays de objetos com {name, value}
   * 3. Arrays mistos ou outros formatos
   * 
   * O resultado é sempre um array de strings seguro para renderização
   */
  const processFeatures = (rawFeatures: any): string[] => {
    if (!rawFeatures) return [];
    
    try {
      // Se for string em formato JSON, tentar fazer parse
      if (typeof rawFeatures === 'string' && 
          (rawFeatures.startsWith('[') || rawFeatures.startsWith('{'))) {
        try {
          rawFeatures = JSON.parse(rawFeatures);
        } catch (e) {
          console.log("Feature não é um JSON válido, usando como texto");
        }
      }
      
      // Se não for array, converter para array com um item
      if (!Array.isArray(rawFeatures)) {
        rawFeatures = [rawFeatures];
      }
      
      // Mapear cada feature para string segura
      return rawFeatures.map((feature: any, index: number) => {
        if (feature === null || feature === undefined) {
          return `Feature ${index + 1}`;
        }
        
        if (typeof feature === 'string') {
          return feature;
        }
        
        if (typeof feature === 'number' || typeof feature === 'boolean') {
          return String(feature);
        }
        
        // Se for objeto com name/value ou name/text
        if (typeof feature === 'object') {
          if (feature.name && feature.value !== undefined) {
            return `${feature.name}: ${feature.value}`;
          }
          
          if (feature.name) {
            return feature.name;
          }
          
          if (feature.text) {
            return feature.text;
          }
          
          // Tentativa final de extrair algo útil
          const keys = Object.keys(feature);
          if (keys.length > 0) {
            return `${keys[0]}: ${feature[keys[0]]}`;
          }
        }
        
        return `Feature ${index + 1}`;
      });
    } catch (error) {
      console.error("Erro ao processar features:", error);
      return [];
    }
  };
  
  // Processar features de forma segura
  const features = processFeatures(product.features);
  
  // Determinar as categorias adicionais (usado para depuração)
  const hasAdditionalCategories = product.additionalCategories && 
                                 Array.isArray(product.additionalCategories) && 
                                 product.additionalCategories.length > 0;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Product Image */}
        <div className="md:w-1/5">
          <img
            src={product.imageUrl || "https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?auto=format&fit=crop&w=300&h=200"}
            alt={product.name}
            className="w-full h-40 md:h-auto object-cover rounded"
          />
        </div>

        {/* Product Details */}
        <div className="md:w-2/5">
          <h3 className="text-lg font-bold mb-1">{product.name}</h3>
          <div className="flex items-center mb-2">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => {
                const rating = product.rating ? parseFloat(product.rating.toString()) : 0;
                return (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.floor(rating)
                        ? "fill-current"
                        : i < Math.ceil(rating)
                        ? "fill-current"
                        : ""
                    }`}
                  />
                );
              })}
            </div>
            <span className="ml-1 text-sm text-gray-500">
              ({product.ratingsCount} avaliações)
            </span>
          </div>

          {/* Informações da categoria - Adicionada para debug e visibilidade */}
          {showDebugInfo && (
            <div className="border border-gray-200 rounded p-2 mb-3 bg-gray-50">
              <div className="flex items-center mb-1">
                <Tag className="w-4 h-4 mr-1 text-primary" />
                <span className="text-xs font-semibold">Categoria Principal:</span>
                <span className="text-xs ml-1">{category?.name || `ID ${product.categoryId}`}</span>
              </div>
              
              {hasAdditionalCategories && (
                <div className="text-xs">
                  <span className="font-semibold">Categorias adicionais:</span>
                  <span className="ml-1">{product.additionalCategories.join(', ')}</span>
                </div>
              )}
              
              {/* ID do produto - útil para debug */}
              <div className="text-xs text-gray-500 mt-1">
                ID: {product.id}
              </div>
            </div>
          )}
          
          <ul className="text-sm space-y-1 text-gray-500 mb-3">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center">
                <Check className="h-4 w-4 text-green-500 mr-2" />
                {feature}
              </li>
            ))}
          </ul>

          <div className="flex items-center mt-3">
            {isLoadingSupplier ? (
              <Skeleton className="h-6 w-24" />
            ) : supplier ? (
              <>
                <Store className="w-5 h-5 mr-2 text-gray-500" />
                <span className="text-sm font-medium">{supplier.companyName || supplier.name}</span>
              </>
            ) : (
              <span className="text-sm text-gray-500">Fornecedor não encontrado</span>
            )}
          </div>
        </div>

        {/* Price and Action */}
        <div className="md:w-2/5 flex flex-col items-start md:items-end justify-between">
          <div className="flex flex-col items-start md:items-end mb-4">
            {isBestPrice && (
              <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 mb-2">
                Melhor Preço
              </Badge>
            )}
            {product.originalPrice && (
              <div className="line-through text-gray-500 text-sm">
                {formatCurrency(Number(product.originalPrice))}
              </div>
            )}
            <div className="text-2xl font-bold text-gray-900 relative inline-block">
              {formatCurrency(Number(product.price))}
              <span className="absolute bottom-1 left-0 w-full h-1 bg-[#FF5A60] bg-opacity-40 -z-10"></span>
            </div>
            <div className="text-sm text-gray-500 mt-1">
              à vista ou em até 12x
            </div>
          </div>

          <div className="space-y-2 w-full md:w-auto">
            <Link href={`/produto/${product.slug}`}>
              <Button className="w-full md:w-auto bg-[#FF5A60] hover:bg-opacity-90 text-white font-bold py-3 px-6 rounded">
                Ver oferta
              </Button>
            </Link>
            <Button
              variant="outline"
              className="w-full md:w-auto bg-white border border-primary text-primary hover:bg-primary hover:text-white font-medium py-2 px-4 rounded"
            >
              Comparar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
