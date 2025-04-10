import { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { 
  Building2, 
  ShoppingBag, 
  Users, 
  Percent
} from 'lucide-react';

// Animação de contador
function CountUp({ 
  end, 
  duration = 2, 
  suffix = "", 
  prefix = ""
}: { 
  end: number; 
  duration?: number; 
  suffix?: string; 
  prefix?: string;
}) {
  const [count, setCount] = useState(0);
  const nodeRef = useRef(null);
  const inView = useInView(nodeRef, { once: true, margin: "-100px" });
  const easeOutQuad = (t: number) => t * (2 - t);
  
  useEffect(() => {
    if (!inView) return;
    
    let startTime: number;
    let animationFrame: number;
    
    const updateCount = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      const easedProgress = easeOutQuad(progress);
      
      setCount(Math.floor(easedProgress * end));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(updateCount);
      }
    };
    
    animationFrame = requestAnimationFrame(updateCount);
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [end, duration, inView]);
  
  return (
    <span ref={nodeRef} className="font-bold text-4xl md:text-5xl text-gray-900">
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}

// Estatísticas a exibir
const stats = [
  {
    id: 1,
    icon: <Building2 className="h-8 w-8" />,
    value: 350,
    label: "Fornecedores Verificados",
    description: "Empresas confiáveis fornecendo produtos de qualidade",
    color: "from-blue-500 to-blue-600"
  },
  {
    id: 2,
    icon: <ShoppingBag className="h-8 w-8" />,
    value: 12500,
    label: "Produtos Disponíveis",
    description: "Amplo catálogo para todas as necessidades gastronômicas",
    color: "from-amber-500 to-amber-600"
  },
  {
    id: 3,
    icon: <Users className="h-8 w-8" />,
    value: 8700,
    label: "Clientes Satisfeitos",
    description: "Estabelecimentos que confiam em nossa plataforma",
    color: "from-emerald-500 to-emerald-600"
  },
  {
    id: 4,
    icon: <Percent className="h-8 w-8" />,
    value: 25,
    label: "Economia Média",
    description: "Porcentagem de economia comparado a compras tradicionais",
    suffix: "%",
    color: "from-purple-500 to-purple-600"
  }
];

// Variantes de animação
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
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

// Componente de estatística individual
const StatCard = ({
  icon,
  value,
  label,
  description,
  suffix = "",
  prefix = "",
  color
}: {
  icon: JSX.Element;
  value: number;
  label: string;
  description: string;
  suffix?: string;
  prefix?: string;
  color: string;
}) => {
  return (
    <motion.div
      variants={itemVariants}
      className="flex flex-col items-center text-center bg-white rounded-xl p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100"
    >
      <div className={`w-16 h-16 flex items-center justify-center rounded-full bg-gradient-to-r ${color} text-white mb-4`}>
        {icon}
      </div>
      
      <CountUp end={value} suffix={suffix} prefix={prefix} />
      <h3 className="text-xl font-semibold mt-2 mb-1 text-gray-900">{label}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </motion.div>
  );
};

// Componente principal
export function StatsSection() {
  return (
    <div className="py-16 bg-gray-50 relative overflow-hidden">
      {/* Elementos decorativos */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full -translate-x-1/3 translate-y-1/3 blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Números que Falam por Si
          </h2>
          <p className="text-gray-600">
            A GastroCompare se tornou a principal plataforma de comparação de preços para o setor gastronômico no Brasil. Confira alguns números que destacam nosso impacto no mercado:
          </p>
        </motion.div>
        
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {stats.map((stat) => (
            <StatCard 
              key={stat.id}
              icon={stat.icon}
              value={stat.value}
              label={stat.label}
              description={stat.description}
              suffix={stat.suffix || ""}
              color={stat.color}
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
}