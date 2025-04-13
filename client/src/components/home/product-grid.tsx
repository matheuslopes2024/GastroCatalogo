import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { 
  Star, 
  ShoppingCart, 
  Heart, 
  PercentCircle, 
  Eye, 
  ArrowUpRight,
  PackageOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';
import { useCart } from '@/hooks/use-cart';
import { formatCurrency } from '@/lib/utils';

// Tipos
interface Product {
  id: number;
  name: string;
  slug: string;
  price: string;
  originalPrice: string | null;
  discount: number | null;
  imageUrl: string;
  rating: number | null;
  ratingsCount: number;
}

// Variantes de animação
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24
    }
  }
};

// Componente de produto individual
const ProductCard = ({ product }: { product: Product }) => {
  const { addItem } = useCart();
  const [isHovered, setIsHovered] = useState(false);
  
  const hasDiscount = product.discount && product.discount > 0;
  
  return (
    <motion.div variants={itemVariants}>
      <Card 
        className="overflow-hidden h-full border-none shadow-sm hover:shadow-md transition-shadow duration-300"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Imagem do produto */}
        <div className="relative aspect-square overflow-hidden group">
          {/* Overlay de ações */}
          <div className={`absolute inset-0 bg-black/40 flex items-center justify-center gap-2 transition-opacity duration-300 z-10 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
            <Link href={`/produto/${product.slug}`}>
              <Button 
                size="sm" 
                variant="secondary"
                className="rounded-full w-10 h-10 p-0 bg-white hover:bg-white/90"
              >
                <Eye className="h-4 w-4 text-gray-800" />
              </Button>
            </Link>
            <Button 
              size="sm" 
              variant="secondary"
              className="rounded-full w-10 h-10 p-0 bg-white hover:bg-white/90"
              onClick={() => addItem({
                id: product.id,
                name: product.name,
                price: parseFloat(product.price),
                imageUrl: product.imageUrl
              } as any, 1)}
            >
              <ShoppingCart className="h-4 w-4 text-gray-800" />
            </Button>
            <Button 
              size="sm" 
              variant="secondary"
              className="rounded-full w-10 h-10 p-0 bg-white hover:bg-white/90"
            >
              <Heart className="h-4 w-4 text-gray-800" />
            </Button>
          </div>
          
          {/* Indicador de desconto */}
          {hasDiscount && (
            <div className="absolute top-2 left-2 z-20">
              <Badge variant="destructive" className="flex items-center gap-1 bg-red-500 hover:bg-red-600">
                <PercentCircle className="h-3.5 w-3.5" />
                <span>-{product.discount}%</span>
              </Badge>
            </div>
          )}
          
          {/* Imagem */}
          <motion.div
            className="w-full h-full"
            animate={{
              scale: isHovered ? 1.05 : 1
            }}
            transition={{
              type: "tween",
              duration: 0.3
            }}
          >
            <img 
              src={product.imageUrl} 
              alt={product.name} 
              className="w-full h-full object-cover object-center"
            />
          </motion.div>
        </div>
        
        {/* Conteúdo do produto */}
        <div className="p-4">
          {/* Rating */}
          <div className="flex items-center mb-2">
            <div className="flex items-center mr-2">
              <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
              <span className="text-sm font-medium ml-1">{product.rating || '4.5'}</span>
            </div>
            <span className="text-xs text-gray-500">({product.ratingsCount || 12} avaliações)</span>
          </div>
          
          {/* Nome do produto */}
          <h3 className="font-medium line-clamp-2 mb-2 group-hover:text-primary transition-colors h-12">
            {product.name}
          </h3>
          
          {/* Preços */}
          <div className="flex items-baseline mt-auto">
            <span className="text-lg font-bold text-primary">
              {formatCurrency(parseFloat(product.price))}
            </span>
            {hasDiscount && product.originalPrice && (
              <span className="text-sm text-gray-400 line-through ml-2">
                {formatCurrency(parseFloat(product.originalPrice))}
              </span>
            )}
          </div>
          
          {/* Botão de ação principal */}
          <Button 
            className="w-full mt-3 group"
            size="sm"
            onClick={() => addItem({
              id: product.id,
              name: product.name,
              price: parseFloat(product.price),
              imageUrl: product.imageUrl
            } as any, 1)}
          >
            <span className="mr-1">Adicionar</span>
            <ShoppingCart className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};

// Título com animação
const AnimatedHeading = ({ children }: { children: React.ReactNode }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.7, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
};

// Componente principal
export function ProductGrid() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await apiRequest('GET', '/api/products', undefined, {
          // Garantir que estamos enviando header para indicar que NÃO é dashboard de fornecedor
          'x-supplier-dashboard': 'false'
        });
        const responseData = await res.json();
        
        // Lidar com ambos os formatos de resposta (array ou objeto com data)
        const productsArray = Array.isArray(responseData) 
          ? responseData 
          : (responseData.data && Array.isArray(responseData.data)) 
            ? responseData.data 
            : [];
            
        console.log(`ProductGrid: Buscou ${productsArray.length} produtos no total`);
        
        // Limitar a 8 produtos para a grade principal
        setProducts(productsArray.slice(0, 8));
        setLoading(false);
      } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="w-full py-20 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <PackageOpen className="h-16 w-16 mx-auto text-gray-300 mb-4" />
        <h3 className="text-xl font-medium text-gray-700">Nenhum produto encontrado</h3>
        <p className="text-gray-500">Estamos trabalhando para adicionar novos produtos em breve.</p>
      </div>
    );
  }

  return (
    <div className="py-12">
      <AnimatedHeading>
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Produtos em Destaque
            </h2>
            <p className="text-gray-600 max-w-2xl">
              Descubra os equipamentos e utensílios mais procurados por profissionais do setor gastronômico.
            </p>
          </div>
          <Link href="/busca" className="group">
            <Button variant="outline" className="hidden md:flex items-center">
              Ver todos os produtos 
              <ArrowUpRight className="ml-2 h-4 w-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </AnimatedHeading>
      
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
      >
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </motion.div>
      
      <div className="mt-8 text-center md:hidden">
        <Link href="/busca">
          <Button variant="outline" className="flex items-center mx-auto">
            Ver todos os produtos 
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}