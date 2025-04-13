import { Product } from "@shared/schema";
import { ComparisonResult } from "@/components/product/comparison-result";
import { Loading } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";

interface SearchResultsGridProps {
  products: Product[] | undefined;
  isLoading: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  emptyMessage?: string;
  errorMessage?: string;
  error?: Error | null;
}

export function SearchResultsGrid({
  products,
  isLoading,
  onLoadMore,
  hasMore = false,
  emptyMessage = "Nenhum produto encontrado para os critérios selecionados.",
  errorMessage = "Ocorreu um erro ao buscar os produtos.",
  error
}: SearchResultsGridProps) {
  
  // Se estiver carregando, mostrar componente de loading
  if (isLoading) {
    return <Loading className="py-12" />;
  }
  
  // Se ocorreu um erro
  if (error) {
    return (
      <div className="text-center p-12 bg-white rounded-lg shadow">
        <h3 className="text-lg font-medium text-red-600 mb-2">Erro</h3>
        <p className="text-gray-500 mb-4">{errorMessage}</p>
        <p className="text-sm text-gray-400">{error.message}</p>
      </div>
    );
  }
  
  // Se não houver produtos
  if (!products || products.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Sem resultados</h3>
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }
  
  // Renderiza a lista de produtos
  return (
    <div className="space-y-4">
      {/* Lista de produtos */}
      {products.map((product, index) => (
        <ComparisonResult 
          key={product.id} 
          product={product} 
          isBestPrice={index === 0} 
        />
      ))}
      
      {/* Botão para carregar mais */}
      {hasMore && onLoadMore && (
        <div className="mt-8 text-center">
          <Button
            variant="outline"
            className="bg-white border border-primary text-primary hover:bg-primary hover:text-white font-medium py-2 px-6 rounded"
            onClick={onLoadMore}
          >
            Carregar mais resultados
          </Button>
        </div>
      )}
    </div>
  );
}