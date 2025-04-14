import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CategoryNav } from "@/components/layout/category-nav";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { LockIcon, BarChart2, Search } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { UserRole } from "@shared/schema";
import { motion } from "framer-motion";

// Importando os novos componentes com animações
import { AnimatedHero } from "@/components/home/animated-hero";
import { FeaturedCarousel } from "@/components/home/featured-carousel";
import { CategoryCards } from "@/components/home/category-cards";
import { ProductGrid } from "@/components/home/product-grid";
import { BenefitsSection } from "@/components/home/benefits-section";
import { TestimonialsCarousel } from "@/components/home/testimonials-carousel";
import { StatsSection } from "@/components/home/stats-section";
import { ComparisonSection } from "@/components/home/comparison-section";

// Componente de divisor visual
const Divider = () => (
  <div className="container mx-auto px-4 py-8">
    <div className="flex items-center gap-4">
      <div className="flex-grow h-0.5 bg-gray-100"></div>
      <div className="w-2 h-2 rounded-full bg-primary/50"></div>
      <div className="w-3 h-3 rounded-full bg-primary/80"></div>
      <div className="w-2 h-2 rounded-full bg-primary/50"></div>
      <div className="flex-grow h-0.5 bg-gray-100"></div>
    </div>
  </div>
);

// Componente de newsletter
const Newsletter = () => (
  <motion.div 
    className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-16"
    initial={{ opacity: 0 }}
    whileInView={{ opacity: 1 }}
    viewport={{ once: true }}
    transition={{ duration: 0.7 }}
  >
    <div className="container mx-auto px-4 max-w-5xl">
      <div className="flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="md:w-1/2">
          <h2 className="text-3xl font-bold mb-4">Assine nossa newsletter</h2>
          <p className="text-gray-300 mb-4">
            Receba em primeira mão nossas ofertas exclusivas, dicas para sua empresa e 
            novidades sobre equipamentos gastronômicos.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input 
              type="email" 
              placeholder="Seu melhor e-mail" 
              className="px-4 py-3 rounded-lg text-gray-900 w-full sm:w-auto flex-grow"
            />
            <Button variant="default" size="lg" className="whitespace-nowrap">
              Quero Receber
            </Button>
          </div>
          <p className="text-gray-400 text-sm mt-2">
            * Prometemos não enviar spam. Você pode cancelar a qualquer momento.
          </p>
        </div>
        <div className="md:w-1/2 flex justify-end">
          <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
            <h3 className="font-medium mb-2">O que você vai receber:</h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary"></div>
                <span>Ofertas e promoções exclusivas</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary"></div>
                <span>Dicas para otimizar seu negócio</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary"></div>
                <span>Tendências do mercado gastronômico</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary"></div>
                <span>Novidades em equipamentos e tecnologias</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </motion.div>
);

export default function HomePage() {
  const { user } = useAuth();

  // Helper to determine admin button destination
  const getAdminLink = () => {
    if (user?.role === UserRole.ADMIN) {
      return "/admin";
    } else if (user?.role === UserRole.SUPPLIER) {
      return "/fornecedor";
    } else {
      return "/auth";
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      
      <main className="flex-grow">
        {/* Hero Section Animado */}
        <AnimatedHero />
        
        <CategoryNav />
        
        <div className="container mx-auto px-4 py-12">
          {/* Carrossel de Destaques */}
          <FeaturedCarousel />
        </div>
        
        <Divider />
        
        {/* Banner de destaque para comparação */}
        <div className="container mx-auto px-4 py-8">
          <motion.div 
            className="bg-gradient-to-r from-primary/90 to-primary/70 rounded-xl p-6 text-white shadow-lg"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="md:w-7/12">
                <h2 className="text-2xl md:text-3xl font-bold mb-3">Compare produtos e economize até 30%</h2>
                <p className="mb-4">
                  Nossa ferramenta exclusiva de comparação de equipamentos permite que você encontre 
                  a melhor oferta entre diversos fornecedores em poucos segundos.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/product-groups/forno-combinado-10-gns">
                    <Button className="bg-white text-primary hover:bg-white/90">
                      <BarChart2 className="mr-2 h-4 w-4" />
                      Comparar Fornos Combinados
                    </Button>
                  </Link>
                  <Link href="/product-groups/refrigerador-comercial-4-portas">
                    <Button variant="outline" className="bg-transparent border-white text-white hover:bg-white/10">
                      Ver Refrigeradores
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="md:w-5/12 flex justify-center">
                <div className="flex items-center justify-center bg-white/20 backdrop-blur-sm rounded-lg p-5 w-full max-w-xs">
                  <div className="space-y-4 w-full">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                        <span className="font-medium">Melhor preço</span>
                      </div>
                      <span className="font-bold">R$ 12.990,00</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                        <span className="font-medium">Preço médio</span>
                      </div>
                      <span>R$ 15.750,00</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                        <span className="font-medium">Preço máximo</span>
                      </div>
                      <span>R$ 17.990,00</span>
                    </div>
                    <div className="pt-2 mt-2 border-t border-white/30 flex justify-between">
                      <span className="font-medium">Economia:</span>
                      <span className="font-bold text-green-300">R$ 5.000,00 (28%)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Categorias com Cards 3D */}
        <div className="container mx-auto px-4">
          <CategoryCards />
        </div>
        
        {/* Seção de Estatísticas */}
        <StatsSection />
        
        <Divider />
        
        {/* Grid de Produtos em Destaque */}
        <div className="container mx-auto px-4">
          <ProductGrid />
        </div>
        
        <Divider />
        
        {/* Seção de Comparação */}
        <ComparisonSection />
        
        <Divider />
        
        {/* Seção de Benefícios */}
        <BenefitsSection />
        
        <Divider />
        
        {/* Carrossel de Depoimentos */}
        <TestimonialsCarousel />
        
        {/* Newsletter */}
        <Newsletter />
      </main>
      
      <Footer />
      
      {/* Admin/Supplier Quick Access */}
      <div className="fixed bottom-4 right-4 z-50">
        <Link href={getAdminLink()}>
          <Button className="bg-gray-900 hover:bg-opacity-90 text-white font-bold py-2 px-4 rounded-lg shadow-lg flex items-center">
            <LockIcon className="mr-2 h-4 w-4" />
            {user?.role === UserRole.ADMIN 
              ? "Acessar Admin" 
              : user?.role === UserRole.SUPPLIER 
                ? "Painel do Fornecedor" 
                : "Acessar Painel"}
          </Button>
        </Link>
      </div>
    </div>
  );
}
