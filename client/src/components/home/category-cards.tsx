import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { ChevronRight, Utensils, ChefHat, Refrigerator, Coffee, Package } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

// Interface para a categoria
interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  productsCount: number;
}

// Configuração de ícones para cada categoria
const categoryIcons: Record<string, JSX.Element> = {
  'utensilios': <Utensils className="h-6 w-6" />,
  'equipamentos': <ChefHat className="h-6 w-6" />,
  'refrigeracao': <Refrigerator className="h-6 w-6" />,
  'cafeteria': <Coffee className="h-6 w-6" />,
  'default': <Package className="h-6 w-6" />
};

// Configuração de cores de fundo para as categorias
const categoryColors: Record<string, string> = {
  'utensilios': 'from-blue-500/90 to-blue-600',
  'equipamentos': 'from-amber-500/90 to-amber-600',
  'refrigeracao': 'from-sky-500/90 to-sky-600',
  'cafeteria': 'from-green-500/90 to-green-600',
  'default': 'from-primary/90 to-primary'
};

// Variante de animação para o card
const cardVariants = {
  initial: {
    y: 50,
    opacity: 0,
    rotateX: -10,
    rotateY: -10,
    scale: 0.95
  },
  animate: (custom: number) => ({
    y: 0,
    opacity: 1,
    rotateX: 0,
    rotateY: 0,
    scale: 1,
    transition: {
      type: 'spring',
      damping: 15,
      stiffness: 300,
      delay: custom * 0.1 + 0.2
    }
  }),
  hover: {
    y: -10,
    scale: 1.03,
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 15
    }
  },
  tap: {
    scale: 0.98,
    y: -5,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 10
    }
  }
};

// Título com animação de subida
const TitleAnimation = ({ children }: { children: React.ReactNode }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
};

// Componente de card individual
const CategoryCard = ({ 
  category, 
  index 
}: { 
  category: Category; 
  index: number;
}) => {
  const icon = categoryIcons[category.slug] || categoryIcons.default;
  const colorClass = categoryColors[category.slug] || categoryColors.default;

  return (
    <motion.div
      className="h-full w-full perspective-1000"
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      whileTap="tap"
      custom={index}
    >
      <Link href={`/busca?categoria=${category.id}`}>
        <div className="relative h-full w-full overflow-hidden rounded-xl group cursor-pointer transform-style-3d">
          {/* Overlay gradiente */}
          <div className={`absolute inset-0 bg-gradient-to-br ${colorClass} transform-gpu z-10`}></div>
          
          {/* Elementos decorativos */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-bl-full transform-gpu -rotate-12 z-0"></div>
          <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-black/5 rounded-tr-full transform-gpu z-0"></div>
          
          {/* Pattern de background animado */}
          <motion.div 
            className="absolute inset-0 opacity-10 z-0"
            style={{
              backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)`,
              backgroundSize: '15px 15px'
            }}
            animate={{
              backgroundPosition: ['0% 0%', '100% 100%'],
            }}
            transition={{
              duration: 20,
              ease: "linear",
              repeat: Infinity,
              repeatType: "reverse"
            }}
          />
          
          {/* Conteúdo */}
          <div className="relative flex flex-col justify-between h-full p-6 z-20 transform-gpu">
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                {icon}
              </div>
              
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-2 py-1">
                <span className="text-sm font-medium">{category.productsCount} produtos</span>
              </div>
            </div>
            
            <div className="mt-auto">
              <h3 className="text-xl font-bold text-white mb-1">{category.name}</h3>
              <p className="text-white/80 text-sm line-clamp-2 mb-4">
                {category.description || `Explore nossa seleção de ${category.name.toLowerCase()} de alta qualidade para seu negócio.`}
              </p>
              
              <div className="flex items-center text-white text-sm font-medium group-hover:underline">
                Ver produtos
                <ChevronRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

// Componente principal
export function CategoryCards() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await apiRequest('GET', '/api/categories');
        const data = await res.json();
        setCategories(data);
        setLoading(false);
      } catch (error) {
        console.error('Erro ao buscar categorias:', error);
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="w-full h-60 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="py-12">
      <TitleAnimation>
        <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">
          Explore por Categorias
        </h2>
        <p className="text-gray-600 text-center mb-10 max-w-2xl mx-auto">
          Descubra nossa ampla seleção de produtos organizados por categorias para facilitar sua busca pelo equipamento ideal para seu negócio.
        </p>
      </TitleAnimation>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
        {categories.map((category, index) => (
          <CategoryCard key={category.id} category={category} index={index} />
        ))}
      </div>
    </div>
  );
}