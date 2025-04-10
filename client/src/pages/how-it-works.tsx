import { motion } from "framer-motion";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { 
  Search, 
  ShoppingBag, 
  Truck, 
  CreditCard, 
  Store, 
  CheckCircle, 
  ChevronRight,
  ShieldCheck,
  Users,
  ArrowRight,
  LineChart,
  Heart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

// Componente Hero
const Hero = () => {
  return (
    <div className="relative py-20 bg-gradient-to-br from-primary/10 to-gray-50 overflow-hidden">
      {/* Elementos decorativos */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-primary/5 rounded-bl-full" />
      <div className="absolute bottom-0 left-0 w-1/4 h-1/4 bg-primary/5 rounded-tr-full" />
      
      <motion.div 
        className="container mx-auto px-4 text-center relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
          Como Funciona a <span className="text-primary">Gastro</span>Compare
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto">
          Entenda como nossa plataforma revoluciona a forma de adquirir equipamentos e utensílios para seu negócio gastronômico, economizando tempo e dinheiro.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/busca">
            <Button size="lg" className="rounded-full gap-2">
              Explorar Produtos
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/auth">
            <Button variant="outline" size="lg" className="rounded-full gap-2">
              Criar Conta
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

// Componente para passo a passo
const StepCard = ({ 
  icon, 
  title, 
  description, 
  step, 
  isLast
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  step: number;
  isLast?: boolean;
}) => {
  return (
    <div className="flex relative">
      {/* Linha conectora */}
      {!isLast && (
        <div className="absolute left-6 top-16 w-0.5 h-[calc(100%-4rem)] bg-primary/20" />
      )}
      
      {/* Número do passo */}
      <div className="flex-shrink-0 mr-6 z-10">
        <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xl">
          {step}
        </div>
      </div>
      
      {/* Conteúdo */}
      <div className="pb-12">
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 mb-4">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
            {icon}
          </div>
          <h3 className="text-xl font-bold mb-2 text-gray-900">{title}</h3>
          <p className="text-gray-600">{description}</p>
        </div>
      </div>
    </div>
  );
};

// Componente de vantagens
const Advantage = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => {
  return (
    <motion.div 
      className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full"
      whileHover={{ y: -5, boxShadow: '0 10px 30px -15px rgba(0, 0, 0, 0.1)' }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-2 text-gray-900">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </motion.div>
  );
};

// Componente de Perguntas Frequentes
const FAQ = ({ question, answer }: { question: string; answer: string }) => {
  return (
    <motion.div 
      className="border-b border-gray-200 pb-6 mb-6 last:mb-0 last:border-0"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5 }}
    >
      <h3 className="text-xl font-semibold mb-3 text-gray-900">{question}</h3>
      <p className="text-gray-600">{answer}</p>
    </motion.div>
  );
};

// Componente principal
export default function HowItWorksPage() {
  // Dados dos passos
  const steps = [
    {
      icon: <Search className="h-6 w-6" />,
      title: "Procure Produtos",
      description: "Utilize nossa barra de pesquisa intuitiva para encontrar exatamente o que você precisa para seu restaurante ou hotel."
    },
    {
      icon: <ShoppingBag className="h-6 w-6" />,
      title: "Compare Preços",
      description: "Veja todas as ofertas disponíveis para o mesmo produto. Compare preços, condições de entrega e avaliações de fornecedores."
    },
    {
      icon: <CreditCard className="h-6 w-6" />,
      title: "Escolha e Compre",
      description: "Selecione a melhor oferta e finalize sua compra com segurança, usando nosso sistema de pagamento protegido."
    },
    {
      icon: <Truck className="h-6 w-6" />,
      title: "Receba em seu Estabelecimento",
      description: "Acompanhe o status da entrega e receba seu produto diretamente do fornecedor em seu estabelecimento."
    }
  ];
  
  // Dados das vantagens
  const advantages = [
    {
      icon: <LineChart className="h-7 w-7" />,
      title: "Economia Real",
      description: "Nossos usuários economizam em média 25% em suas compras ao comparar preços de diferentes fornecedores."
    },
    {
      icon: <ShieldCheck className="h-7 w-7" />,
      title: "Fornecedores Verificados",
      description: "Todos os fornecedores passam por um rigoroso processo de verificação para garantir a qualidade e confiabilidade."
    },
    {
      icon: <Users className="h-7 w-7" />,
      title: "Avaliações Genuínas",
      description: "Acesse avaliações reais de outros estabelecimentos que já compraram os produtos de seu interesse."
    },
    {
      icon: <Heart className="h-7 w-7" />,
      title: "Suporte Personalizado",
      description: "Nossa equipe de especialistas está sempre disponível para ajudar com qualquer dúvida ou problema."
    }
  ];
  
  // Dados das perguntas frequentes
  const faqs = [
    {
      question: "Existem custos para utilizar a plataforma?",
      answer: "Não, a plataforma é totalmente gratuita para compradores. Nosso modelo de negócio baseia-se em comissões sobre as vendas realizadas através do site, pagas pelos fornecedores."
    },
    {
      question: "Como posso ter certeza que estou comprando de fornecedores confiáveis?",
      answer: "Todos os fornecedores passam por uma rigorosa verificação antes de serem aceitos na plataforma. Além disso, você terá acesso a avaliações e comentários de outros compradores."
    },
    {
      question: "Posso negociar diretamente com os fornecedores?",
      answer: "Sim, nossa plataforma permite que você entre em contato direto com os fornecedores para negociar condições especiais ou tirar dúvidas sobre os produtos."
    },
    {
      question: "Quanto tempo leva para receber os produtos?",
      answer: "O prazo de entrega varia conforme o fornecedor e sua localização. Cada produto exibe uma estimativa de prazo de entrega que você pode consultar antes de finalizar a compra."
    },
    {
      question: "Como posso me tornar um fornecedor na plataforma?",
      answer: "Para se tornar um fornecedor, acesse a área 'Para Fornecedores' em nosso site e preencha o formulário de cadastro. Nossa equipe entrará em contato para prosseguir com o processo de verificação."
    },
    {
      question: "Quais as formas de pagamento aceitas?",
      answer: "Aceitamos diversas formas de pagamento, incluindo cartão de crédito, boleto bancário, PIX e, em alguns casos, parcelamento sem juros dependendo do fornecedor."
    }
  ];
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <Hero />
        
        {/* Como Funciona - Passo a Passo */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <motion.div 
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
                Passo a Passo
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Veja como é simples encontrar e comprar os melhores equipamentos para seu negócio com a Gastro Compare.
              </p>
            </motion.div>
            
            <div className="max-w-3xl mx-auto">
              {steps.map((step, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <StepCard 
                    icon={step.icon} 
                    title={step.title} 
                    description={step.description} 
                    step={index + 1} 
                    isLast={index === steps.length - 1}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
        
        {/* Vantagens */}
        <section className="py-16 bg-gray-100">
          <div className="container mx-auto px-4">
            <motion.div 
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
                Por que Escolher a Gastro Compare?
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Descubra os benefícios de utilizar nossa plataforma para a compra de equipamentos e utensílios.
              </p>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {advantages.map((advantage, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Advantage 
                    icon={advantage.icon} 
                    title={advantage.title} 
                    description={advantage.description} 
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
        
        {/* Perguntas Frequentes */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <motion.div 
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
                Perguntas Frequentes
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Confira as principais dúvidas sobre o funcionamento da Gastro Compare.
              </p>
            </motion.div>
            
            <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm p-8">
              {faqs.map((faq, index) => (
                <FAQ 
                  key={index} 
                  question={faq.question} 
                  answer={faq.answer} 
                />
              ))}
            </div>
          </div>
        </section>
        
        {/* CTA Final */}
        <section className="py-16 bg-gradient-to-r from-primary to-primary/80 text-white">
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Pronto para economizar em seus equipamentos?
              </h2>
              <p className="text-xl mb-8 max-w-2xl mx-auto text-white/90">
                Junte-se a milhares de estabelecimentos que já estão economizando tempo e dinheiro com a Gastro Compare.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link href="/busca">
                  <Button size="lg" variant="secondary" className="rounded-full gap-2">
                    Começar Agora
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/contato">
                  <Button variant="outline" size="lg" className="rounded-full gap-2 bg-transparent text-white border-white hover:bg-white/10">
                    Fale Conosco
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}