import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  MapPin, 
  PercentCircle, 
  ShoppingCart, 
  TrendingUp 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';

// Tipos
interface Category {
  id: number;
  name: string;
  slug: string;
}

// Componente principal de hero estilo Trivago
export function TrivagoStyleHero() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [popularSearches, setPopularSearches] = useState([
    { text: 'Forno Combinado', query: 'forno combinado' },
    { text: 'Refrigerador Comercial', query: 'refrigerador comercial' },
    { text: 'Fritadeira', query: 'fritadeira' },
    { text: 'Chapa', query: 'chapa' },
    { text: 'Lava-louças', query: 'lava-louças' }
  ]);
  
  // Buscar categorias ao montar o componente
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await apiRequest('GET', '/api/categories');
        const data = await res.json();
        setCategories(data);
        setIsLoading(false);
      } catch (error) {
        console.error('Erro ao buscar categorias:', error);
        setIsLoading(false);
      }
    }
    
    fetchCategories();
    
    // Também tenta buscar buscas populares dinamicamente
    async function fetchPopularSearches() {
      try {
        const res = await apiRequest('GET', '/api/popular-searches');
        const data = await res.json();
        if (data && data.length > 0) {
          setPopularSearches(data);
        }
      } catch (error) {
        // Falha silenciosa, mantém os valores padrão
        console.log('Usando buscas populares padrão');
      }
    }
    
    fetchPopularSearches();
  }, []);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const searchParams = new URLSearchParams();
    if (searchQuery) searchParams.set('q', searchQuery);
    if (categoryId) searchParams.set('categoria', categoryId);
    window.location.href = `/busca?${searchParams.toString()}`;
  };
  
  // Animações para elementos do hero
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
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
        stiffness: 260,
        damping: 20
      }
    }
  };

  // Preenchimentos animados para o campo de busca
  const placeholders = [
    'Forno Combinado',
    'Refrigerador Comercial',
    'Lava-louças Profissional',
    'Fritadeira Elétrica',
    'Cervejeira Comercial'
  ];

  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [currentPlaceholder, setCurrentPlaceholder] = useState(placeholders[0]);
  const [isChangingPlaceholder, setIsChangingPlaceholder] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsChangingPlaceholder(true);
      setTimeout(() => {
        setPlaceholderIndex((prevIndex) => (prevIndex + 1) % placeholders.length);
        setCurrentPlaceholder(placeholders[(placeholderIndex + 1) % placeholders.length]);
        setIsChangingPlaceholder(false);
      }, 500);
    }, 4000);

    return () => clearInterval(interval);
  }, [placeholderIndex, placeholders.length]);
  
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-primary/3 to-transparent pt-8 pb-24 md:pt-16 md:pb-28">
      {/* Decoração de fundo */}
      <div className="absolute inset-0 overflow-hidden z-0 opacity-50">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        
        {/* Padrão de ícones */}
        <div className="absolute inset-0 opacity-5">
          <div className="grid grid-cols-10 grid-rows-10 gap-4 h-full w-full">
            {Array.from({ length: 25 }).map((_, i) => (
              <motion.div
                key={i}
                className="flex items-center justify-center text-primary"
                initial={{ opacity: 0 }}
                animate={{ opacity: Math.random() * 0.8 + 0.2 }}
                transition={{ 
                  duration: Math.random() * 4 + 2, 
                  repeat: Infinity, 
                  repeatType: "reverse",
                  delay: Math.random() * 5
                }}
                style={{
                  gridColumnStart: Math.floor(Math.random() * 10) + 1,
                  gridRowStart: Math.floor(Math.random() * 10) + 1,
                }}
              >
                {i % 5 === 0 ? <Search size={20} /> : 
                 i % 5 === 1 ? <MapPin size={20} /> : 
                 i % 5 === 2 ? <PercentCircle size={20} /> : 
                 i % 5 === 3 ? <ShoppingCart size={20} /> : 
                 <TrendingUp size={20} />}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          className="max-w-6xl mx-auto text-center mb-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h1 
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-6 text-gray-900 tracking-tight"
            variants={itemVariants}
          >
            Compare e <span className="text-primary">economize</span> em<br className="hidden sm:block" /> equipamentos para gastronomia
          </motion.h1>
          
          <motion.p 
            className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto"
            variants={itemVariants}
          >
            Encontre os melhores preços entre diversos fornecedores em uma única busca
          </motion.p>
          
          {/* Card de busca principal estilo Trivago */}
          <motion.div 
            className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 max-w-4xl mx-auto relative z-10"
            variants={itemVariants}
          >
            <form onSubmit={handleSearch}>
              <div className="grid md:grid-cols-12 gap-4 items-center">
                <div className="md:col-span-7">
                  <label className="text-sm font-medium text-gray-700 mb-1 block text-left">
                    O que você está procurando?
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <motion.input
                      type="text"
                      placeholder={currentPlaceholder}
                      className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all shadow-sm"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      animate={{ 
                        opacity: isChangingPlaceholder ? 0.7 : 1,
                        y: isChangingPlaceholder ? 5 : 0
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
                
                <div className="md:col-span-3">
                  <label className="text-sm font-medium text-gray-700 mb-1 block text-left">
                    Categoria
                  </label>
                  <div className="relative">
                    <select
                      className="w-full px-4 py-3.5 rounded-xl appearance-none border border-gray-300 focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all shadow-sm"
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      disabled={isLoading}
                    >
                      <option value="">Todas as categorias</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id.toString()}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <label className="opacity-0 text-sm font-medium mb-1 block">
                    &nbsp;
                  </label>
                  <Button 
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3.5 px-6 rounded-xl transition-colors shadow-md"
                  >
                    Buscar
                  </Button>
                </div>
              </div>
              
              {/* Vantagens abaixo do formulário */}
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-6 text-sm text-gray-600">
                <div className="flex items-center gap-1.5">
                  <div className="text-primary">
                    <Search className="h-4 w-4" />
                  </div>
                  <span>Compare preços instantaneamente</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="text-primary">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <span>Encontre as melhores ofertas</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="text-primary">
                    <PercentCircle className="h-4 w-4" />
                  </div>
                  <span>Economize até 30% nas compras</span>
                </div>
              </div>
            </form>
          </motion.div>
          
          {/* Buscas populares abaixo do card */}
          <motion.div 
            className="flex flex-wrap justify-center gap-2 mt-6"
            variants={itemVariants}
          >
            <span className="text-sm text-gray-500">Buscas populares:</span>
            {popularSearches.map((search, index) => (
              <div key={index} className="flex items-center">
                <a 
                  href={`/busca?q=${encodeURIComponent(search.query)}`} 
                  className="text-sm text-primary hover:underline"
                >
                  {search.text}
                </a>
                {index < popularSearches.length - 1 && (
                  <span className="text-gray-300 ml-2 mr-1">•</span>
                )}
              </div>
            ))}
          </motion.div>
        </motion.div>
        
        {/* Números e estatísticas */}
        <motion.div 
          className="flex flex-wrap justify-center mt-8 gap-12"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div 
            className="text-center"
            variants={itemVariants}
          >
            <div className="text-3xl md:text-4xl font-bold text-primary">+350</div>
            <div className="text-sm text-gray-600">Fornecedores verificados</div>
          </motion.div>
          
          <motion.div 
            className="text-center"
            variants={itemVariants}
          >
            <div className="text-3xl md:text-4xl font-bold text-primary">+12.000</div>
            <div className="text-sm text-gray-600">Produtos disponíveis</div>
          </motion.div>
          
          <motion.div 
            className="text-center"
            variants={itemVariants}
          >
            <div className="text-3xl md:text-4xl font-bold text-primary">25%</div>
            <div className="text-sm text-gray-600">Economia média</div>
          </motion.div>
        </motion.div>
      </div>
      
      {/* Shape divisor na parte inferior */}
      <div className="absolute bottom-0 left-0 right-0 overflow-hidden">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="w-full h-12 md:h-16 text-white fill-current"
        >
          <path d="M600,112.77C268.63,112.77,0,65.52,0,7.23V120H1200V7.23C1200,65.52,931.37,112.77,600,112.77Z" />
        </svg>
      </div>
    </div>
  );
}