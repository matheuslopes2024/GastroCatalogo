import { useState } from "react";
import { ComparisonResult } from "@/components/product/comparison-result";
import { ProductSearchResultCard } from "@/components/product/product-search-result-card";
import { Loading } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle, 
  Filter, 
  RefreshCw, 
  LayoutList, 
  LayoutGrid, 
  AlignLeft 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Definição de tipo para os produtos usados nas grids de busca
// Adaptado de acordo com schema.ts e necessidades do componente
interface Product {
  id: number;
  name: string;
  description: string;
  slug: string;
  categoryId: number;
  supplierId: number;
  price: string;
  originalPrice?: string | null;
  discount?: number | null;
  rating?: string | number | null;
  ratingsCount?: number;
  imageUrl: string;
  features?: string[];
  supplierName?: string;
  [key: string]: any; // Para outros campos que possam existir
}

interface SearchResultsGridProps {
  products: Product[] | undefined;
  isLoading: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  emptyMessage?: string;
  errorMessage?: string;
  error?: Error | null;
}

// Define os tipos de visualização
type ViewMode = 'card' | 'list' | 'detailed';

export function SearchResultsGrid({
  products,
  isLoading,
  onLoadMore,
  hasMore = false,
  emptyMessage = "Nenhum produto encontrado para os critérios selecionados.",
  errorMessage = "Ocorreu um erro ao buscar os produtos.",
  error
}: SearchResultsGridProps) {
  // Estado para o modo de visualização
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  
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
      <div className="text-center p-12 bg-white rounded-xl shadow-lg">
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
      <div className="text-center py-16 bg-white rounded-xl shadow-lg">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6">
          <Filter className="h-10 w-10 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold mb-3 text-gray-800">Sem resultados</h3>
        <p className="text-gray-500 max-w-lg mx-auto">{emptyMessage}</p>
      </div>
    );
  }
  
  // Selecionar de visualização
  const ViewToggle = () => (
    <div className="flex items-center justify-between mb-6">
      <div className="text-sm text-gray-500">
        {products.length} {products.length === 1 ? 'produto encontrado' : 'produtos encontrados'}
      </div>
      <div className="flex items-center bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setViewMode('card')}
          className={`p-2 rounded ${viewMode === 'card' ? 'bg-white shadow text-primary' : 'text-gray-500'}`}
          title="Visualização em cards"
        >
          <LayoutGrid size={18} />
        </button>
        <button
          onClick={() => setViewMode('list')}
          className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow text-primary' : 'text-gray-500'}`}
          title="Visualização em lista"
        >
          <LayoutList size={18} />
        </button>
        <button
          onClick={() => setViewMode('detailed')}
          className={`p-2 rounded ${viewMode === 'detailed' ? 'bg-white shadow text-primary' : 'text-gray-500'}`}
          title="Visualização detalhada"
        >
          <AlignLeft size={18} />
        </button>
      </div>
    </div>
  );
  
  // Renderizar os produtos de acordo com o modo de visualização
  const renderProducts = () => {
    // Animação para a transição entre modos de visualização
    const containerVariants = {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.05
        }
      }
    };
    
    if (viewMode === 'card') {
      return (
        <motion.div 
          className="grid grid-cols-1 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {products.map((product, index) => (
            <ProductSearchResultCard 
              key={product.id} 
              product={{
                id: product.id,
                name: product.name,
                slug: product.slug || product.name.toLowerCase().replace(/\s+/g, '-'),
                description: product.description || '',
                price: product.price,
                originalPrice: product.originalPrice || null,
                discount: product.discount || null,
                imageUrl: product.imageUrl || 'https://placehold.co/300x300?text=Sem+imagem',
                rating: typeof product.rating === 'string' ? parseFloat(product.rating) : product.rating,
                ratingsCount: product.ratingsCount || 0,
                supplierId: product.supplierId,
                supplierName: product.supplierName || ''
              }} 
              index={index}
            />
          ))}
        </motion.div>
      );
    } else if (viewMode === 'list') {
      // Visualização em lista mais compacta
      return (
        <motion.div 
          className="flex flex-col gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {products.map((product, index) => (
            <motion.div 
              key={product.id}
              className="bg-white rounded-lg shadow-md p-4 flex items-center gap-4 hover:shadow-lg transition-shadow"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="w-20 h-20 flex-shrink-0">
                <img 
                  src={product.imageUrl || 'https://placehold.co/300x300?text=Sem+imagem'} 
                  alt={product.name} 
                  className="w-full h-full object-cover rounded-md"
                />
              </div>
              <div className="flex-grow">
                <h3 className="font-medium">{product.name}</h3>
                <div className="text-sm text-gray-500 line-clamp-1">{product.description}</div>
              </div>
              <div className="flex-shrink-0 text-right">
                <div className="font-bold text-primary text-lg">
                  R$ {parseFloat(product.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                {product.originalPrice && (
                  <div className="text-gray-400 line-through text-sm">
                    R$ {parseFloat(product.originalPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                )}
                <div className="mt-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-xs"
                    onClick={() => window.location.href = `/produto/${product.slug || product.id}`}
                  >
                    Ver detalhes
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      );
    } else {
      // Visualização detalhada (mantendo o componente antigo para compatibilidade)
      return (
        <motion.div 
          className="space-y-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {products.map((product, index) => (
            <ComparisonResult 
              key={product.id} 
              product={product} 
              isBestPrice={index === 0} 
            />
          ))}
        </motion.div>
      );
    }
  };
  
  // Renderização final
  return (
    <div className="space-y-4">
      {/* Seletor de modo de visualização */}
      <ViewToggle />
      
      {/* Lista de produtos com transição animada entre modos */}
      <AnimatePresence mode="wait">
        <motion.div
          key={viewMode}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {renderProducts()}
        </motion.div>
      </AnimatePresence>
      
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