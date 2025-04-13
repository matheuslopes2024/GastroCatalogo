import { Product } from "@shared/schema";
import { ComparisonResult } from "@/components/product/comparison-result";
import { Loading } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Filter, RefreshCw } from "lucide-react";

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
  
  // Se ocorreu um erro - Tratamento aprimorado para erros de filtro de preço
  if (error) {
    // Verificar se é um erro específico de filtro de preço com várias verificações
    const isPriceFilterError = 
      error.message?.includes('preço') || 
      error.message?.toLowerCase().includes('price') ||
      error.message?.includes('DECIMAL') ||
      error.message?.includes('valor') ||
      error.message?.includes('filter') ||
      error.message?.includes('filtro') ||
      error.message?.includes('format') ||
      error.message?.includes('cast');
    
    return (
      <div className="text-center p-12 bg-white rounded-lg shadow">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>
        
        <h3 className="text-xl font-semibold mb-3 text-red-600">
          {isPriceFilterError 
            ? "Problema com o filtro de preço" 
            : "Erro ao buscar produtos"}
        </h3>
        
        {isPriceFilterError ? (
          <>
            <p className="text-gray-700 mb-4">
              O filtro de preço pode estar causando problemas na busca.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-left max-w-md mx-auto">
              <h4 className="font-medium text-amber-700 mb-2">Sugestões:</h4>
              <ul className="list-disc text-amber-800 pl-5 space-y-1">
                <li>Ajuste os valores mínimo e máximo para uma faixa menor</li>
                <li>Limpe os filtros e aplique apenas filtros básicos</li>
                <li>Use valores arredondados (sem centavos)</li>
                <li>Tente uma faixa de preço diferente</li>
              </ul>
            </div>
          </>
        ) : (
          <p className="text-gray-600 mb-6">
            {errorMessage}
            <span className="block mt-2 text-sm text-gray-400">{error.message}</span>
          </p>
        )}
        
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
            className="flex items-center"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Recarregar página
          </Button>
          
          {isPriceFilterError && (
            <Button 
              onClick={() => {
                // Remover parâmetros de filtro de preço da URL e recarregar
                const url = new URL(window.location.href);
                url.searchParams.delete('minPrice');
                url.searchParams.delete('maxPrice');
                window.location.href = url.toString();
              }}
              variant="destructive"
              className="flex items-center"
            >
              <Filter className="mr-2 h-4 w-4" />
              Limpar filtros de preço
            </Button>
          )}
        </div>
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