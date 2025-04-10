import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Star, 
  Quote,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// Dados de testemunhos (em uma aplicação real, estes viriam da API)
const testimonials = [
  {
    id: 1,
    name: "Ricardo Oliveira",
    role: "Chef Executivo, Restaurante Aroma",
    content: "A plataforma Gastro Compare revolucionou o modo como adquirimos equipamentos para nosso restaurante. Economizamos mais de 20% em nossas últimas compras comparando os preços entre diferentes fornecedores.",
    rating: 5,
    image: "https://images.unsplash.com/photo-1583394838336-acd977736f90?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=384&q=80"
  },
  {
    id: 2,
    name: "Carla Mendes",
    role: "Proprietária, Café Central",
    content: "Como uma pequena empresária, cada real conta. Com o Gastro Compare, consegui encontrar equipamentos de qualidade a preços acessíveis, o que me permitiu investir em outras áreas do meu café.",
    rating: 5,
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=922&q=80"
  },
  {
    id: 3,
    name: "Fernando Almeida",
    role: "Gerente de Operações, Hotel Estrela",
    content: "A plataforma é extremamente intuitiva e o processo de comparação de preços é rápido e eficiente. Além disso, os filtros de pesquisa permitem encontrar exatamente o que precisamos em questão de minutos.",
    rating: 4,
    image: "https://images.unsplash.com/photo-1564564321837-a57b7070ac4f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1176&q=80"
  },
  {
    id: 4,
    name: "Ana Beatriz Costa",
    role: "Diretora, Escola de Gastronomia Sabor & Arte",
    content: "Na nossa escola, utilizamos os mais diversos equipamentos de cozinha. O Gastro Compare nos ajuda a manter a qualidade oferecendo as melhores opções do mercado com ótimo custo-benefício.",
    rating: 5,
    image: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=774&q=80"
  }
];

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

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
    scale: 0.9
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: {
      x: { type: 'spring', stiffness: 300, damping: 30 },
      opacity: { duration: 0.4 },
      scale: { duration: 0.4 }
    }
  },
  exit: (direction: number) => ({
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0,
    scale: 0.9,
    transition: {
      x: { type: 'spring', stiffness: 300, damping: 30 },
      opacity: { duration: 0.2 },
      scale: { duration: 0.2 }
    }
  })
};

// Componente de controle de navegação
const NavigationButtons = ({ 
  onPrev, 
  onNext 
}: { 
  onPrev: () => void; 
  onNext: () => void;
}) => {
  return (
    <div className="flex items-center justify-center mt-8 gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={onPrev}
        className="rounded-full hover:bg-primary/10 border-gray-300"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={onNext}
        className="rounded-full hover:bg-primary/10 border-gray-300"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
};

// Componente de classificação por estrelas
const StarRating = ({ rating }: { rating: number }) => {
  return (
    <div className="flex items-center mb-3">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  );
};

// Componente principal
export function TestimonialsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [autoplay, setAutoplay] = useState(true);
  const autoplayRef = useRef<NodeJS.Timeout | null>(null);

  // Configuração do autoplay
  useEffect(() => {
    if (autoplay) {
      autoplayRef.current = setInterval(() => {
        setDirection(1);
        setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
      }, 7000);
    }

    return () => {
      if (autoplayRef.current) {
        clearInterval(autoplayRef.current);
      }
    };
  }, [autoplay, testimonials.length]);

  // Pausar autoplay quando usuário interage com o carrossel
  const pauseAutoplay = () => setAutoplay(false);
  const resumeAutoplay = () => setAutoplay(true);

  // Funções para navegação
  const nextSlide = () => {
    pauseAutoplay();
    setDirection(1);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
    setTimeout(resumeAutoplay, 7000);
  };

  const prevSlide = () => {
    pauseAutoplay();
    setDirection(-1);
    setCurrentIndex((prevIndex) => (prevIndex - 1 + testimonials.length) % testimonials.length);
    setTimeout(resumeAutoplay, 7000);
  };

  return (
    <motion.div 
      className="py-16 relative overflow-hidden"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
    >
      {/* Background decorativo */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-20 left-0 w-64 h-64 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-20 right-0 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
      </div>
      
      <div className="container mx-auto px-4 max-w-6xl relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-2 bg-primary/10 rounded-full mb-4">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            O que nossos clientes dizem
          </h2>
          <p className="text-gray-600 max-w-3xl mx-auto">
            Descubra por que milhares de profissionais do setor gastronômico confiam em nossa plataforma para encontrar os melhores equipamentos e utensílios.
          </p>
        </div>
        
        <div
          className="relative h-[400px] overflow-hidden"
          onMouseEnter={pauseAutoplay}
          onMouseLeave={resumeAutoplay}
        >
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="absolute inset-0 w-full h-full"
            >
              <div className="flex flex-col md:flex-row items-center h-full bg-white rounded-2xl shadow-sm p-6 md:p-8 border border-gray-100">
                {/* Imagem do cliente */}
                <div className="md:w-1/3 mb-6 md:mb-0 md:pr-8">
                  <div className="relative">
                    <div className="absolute -top-4 -left-4 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <Quote className="h-6 w-6 text-primary" />
                    </div>
                    <div className="w-28 h-28 md:w-36 md:h-36 mx-auto rounded-full overflow-hidden border-4 border-white shadow-lg">
                      <img 
                        src={testimonials[currentIndex].image} 
                        alt={testimonials[currentIndex].name}
                        className="w-full h-full object-cover" 
                      />
                    </div>
                  </div>
                  
                  <div className="text-center mt-4">
                    <h3 className="font-semibold text-xl">{testimonials[currentIndex].name}</h3>
                    <p className="text-gray-500 text-sm">{testimonials[currentIndex].role}</p>
                  </div>
                </div>
                
                {/* Conteúdo do testemunho */}
                <div className="md:w-2/3 md:border-l md:border-gray-200 md:pl-8">
                  <StarRating rating={testimonials[currentIndex].rating} />
                  
                  <p className="text-gray-700 text-lg italic mb-6 leading-relaxed">
                    "{testimonials[currentIndex].content}"
                  </p>
                  
                  <div className="flex justify-center md:justify-start">
                    {testimonials.map((_, index) => (
                      <button
                        key={index}
                        className={`w-2 h-2 rounded-full mx-1 transition-all duration-300 ${
                          index === currentIndex ? 'bg-primary w-6' : 'bg-gray-300'
                        }`}
                        onClick={() => {
                          pauseAutoplay();
                          setDirection(index > currentIndex ? 1 : -1);
                          setCurrentIndex(index);
                          setTimeout(resumeAutoplay, 7000);
                        }}
                        aria-label={`Ir para o testemunho ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
        
        <NavigationButtons onPrev={prevSlide} onNext={nextSlide} />
      </div>
    </motion.div>
  );
}