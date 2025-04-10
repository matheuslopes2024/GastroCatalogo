import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star, DollarSign, PercentCircle, ShoppingCart } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn, formatCurrency } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';
import { useCart } from '@/hooks/use-cart';

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
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0
  }),
  center: {
    x: 0,
    opacity: 1
  },
  exit: (direction: number) => ({
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0
  })
};

// Variantes para os botões de controle
const controlButtonVariants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  hover: { scale: 1.1, backgroundColor: 'rgba(var(--primary) / 0.2)' },
  tap: { scale: 0.95 }
};

// Componente de slide individual
const CarouselSlide = ({ product, direction }: { product: Product, direction: number }) => {
  const { addItem } = useCart();
  
  const discount = product.discount || 0;
  const hasDiscount = discount > 0;
  
  return (
    <motion.div
      key={product.id}
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.5 }
      }}
      className="absolute inset-0 w-full h-full flex items-center justify-center"
    >
      <Card className="w-full h-full overflow-hidden bg-transparent border-0 shadow-none">
        <CardContent className="p-0 h-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
            <div className="relative overflow-hidden rounded-xl h-full">
              {hasDiscount && (
                <div className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10 flex items-center gap-1">
                  <PercentCircle className="h-3 w-3" />
                  <span>-{discount}%</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-950/80 z-[1]" />
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute bottom-4 left-4 z-10 flex items-center">
                <div className="flex items-center bg-white/10 backdrop-blur-md px-2 py-1 rounded text-white">
                  <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-sm ml-1">{product.rating || '4.5'}</span>
                  <span className="text-xs text-white/70 ml-1">({product.ratingsCount || 12})</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col justify-center px-6 py-4">
              <motion.h2 
                className="text-2xl md:text-3xl font-bold text-gray-900 mb-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                {product.name}
              </motion.h2>
              
              <motion.div 
                className="flex items-baseline mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <span className="text-3xl font-bold text-primary">
                  {formatCurrency(parseFloat(product.price))}
                </span>
                {hasDiscount && (
                  <span className="text-lg text-gray-400 line-through ml-2">
                    {formatCurrency(parseFloat(product.originalPrice || '0'))}
                  </span>
                )}
              </motion.div>
              
              <motion.p 
                className="text-gray-600 mb-6 line-clamp-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                Produto premium com garantia estendida. Compare preços de diversos fornecedores e economize na sua compra. Entrega rápida para todo o Brasil.
              </motion.p>
              
              <motion.div 
                className="flex flex-wrap gap-2 mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">Produto Premium</span>
                <span className="bg-green-50 text-green-600 px-3 py-1 rounded-full text-sm">Entrega Rápida</span>
                <span className="bg-yellow-50 text-yellow-600 px-3 py-1 rounded-full text-sm">Comparar Preços</span>
              </motion.div>
              
              <motion.div 
                className="flex items-center gap-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <Button 
                  onClick={() => addItem({
                    id: product.id,
                    name: product.name,
                    price: parseFloat(product.price),
                    imageUrl: product.imageUrl
                  } as any, 1)}
                  className="px-6"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Adicionar ao Carrinho
                </Button>
                <Link href={`/produto/${product.slug}`}>
                  <Button variant="outline" className="px-6">
                    Ver Detalhes
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Componente de paginação
const Pagination = ({ 
  total, 
  active, 
  onPageChange 
}: { 
  total: number; 
  active: number; 
  onPageChange: (index: number) => void;
}) => {
  return (
    <div className="flex justify-center gap-2 mt-4">
      {Array.from({ length: total }).map((_, index) => (
        <motion.button
          key={index}
          className={cn(
            "w-2.5 h-2.5 rounded-full transition-all",
            active === index ? "bg-primary w-6" : "bg-primary/30"
          )}
          onClick={() => onPageChange(index)}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          animate={{ 
            width: active === index ? 24 : 10,
            backgroundColor: active === index ? 'rgb(var(--primary))' : 'rgba(var(--primary), 0.3)'
          }}
          transition={{ 
            type: "spring", 
            stiffness: 400, 
            damping: 30
          }}
        />
      ))}
    </div>
  );
};

// Componente principal do carrossel
export function FeaturedCarousel() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [autoplay, setAutoplay] = useState(true);
  const autoplayRef = useRef<NodeJS.Timeout | null>(null);

  // Carregar produtos destacados
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await apiRequest('GET', '/api/products');
        const data = await res.json();
        // Filtrar apenas produtos com desconto
        const featuredProducts = data.filter((p: Product) => p.discount > 0);
        setProducts(featuredProducts.length > 0 ? featuredProducts : data.slice(0, 5));
        setLoading(false);
      } catch (error) {
        console.error('Erro ao buscar produtos destacados:', error);
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Lógica de autoplay
  useEffect(() => {
    if (autoplay && products.length > 0) {
      autoplayRef.current = setInterval(() => {
        setDirection(1);
        setCurrentIndex((prevIndex) => (prevIndex + 1) % products.length);
      }, 6000);
    }

    return () => {
      if (autoplayRef.current) {
        clearInterval(autoplayRef.current);
      }
    };
  }, [autoplay, products.length]);

  // Pausar autoplay quando usuário interage com o carrossel
  const pauseAutoplay = () => setAutoplay(false);
  const resumeAutoplay = () => setAutoplay(true);

  // Funções para navegação
  const nextSlide = () => {
    pauseAutoplay();
    setDirection(1);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % products.length);
    setTimeout(resumeAutoplay, 5000);
  };

  const prevSlide = () => {
    pauseAutoplay();
    setDirection(-1);
    setCurrentIndex((prevIndex) => (prevIndex - 1 + products.length) % products.length);
    setTimeout(resumeAutoplay, 5000);
  };

  const goToSlide = (index: number) => {
    pauseAutoplay();
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
    setTimeout(resumeAutoplay, 5000);
  };

  if (loading) {
    return (
      <div className="w-full h-[500px] bg-gray-100 rounded-xl flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div 
      className="relative w-full h-[500px] overflow-hidden rounded-xl bg-gray-50"
      onMouseEnter={pauseAutoplay}
      onMouseLeave={resumeAutoplay}
    >
      {/* Fundo decorativo */}
      <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-primary/10" />
      <div className="absolute top-0 right-0 w-1/4 h-1/4 bg-primary/10 rounded-bl-full" />
      <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-primary/5 rounded-tr-full" />
      
      {/* Elementos decorativos */}
      <motion.div 
        className="absolute top-10 left-10 w-10 h-10 rounded-full bg-primary/20"
        animate={{ 
          y: [0, 10, 0],
          scale: [1, 1.1, 1],
          opacity: [0.2, 0.3, 0.2]
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div 
        className="absolute bottom-20 right-20 w-16 h-16 rounded-full bg-primary/10"
        animate={{ 
          y: [0, -15, 0],
          scale: [1, 0.9, 1],
          opacity: [0.1, 0.2, 0.1]
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <div className="relative w-full h-full">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <CarouselSlide 
            key={currentIndex} 
            product={products[currentIndex]} 
            direction={direction}
          />
        </AnimatePresence>
        
        {/* Controles de navegação */}
        <motion.button
          variants={controlButtonVariants}
          initial="initial"
          animate="animate"
          whileHover="hover"
          whileTap="tap"
          onClick={prevSlide}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-md z-20"
          aria-label="Anterior"
        >
          <ChevronLeft className="h-6 w-6 text-gray-700" />
        </motion.button>
        
        <motion.button
          variants={controlButtonVariants}
          initial="initial"
          animate="animate"
          whileHover="hover"
          whileTap="tap"
          onClick={nextSlide}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-md z-20"
          aria-label="Próximo"
        >
          <ChevronRight className="h-6 w-6 text-gray-700" />
        </motion.button>
      </div>
      
      {/* Paginação */}
      <div className="absolute bottom-4 left-0 right-0">
        <Pagination 
          total={products.length} 
          active={currentIndex} 
          onPageChange={goToSlide} 
        />
      </div>
    </div>
  );
}