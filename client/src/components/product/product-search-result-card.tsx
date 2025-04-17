import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { ChevronRight, Star, PercentCircle, ShoppingCart, ArrowRight, Eye, BarChart2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/use-cart';
import { formatCurrency } from '@/lib/utils';

// Tipos
interface ProductSearchResultProps {
  product: {
    id: number;
    name: string;
    slug: string;
    description: string;
    price: string;
    originalPrice: string | null;
    discount: number | null;
    imageUrl: string;
    rating: number | null;
    ratingsCount: number;
    supplierId?: number;
    supplierName?: string;
  };
  index?: number;
}

export function ProductSearchResultCard({ product, index = 0 }: ProductSearchResultProps) {
  const { addItem } = useCart();
  const [isHovered, setIsHovered] = useState(false);
  
  const variantDelay = index * 0.1;
  
  // Calcular o desconto e preço original se não estiver disponível
  const discount = product.discount || 0;
  const hasDiscount = discount > 0;
  const price = parseFloat(product.price);
  const originalPrice = product.originalPrice 
    ? parseFloat(product.originalPrice) 
    : hasDiscount ? price / (1 - discount / 100) : null;
  
  // Formatação das estrelas de classificação
  const rating = product.rating || 4.2; // Valor padrão se não houver classificação
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  const renderStars = () => {
    return (
      <div className="flex text-yellow-400">
        {Array(5).fill(0).map((_, i) => (
          <span key={i}>
            {i < fullStars ? (
              <Star className="h-4 w-4 fill-yellow-400" />
            ) : i === fullStars && hasHalfStar ? (
              <span className="relative">
                <Star className="h-4 w-4 text-gray-300" />
                <Star className="absolute top-0 left-0 h-4 w-4 fill-yellow-400 overflow-hidden" style={{ clipPath: 'inset(0 50% 0 0)' }} />
              </span>
            ) : (
              <Star className="h-4 w-4 text-gray-300" />
            )}
          </span>
        ))}
      </div>
    );
  };
  
  return (
    <motion.div 
      className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: variantDelay }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="grid grid-cols-1 md:grid-cols-12">
        {/* Imagem do produto - Coluna esquerda */}
        <div className="md:col-span-3 relative">
          <div className="relative h-full min-h-[200px] md:min-h-0">
            <img 
              src={product.imageUrl} 
              alt={product.name} 
              className="w-full h-full object-cover aspect-[4/3] md:aspect-auto" 
            />
            {hasDiscount && (
              <div className="absolute top-0 left-0 bg-red-500 text-white text-xs font-bold px-2 py-1 m-2 rounded-md flex items-center gap-1">
                <PercentCircle className="h-3 w-3" />
                <span>-{discount}%</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent md:hidden"></div>
            <div className="absolute bottom-2 left-2 flex items-center md:hidden">
              <div className="bg-white/10 backdrop-blur-sm px-2 py-1 rounded text-white text-xs flex items-center">
                {renderStars()}
                <span className="ml-1">({product.ratingsCount || 0})</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Detalhes do produto - Coluna central */}
        <div className="md:col-span-6 p-4 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2">{product.name}</h3>
            
            <div className="flex items-center mb-2 hidden md:flex">
              {renderStars()}
              <span className="text-sm text-gray-500 ml-1">({product.ratingsCount || 0})</span>
            </div>
            
            <p className="text-gray-600 text-sm mb-3 line-clamp-3">{product.description}</p>
            
            {product.supplierName && (
              <div className="text-sm text-gray-500 mb-3">
                Fornecedor: <span className="font-medium">{product.supplierName}</span>
              </div>
            )}
            
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                Entrega Rápida
              </span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                Garantia 1 ano
              </span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
                Produto Verificado
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 md:hidden">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => addItem({
                id: product.id,
                name: product.name,
                price: price,
                imageUrl: product.imageUrl
              } as any, 1)}
            >
              <ShoppingCart className="h-4 w-4 mr-1" />
              Comprar
            </Button>
            <Link href={`/comparar/${product.slug}`}>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
              >
                <BarChart2 className="h-4 w-4 mr-1" />
                Comparar
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Preço e ações - Coluna direita */}
        <div className="md:col-span-3 p-4 bg-gray-50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-end gap-2 mb-1">
              <div className="flex items-center text-green-600 text-xs font-medium">
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Melhor preço
              </div>
            </div>
            
            <div className="text-right">
              {originalPrice && (
                <div className="text-gray-400 line-through text-sm">
                  {formatCurrency(originalPrice)}
                </div>
              )}
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(price)}
              </div>
              <div className="text-xs text-gray-500">
                à vista ou em até 12x
              </div>
            </div>
          </div>
          
          <div className="mt-4 space-y-2 hidden md:block">
            <Button 
              className="w-full"
              onClick={() => addItem({
                id: product.id,
                name: product.name,
                price: price,
                imageUrl: product.imageUrl
              } as any, 1)}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Adicionar ao Carrinho
            </Button>
            
            <Link href={`/produto/${product.slug}`}>
              <Button 
                variant="outline" 
                className="w-full"
              >
                <Eye className="h-4 w-4 mr-2" />
                Ver Detalhes
              </Button>
            </Link>
            
            <Link href={`/comparar/${product.slug}`}>
              <Button 
                variant="ghost"
                className="w-full text-primary hover:text-primary/90"
              >
                <BarChart2 className="h-4 w-4 mr-2" />
                Comparar Preços
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Barra de comparação que aparece ao passar o mouse */}
      <motion.div 
        className="bg-primary/95 text-white py-2 px-4 flex items-center justify-between"
        initial={{ height: 0, opacity: 0 }}
        animate={{ 
          height: isHovered ? 'auto' : 0,
          opacity: isHovered ? 1 : 0
        }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center">
          <BarChart2 className="h-5 w-5 mr-2" />
          <span className="font-medium">Comparar preços entre fornecedores</span>
        </div>
        <Link href={`/comparar/${product.slug}`}>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-white hover:text-white hover:bg-white/20"
          >
            Ver Comparação
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </motion.div>
    </motion.div>
  );
}