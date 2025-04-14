import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  BarChart2,
  TrendingDown,
  ShoppingCart,
  Star,
  Timer,
  ChefHat,
  ArrowRight,
  TrendingUp,
  GraduationCap,
  Building,
  Calendar,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

// Tipo para estatísticas do marketplace
interface MarketplaceStats {
  totalSavings: string;
  avgSavingsPercentage: number;
  totalProductsCompared: number;
  totalComparisons: number;
  topCategories: {
    id: number;
    name: string;
    count: number;
    slug: string;
  }[];
  recentSavings: {
    amount: string;
    percentage: number;
    product: string;
    date: string;
    productSlug: string;
  }[];
}

// Tipo para kits pré-configurados
interface KitPreset {
  id: number;
  name: string;
  slug: string;
  itemsCount: number;
  totalInvestment: string;
  estimatedSavings: string;
  savingsPercentage: number;
  imageUrl: string;
  mainCategories: string[];
}

// Tipo para produtos destacados
interface FeaturedProduct {
  id: number;
  name: string;
  slug: string;
  price: string;
  originalPrice: string;
  discount: number;
  imageUrl: string;
  supplier: {
    id: number;
    name: string;
  };
  rating: string;
  minPrice: string;
  maxPrice: string;
  comparisonCount: number;
}

export function InteractiveBanner() {
  const [activeRecentSaving, setActiveRecentSaving] = useState(0);
  const [activeTab, setActiveTab] = useState("economias");
  
  // Buscar estatísticas do marketplace
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["/api/stats/marketplace"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/stats/marketplace");
        if (!res.ok) {
          throw new Error("Falha ao carregar estatísticas");
        }
        return res.json() as Promise<MarketplaceStats>;
      } catch (error) {
        console.error("Erro ao buscar estatísticas:", error);
        // Retornamos valores vazios em caso de erro para evitar quebra do componente
        return {
          totalSavings: "0",
          avgSavingsPercentage: 0,
          totalProductsCompared: 0,
          totalComparisons: 0,
          topCategories: [],
          recentSavings: []
        } as MarketplaceStats;
      }
    }
  });
  
  // Buscar kits pré-configurados
  const { data: kits, isLoading: isLoadingKits } = useQuery({
    queryKey: ["/api/kits/presets"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/kits/presets");
        if (!res.ok) {
          throw new Error("Falha ao carregar kits");
        }
        return res.json() as Promise<KitPreset[]>;
      } catch (error) {
        console.error("Erro ao buscar kits:", error);
        return [] as KitPreset[];
      }
    }
  });
  
  // Buscar produtos destacados
  const { data: featuredProducts, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["/api/products/featured"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/products/featured?limit=3");
        if (!res.ok) {
          throw new Error("Falha ao carregar produtos destacados");
        }
        return res.json() as Promise<FeaturedProduct[]>;
      } catch (error) {
        console.error("Erro ao buscar produtos destacados:", error);
        return [] as FeaturedProduct[];
      }
    }
  });
  
  // Rotacionar os savings recentes automaticamente
  useEffect(() => {
    if (!stats?.recentSavings?.length) return;
    
    const interval = setInterval(() => {
      setActiveRecentSaving((prev) => 
        prev === stats.recentSavings.length - 1 ? 0 : prev + 1
      );
    }, 5000);
    
    return () => clearInterval(interval);
  }, [stats?.recentSavings?.length]);
  
  // Formatar o preço
  const formatCurrency = (price: string | number) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(numPrice);
  };
  
  // Verificar carregamento
  const isLoading = isLoadingStats || isLoadingKits || isLoadingProducts;
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }
  
  // Extrai os dados de economia mais recentes, se disponíveis
  const recentSaving = stats?.recentSavings && stats.recentSavings.length > 0 
    ? stats.recentSavings[activeRecentSaving] 
    : null;
  
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="bg-white rounded-xl overflow-hidden shadow-xl border border-gray-100">
        <div className="bg-gradient-to-br from-primary/95 via-primary/90 to-primary/80 text-white p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Coluna esquerda */}
            <div className="flex-1">
              <div className="flex items-center gap-3 bg-white/10 rounded-full text-sm px-4 py-1.5 w-fit mb-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <BarChart2 size={18} />
                </motion.div>
                <span className="font-medium">Economia em Tempo Real</span>
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
                Compare e <span className="text-yellow-300">economize</span> em equipamentos para restaurantes
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-6">
                <div className="bg-white/10 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-white/80">Economia total na plataforma</span>
                    <Badge variant="outline" className="bg-green-600/20 text-green-300 border-green-500/30">
                      Atualizado hoje
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold">{formatCurrency(stats?.totalSavings || "0")}</div>
                  <div className="flex items-center text-green-300 text-sm mt-1">
                    <TrendingUp size={14} className="mr-1" />
                    <span>+{stats?.avgSavingsPercentage || 0}% em média por comparação</span>
                  </div>
                </div>
                
                <div className="bg-white/10 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-white/80">Comparações realizadas</span>
                    <Badge variant="outline" className="bg-blue-600/20 text-blue-300 border-blue-500/30">
                      Em tempo real
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold">{stats?.totalComparisons.toLocaleString('pt-BR') || 0}</div>
                  <div className="flex items-center text-blue-300 text-sm mt-1">
                    <Users size={14} className="mr-1" />
                    <span>{stats?.totalProductsCompared || 0} produtos analisados</span>
                  </div>
                </div>
              </div>
              
              {/* Tabs de conteúdo */}
              <Tabs defaultValue="economias" className="mt-4" onValueChange={setActiveTab}>
                <TabsList className="bg-white/10 mx-auto">
                  <TabsTrigger value="economias" className="data-[state=active]:bg-white data-[state=active]:text-primary">
                    <TrendingDown className="mr-2 h-4 w-4" />
                    Economias recentes
                  </TabsTrigger>
                  <TabsTrigger value="kits" className="data-[state=active]:bg-white data-[state=active]:text-primary">
                    <ChefHat className="mr-2 h-4 w-4" /> 
                    Kits inteligentes
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="economias" className="pt-4 mt-2">
                  {stats?.recentSavings && stats.recentSavings.length > 0 ? (
                    <div className="bg-white/10 rounded-lg p-4 h-[100px]">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={activeRecentSaving}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.3 }}
                          className="h-full"
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium">{recentSaving?.product}</span>
                            <span className="text-xs text-white/70">{recentSaving?.date}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="text-xl font-bold text-green-300">
                              {formatCurrency(recentSaving?.amount || "0")} de economia
                            </div>
                            <Badge className="bg-green-500">{recentSaving?.percentage}%</Badge>
                          </div>
                          <Link href={`/produto/${recentSaving?.productSlug}`}>
                            <Button variant="link" className="text-white p-0 h-6 mt-2 hover:text-yellow-300">
                              Ver detalhes <ArrowRight size={14} className="ml-1" />
                            </Button>
                          </Link>
                        </motion.div>
                      </AnimatePresence>
                      
                      <div className="flex justify-center mt-2 gap-1">
                        {stats.recentSavings.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setActiveRecentSaving(index)}
                            className={`w-2 h-2 rounded-full ${
                              index === activeRecentSaving ? "bg-white" : "bg-white/30"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white/10 rounded-lg p-4 text-center text-white/70">
                      Nenhuma economia recente para mostrar
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="kits" className="pt-4 mt-2">
                  {kits && kits.length > 0 ? (
                    <div className="bg-white/10 rounded-lg p-4 h-[100px]">
                      <div className="flex flex-col gap-2">
                        {kits.slice(0, 1).map((kit) => (
                          <div key={kit.id}>
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium">{kit.name}</span>
                              <Badge variant="outline" className="bg-blue-600/20 border-blue-500/30">
                                {kit.itemsCount} itens
                              </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                              <div className="flex items-center">
                                <span className="text-sm mr-2">Investimento:</span>
                                <span className="font-medium">{formatCurrency(kit.totalInvestment)}</span>
                              </div>
                              <div className="flex items-center text-green-300">
                                <span className="text-sm mr-2">Economia:</span>
                                <span className="font-bold">{formatCurrency(kit.estimatedSavings)}</span>
                              </div>
                            </div>
                            <Link href={`/kits/${kit.slug}`}>
                              <Button variant="link" className="text-white p-0 h-6 mt-2 hover:text-yellow-300">
                                Configurar kit <ArrowRight size={14} className="ml-1" />
                              </Button>
                            </Link>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white/10 rounded-lg p-4 text-center text-white/70">
                      Kits em breve disponíveis
                    </div>
                  )}
                </TabsContent>
              </Tabs>
              
              <div className="flex flex-wrap gap-3 mt-6">
                <Link href="/categorias">
                  <Button className="bg-white text-primary hover:bg-white/90">
                    <BarChart2 className="mr-2 h-4 w-4" />
                    Ver todas as categorias
                  </Button>
                </Link>
                <Link href="/kits/montar">
                  <Button variant="outline" className="bg-transparent border-white text-white hover:bg-white/10">
                    <ChefHat className="mr-2 h-4 w-4" />
                    Montar kit personalizado
                  </Button>
                </Link>
              </div>
            </div>
            
            {/* Coluna direita */}
            <div className="md:w-5/12">
              <Card className="bg-white/5 border-white/10 overflow-hidden">
                <div className="p-4 bg-white/10">
                  <h3 className="font-semibold text-lg flex items-center">
                    <Star className="mr-2 h-5 w-5 text-yellow-300" />
                    Mais Comparados Hoje
                  </h3>
                </div>
                <div className="p-4">
                  {featuredProducts && featuredProducts.length > 0 ? (
                    <div className="space-y-4">
                      {featuredProducts.map((product) => (
                        <div key={product.id} className="flex items-center gap-3 bg-white/5 p-3 rounded-lg hover:bg-white/10 transition-colors group">
                          <div className="h-16 w-16 rounded bg-white/10 overflow-hidden flex-shrink-0">
                            {product.imageUrl && (
                              <img 
                                src={product.imageUrl} 
                                alt={product.name} 
                                className="h-full w-full object-cover"
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm leading-tight truncate">
                              {product.name}
                            </h4>
                            <div className="flex items-center text-xs text-white/70 gap-2 mt-1">
                              <div className="flex items-center">
                                <Building size={10} className="mr-1" />
                                {product.supplier.name}
                              </div>
                              <div className="flex items-center">
                                <BarChart2 size={10} className="mr-1" />
                                {product.comparisonCount} comparações
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold">{formatCurrency(product.price)}</span>
                                {product.originalPrice && (
                                  <span className="text-xs text-white/50 line-through">{formatCurrency(product.originalPrice)}</span>
                                )}
                              </div>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge className="bg-green-600/50 text-[10px] h-5">
                                      −{product.discount}%
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Economia em relação ao preço médio</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </div>
                          <Link href={`/produto/${product.slug}`}>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                              <ArrowRight size={14} />
                            </Button>
                          </Link>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-white/70 py-4">
                      Nenhum produto destacado disponível
                    </div>
                  )}
                  
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <Link href="/produtos/destaque">
                      <Button variant="outline" className="w-full bg-transparent border-white/20 hover:bg-white/10">
                        Ver todos os destaques
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
        
        {/* Seção inferior - Categorias mais populares */}
        <div className="p-6 bg-white">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800">Categorias mais comparadas</h3>
            <Link href="/categorias">
              <Button variant="ghost" size="sm" className="text-primary">
                Ver todas <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats?.topCategories && stats.topCategories.slice(0, 4).map((category) => (
              <Link key={category.id} href={`/categoria/${category.slug}`}>
                <Card className="hover:border-primary/50 transition-colors hover:shadow-md cursor-pointer h-full">
                  <div className="p-4 text-center h-full flex flex-col">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <BarChart2 className="h-6 w-6 text-primary" />
                    </div>
                    <h4 className="font-medium text-gray-800 mb-1">{category.name}</h4>
                    <p className="text-xs text-gray-500 mb-2 flex-grow">
                      {category.count} comparações realizadas
                    </p>
                    <Progress value={Math.min(category.count / 10, 100)} className="h-1 mt-2" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}