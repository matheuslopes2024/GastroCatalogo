import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ChevronDown, Search, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { apiRequest } from "@/lib/queryClient";
import { FaqCategory, FaqItem } from "@shared/schema";

// Componente principal
export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<FaqCategory[]>([]);
  const [items, setItems] = useState<FaqItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<FaqItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buscar categorias e itens
  useEffect(() => {
    const fetchFAQData = async () => {
      try {
        setLoading(true);
        
        // Buscar categorias
        const categoriesResponse = await apiRequest("GET", "/api/faq/categories");
        const categoriesData = await categoriesResponse.json();
        
        // Buscar todos os itens
        const itemsResponse = await apiRequest("GET", "/api/faq/items");
        const itemsData = await itemsResponse.json();
        
        setCategories(categoriesData);
        setItems(itemsData);
        setFilteredItems(itemsData);
        
        setError(null);
      } catch (err) {
        console.error("Erro ao buscar dados do FAQ:", err);
        setError("Não foi possível carregar as perguntas frequentes. Por favor, tente novamente mais tarde.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchFAQData();
  }, []);

  // Filtrar itens quando o usuário pesquisa ou seleciona uma categoria
  useEffect(() => {
    let result = [...items];
    
    // Filtrar por categoria selecionada
    if (selectedCategory !== null) {
      result = result.filter(item => item.categoryId === selectedCategory);
    }
    
    // Filtrar por termo de busca
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        item => 
          item.question.toLowerCase().includes(query) || 
          item.answer.toLowerCase().includes(query)
      );
    }
    
    setFilteredItems(result);
  }, [searchQuery, selectedCategory, items]);

  // Ordenar os itens por categoria e ordem de classificação
  const getItemsByCategory = (categoryId: number) => {
    return filteredItems
      .filter(item => item.categoryId === categoryId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  };

  // Componente do banner
  const HeroBanner = () => (
    <div className="relative py-20 bg-gradient-to-br from-primary/10 to-gray-50">
      <motion.div 
        className="container mx-auto px-4 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
          Perguntas Frequentes
        </h1>
        <p className="text-xl text-gray-600 mb-6 max-w-3xl mx-auto">
          Encontre respostas para as dúvidas mais comuns sobre a plataforma Gastro.
        </p>
        
        {/* Campo de busca */}
        <div className="max-w-md mx-auto relative">
          <Input
            type="text"
            placeholder="Pesquisar perguntas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 py-6 text-base rounded-full"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>
      </motion.div>
    </div>
  );

  // Componente de navegação por categorias
  const CategoryNavigation = () => (
    <div className="mb-8 pb-4 border-b">
      <div className="flex flex-nowrap overflow-x-auto gap-2 pb-2 hide-scrollbar">
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          onClick={() => setSelectedCategory(null)}
          className="whitespace-nowrap"
        >
          Todas as categorias
        </Button>
        
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? "default" : "outline"}
            onClick={() => setSelectedCategory(category.id)}
            className="whitespace-nowrap"
          >
            {category.name}
          </Button>
        ))}
      </div>
    </div>
  );

  // Componente de seção de FAQ
  const FAQSection = ({ categoryId, categoryName }: { categoryId: number, categoryName: string }) => {
    const categoryItems = getItemsByCategory(categoryId);
    
    if (categoryItems.length === 0) return null;
    
    return (
      <motion.div
        className="mb-12"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl font-bold mb-6 text-gray-900">{categoryName}</h2>
        
        <Accordion type="single" collapsible className="w-full">
          {categoryItems.map((item) => (
            <AccordionItem key={item.id} value={`item-${item.id}`}>
              <AccordionTrigger className="text-left text-lg font-medium hover:no-underline">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-gray-700 leading-relaxed text-base">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-grow">
        <HeroBanner />
        
        <section className="py-16">
          <div className="container mx-auto px-4">
            {/* Link para voltar para a página de contato */}
            <Link href="/contato">
              <a className="inline-flex items-center text-primary hover:text-primary/80 mb-8">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para Contato
              </a>
            </Link>
            
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : error ? (
              <div className="text-center py-20">
                <p className="text-red-500 mb-4">{error}</p>
                <Button onClick={() => window.location.reload()}>Tentar novamente</Button>
              </div>
            ) : (
              <>
                <CategoryNavigation />
                
                {selectedCategory === null ? (
                  // Mostrar todas as categorias quando nenhuma está selecionada
                  categories.map((category) => (
                    <FAQSection 
                      key={category.id} 
                      categoryId={category.id} 
                      categoryName={category.name} 
                    />
                  ))
                ) : (
                  // Mostrar apenas a categoria selecionada
                  <FAQSection 
                    categoryId={selectedCategory} 
                    categoryName={categories.find(c => c.id === selectedCategory)?.name || ""}
                  />
                )}
                
                {/* Mensagem quando não há resultados */}
                {filteredItems.length === 0 && (
                  <div className="text-center py-20">
                    <p className="text-xl text-gray-600 mb-4">
                      Nenhum resultado encontrado para "{searchQuery}".
                    </p>
                    <Button onClick={() => setSearchQuery("")}>Limpar pesquisa</Button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
        
        {/* Seção CTA */}
        <section className="py-16 bg-primary/5">
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7 }}
            >
              <h2 className="text-3xl font-bold mb-4 text-gray-900">
                Não encontrou o que procurava?
              </h2>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                Nossa equipe de suporte está pronta para responder suas perguntas e ajudar com qualquer problema que você possa ter.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link href="/contato">
                  <Button size="lg" className="px-8">
                    Entre em Contato
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="px-8">
                  Iniciar Chat
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}