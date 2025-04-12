import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/hooks/use-auth";
import { useChat } from "@/hooks/use-chat";
import { UserRole } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { 
  Package, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Plus, 
  BarChart, 
  MessageCircle, 
  Bell, 
  Paperclip, 
  Send, 
  Building2,
  Settings
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Dashboard sidebar with links to other supplier pages
function SupplierSidebar() {
  // Usar o hook para obter o contador de mensagens não lidas
  const { unreadCount } = useChat();
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold mb-4">Painel do Fornecedor</h2>
      <nav className="space-y-2">
        <Link href="/fornecedor" className="flex items-center text-primary p-2 rounded-md bg-primary/10 font-medium">
          <BarChart className="mr-2 h-5 w-5" />
          Dashboard
        </Link>
        <Link href="/fornecedor/produtos" className="flex items-center text-gray-700 hover:text-primary p-2 rounded-md hover:bg-gray-50 font-medium">
          <Package className="mr-2 h-5 w-5" />
          Meus Produtos
        </Link>
        <Link href="/fornecedor/vendas" className="flex items-center text-gray-700 hover:text-primary p-2 rounded-md hover:bg-gray-50 font-medium">
          <DollarSign className="mr-2 h-5 w-5" />
          Vendas e Comissões
        </Link>
        <Link href="/fornecedor/chat" className="flex items-center text-gray-700 hover:text-primary p-2 rounded-md hover:bg-gray-50 font-medium relative">
          <MessageCircle className="mr-2 h-5 w-5" />
          Suporte/Chat
          {unreadCount > 0 && (
            <span className="ml-auto bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </Link>
      </nav>
    </div>
  );
}

export default function SupplierDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { 
    openChat, 
    openChatWithAdmin,
    unreadCount,
    startConversationWithAdmin
  } = useChat();
  const [timeframeFilter, setTimeframeFilter] = useState("month"); // "week", "month", "quarter", "year", "all"
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Fetch supplier products
  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["/api/products", { supplierId: user?.id }],
    enabled: !!user?.id,
  });
  
  // Fetch supplier sales
  const { data: sales, isLoading: isLoadingSales } = useQuery({
    queryKey: ["/api/sales", { supplierId: user?.id }],
    enabled: !!user?.id,
  });

  // Fetch supplier-specific commission settings
  const { data: commissionSettings, isLoading: isLoadingCommissions } = useQuery({
    queryKey: ["/api/commission-settings", { supplierId: user?.id }],
    enabled: !!user?.id,
  });
  
  // Fetch categories to map category names
  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
  });
  
  // Filter sales data based on selected timeframe
  const filteredSales = useMemo(() => {
    if (!sales || sales.length === 0) return [];
    
    const now = new Date();
    let filterDate = new Date();
    
    switch (timeframeFilter) {
      case "week":
        filterDate.setDate(now.getDate() - 7);
        break;
      case "month":
        filterDate.setMonth(now.getMonth() - 1);
        break;
      case "quarter":
        filterDate.setMonth(now.getMonth() - 3);
        break;
      case "year":
        filterDate.setFullYear(now.getFullYear() - 1);
        break;
      case "all":
      default:
        return sales;
    }
    
    return sales.filter(sale => new Date(sale.createdAt) >= filterDate);
  }, [sales, timeframeFilter]);
  
  // Generate chart data from actual sales data
  const salesData = useMemo(() => {
    if (!filteredSales || filteredSales.length === 0) {
      // Se não houver dados de vendas, usar dados de exemplo para demonstração
      return [
        { month: 'Jan', vendas: 4000, comissao: 240 },
        { month: 'Fev', vendas: 3000, comissao: 180 },
        { month: 'Mar', vendas: 5000, comissao: 300 },
        { month: 'Abr', vendas: 2780, comissao: 167 },
        { month: 'Mai', vendas: 1890, comissao: 113 },
        { month: 'Jun', vendas: 2390, comissao: 143 },
        { month: 'Jul', vendas: 3490, comissao: 209 },
      ];
    }
    
    // Agrupar vendas por mês
    const salesByMonth = filteredSales.reduce((acc, sale) => {
      const date = new Date(sale.createdAt);
      const monthYear = `${date.toLocaleString('pt-BR', { month: 'short' })}/${date.getFullYear()}`;
      
      if (!acc[monthYear]) {
        acc[monthYear] = {
          month: monthYear,
          vendas: 0,
          comissao: 0
        };
      }
      
      acc[monthYear].vendas += Number(sale.totalPrice);
      acc[monthYear].comissao += Number(sale.commissionAmount);
      
      return acc;
    }, {} as Record<string, { month: string, vendas: number, comissao: number }>);
    
    // Converter objeto para array e ordenar por data
    return Object.values(salesByMonth).sort((a, b) => {
      // Extrair mês e ano da string no formato "MMM/YYYY"
      const [aMonth, aYear] = a.month.split('/');
      const [bMonth, bYear] = b.month.split('/');
      
      // Comparar por ano primeiro
      if (aYear !== bYear) return Number(aYear) - Number(bYear);
      
      // Depois comparar por mês
      const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
      return months.indexOf(aMonth.toLowerCase()) - months.indexOf(bMonth.toLowerCase());
    });
  }, [filteredSales]);
  
  // Calculate earnings
  const totalSales = filteredSales?.reduce((acc, sale) => acc + Number(sale.totalPrice), 0) || 0;
  const totalCommission = filteredSales?.reduce((acc, sale) => acc + Number(sale.commissionAmount), 0) || 0;
  const netEarnings = totalSales - totalCommission;
  
  // Calculate average commission rate
  const avgCommissionRate = totalSales > 0
    ? (totalCommission / totalSales * 100).toFixed(2)
    : "0.00";
  
  // Get total active products
  const activeProducts = products?.filter(p => p.active).length || 0;
  
  // Calculate top performing products
  const topProducts = useMemo(() => {
    if (!filteredSales || !products) return [];
    
    // Agregar vendas por produto
    const salesByProduct = filteredSales.reduce((acc, sale) => {
      if (!acc[sale.productId]) {
        acc[sale.productId] = {
          productId: sale.productId,
          totalSales: 0,
          totalValue: 0,
          count: 0
        };
      }
      
      acc[sale.productId].totalValue += Number(sale.totalPrice);
      acc[sale.productId].count += Number(sale.quantity);
      
      return acc;
    }, {} as Record<number, { productId: number, totalSales: number, totalValue: number, count: number }>);
    
    // Mapear IDs de produto para objetos de produto completos
    return Object.values(salesByProduct)
      .map(item => {
        const product = products.find(p => p.id === item.productId);
        if (!product) return null;
        
        return {
          ...item,
          product,
          name: product.name,
          imageUrl: product.imageUrl
        };
      })
      .filter(Boolean)
      .sort((a, b) => b!.totalValue - a!.totalValue)
      .slice(0, 5);
  }, [filteredSales, products]);
  
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };
  
  // Função para formatar percentuais
  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow bg-gray-100 py-8">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Dashboard do Fornecedor</h1>
            <p className="text-gray-600">
              Bem-vindo, {user?.name}! Gerencie seus produtos e acompanhe suas vendas.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="md:col-span-1">
              <SupplierSidebar />
            </div>
            
            {/* Main Content */}
            <div className="md:col-span-3 space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Produtos</p>
                        <h3 className="text-2xl font-bold">
                          {isLoadingProducts ? <Loading /> : products?.length || 0}
                        </h3>
                      </div>
                      <div className="p-2 bg-primary/10 rounded-full">
                        <Package className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Vendas</p>
                        <h3 className="text-2xl font-bold">
                          {isLoadingSales ? <Loading /> : sales?.length || 0}
                        </h3>
                      </div>
                      <div className="p-2 bg-green-100 rounded-full">
                        <TrendingUp className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Faturamento</p>
                        <h3 className="text-2xl font-bold">
                          {isLoadingSales ? <Loading /> : formatCurrency(totalSales)}
                        </h3>
                      </div>
                      <div className="p-2 bg-blue-100 rounded-full">
                        <DollarSign className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Comissão</p>
                        <h3 className="text-2xl font-bold">
                          {isLoadingSales ? <Loading /> : formatCurrency(totalCommission)}
                        </h3>
                      </div>
                      <div className="p-2 bg-yellow-100 rounded-full">
                        <Users className="h-6 w-6 text-yellow-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Quick Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6 pb-6">
                    <div className="flex flex-col items-center text-center">
                      <div className="p-3 bg-primary/10 rounded-full mb-4">
                        <Package className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Adicionar Produto</h3>
                      <p className="text-gray-500 text-sm mb-4">
                        Cadastre novos produtos no marketplace
                      </p>
                      <Link href="/fornecedor/produtos/novo">
                        <Button variant="outline" className="w-full">
                          Cadastrar
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6 pb-6">
                    <div className="flex flex-col items-center text-center">
                      <div className="p-3 bg-blue-100 rounded-full mb-4">
                        <TrendingUp className="h-6 w-6 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Relatório de Vendas</h3>
                      <p className="text-gray-500 text-sm mb-4">
                        Visualize relatórios detalhados das suas vendas
                      </p>
                      <Link href="/fornecedor/vendas">
                        <Button variant="outline" className="w-full">
                          Ver Relatórios
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6 pb-6">
                    <div className="flex flex-col items-center text-center">
                      <div className="p-3 bg-purple-100 rounded-full mb-4">
                        <MessageCircle className="h-6 w-6 text-purple-600" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Suporte Administrativo</h3>
                      <p className="text-gray-500 text-sm mb-4">
                        Tire dúvidas sobre comissões e funcionamento
                      </p>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => {
                          if (user) {
                            const initialMessage = `Fornecedor ${user.username} - Solicitação de Suporte`;
                            startConversationWithAdmin(initialMessage).then(() => {
                              openChat();
                            });
                          }
                        }}
                      >
                        <span className="mr-2">Conversar</span>
                        {unreadCount > 0 && (
                          <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                            {unreadCount}
                          </span>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Sales Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Vendas e Comissões</CardTitle>
                  <CardDescription>
                    Visualize suas vendas e comissões nos últimos meses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={salesData}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => ['R$ ' + value.toFixed(2)]} />
                        <Area
                          type="monotone"
                          dataKey="vendas"
                          stackId="1"
                          stroke="#007BFF"
                          fill="#007BFF"
                          fillOpacity={0.8}
                          name="Vendas"
                        />
                        <Area
                          type="monotone"
                          dataKey="comissao"
                          stackId="2"
                          stroke="#FF5A60"
                          fill="#FF5A60"
                          fillOpacity={0.8}
                          name="Comissão"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              {/* Recent Products */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Produtos Recentes</CardTitle>
                    <CardDescription>
                      Seus produtos mais recentemente adicionados
                    </CardDescription>
                  </div>
                  <Link href="/fornecedor/produtos">
                    <Button className="flex items-center">
                      <Plus className="mr-2 h-4 w-4" />
                      Novo Produto
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  {isLoadingProducts ? (
                    <Loading />
                  ) : !products || products.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-4">
                        Você ainda não tem produtos cadastrados.
                      </p>
                      <Link href="/fornecedor/produtos">
                        <Button>Adicionar meu primeiro produto</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {products.slice(0, 5).map((product) => (
                        <div key={product.id} className="flex items-center justify-between py-2 border-b">
                          <div className="flex items-center">
                            <div className="w-10 h-10 mr-3 bg-gray-200 rounded overflow-hidden">
                              <img
                                src={product.imageUrl || "https://via.placeholder.com/40"}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-gray-500">
                                {formatCurrency(Number(product.price))}
                              </p>
                            </div>
                          </div>
                          <Link href={`/produto/${product.slug}`}>
                            <Button variant="ghost" size="sm">Ver</Button>
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Chat com Administração */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageCircle className="h-5 w-5 mr-2 text-primary" />
                    Suporte Administrativo
                  </CardTitle>
                  <CardDescription>
                    Converse com nossa equipe administrativa diretamente pelo seu dashboard
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0 h-[500px]">
                  <div className="flex h-full border-t">
                    {/* Lista de mensagens */}
                    <div className="flex-1 flex flex-col">
                      <div className="border-b p-3 flex items-center sticky top-0 bg-white z-10">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 font-bold text-sm mr-3">
                            <Building2 className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm">Administração Gastro</h4>
                            <p className="text-xs text-green-600">Online</p>
                          </div>
                        </div>
                        <div className="ml-auto flex space-x-2">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                        <div className="space-y-4">
                          <div className="flex items-end flex-row-reverse">
                            <div className="bg-primary text-white rounded-lg rounded-br-none shadow-sm p-3 max-w-[80%]">
                              <p className="text-sm">Olá, preciso de informações sobre as comissões da plataforma para produtos de cozinha industrial.</p>
                              <span className="text-xs text-primary-foreground/70 mt-1 block">13:45</span>
                            </div>
                          </div>
                          
                          <div className="flex items-end">
                            <div className="bg-white rounded-lg rounded-bl-none shadow-sm p-3 max-w-[80%]">
                              <p className="text-sm">Olá! Claro, posso ajudar com informações sobre as comissões. Para produtos de cozinha industrial, nossa taxa é de 2,5% sobre o valor da venda.</p>
                              <span className="text-xs text-gray-500 mt-1 block">13:47</span>
                            </div>
                          </div>
                          
                          <div className="flex items-end">
                            <div className="bg-white rounded-lg rounded-bl-none shadow-sm p-3 max-w-[80%]">
                              <p className="text-sm">Essa taxa é válida para todos os equipamentos nessa categoria. Existe algum produto específico sobre o qual você gostaria de mais informações?</p>
                              <span className="text-xs text-gray-500 mt-1 block">13:48</span>
                            </div>
                          </div>
                          
                          <div className="flex items-end flex-row-reverse">
                            <div className="bg-primary text-white rounded-lg rounded-br-none shadow-sm p-3 max-w-[80%]">
                              <p className="text-sm">Gostaria de saber se há alguma diferença na comissão para fornos combinados de grande porte.</p>
                              <span className="text-xs text-primary-foreground/70 mt-1 block">13:50</span>
                            </div>
                          </div>
                          
                          <div className="flex items-end">
                            <div className="bg-white rounded-lg rounded-bl-none shadow-sm p-3 max-w-[80%]">
                              <p className="text-sm">Para fornos combinados de grande porte (acima de 20 GNs), a comissão é de 2%, um pouco menor que a taxa padrão, devido ao valor mais elevado desses equipamentos.</p>
                              <span className="text-xs text-gray-500 mt-1 block">13:52</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border-t p-3 bg-white">
                        <div className="flex items-center">
                          <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-full">
                            <span className="sr-only">Anexar arquivo</span>
                            <Paperclip className="h-4 w-4 text-gray-500" />
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
                            <Send className="h-4 w-4" />
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
