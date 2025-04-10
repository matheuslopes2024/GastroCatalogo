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
                  <Store className="h-10 w-10" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Conteúdo */}
          <div className="pt-12 px-6 pb-6">
            <div className="text-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 mb-1">
                {supplier.companyName || supplier.name}
              </h3>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span>{supplier.cnpj ? `CNPJ: ${supplier.cnpj}` : "Fornecedor Verificado"}</span>
              </div>
            </div>
            
            <p className="text-gray-600 text-center mb-4 line-clamp-2">
              {`Fornecedor especializado que oferece produtos de qualidade desde ${new Date(supplier.createdAt).getFullYear()}.`}
            </p>
            
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                <span className="ml-1 font-medium">{parseFloat(supplier.rating).toFixed(1)}</span>
              </div>
              <div className="flex items-center text-gray-600 text-sm">
                <Store className="h-4 w-4 mr-1" />
                <span>{supplier.productsCount} produtos</span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-1 mb-4">
              {supplier.categories.slice(0, 3).map((category, idx) => (
                <Badge key={idx} variant="secondary" className="font-normal">
                  {category}
                </Badge>
              ))}
              {supplier.categories.length > 3 && (
                <Badge variant="outline" className="font-normal text-gray-500">
                  +{supplier.categories.length - 3}
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
  
  // Efeito para carregar fornecedores
  useEffect(() => {
    const fetchSuppliers = async () => {
      setLoading(true);
      
      try {
        const response = await apiRequest('GET', '/api/suppliers');
        const data = await response.json();
        
        // Adicionar a propriedade "verified" a todos os fornecedores 
        const enhancedSuppliers = data.map((supplier: any) => ({
          ...supplier,
          verified: true // Todos os fornecedores na plataforma são verificados
        }));
        
        setSuppliers(enhancedSuppliers);
      } catch (error) {
        console.error('Erro ao buscar fornecedores:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSuppliers();
  }, []);
  
  // Função para ordenar fornecedores
  const getSortedSuppliers = () => {
    const filtered = [...suppliers];
    
    if (filters.category && filtered.length > 0 && filtered[0].categories) {
      return filtered.filter(s => 
        s.categories.some((c: string) => 
          c.toLowerCase().includes(filters.category.toLowerCase()))
      );
    }
    
    if (filters.sortBy === 'rating') {
      return filtered.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
    } else if (filters.sortBy === 'products') {
      return filtered.sort((a, b) => b.productsCount - a.productsCount);
    } else if (filters.sortBy === 'newest') {
      return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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