import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CategoryNav } from "@/components/layout/category-nav";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { LockIcon, BarChart2, Search, Mail, ArrowRight, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { UserRole } from "@shared/schema";
import { motion } from "framer-motion";

// Importando componentes existentes
import { FeaturedCarousel } from "@/components/home/featured-carousel";
import { CategoryCards } from "@/components/home/category-cards";
import { ProductGrid } from "@/components/home/product-grid";
import { BenefitsSection } from "@/components/home/benefits-section";
import { TestimonialsCarousel } from "@/components/home/testimonials-carousel";
import { StatsSection } from "@/components/home/stats-section";

// Importando novos componentes com design estilo Trivago
import { TrivagoStyleHero } from "@/components/home/trivago-style-hero";
import { KitsSolution } from "@/components/home/kits-solution";
import { PriceComparisonShowcase } from "@/components/home/price-comparison-showcase";

// Componente de divisor visual aprimorado
const Divider = () => (
  <div className="container mx-auto px-4 py-6">
    <div className="flex items-center gap-4">
      <div className="flex-grow h-0.5 bg-gray-100"></div>
      <div className="w-2 h-2 rounded-full bg-primary/50"></div>
      <div className="w-3 h-3 rounded-full bg-primary/80"></div>
      <div className="w-2 h-2 rounded-full bg-primary/50"></div>
      <div className="flex-grow h-0.5 bg-gray-100"></div>
    </div>
  </div>
);

// Componente de newsletter aprimorado
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
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-white/20 backdrop-blur-sm p-2 rounded-full">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-3xl font-bold">Assine nossa newsletter</h2>
          </div>
          <p className="text-gray-300 mb-4">
            Receba em primeira mão nossas ofertas exclusivas, dicas para sua empresa e 
            novidades sobre equipamentos gastronômicos.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 relative z-0">
            <input 
              type="email" 
              placeholder="Seu melhor e-mail" 
              className="px-4 py-3 rounded-lg text-gray-900 w-full sm:w-auto flex-grow"
            />
            <Button variant="default" size="lg" className="whitespace-nowrap">
              Quero Receber
              <ArrowRight className="ml-2 h-4 w-4" />
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
        {/* Hero Section Estilo Trivago */}
        <TrivagoStyleHero />
        
        <CategoryNav />
        
        {/* Carrossel de Destaques */}
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">Produtos em Destaque</h2>
            <Link href="/produtos/destaque">
              <Button variant="ghost" className="gap-1 text-primary hover:text-primary/90">
                Ver todos
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <FeaturedCarousel />
        </div>
        
        <Divider />
        
        {/* Seção de Comparação de Preços com Showcase */}
        <PriceComparisonShowcase />
        
        <Divider />
        
        {/* Kits de Soluções para Estabelecimentos */}
        <KitsSolution />
        
        <Divider />
        
        {/* Categorias com Cards 3D */}
        <div className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">Navegue por Categorias</h2>
              <Link href="/categorias">
                <Button variant="ghost" className="gap-1 text-primary hover:text-primary/90">
                  Ver todas
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <CategoryCards />
          </div>
        </div>
        
        <Divider />
        
        {/* Grid de Produtos em Destaque */}
        <div className="py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">Produtos Mais Vendidos</h2>
              <Link href="/produtos/populares">
                <Button variant="ghost" className="gap-1 text-primary hover:text-primary/90">
                  Ver todos
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <ProductGrid />
          </div>
        </div>
        
        <Divider />
        
        {/* Seção de Estatísticas */}
        <StatsSection />
        
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
