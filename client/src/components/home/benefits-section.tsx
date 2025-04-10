import { motion } from 'framer-motion';
import { 
  LineChart, 
  ShieldCheck, 
  Truck, 
  HeartHandshake, 
  Store, 
  ArrowRight,
  Sparkles 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

// Variantes de animação
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      damping: 20,
      stiffness: 200
    }
  }
};

// Benefícios a serem exibidos
const benefits = [
  {
    icon: <LineChart className="h-7 w-7" />,
    title: "Comparação Instantânea",
    description: "Compare preços de diversos fornecedores em tempo real para encontrar as melhores ofertas."
  },
  {
    icon: <ShieldCheck className="h-7 w-7" />,
    title: "Fornecedores Verificados",
    description: "Todos os fornecedores são verificados e avaliados para garantir a qualidade dos produtos."
  },
  {
    icon: <Truck className="h-7 w-7" />,
    title: "Entrega Rápida",
    description: "Logística eficiente para garantir que seus produtos cheguem no prazo necessário."
  },
  {
    icon: <HeartHandshake className="h-7 w-7" />,
    title: "Suporte Especializado",
    description: "Nossa equipe de especialistas está disponível para ajudar com quaisquer dúvidas."
  },
  {
    icon: <Store className="h-7 w-7" />,
    title: "Ampla Variedade",
    description: "Encontre desde pequenos utensílios até equipamentos profissionais completos."
  },
  {
    icon: <Sparkles className="h-7 w-7" />,
    title: "Produtos Premium",
    description: "Acesso aos melhores equipamentos e utensílios do mercado gastronômico."
  }
];

// Componente de cartão de benefício individual
const BenefitCard = ({ 
  icon, 
  title, 
  description, 
  index 
}: { 
  icon: JSX.Element; 
  title: string; 
  description: string;
  index: number;
}) => {
  return (
    <motion.div
      variants={itemVariants}
      className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100"
    >
      {/* Ícone com efeito de gradiente */}
      <div className="relative mb-4 group">
        <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl transition-opacity duration-300 group-hover:opacity-100 opacity-0" />
        <div className="relative w-14 h-14 flex items-center justify-center rounded-full bg-gradient-to-br from-primary/80 to-primary text-white">
          {icon}
        </div>
      </div>
      
      <h3 className="text-xl font-semibold mb-2 text-gray-900">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </motion.div>
  );
};

// Componente principal
export function BenefitsSection() {
  return (
    <div className="py-16 relative overflow-hidden">
      {/* Elementos decorativos no fundo */}
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute top-1/2 right-0 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7 }}
        className="container mx-auto px-4 text-center mb-12"
      >
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Por que escolher a <span className="text-primary">Gastro</span>Compare?
        </h2>
        <p className="text-gray-600 max-w-3xl mx-auto">
          Somos uma plataforma completa que revoluciona a maneira como restaurantes e hotéis encontram e adquirem equipamentos e utensílios. Conheça os principais benefícios:
        </p>
      </motion.div>
      
      <motion.div 
        className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
      >
        {benefits.map((benefit, index) => (
          <BenefitCard 
            key={index} 
            icon={benefit.icon} 
            title={benefit.title} 
            description={benefit.description}
            index={index}
          />
        ))}
      </motion.div>
      
      {/* CTA - Chamada para ação */}
      <motion.div 
        className="container mx-auto px-4 mt-16 text-center"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5, duration: 0.7 }}
      >
        <div className="bg-gradient-to-r from-primary/90 to-primary rounded-xl p-10 text-white max-w-4xl mx-auto relative overflow-hidden">
          {/* Elementos decorativos */}
          <div className="absolute top-0 left-0 w-full h-full">
            <motion.div 
              className="absolute top-10 left-10 w-20 h-20 rounded-full bg-white/10"
              animate={{ 
                y: [0, 10, 0],
                opacity: [0.1, 0.15, 0.1]
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div 
              className="absolute bottom-10 right-10 w-32 h-32 rounded-full bg-white/10"
              animate={{ 
                y: [0, -15, 0],
                opacity: [0.1, 0.15, 0.1]
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>
          
          <div className="relative z-10">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              Pronto para economizar e encontrar os melhores equipamentos?
            </h3>
            <p className="text-white/90 max-w-2xl mx-auto mb-8">
              Junte-se a milhares de empresas que já estão economizando tempo e dinheiro utilizando nossa plataforma para encontrar os melhores equipamentos aos melhores preços.
            </p>
            <Link href="/busca">
              <Button 
                size="lg" 
                variant="secondary" 
                className="group"
              >
                Explorar Produtos
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}