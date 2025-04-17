import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Store, Coffee, Utensils, Pizza, Beer, ThermometerSnowflake } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

// Tipos
interface Kit {
  id: number;
  title: string;
  description: string;
  image: string;
  items: number;
  savings: string;
  type: string;
}

// Dados padrão para kits (caso a API não retorne dados)
const defaultKits: Kit[] = [
  {
    id: 1,
    title: "Kit Cafeteria Completa",
    description: "Tudo que você precisa para montar uma cafeteria moderna e funcional com os melhores equipamentos.",
    image: "https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?auto=format&fit=crop&w=800&q=80",
    items: 15,
    savings: "25%",
    type: "cafe"
  },
  {
    id: 2,
    title: "Kit Padaria Básica",
    description: "Equipamentos essenciais para começar sua padaria com tudo que você precisa para produção e vendas.",
    image: "https://images.unsplash.com/photo-1568254183919-78a4f43a2877?auto=format&fit=crop&w=800&q=80",
    items: 12,
    savings: "22%",
    type: "bakery"
  },
  {
    id: 3,
    title: "Kit Restaurante Iniciante",
    description: "Monte seu restaurante com todos os equipamentos essenciais para cozinha, salão e atendimento.",
    image: "https://images.unsplash.com/photo-1574936611677-f231616837f9?auto=format&fit=crop&w=800&q=80",
    items: 20,
    savings: "30%",
    type: "restaurant"
  },
  {
    id: 4,
    title: "Kit Pizza Express",
    description: "Equipamentos específicos para pizzarias, desde fornos até utensílios especializados.",
    image: "https://images.unsplash.com/photo-1588315029754-2dd089d39a1a?auto=format&fit=crop&w=800&q=80",
    items: 10,
    savings: "18%",
    type: "pizza"
  }
];

// Mapeamento de tipos para ícones
const typeIconMap = {
  cafe: <Coffee className="h-5 w-5" />,
  bakery: <Store className="h-5 w-5" />,
  restaurant: <Utensils className="h-5 w-5" />,
  pizza: <Pizza className="h-5 w-5" />,
  bar: <Beer className="h-5 w-5" />,
  ice_cream: <ThermometerSnowflake className="h-5 w-5" />,
};

export function KitsSolution() {
  const [kits, setKits] = useState<Kit[]>(defaultKits);
  const [isLoading, setIsLoading] = useState(true);
  
  // Buscar kits da API quando disponível
  useEffect(() => {
    async function fetchKits() {
      try {
        const res = await apiRequest('GET', '/api/establishment-kits');
        const data = await res.json();
        if (data && data.length > 0) {
          setKits(data);
        }
        setIsLoading(false);
      } catch (error) {
        console.log('Usando kits padrão');
        setIsLoading(false);
      }
    }
    
    fetchKits();
  }, []);
  
  // Animações com Framer Motion
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
        stiffness: 200,
        damping: 20
      }
    }
  };
  
  // Função para determinar qual ícone mostrar com base no tipo
  const getIconForType = (type: string) => {
    return typeIconMap[type as keyof typeof typeIconMap] || <Store className="h-5 w-5" />;
  };
  
  if (isLoading) {
    return (
      <div className="py-16 flex justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }
  
  return (
    <div className="py-16 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-bold mb-4">Monte seu Estabelecimento</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Kits completos com todos os equipamentos necessários para abrir ou renovar 
            seu negócio. Economize tempo e dinheiro com nossas soluções prontas.
          </p>
        </motion.div>
        
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {kits.map((kit) => (
            <motion.div 
              key={kit.id} 
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 group"
              variants={itemVariants}
            >
              <div className="relative h-48 overflow-hidden">
                <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 flex items-center justify-center">
                  <div className="text-white text-center px-4">
                    <p className="text-sm">{kit.description}</p>
                    <div className="mt-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/20 backdrop-blur-md">
                        {kit.items} itens essenciais
                      </span>
                    </div>
                  </div>
                </div>
                <img 
                  src={kit.image} 
                  alt={kit.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent z-[1]"></div>
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white z-[2]">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="bg-white/20 backdrop-blur-sm p-1 rounded-full">
                      {getIconForType(kit.type)}
                    </div>
                    <h3 className="font-bold text-lg">{kit.title}</h3>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm opacity-90">{kit.items} itens essenciais</span>
                    <span className="text-sm text-green-300 font-medium">Economia de {kit.savings}</span>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <a 
                  href={`/kits/${kit.id}`} 
                  className="flex items-center justify-center w-full py-2.5 bg-white border border-primary text-primary hover:bg-primary hover:text-white rounded-lg transition-colors font-medium"
                >
                  <span>Ver Kit Completo</span>
                  <ChevronRight className="h-4 w-4 ml-1" />
                </a>
              </div>
            </motion.div>
          ))}
        </motion.div>
        
        {/* CTA para orçamento personalizado */}
        <motion.div 
          className="bg-primary/5 rounded-xl p-6 text-center max-w-4xl mx-auto"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h3 className="text-xl font-bold mb-3">Precisa de uma solução personalizada?</h3>
          <p className="text-gray-600 mb-4">
            Fale com nossos especialistas para montar um kit sob medida para o seu negócio.
            Nossa equipe irá analisar suas necessidades e oferecer as melhores opções.
          </p>
          <a 
            href="/contato" 
            className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            Solicitar Orçamento Personalizado
          </a>
        </motion.div>
      </div>
    </div>
  );
}