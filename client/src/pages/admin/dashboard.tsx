import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/hooks/use-auth";
import { User, UserRole, Sale, Product } from "@shared/schema";
import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { BarChart, Users, DollarSign, Settings, Package, Grid, Tags, Percent, MessageCircle, Bell } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// Admin sidebar with links to other admin pages
function AdminSidebar() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold mb-4">Painel Administrativo</h2>
      <nav className="space-y-2">
        <Link href="/admin" className="flex items-center text-primary p-2 rounded-md bg-primary/10 font-medium">
          <BarChart className="mr-2 h-5 w-5" />
          Dashboard
        </Link>
        <Link href="/admin/fornecedores" className="flex items-center text-gray-700 hover:text-primary p-2 rounded-md hover:bg-gray-50 font-medium">
          <Users className="mr-2 h-5 w-5" />
          Fornecedores
        </Link>
        <Link href="/admin/comissoes" className="flex items-center text-gray-700 hover:text-primary p-2 rounded-md hover:bg-gray-50 font-medium">
          <Percent className="mr-2 h-5 w-5" />
          Comissões
        </Link>
        <Link href="/admin/categorias" className="flex items-center text-gray-700 hover:text-primary p-2 rounded-md hover:bg-gray-50 font-medium">
          <Tags className="mr-2 h-5 w-5" />
          Categorias
        </Link>
        <Link href="/admin/chat" className="flex items-center text-gray-700 hover:text-primary p-2 rounded-md hover:bg-gray-50 font-medium">
          <MessageCircle className="mr-2 h-5 w-5" />
          Chat Ao Vivo
          <span className="ml-auto bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">3</span>
        </Link>
      </nav>
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  
  // Fetch all users
  const { data: users, isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });
  
  // Fetch all sales
  const { data: sales, isLoading: isLoadingSales } = useQuery<Sale[]>({
    queryKey: ["/api/sales"],
  });
  
  // Fetch all products
  const { data: productsResponse, isLoading: isLoadingProducts } = useQuery<Product[] | { data: Product[] }>({
    queryKey: ["/api/products"],
  });
  
  // Normaliza o formato dos produtos para garantir que sempre seja um array
  const products = useMemo(() => {
    if (!productsResponse) return [];
    
    // Se já for um array, usar diretamente
    if (Array.isArray(productsResponse)) {
      return productsResponse;
    }
    
    // Se for um objeto com propriedade 'data' como array, usar esse array
    if (productsResponse && typeof productsResponse === 'object' && 
        'data' in productsResponse && Array.isArray(productsResponse.data)) {
      return productsResponse.data;
    }
    
    console.error("Formato inesperado de resposta de produtos:", productsResponse);
    return []; // Fallback para array vazio
  }, [productsResponse]);
  
  // Supplier count
  const supplierCount = users?.filter(u => u.role === UserRole.SUPPLIER).length || 0;
  
  // Calculate earnings
  const totalSales = sales?.reduce((acc, sale) => acc + Number(sale.totalPrice), 0) || 0;
  const totalCommission = sales?.reduce((acc, sale) => acc + Number(sale.commissionAmount), 0) || 0;
  
  // Format currency
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };
  
  // Sample monthly data for the chart
  const monthlyData = [
    { month: 'Jan', vendas: 120000, comissao: 6000 },
    { month: 'Fev', vendas: 150000, comissao: 7500 },
    { month: 'Mar', vendas: 180000, comissao: 9000 },
    { month: 'Abr', vendas: 160000, comissao: 8000 },
    { month: 'Mai', vendas: 190000, comissao: 9500 },
    { month: 'Jun', vendas: 220000, comissao: 11000 },
    { month: 'Jul', vendas: 240000, comissao: 12000 },
  ];
  
  // Calculate sales by category
  const calculateSalesByCategory = () => {
    if (!sales || !products) return [];
    
    const categoryMap = new Map();
    
    for (const sale of sales) {
      const product = products.find(p => p.id === sale.productId);
      if (!product) continue;
      
      const categoryId = product.categoryId;
      const saleAmount = Number(sale.totalPrice);
      
      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, {
          categoryId,
          name: `Categoria ${categoryId}`, // In a real app, we'd lookup the category name
          value: 0,
        });
      }
      
      const category = categoryMap.get(categoryId);
      category.value += saleAmount;
    }
    
    return Array.from(categoryMap.values());
  };
  
  const salesByCategory = calculateSalesByCategory();
  
  // Colors for the pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#FF5A60'];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow bg-gray-100 py-8">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Dashboard Administrativo</h1>
            <p className="text-gray-600">
              Bem-vindo, {user?.name}! Gerencie a plataforma Gastro Compare.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="md:col-span-1">
              <AdminSidebar />
            </div>
            
            {/* Main Content */}
            <div className="md:col-span-3 space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Fornecedores</p>
                        <h3 className="text-2xl font-bold">
                          {isLoadingUsers ? <Loading /> : supplierCount}
                        </h3>
                      </div>
                      <div className="p-2 bg-blue-100 rounded-full">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Produtos</p>
                        <h3 className="text-2xl font-bold">
                          {isLoadingProducts ? <Loading /> : products?.length || 0}
                        </h3>
                      </div>
                      <div className="p-2 bg-green-100 rounded-full">
                        <Package className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Vendas Totais</p>
                        <h3 className="text-2xl font-bold">
                          {isLoadingSales ? <Loading /> : formatCurrency(totalSales)}
                        </h3>
                      </div>
                      <div className="p-2 bg-purple-100 rounded-full">
                        <DollarSign className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Comissões</p>
                        <h3 className="text-2xl font-bold">
                          {isLoadingSales ? <Loading /> : formatCurrency(totalCommission)}
                        </h3>
                      </div>
                      <div className="p-2 bg-yellow-100 rounded-full">
                        <Percent className="h-6 w-6 text-yellow-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Sales Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Vendas e Comissões</CardTitle>
                  <CardDescription>
                    Visualize o histórico de vendas e comissões na plataforma
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={monthlyData}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Area
                          type="monotone"
                          dataKey="vendas"
                          stackId="1"
                          stroke="#007BFF"
                          fill="#007BFF"
                          name="Vendas"
                        />
                        <Area
                          type="monotone"
                          dataKey="comissao"
                          stackId="2"
                          stroke="#FF5A60"
                          fill="#FF5A60"
                          name="Comissões"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              {/* Additional Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sales by Category */}
                <Card className="h-[400px]">
                  <CardHeader>
                    <CardTitle>Vendas por Categoria</CardTitle>
                    <CardDescription>
                      Distribuição de vendas por categoria de produto
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingSales || isLoadingProducts ? (
                      <Loading />
                    ) : salesByCategory.length === 0 ? (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-gray-500">Sem dados suficientes</p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                          <Pie
                            data={salesByCategory}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {salesByCategory.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
                
                {/* Recent Activity */}
                <Card className="h-[400px]">
                  <CardHeader>
                    <CardTitle>Atividade Recente</CardTitle>
                    <CardDescription>
                      Últimas transações na plataforma
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingSales ? (
                      <Loading />
                    ) : !sales || sales.length === 0 ? (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-gray-500">Nenhuma venda registrada ainda</p>
                      </div>
                    ) : (
                      <div className="space-y-4 overflow-y-auto max-h-[280px]">
                        {sales.slice(0, 10).map((sale) => (
                          <div key={sale.id} className="flex items-start border-b border-gray-100 pb-2">
                            <div className="p-2 bg-primary/10 rounded-full mr-3">
                              <DollarSign className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">
                                Venda #{sale.id} - Produto #{sale.productId}
                              </p>
                              <div className="flex items-center text-sm text-gray-500">
                                <span className="mr-2">{formatCurrency(Number(sale.totalPrice))}</span>
                                <span className="text-green-600">
                                  (Comissão: {formatCurrency(Number(sale.commissionAmount))})
                                </span>
                              </div>
                              <p className="text-xs text-gray-400">
                                {new Date(sale.createdAt).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                          </div>
                        ))}
                        
                        <div className="text-center pt-2">
                          <Button variant="link" className="text-primary">
                            Ver todas as vendas
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              {/* Quick Links */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6 pb-6">
                    <div className="flex flex-col items-center text-center">
                      <div className="p-3 bg-blue-100 rounded-full mb-4">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Gerenciar Fornecedores</h3>
                      <p className="text-gray-500 text-sm mb-4">
                        Aprove novos fornecedores e gerencie os existentes.
                      </p>
                      <Button variant="outline" className="w-full" asChild>
                        <Link href="/admin/fornecedores">
                          Acessar
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6 pb-6">
                    <div className="flex flex-col items-center text-center">
                      <div className="p-3 bg-green-100 rounded-full mb-4">
                        <Percent className="h-6 w-6 text-green-600" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Ajustar Comissões</h3>
                      <p className="text-gray-500 text-sm mb-4">
                        Configure as taxas de comissão para diferentes categorias.
                      </p>
                      <Button variant="outline" className="w-full" asChild>
                        <Link href="/admin/comissoes">
                          Acessar
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6 pb-6">
                    <div className="flex flex-col items-center text-center">
                      <div className="p-3 bg-purple-100 rounded-full mb-4">
                        <Tags className="h-6 w-6 text-purple-600" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Gerenciar Categorias</h3>
                      <p className="text-gray-500 text-sm mb-4">
                        Adicione ou edite categorias de produtos.
                      </p>
                      <Button variant="outline" className="w-full" asChild>
                        <Link href="/admin/categorias">
                          Acessar
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6 pb-6">
                    <div className="flex flex-col items-center text-center">
                      <div className="p-3 bg-blue-400 rounded-full mb-4">
                        <MessageCircle className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Chat Ao Vivo</h3>
                      <p className="text-gray-500 text-sm mb-4">
                        Atenda usuários e fornecedores em tempo real.
                      </p>
                      <Button variant="outline" className="w-full" asChild>
                        <Link href="/admin/chat">
                          <span className="mr-2">Acessar</span>
                          <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">3</span>
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Live Chat Box Inline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageCircle className="h-5 w-5 mr-2 text-primary" />
                    Chat Ao Vivo
                  </CardTitle>
                  <CardDescription>
                    Atenda usuários e fornecedores diretamente do dashboard
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0 h-[500px]">
                  <div className="flex h-full border-t">
                    <div className="w-1/3 border-r p-0">
                      <div className="flex items-center p-4 border-b bg-gray-50 sticky top-0">
                        <h3 className="font-medium text-sm">Conversas</h3>
                        <div className="ml-auto flex space-x-1">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
                            <span className="sr-only">Filtrar</span>
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex border-b">
                        <button className="flex-1 font-medium text-xs p-2 text-center relative bg-primary text-white">
                          Clientes
                          <span className="absolute top-1 right-1 bg-red-500 text-white text-xs px-1 rounded-full">2</span>
                        </button>
                        <button className="flex-1 font-medium text-xs p-2 text-center relative">
                          Fornecedores
                          <span className="absolute top-1 right-1 bg-red-500 text-white text-xs px-1 rounded-full">1</span>
                        </button>
                      </div>
                      
                      <div className="overflow-y-auto h-[calc(500px-86px)]">
                        <div className="border-b p-3 hover:bg-gray-50 cursor-pointer">
                          <div className="flex items-start">
                            <div className="relative mr-3">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 font-bold text-sm">
                                MC
                              </div>
                              <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-sm">Marcos Costa</h4>
                                <span className="text-xs text-gray-500">12:05</span>
                              </div>
                              <p className="text-xs text-gray-600 truncate">Olá, gostaria de informações sobre o prazo de entrega do forno combinado.</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="border-b p-3 hover:bg-gray-50 cursor-pointer bg-blue-50">
                          <div className="flex items-start">
                            <div className="relative mr-3">
                              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-500 font-bold text-sm">
                                AS
                              </div>
                              <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-sm">Amanda Silva</h4>
                                <span className="text-xs text-gray-500">11:42</span>
                              </div>
                              <p className="text-xs text-gray-600 truncate">Preciso de ajuda para comparar as opções de máquinas de gelo.</p>
                              <span className="inline-block bg-primary text-white text-xs rounded-full px-2 py-0.5 mt-1">2 novas</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="border-b p-3 hover:bg-gray-50 cursor-pointer">
                          <div className="flex items-start">
                            <div className="relative mr-3">
                              <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-500 font-bold text-sm">
                                RL
                              </div>
                              <span className="absolute bottom-0 right-0 h-3 w-3 bg-gray-300 rounded-full border-2 border-white"></span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-sm">Restaurante Laguna</h4>
                                <span className="text-xs text-gray-500">Ontem</span>
                              </div>
                              <p className="text-xs text-gray-600 truncate">Obrigado pelo atendimento rápido!</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-1 flex flex-col">
                      <div className="border-b p-3 flex items-center sticky top-0 bg-white z-10">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-500 font-bold text-sm mr-3">
                            AS
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm">Amanda Silva</h4>
                            <p className="text-xs text-green-600">Online</p>
                          </div>
                        </div>
                        <div className="ml-auto flex space-x-2">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
                            <Users className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
                            <Bell className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                        <div className="space-y-4">
                          <div className="flex items-end">
                            <div className="bg-white rounded-lg rounded-bl-none shadow-sm p-3 max-w-[80%]">
                              <p className="text-sm">Olá, estou precisando de ajuda para escolher a melhor máquina de gelo para meu restaurante.</p>
                              <span className="text-xs text-gray-500 mt-1 block">11:30</span>
                            </div>
                          </div>
                          
                          <div className="flex items-end flex-row-reverse">
                            <div className="bg-primary text-white rounded-lg rounded-br-none shadow-sm p-3 max-w-[80%]">
                              <p className="text-sm">Olá Amanda! Claro, posso ajudá-la. Qual o tamanho do seu restaurante e quantos clientes atende por dia?</p>
                              <span className="text-xs text-primary-foreground/70 mt-1 block">11:32</span>
                            </div>
                          </div>
                          
                          <div className="flex items-end">
                            <div className="bg-white rounded-lg rounded-bl-none shadow-sm p-3 max-w-[80%]">
                              <p className="text-sm">Temos um restaurante médio, com capacidade para 80 pessoas. Atendemos cerca de 150 clientes por dia.</p>
                              <span className="text-xs text-gray-500 mt-1 block">11:35</span>
                            </div>
                          </div>
                          
                          <div className="flex items-end">
                            <div className="bg-white rounded-lg rounded-bl-none shadow-sm p-3 max-w-[80%]">
                              <p className="text-sm">Vi que vocês têm algumas opções de máquinas de gelo na plataforma, mas não sei qual seria ideal para nossas necessidades.</p>
                              <span className="text-xs text-gray-500 mt-1 block">11:36</span>
                            </div>
                          </div>
                          
                          <div className="flex items-end flex-row-reverse">
                            <div className="bg-primary text-white rounded-lg rounded-br-none shadow-sm p-3 max-w-[80%]">
                              <p className="text-sm">Para um restaurante com esse fluxo, recomendo uma máquina com produção de pelo menos 80kg de gelo por dia. Temos ótimas opções dos fornecedores TecnoGelo e FrostMax.</p>
                              <span className="text-xs text-primary-foreground/70 mt-1 block">11:40</span>
                            </div>
                          </div>
                          
                          <div className="flex items-end">
                            <div className="bg-white rounded-lg rounded-bl-none shadow-sm p-3 max-w-[80%]">
                              <p className="text-sm">A TecnoGelo tem um modelo específico que você recomenda? Vi que eles têm vários tipos de gelo também.</p>
                              <span className="text-xs text-gray-500 mt-1 block">11:42</span>
                            </div>
                          </div>
                          
                          <div className="flex items-end">
                            <div className="bg-white rounded-lg rounded-bl-none shadow-sm p-3 max-w-[80%]">
                              <p className="text-sm">E qual a diferença de consumo de energia entre as duas marcas?</p>
                              <span className="text-xs text-gray-500 mt-1 block">11:42</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border-t p-3 bg-white">
                        <div className="flex items-center">
                          <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-full">
                            <span className="sr-only">Anexar arquivo</span>
                            <i className="fas fa-paperclip text-gray-500"></i>
                          </Button>
                          <div className="flex-1 mx-3">
                            <input
                              type="text"
                              placeholder="Digite sua mensagem..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                            />
                          </div>
                          <Button size="sm" className="h-9 w-9 p-0 rounded-full">
                            <span className="sr-only">Enviar</span>
                            <i className="fas fa-paper-plane"></i>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
