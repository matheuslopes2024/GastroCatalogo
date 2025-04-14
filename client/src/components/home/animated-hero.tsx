import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { 
  Search, 
  ArrowRight, 
  ChevronRight, 
  Store, 
  ShieldCheck, 
  LineChart 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Variantes de animação
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3
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
      damping: 20,
      stiffness: 100
    }
  }
};

// Recursos destacados para mostrar no hero
const features = [
  {
    icon: <LineChart className="h-5 w-5" />,
    text: "Compare preços instantaneamente"
  },
  {
    icon: <Store className="h-5 w-5" />,
    text: "Mais de 350 fornecedores verificados"
  },
  {
    icon: <ShieldCheck className="h-5 w-5" />,
    text: "Produtos de qualidade garantida"
  }
];

// Componente principal de hero
export function AnimatedHero() {
  const [searchQuery, setSearchQuery] = useState('');
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Navegar para a página de resultados com a consulta
    window.location.href = `/busca?q=${encodeURIComponent(searchQuery)}`;
  };
  
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 pt-16 pb-20 md:pt-20 md:pb-28">
      {/* Elementos decorativos */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full translate-x-1/4 -translate-y-1/4 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full -translate-x-1/4 translate-y-1/4 blur-3xl" />
      
      {/* Padrão geométrico decorativo */}
      <div className="absolute inset-0 z-0 opacity-20">
        <div className="absolute inset-y-0 right-0 w-1/2">
          <svg className="h-full w-full" viewBox="0 0 400 800" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g opacity="0.3">
              <motion.circle 
                cx="100" cy="100" r="10" 
                fill="var(--primary)" 
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.8 }}
                transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
              />
              <motion.circle 
                cx="200" cy="200" r="15" 
                fill="var(--primary)" 
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                transition={{ duration: 3, repeat: Infinity, repeatType: "reverse", delay: 0.5 }}
              />
              <motion.circle 
                cx="300" cy="300" r="20" 
                fill="var(--primary)" 
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                transition={{ duration: 4, repeat: Infinity, repeatType: "reverse", delay: 1 }}
              />
              <motion.circle 
                cx="150" cy="400" r="25" 
                fill="var(--primary)" 
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                transition={{ duration: 3.5, repeat: Infinity, repeatType: "reverse", delay: 1.5 }}
              />
              <motion.circle 
                cx="250" cy="500" r="15" 
                fill="var(--primary)" 
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                transition={{ duration: 2.5, repeat: Infinity, repeatType: "reverse", delay: 0.75 }}
              />
              <motion.circle 
                cx="350" cy="600" r="10" 
                fill="var(--primary)" 
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.3 }}
                transition={{ duration: 3, repeat: Infinity, repeatType: "reverse", delay: 1.25 }}
              />
            </g>
          </svg>
        </div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row gap-12 items-center">
          {/* Conteúdo do Hero - Lado Esquerdo */}
          <motion.div 
            className="lg:w-7/12 text-center lg:text-left"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants}>
              <div className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-primary/10 text-primary mb-6">
                <LineChart className="h-4 w-4 mr-1" />
                <span>Economia garantida para seu negócio</span>
              </div>
            </motion.div>
            
            <motion.h1 
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight"
              variants={itemVariants}
            >
              Compare e economize em 
              <span className="relative">
                <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent px-2">
                  equipamentos
                </span>
                <motion.svg
                  className="absolute bottom-1 left-0 w-full"
                  height="6"
                  viewBox="0 0 260 6"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1, delay: 0.5 }}
                >
                  <path
                    d="M3 3C40.6667 3.33333 174.4 3.8 257 3"
                    stroke="var(--primary)"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                </motion.svg>
              </span>
              <br />para gastronomia
            </motion.h1>
            
            <motion.p 
              className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto lg:mx-0"
              variants={itemVariants}
            >
              Encontre os melhores preços para equipamentos e utensílios de restaurantes, hotéis e estabelecimentos gastronômicos em uma única plataforma.
            </motion.p>
            
            {/* Barra de pesquisa */}
            <motion.form 
              onSubmit={handleSearch}
              className="relative max-w-2xl mx-auto lg:mx-0 mb-8"
              variants={itemVariants}
            >
              <div className="relative flex items-center">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Pesquise por equipamentos, utensílios, produtos..."
                  className="w-full pl-10 pr-20 py-3 rounded-full border-gray-200 focus:border-primary shadow-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button 
                  type="submit" 
                  className="absolute right-1.5 top-1.5 rounded-full px-4"
                >
                  Buscar
                </Button>
              </div>
            </motion.form>
            
            {/* Features */}
            <motion.div 
              className="flex flex-wrap justify-center lg:justify-start gap-4 mb-10"
              variants={itemVariants}
            >
              {features.map((feature, index) => (
                <div 
                  key={index} 
                  className="flex items-center space-x-2 bg-white px-4 py-2 rounded-full shadow-sm"
                >
                  <div className="text-primary">{feature.icon}</div>
                  <span className="text-gray-700 text-sm font-medium">{feature.text}</span>
                </div>
              ))}
            </motion.div>
            
            {/* CTA Buttons */}
            <motion.div 
              className="flex flex-wrap gap-4 justify-center lg:justify-start"
              variants={itemVariants}
            >
              <Link href="/busca">
                <Button size="lg" className="gap-2 rounded-full shadow-md">
                  Explorar Agora
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/como-funciona">
                <Button variant="outline" size="lg" className="gap-2 rounded-full">
                  Como Funciona
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>
          
          {/* Imagem ilustrativa */}
          <motion.div 
            className="lg:w-5/12 relative"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <div className="relative z-10">
              <img
                src="https://images.unsplash.com/photo-1581299894007-aaa50297cf16?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1474&q=80"
                alt="Equipamentos de cozinha profissional"
                className="rounded-xl shadow-xl"
              />
              
              {/* Badge de preço flutuante animada */}
              <motion.div 
                className="absolute -top-4 -left-4 bg-white rounded-lg shadow-lg p-3"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1, duration: 0.5 }}
              >
                <div className="text-center">
                  <span className="block text-xs text-gray-500">A partir de</span>
                  <span className="block text-primary font-bold text-xl">R$ 1.299,00</span>
                </div>
              </motion.div>
              
              {/* Badge de economia flutuante animada */}
              <motion.div 
                className="absolute -bottom-4 -right-4 bg-green-500 text-white rounded-lg shadow-lg p-3"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.5 }}
              >
                <div className="text-center">
                  <span className="block text-xs text-white/90">Economia de</span>
                  <span className="block font-bold text-xl">25%</span>
                </div>
              </motion.div>
            </div>
            
            {/* Efeitos de reflexo/destaque */}
            <motion.div 
              className="absolute -top-4 -left-4 w-full h-full bg-gradient-to-br from-primary/20 to-transparent rounded-xl blur-3xl -z-10"
              animate={{ 
                opacity: [0.4, 0.6, 0.4],
                scale: [0.95, 1.05, 0.95] 
              }}
              transition={{ 
                duration: 6,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}