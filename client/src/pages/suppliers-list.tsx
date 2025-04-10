import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Link } from "wouter";
import { 
  Search, 
  Store, 
  MapPin, 
  Star, 
  ChevronRight, 
  Filter,
  Users,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  BadgeCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { 
  Card, 
  CardContent,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

// Interface do fornecedor
interface Supplier {
  id: number;
  name: string;
  companyName: string | null;
  email: string;
  role: string;
  active: boolean;
  phone: string | null;
  cnpj: string | null;
  createdAt: string;
  username: string;
  rating: string;
  productsCount: number;
  categories: string[];
  verified: boolean;
  joinedDate: string;
}

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
          Fornecedores <span className="text-primary">Verificados</span>
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto">
          Conheça os melhores fornecedores de equipamentos e utensílios para 
          restaurantes, hotéis e estabelecimentos gastronômicos.
        </p>
        <form className="max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Buscar fornecedores por nome, categoria ou localização..."
              className="pl-10 pr-20 py-6 rounded-full border-gray-200 shadow-md w-full"
            />
            <Button type="submit" className="absolute right-1.5 top-1.5 rounded-full">
              Buscar
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// Cartão de fornecedor
const SupplierCard = ({ supplier }: { supplier: Supplier }) => {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Card className="h-full overflow-hidden border-gray-200 hover:shadow-md transition-shadow duration-300">
        <CardContent className="p-0">
          {/* Cabeçalho do cartão */}
          <div className="relative h-36 bg-gradient-to-tr from-primary/80 to-primary w-full">
            {supplier.verified && (
              <div className="absolute top-4 left-4 bg-white rounded-full px-3 py-1 shadow-sm flex items-center gap-1">
                <BadgeCheck className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium">Verificado</span>
              </div>
            )}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
              <div className="w-20 h-20 rounded-full bg-white p-1">
                <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center text-gray-700 overflow-hidden">
                  {supplier.imageUrl ? (
                    <img src={supplier.imageUrl} alt={supplier.name} className="w-full h-full object-cover" />
                  ) : (
                    <Store className="h-10 w-10" />
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Conteúdo */}
          <div className="pt-12 px-6 pb-6">
            <div className="text-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 mb-1">
                {supplier.companyName}
              </h3>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span>{supplier.location}</span>
              </div>
            </div>
            
            <p className="text-gray-600 text-center mb-4 line-clamp-2">
              {supplier.description}
            </p>
            
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                <span className="ml-1 font-medium">{supplier.rating.toFixed(1)}</span>
              </div>
              <div className="flex items-center text-gray-600 text-sm">
                <Store className="h-4 w-4 mr-1" />
                <span>{supplier.productsCount} produtos</span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-1 mb-4">
              {supplier.categoryFocus.slice(0, 3).map((category, idx) => (
                <Badge key={idx} variant="secondary" className="font-normal">
                  {category}
                </Badge>
              ))}
              {supplier.categoryFocus.length > 3 && (
                <Badge variant="outline" className="font-normal text-gray-500">
                  +{supplier.categoryFocus.length - 3}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Link href={`/fornecedor/${supplier.id}`} className="flex-1">
                <Button variant="outline" className="w-full group">
                  <span>Ver Detalhes</span>
                  <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href={`/busca?fornecedor=${supplier.id}`} className="flex-1">
                <Button className="w-full group">
                  <span>Ver Produtos</span>
                  <ArrowUpRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Componente de estatísticas
const StatsSection = () => {
  return (
    <div className="bg-white py-12 border-y border-gray-200">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-center justify-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-3xl font-bold text-gray-900">350+</h3>
              <p className="text-gray-600">Fornecedores Verificados</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-4">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
              <Store className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-3xl font-bold text-gray-900">12.500+</h3>
              <p className="text-gray-600">Produtos Disponíveis</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-4">
            <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <h3 className="text-3xl font-bold text-gray-900">98%</h3>
              <p className="text-gray-600">Taxa de Satisfação</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente principal
export default function SuppliersListPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: "",
    location: "",
    sortBy: "rating"
  });
  
  // Dados simulados de fornecedores para demonstração
  const dummySuppliers: Supplier[] = [
    {
      id: 1,
      name: "equipment_world",
      companyName: "Equipment World",
      description: "Especialistas em equipamentos industriais para cozinhas profissionais, com mais de 20 anos no mercado.",
      location: "São Paulo, SP",
      rating: 4.8,
      productsCount: 423,
      verified: true,
      joinedDate: "2018-05-12",
      categoryFocus: ["Fornos", "Fogões", "Refrigeração"]
    },
    {
      id: 2,
      name: "kitchenware_pro",
      companyName: "KitchenWare Pro",
      description: "Utensílios e pequenos equipamentos para restaurantes e bares com entrega expressa.",
      location: "Rio de Janeiro, RJ",
      rating: 4.6,
      productsCount: 312,
      verified: true,
      joinedDate: "2019-10-25",
      categoryFocus: ["Utensílios", "Panelas", "Facas"]
    },
    {
      id: 3,
      name: "cool_systems",
      companyName: "Cool Systems",
      description: "Especialistas em sistemas de refrigeração comercial e industrial para restaurantes, hotéis e supermercados.",
      location: "Curitiba, PR",
      rating: 4.7,
      productsCount: 187,
      verified: true,
      joinedDate: "2020-02-15",
      categoryFocus: ["Refrigeração", "Congeladores", "Câmaras Frias"]
    },
    {
      id: 4,
      name: "chef_supplies",
      companyName: "Chef Supplies",
      description: "Fornecedor completo de produtos para chefs, com foco em qualidade e durabilidade.",
      location: "Belo Horizonte, MG",
      rating: 4.5,
      productsCount: 278,
      verified: true,
      joinedDate: "2019-07-03",
      categoryFocus: ["Utensílios", "Uniformes", "Acessórios"]
    },
    {
      id: 5,
      name: "smart_kitchen",
      companyName: "Smart Kitchen Solutions",
      description: "Tecnologia de ponta para cozinhas modernas, fornecendo equipamentos inteligentes e conectados.",
      location: "São Paulo, SP",
      rating: 4.9,
      productsCount: 156,
      verified: true,
      joinedDate: "2021-01-10",
      categoryFocus: ["Automação", "Equipamentos", "IoT"]
    },
    {
      id: 6,
      name: "barista_pro",
      companyName: "Barista Pro",
      description: "Tudo para cafeterias e espaços gourmet, desde máquinas profissionais até acessórios especializados.",
      location: "Porto Alegre, RS",
      rating: 4.7,
      productsCount: 203,
      verified: true,
      joinedDate: "2019-11-20",
      categoryFocus: ["Café", "Bebidas", "Máquinas"]
    },
    {
      id: 7,
      name: "pizza_tools",
      companyName: "Pizza Tools Brasil",
      description: "Fornecedor especializado em equipamentos para pizzarias e restaurantes italianos.",
      location: "Campinas, SP",
      rating: 4.6,
      productsCount: 145,
      verified: true,
      joinedDate: "2020-06-18",
      categoryFocus: ["Fornos", "Pizzaria", "Utensílios"]
    },
    {
      id: 8,
      name: "hotel_supplies",
      companyName: "Hotel Supplies",
      description: "Produtos e equipamentos para hotelaria, com foco em restaurantes, bares e áreas de serviço.",
      location: "Florianópolis, SC",
      rating: 4.5,
      productsCount: 320,
      verified: true,
      joinedDate: "2018-09-12",
      categoryFocus: ["Hotelaria", "Serviço", "Buffet"]
    }
  ];
  
  // Efeito para carregar fornecedores
  useEffect(() => {
    const fetchSuppliers = async () => {
      // Em uma implementação real, aqui faria uma chamada à API
      // Aqui estamos usando dados dummy para demonstração
      setLoading(true);
      
      // Simular um atraso de carregamento
      setTimeout(() => {
        setSuppliers(dummySuppliers);
        setLoading(false);
      }, 800);
      
      // Na implementação real:
      // try {
      //   const response = await apiRequest('GET', '/api/suppliers');
      //   const data = await response.json();
      //   setSuppliers(data);
      // } catch (error) {
      //   console.error('Erro ao buscar fornecedores:', error);
      // } finally {
      //   setLoading(false);
      // }
    };
    
    fetchSuppliers();
  }, []);
  
  // Função para ordenar fornecedores
  const getSortedSuppliers = () => {
    const filtered = [...suppliers];
    
    if (filters.category) {
      filtered.filter(s => s.categoryFocus.some(c => 
        c.toLowerCase().includes(filters.category.toLowerCase())));
    }
    
    if (filters.location) {
      filtered.filter(s => 
        s.location.toLowerCase().includes(filters.location.toLowerCase()));
    }
    
    if (filters.sortBy === 'rating') {
      filtered.sort((a, b) => b.rating - a.rating);
    } else if (filters.sortBy === 'products') {
      filtered.sort((a, b) => b.productsCount - a.productsCount);
    } else if (filters.sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.joinedDate).getTime() - new Date(a.joinedDate).getTime());
    }
    
    return filtered;
  };
  
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-grow">
        {/* Hero com barra de pesquisa */}
        <Hero />
        
        {/* Estatísticas */}
        <StatsSection />
        
        {/* Lista de Fornecedores */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Conheça nossos Fornecedores
                </h2>
                <p className="text-gray-600">
                  Todos os fornecedores são verificados e avaliados pela nossa equipe
                </p>
              </div>
              
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="w-full md:w-auto">
                  <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
                    <SelectTrigger className="min-w-[180px]">
                      <SelectValue placeholder="Ordenar por" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rating">Melhor Avaliação</SelectItem>
                      <SelectItem value="products">Mais Produtos</SelectItem>
                      <SelectItem value="newest">Mais Recentes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {loading ? (
              <div className="py-20 flex items-center justify-center">
                <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {getSortedSuppliers().map((supplier) => (
                  <SupplierCard key={supplier.id} supplier={supplier} />
                ))}
              </div>
            )}
            
            {suppliers.length > 0 && (
              <div className="mt-12 text-center">
                <Button size="lg" variant="outline">
                  Carregar Mais Fornecedores
                </Button>
              </div>
            )}
          </div>
        </section>
        
        {/* CTA para se tornar um fornecedor */}
        <section className="py-16 bg-gradient-to-r from-primary to-primary/80 text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Quer se tornar um fornecedor na Gastro Compare?
              </h2>
              <p className="text-xl mb-8 text-white/90">
                Aumente suas vendas e alcance milhares de restaurantes e hotéis em todo o Brasil.
                Nosso processo de cadastro é simples e rápido.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link href="/auth">
                  <Button size="lg" variant="secondary" className="rounded-full">
                    Cadastre-se como Fornecedor
                  </Button>
                </Link>
                <Link href="/como-funciona#fornecedores">
                  <Button variant="outline" size="lg" className="rounded-full bg-transparent text-white border-white hover:bg-white/10">
                    Saiba Mais
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}