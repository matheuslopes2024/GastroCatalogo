import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { 
  BarChart2, 
  Sparkles, 
  TrendingDown, 
  Percent, 
  ShoppingCart, 
  ArrowRight,
  Scale,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface ProductGroup {
  id: number;
  name: string;
  slug: string;
  displayName: string;
  description: string | null;
  features: string[] | null;
  minPrice: string;
  maxPrice: string;
  avgPrice: string;
  productsCount: number;
  suppliersCount: number;
  categoryId: number;
  itemsCount: number;
}

export function ComparisonSection() {
  // Buscar os grupos de produtos para comparação
  const { data: productGroups, isLoading, error } = useQuery({
    queryKey: ["/api/product-groups"],
    queryFn: async () => {
      const res = await fetch("/api/product-groups");
      if (!res.ok) {
        throw new Error("Falha ao carregar grupos de produtos");
      }
      return res.json() as Promise<ProductGroup[]>;
    }
  });

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };
  
  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 },
  };

  // Formatar o preço
  const formatCurrency = (price: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(parseFloat(price));
  };

  if (isLoading) {
    return (
      <div className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center text-center mb-12">
            <Skeleton className="h-10 w-3/4 max-w-md mb-4" />
            <Skeleton className="h-6 w-full max-w-2xl" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !productGroups || productGroups.length === 0) {
    return null;
  }

  return (
    <div className="py-12 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center text-center mb-12">
          <div className="bg-primary/10 text-primary font-semibold py-2 px-4 rounded-full inline-flex items-center mb-4">
            <BarChart2 className="mr-2 h-4 w-4" /> 
            <span>Compare e economize</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Compare os melhores equipamentos <br className="hidden md:inline" />
            <span className="text-primary">e economize até 30%</span>
          </h2>
          
          <p className="text-gray-600 max-w-2xl">
            Encontre as melhores ofertas do mercado com nosso sistema de comparação exclusivo. 
            Analisamos preços e condições de diversos fornecedores para você fazer a melhor escolha.
          </p>
        </div>
        
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
        >
          {productGroups.slice(0, 3).map((group) => (
            <motion.div key={group.id} variants={item}>
              <Card className="overflow-hidden h-full transition-all hover:shadow-lg flex flex-col border-2 hover:border-primary">
                <div className="p-4 md:p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <Badge variant="outline" className="bg-primary/5 text-primary">
                      {group.suppliersCount} fornecedores
                    </Badge>
                    
                    <div className="text-sm bg-primary/10 rounded-full px-3 py-1 flex items-center">
                      <Scale className="h-4 w-4 mr-1 text-primary" />
                      <span>{group.itemsCount || 0} opções</span>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold mb-2">{group.displayName}</h3>
                  
                  <p className="text-gray-600 mb-4 text-sm flex-grow">
                    {group.description || "Compare preços e condições de diversos fornecedores."}
                  </p>
                  
                  <div className="flex flex-col gap-2 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Preço mais baixo</span>
                      <span className="font-semibold text-green-600 flex items-center">
                        <TrendingDown className="h-4 w-4 mr-1" />
                        {formatCurrency(group.minPrice)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Média do mercado</span>
                      <span className="font-semibold">
                        {formatCurrency(group.avgPrice)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Economia potencial</span>
                      <span className="font-semibold text-primary flex items-center">
                        <Percent className="h-4 w-4 mr-1" />
                        {Math.round(((parseFloat(group.maxPrice) - parseFloat(group.minPrice)) / parseFloat(group.maxPrice)) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 md:p-6 pt-0">
                  <div className="flex flex-col space-y-2">
                    <Link href={`/comparar/${group.slug}`}>
                      <Button className="w-full">
                        <Search className="mr-2 h-4 w-4" />
                        Comparar Opções
                      </Button>
                    </Link>
                    <Link href={`/product-groups/${group.slug}`}>
                      <Button variant="outline" className="w-full text-xs">
                        <BarChart2 className="mr-2 h-3 w-3" />
                        Ver Comparação Detalhada
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
        
        <div className="flex justify-center mt-10">
          <Link href="/categorias">
            <Button variant="outline" size="lg" className="gap-2">
              Ver todos os grupos de comparação
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        
        <div className="mt-16 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-primary/5 rounded-lg p-4 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
              <Search className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-1">Busque</h3>
            <p className="text-gray-600 text-sm">Encontre o produto ideal para o seu negócio</p>
          </div>
          
          <div className="bg-primary/5 rounded-lg p-4 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
              <BarChart2 className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-1">Compare</h3>
            <p className="text-gray-600 text-sm">Analise preços, condições e características</p>
          </div>
          
          <div className="bg-primary/5 rounded-lg p-4 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-1">Economize</h3>
            <p className="text-gray-600 text-sm">Encontre a melhor oferta do mercado</p>
          </div>
          
          <div className="bg-primary/5 rounded-lg p-4 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
              <ShoppingCart className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-1">Compre</h3>
            <p className="text-gray-600 text-sm">Adquira com segurança e praticidade</p>
          </div>
        </div>
      </div>
    </div>
  );
}