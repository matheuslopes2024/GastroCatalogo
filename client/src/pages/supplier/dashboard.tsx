import { useEffect, useState, useMemo } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/hooks/use-auth";
import { useChat } from "@/hooks/use-chat";
import { useToast } from "@/hooks/use-toast";
import { UserRole } from "@shared/schema";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
} from "@/components/ui/card";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Package, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Plus, 
  BarChart, 
  MessageCircle, 
  Bell,
  Settings,
  Building2,
  Edit,
  Calendar,
  Paperclip, 
  Send
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
        <Link href="/fornecedor/dashboard" className="flex items-center text-primary p-2 rounded-md bg-primary/10 font-medium">
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
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  
  // Fetch dashboard summary (includes sales, products, metrics)
  const { 
    data: dashboardData, 
    isLoading: isLoadingDashboard,
    error: dashboardError,
    refetch: refetchDashboard
  } = useQuery({
    queryKey: ["/api/supplier/dashboard/sales-summary", { period: timeframeFilter }],
    enabled: !!user?.id && user?.role === UserRole.SUPPLIER,
  });
  
  // Fetch top products data
  const {
    data: topProductsData,
    isLoading: isLoadingTopProducts
  } = useQuery({
    queryKey: ["/api/supplier/dashboard/top-products"],
    enabled: !!user?.id && user?.role === UserRole.SUPPLIER,
  });
  
  // Fetch recent products - garantir que sejam apenas os produtos do fornecedor logado
  const { data: productsResponse, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["/api/products", { supplierId: user?.id, limit: 5 }],
    enabled: !!user?.id && user?.role === UserRole.SUPPLIER,
    // Log detalhado para depuração
    onSuccess: (data) => {
      console.log(`Produtos carregados para fornecedor ID ${user?.id}:`, 
        Array.isArray(data) ? data.length : 
        (data?.data?.length || 0)
      );
    },
    onError: (error) => {
      console.error("Erro ao carregar produtos do fornecedor:", error);
      toast({
        title: "Erro ao carregar produtos",
        description: "Não foi possível carregar seus produtos. Por favor, tente novamente.",
        variant: "destructive",
      });
    }
  });
  
  // Assegurar que products é sempre um array, mesmo quando a API retorna um objeto
  const products = useMemo(() => {
    if (!productsResponse) return [];
    
    // Se já for um array, usar diretamente
    if (Array.isArray(productsResponse)) return productsResponse;
    
    // Se for um objeto com propriedade 'data' como array, usar esse array
    if (productsResponse && typeof productsResponse === 'object' && 
        productsResponse.data && Array.isArray(productsResponse.data)) {
      return productsResponse.data;
    }
    
    // Fallback para array vazio
    return [];
  }, [productsResponse]);
  
  // Fetch categories to map category names
  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
  });
  
  // Usar dados do dashboard diretamente da API
  const salesData = useMemo(() => {
    // Verificação inicial de carregamento e existência dos dados
    if (isLoadingDashboard || !dashboardData) {
      return [];
    }
    
    // Verificação explícita se o formato dos dados está correto
    const chartData = dashboardData.salesChartData;
    if (!Array.isArray(chartData) || chartData.length === 0) {
      console.log("Dados de vendas não estão disponíveis ou não estão no formato esperado.");
      return [];
    }
    
    try {
      // Transformar dados para o formato esperado pelo gráfico com tratamento de falhas
      return chartData.map((item, index) => {
        // Verificar se o item é um objeto válido
        if (!item || typeof item !== 'object') {
          console.log(`Item inválido no índice ${index} do chartData`);
          return {
            month: `Mês ${index + 1}`,
            vendas: 0,
            comissao: 0
          };
        }
        
        // Extrair valores com fallbacks seguros
        const date = item.date || `Mês ${index + 1}`;
        
        // Converter valores para números com validação
        let salesValue = 0;
        let commissionValue = 0;
        
        if (item.receita !== undefined && item.receita !== null) {
          salesValue = typeof item.receita === 'string' 
            ? parseFloat(item.receita) || 0 
            : Number(item.receita) || 0;
        }
        
        if (item.comissao !== undefined && item.comissao !== null) {
          commissionValue = typeof item.comissao === 'string'
            ? parseFloat(item.comissao) || 0
            : Number(item.comissao) || 0;
        }
        
        return {
          month: date,
          vendas: salesValue,
          comissao: commissionValue,
        };
      }).filter(Boolean); // Remover itens undefined ou null
    } catch (error) {
      console.error("Erro ao processar dados do gráfico de vendas:", error);
      return [];
    }
  }, [dashboardData, isLoadingDashboard]);
  
  // Extrair métricas do dashboard com tratamento de erro aprimorado
  const dashboardSummary = useMemo(() => {
    try {
      // Verificação de estado de carregamento e existência de dados
      if (isLoadingDashboard || !dashboardData) {
        return {
          totalSales: 0,
          totalOrders: 0,
          totalRevenue: 0,
          totalCommission: 0,
          netRevenue: 0,
          avgCommissionRate: "0.00",
          topProducts: []
        };
      }
      
      // Verificar explicitamente a existência do objeto summary
      if (!dashboardData.summary || typeof dashboardData.summary !== 'object') {
        console.log("Dados de resumo do dashboard não disponíveis ou em formato inválido");
        return {
          totalSales: 0,
          totalOrders: 0,
          totalRevenue: 0,
          totalCommission: 0,
          netRevenue: 0,
          avgCommissionRate: "0.00",
          topProducts: []
        };
      }
      
      // Extrair valores com fallbacks seguros para cada métrica
      const totalSales = typeof dashboardData.summary.totalSales === 'number' 
        ? dashboardData.summary.totalSales 
        : 0;
        
      const totalRevenue = typeof dashboardData.summary.totalRevenue === 'number' 
        ? dashboardData.summary.totalRevenue 
        : 0;
        
      const totalCommission = typeof dashboardData.summary.totalCommission === 'number' 
        ? dashboardData.summary.totalCommission 
        : 0;
        
      const netRevenue = typeof dashboardData.summary.netRevenue === 'number' 
        ? dashboardData.summary.netRevenue 
        : 0;
      
      // Calcular taxa média de comissão com proteção contra divisão por zero
      const avgCommissionRate = totalRevenue > 0
        ? (totalCommission / totalRevenue * 100).toFixed(2)
        : "0.00";
        
      // Processamento seguro de topProducts
      let topProducts = [];
      
      if (Array.isArray(dashboardData.topProducts)) {
        topProducts = dashboardData.topProducts.map(product => {
          // Verificar se o item é um objeto válido
          if (!product || typeof product !== 'object') {
            return null;
          }
          
          // Extrair valores com fallbacks seguros
          const productId = product.productId || 0;
          const name = product.name || 'Produto sem nome';
          const imageUrl = product.imageUrl || null;
          const totalRevenue = typeof product.totalRevenue === 'number' ? product.totalRevenue : 0;
          const totalSales = typeof product.totalSales === 'number' ? product.totalSales : 0;
          
          return {
            productId,
            product: { id: productId, name },
            imageUrl,
            totalValue: totalRevenue,
            count: totalSales
          };
        }).filter(Boolean); // Filtrar itens nulos ou undefined
      }
        
      return {
        totalOrders: totalSales,
        totalSales: totalRevenue,
        totalCommission,
        netRevenue,
        avgCommissionRate,
        topProducts
      };
    } catch (error) {
      console.error("Erro ao processar dados do dashboard:", error);
      return {
        totalSales: 0,
        totalOrders: 0,
        totalRevenue: 0,
        totalCommission: 0,
        netRevenue: 0,
        avgCommissionRate: "0.00",
        topProducts: []
      };
    }
  }, [dashboardData, isLoadingDashboard]);
  
  // Este useMemo foi substituído pelo topProducts dentro do dashboardSummary
  
  // Extrair desempenho de produtos para visualização na tabela com tratamento de erro aprimorado
  const productPerformance = useMemo(() => {
    try {
      // Verificação inicial de estado e existência de dados
      if (isLoadingDashboard || !dashboardData) {
        return [];
      }
      
      // Verificação explícita do formato dos dados de produtos
      if (!dashboardData.topProducts || !Array.isArray(dashboardData.topProducts)) {
        console.log("Dados de produtos mais vendidos não disponíveis ou em formato inválido");
        return [];
      }
      
      // Processamento seguro dos produtos com validações
      return dashboardData.topProducts.map(product => {
        // Verificar se o item é um objeto válido
        if (!product || typeof product !== 'object') {
          return null;
        }
        
        // Extrair valores com fallbacks seguros
        const productId = product.productId || 0;
        const name = product.name || 'Produto sem nome';
        const imageUrl = product.imageUrl || null;
        const totalRevenue = typeof product.totalRevenue === 'number' ? product.totalRevenue : 0;
        const totalSales = typeof product.totalSales === 'number' ? product.totalSales : 0;
        
        return {
          productId,
          product: { 
            id: productId, 
            name 
          },
          imageUrl,
          totalValue: totalRevenue,
          count: totalSales
        };
      }).filter(Boolean); // Remover itens nulos ou undefined
    } catch (error) {
      console.error("Erro ao processar dados de desempenho de produtos:", error);
      return [];
    }
  }, [dashboardData, isLoadingDashboard]);
  
  // Extrair vendas recentes com tratamento de erro aprimorado
  const recentSales = useMemo(() => {
    try {
      // Verificação inicial de estado e existência de dados
      if (isLoadingDashboard || !dashboardData) {
        return [];
      }
      
      // Verificação explícita do formato dos dados
      if (!dashboardData.recentSales || !Array.isArray(dashboardData.recentSales)) {
        console.log("Dados de vendas recentes não disponíveis ou em formato inválido");
        return [];
      }
      
      // Verificar se cada elemento é válido
      return dashboardData.recentSales.map(sale => {
        // Verificar se o item é um objeto válido
        if (!sale || typeof sale !== 'object') {
          return null;
        }
        
        // Extrair com valores padrão seguros
        return {
          id: sale.id || 0,
          date: sale.date || new Date().toISOString(),
          productId: sale.productId || 0,
          productName: sale.productName || 'Produto não identificado',
          buyerName: sale.buyerName || 'Cliente não identificado',
          quantity: typeof sale.quantity === 'number' ? sale.quantity : 1,
          totalPrice: sale.totalPrice || '0',
          status: sale.status || 'pending'
        };
      }).filter(Boolean); // Remover itens nulos
    } catch (error) {
      console.error("Erro ao processar dados de vendas recentes:", error);
      return [];
    }
  }, [dashboardData, isLoadingDashboard]);
  
  // Get total active products - verificamos se products é um array antes de usar filter
  const activeProducts = Array.isArray(products) ? products.filter(p => p.active).length || 0 : 0;
  
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
          {/* Cabeçalho com informações mais completas */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 text-transparent bg-clip-text">
                  Dashboard do Fornecedor
                </h1>
                <p className="text-gray-600">
                  Bem-vindo, <span className="font-medium">{user?.name}</span>! Gerencie seus produtos e acompanhe suas vendas.
                </p>
              </div>
              <div className="flex flex-col md:flex-row gap-3">
                <Select value={timeframeFilter} onValueChange={setTimeframeFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Selecione o período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Última semana</SelectItem>
                    <SelectItem value="month">Último mês</SelectItem>
                    <SelectItem value="quarter">Último trimestre</SelectItem>
                    <SelectItem value="year">Último ano</SelectItem>
                    <SelectItem value="all">Todo o período</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  className="flex items-center" 
                  onClick={() => setIsSettingsOpen(true)}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Configurações
                </Button>
              </div>
            </div>
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
                        <p className="text-xs text-green-600 mt-1">
                          {activeProducts} produtos ativos
                        </p>
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
                          {isLoadingDashboard ? <Loading /> : dashboardSummary.totalOrders || 0}
                        </h3>
                        <p className="text-xs text-green-600 mt-1">
                          Período: {timeframeFilter}
                        </p>
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
                          {isLoadingDashboard ? <Loading /> : formatCurrency(dashboardSummary.totalSales)}
                        </h3>
                        <p className="text-xs text-green-600 mt-1">
                          {formatCurrency(dashboardSummary.netRevenue)} líquido
                        </p>
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
                          {isLoadingDashboard ? <Loading /> : formatCurrency(dashboardSummary.totalCommission)}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          Taxa média: {dashboardSummary.avgCommissionRate}%
                        </p>
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
              
              {/* Grid de Produtos e Top Performers */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                        {Array.isArray(products) ? 
                          // Garantir que apenas produtos do fornecedor atual sejam mostrados
                          products
                            .filter(product => {
                              const productSupplierId = Number(product.supplierId);
                              const currentUserId = Number(user?.id);
                              const belongsToCurrentSupplier = productSupplierId === currentUserId;
                              
                              // Log para debug e transparência
                              if (!belongsToCurrentSupplier) {
                                console.log(`[Segurança] Produto ${product.id} (fornecedor ${productSupplierId}) filtrado - não pertence ao fornecedor atual (${currentUserId})`);
                              }
                              
                              return belongsToCurrentSupplier;
                            })
                            .slice(0, 5).map((product) => (
                            <div key={product.id} className="flex items-center justify-between py-2 border-b">
                              <div className="flex items-center">
                                <div className="w-10 h-10 mr-3 bg-gray-200 rounded overflow-hidden">
                                  <img
                                    src={product.imageUrl || "https://via.placeholder.com/40"}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      // Fallback para imagem padrão em caso de erro
                                      e.currentTarget.src = "https://via.placeholder.com/40";
                                      e.currentTarget.onerror = null; // Prevenir loop infinito
                                    }}
                                  />
                                </div>
                                <div>
                                  <p className="font-medium">
                                    {product.name}
                                    <span className="ml-1 text-xs text-gray-400">
                                      (ID: {product.id})
                                    </span>
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {formatCurrency(Number(product.price))}
                                  </p>
                                </div>
                              </div>
                              <Link href={`/produto/${product.slug}`}>
                                <Button variant="ghost" size="sm">Ver</Button>
                              </Link>
                            </div>
                          ))
                        : // Renderização de conteúdo vazio com mensagem adequada quando produtos não é um array
                          <div className="text-center py-4">
                            <p className="text-gray-500">Carregando lista de produtos...</p>
                          </div>
                        }
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Top Performing Products */}
                <Card>
                  <CardHeader>
                    <CardTitle>Produtos Mais Vendidos</CardTitle>
                    <CardDescription>
                      Produtos com melhor desempenho no período selecionado
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingDashboard ? (
                      <Loading />
                    ) : !dashboardSummary.topProducts || dashboardSummary.topProducts.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500 mb-4">
                          Ainda não há dados de vendas para os produtos.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {Array.isArray(dashboardSummary.topProducts) ? 
                          // Filtrar para garantir que apenas produtos do fornecedor atual sejam mostrados
                          dashboardSummary.topProducts
                            .filter(item => {
                              if (!item || !item.product) return false;
                              
                              const productSupplierId = Number(item.product.supplierId);
                              const currentUserId = Number(user?.id);
                              const belongsToCurrentSupplier = productSupplierId === currentUserId;
                              
                              // Log para debug e transparência
                              if (!belongsToCurrentSupplier) {
                                console.log(`[Segurança] Top produto ${item.product.id} (fornecedor ${productSupplierId}) filtrado - não pertence ao fornecedor atual (${currentUserId})`);
                              }
                              
                              return belongsToCurrentSupplier;
                            })
                            .map((item, index) => {
                            // Verificações de segurança adicionais para evitar erros
                            if (!item) return null;
                            
                            // Extrair os valores com fallbacks seguros
                            const productId = item?.product?.id || `produto-${index}`;
                            const productName = item?.product?.name || `Produto ${index + 1}`;
                            const salesCount = item?.count || 0;
                            const totalValue = item?.totalValue || 0;
                            const percentOfTotal = dashboardSummary.totalSales > 0 
                              ? (totalValue / dashboardSummary.totalSales * 100) 
                              : 0;
                            
                            return (
                              <div key={productId} className="flex items-center space-x-4">
                                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-medium">
                                  #{index + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{productName}</p>
                                  <div className="flex items-center text-sm text-gray-500">
                                    <span>{salesCount} vendas</span>
                                    <span className="mx-2">•</span>
                                    <span>{formatCurrency(totalValue)}</span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-semibold text-green-600">
                                    +{percentOfTotal.toFixed(1)}%
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    do total
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        : 
                          // Renderização de fallback quando topProducts não é um array
                          <div className="text-center py-4">
                            <p className="text-gray-500">Carregando produtos mais vendidos...</p>
                          </div>
                        }
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
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
      
      {/* Modal de Configurações */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Configurações do Fornecedor</DialogTitle>
            <DialogDescription>
              Ajuste as configurações da sua conta e preferências de exibição.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Notificações</h3>
              <div className="flex items-center space-x-2">
                <Checkbox id="notif-sales" />
                <label htmlFor="notif-sales" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Receber notificações de novas vendas
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="notif-messages" defaultChecked />
                <label htmlFor="notif-messages" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Receber notificações de novas mensagens
                </label>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Exibição do Dashboard</h3>
              <div className="flex items-center space-x-2">
                <Checkbox id="dashboard-sales" defaultChecked />
                <label htmlFor="dashboard-sales" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Mostrar gráfico de vendas
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="dashboard-commission" defaultChecked />
                <label htmlFor="dashboard-commission" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Mostrar gráfico de comissões
                </label>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Período padrão para relatórios</h3>
              <Select defaultValue={timeframeFilter} onValueChange={setTimeframeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o período padrão" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Última semana</SelectItem>
                  <SelectItem value="month">Último mês</SelectItem>
                  <SelectItem value="quarter">Último trimestre</SelectItem>
                  <SelectItem value="year">Último ano</SelectItem>
                  <SelectItem value="all">Todo o período</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Informações da conta</h3>
              <div className="rounded-md border p-4">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">Fornecedor: {user?.username}</p>
                  <p className="text-sm text-muted-foreground">Email: {user?.email}</p>
                  <p className="text-sm text-muted-foreground">Empresa: {user?.companyName || "Não informado"}</p>
                  <p className="text-sm text-muted-foreground">CNPJ: {user?.cnpj || "Não informado"}</p>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex items-center justify-between">
            <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => {
              toast({
                title: "Configurações salvas",
                description: "Suas preferências foram atualizadas com sucesso.",
              });
              setIsSettingsOpen(false);
            }}>
              Salvar alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal de Análise de Vendas Detalhada */}
      <Dialog open={isAnalyticsOpen} onOpenChange={setIsAnalyticsOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Análise Detalhada de Vendas</DialogTitle>
            <DialogDescription>
              Analise suas vendas e comissões no período selecionado.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Filtros e período */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-base font-medium mb-2">Período de análise</h3>
                <div className="flex space-x-2">
                  <Button 
                    variant={timeframeFilter === "week" ? "default" : "outline"} 
                    size="sm" 
                    onClick={() => setTimeframeFilter("week")}
                  >
                    Semana
                  </Button>
                  <Button 
                    variant={timeframeFilter === "month" ? "default" : "outline"} 
                    size="sm" 
                    onClick={() => setTimeframeFilter("month")}
                  >
                    Mês
                  </Button>
                  <Button 
                    variant={timeframeFilter === "quarter" ? "default" : "outline"} 
                    size="sm" 
                    onClick={() => setTimeframeFilter("quarter")}
                  >
                    Trimestre
                  </Button>
                  <Button 
                    variant={timeframeFilter === "year" ? "default" : "outline"} 
                    size="sm" 
                    onClick={() => setTimeframeFilter("year")}
                  >
                    Ano
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="bg-primary/10 rounded-lg p-3 text-center">
                  <p className="text-sm text-gray-600">Total de Vendas</p>
                  <p className="text-xl font-bold">{dashboardSummary.totalOrders || 0}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-sm text-gray-600">Faturamento</p>
                  <p className="text-xl font-bold">{formatCurrency(dashboardSummary.totalSales)}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-sm text-gray-600">Líquido</p>
                  <p className="text-xl font-bold">{formatCurrency(dashboardSummary.netRevenue)}</p>
                </div>
              </div>
            </div>
            
            {/* Gráfico de vendas */}
            <div>
              <h3 className="text-base font-medium mb-2">Evolução de vendas e comissões</h3>
              <div className="h-[300px] bg-white rounded-lg p-4 border">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={salesData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => formatCurrency(Number(value))} 
                      labelFormatter={(label) => `Período: ${label}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="vendas"
                      stackId="1"
                      name="Vendas"
                      stroke="#4f46e5"
                      fill="#4f46e580"
                    />
                    <Area
                      type="monotone"
                      dataKey="comissao"
                      stackId="2"
                      name="Comissão"
                      stroke="#f59e0b"
                      fill="#f59e0b80"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Lista de vendas recentes */}
            <div>
              <h3 className="text-base font-medium mb-2">Vendas recentes</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Produto
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Comissão
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {isLoadingDashboard ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center">
                          <Loading />
                        </td>
                      </tr>
                    ) : !recentSales || recentSales.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                          Não há vendas no período selecionado.
                        </td>
                      </tr>
                    ) : (
                      recentSales.slice(0, 10).map((sale) => {
                        // Garantir que products é um array antes de usar find
                        let product;
                        if (Array.isArray(products)) {
                          product = products.find(p => p && typeof p === 'object' && p.id === sale.productId);
                        } else if (products && typeof products === 'object' && Array.isArray(products.data)) {
                          product = products.data.find(p => p && typeof p === 'object' && p.id === sale.productId);
                        }
                        return (
                          <tr key={sale.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full overflow-hidden">
                                  <img 
                                    src={product?.imageUrl || "https://via.placeholder.com/40"} 
                                    alt={product?.name || "Produto"}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {product?.name || `Produto #${sale.productId}`}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    Qtd: {sale.quantity || 1}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {new Date(sale.createdAt).toLocaleDateString('pt-BR')}
                              </div>
                              <div className="text-sm text-gray-500">
                                {new Date(sale.createdAt).toLocaleTimeString('pt-BR')}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-semibold text-gray-900">
                                {formatCurrency(Number(sale.totalPrice))}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {formatCurrency(Number(sale.commissionAmount))}
                              </div>
                              <div className="text-xs text-gray-500">
                                ({sale.commissionRate}%)
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                sale.status === "completed" 
                                  ? "bg-green-100 text-green-800" 
                                  : sale.status === "pending" 
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}>
                                {sale.status === "completed" 
                                  ? "Concluída" 
                                  : sale.status === "pending" 
                                  ? "Pendente"
                                  : sale.status || "Processando"}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Análise por categoria */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-base font-medium mb-2">Vendas por categoria</h3>
                <div className="bg-white rounded-lg p-4 border h-[300px]">
                  {isLoadingDashboard || !categories ? (
                    <div className="flex items-center justify-center h-full">
                      <Loading />
                    </div>
                  ) : !recentSales || recentSales.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-500">Não há dados suficientes para análise.</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={(() => {
                          try {
                            // Verificar se os arrays necessários existem
                            if (!Array.isArray(recentSales) || recentSales.length === 0) {
                              console.log("Sem vendas recentes para exibir no gráfico");
                              return [];
                            }
                            
                            // Verificar e normalizar o formato de products
                            let productsArray = [];
                            if (Array.isArray(products)) {
                              productsArray = products;
                            } else if (products && typeof products === 'object' && Array.isArray(products.data)) {
                              productsArray = products.data;
                            } else {
                              console.log("Dados de produtos não disponíveis em formato válido");
                              return [];
                            }
                            
                            if (!Array.isArray(categories)) {
                              console.log("Dados de categorias não disponíveis");
                              return [];
                            }
                            
                            // Usar reduce com validações em cada etapa
                            const categorySales = recentSales.reduce((acc, sale) => {
                              // Verificar se venda é um objeto válido com propriedades necessárias
                              if (!sale || typeof sale !== 'object' || !sale.productId || !sale.totalPrice) {
                                return acc;
                              }
                              
                              // Buscar produto com verificação de tipo usando a variável productsArray normalizada
                              const product = productsArray.find(p => p && typeof p === 'object' && p.id === sale.productId);
                              if (!product || !product.categoryId) return acc;
                              
                              // Buscar categoria com verificação de tipo
                              const category = categories.find(c => c && typeof c === 'object' && c.id === product.categoryId);
                              if (!category || !category.name) return acc;
                              
                              const categoryName = category.name;
                              
                              // Inicializar categoria se não existir
                              if (!acc[categoryName]) {
                                acc[categoryName] = {
                                  name: categoryName,
                                  value: 0,
                                  count: 0
                                };
                              }
                              
                              // Converter valor com segurança
                              const saleValue = typeof sale.totalPrice === 'string' 
                                ? parseFloat(sale.totalPrice) || 0 
                                : Number(sale.totalPrice) || 0;
                              
                              // Acumular valores
                              acc[categoryName].value += saleValue;
                              acc[categoryName].count += 1;
                              
                              return acc;
                            }, {} as Record<string, { name: string, value: number, count: number }>);
                            
                            // Converter para array
                            return Object.values(categorySales);
                          } catch (error) {
                            console.error("Erro ao processar dados para o gráfico de categorias:", error);
                            return [];
                          }
                        })()}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value) => formatCurrency(Number(value))} 
                        />
                        <Area
                          type="monotone"
                          dataKey="value"
                          name="Valor"
                          stroke="#4f46e5"
                          fill="#4f46e580"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-base font-medium mb-2">Desempenho de produtos</h3>
                <div className="bg-white rounded-lg p-4 border h-[300px] overflow-y-auto">
                  {isLoadingDashboard ? (
                    <div className="flex items-center justify-center h-full">
                      <Loading />
                    </div>
                  ) : !productPerformance || productPerformance.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-500">Não há dados suficientes para análise.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {productPerformance.map((item, index) => (
                        <div key={item?.product?.id || index} className="flex items-center space-x-4">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-medium">
                            #{index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{item?.product?.name}</p>
                            <div className="flex items-center text-sm text-gray-500">
                              <span>{item?.count || 0} vendas</span>
                              <span className="mx-2">•</span>
                              <span>{formatCurrency(item?.totalValue || 0)}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-green-600">
                              +{(item?.totalValue / (dashboardSummary?.totalSales || 1) * 100 || 0).toFixed(1)}%
                            </div>
                            <div className="text-xs text-gray-500">
                              do total
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setIsAnalyticsOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal de Configurações do Fornecedor */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Configurações do Fornecedor</DialogTitle>
            <DialogDescription>
              Ajuste as configurações da sua conta e preferências de exibição.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Notificações</h3>
              <div className="flex items-center space-x-2">
                <Checkbox id="notif-sales" />
                <label htmlFor="notif-sales" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Receber notificações de novas vendas
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="notif-messages" defaultChecked />
                <label htmlFor="notif-messages" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Receber notificações de novas mensagens
                </label>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Exibição do Dashboard</h3>
              <div className="flex items-center space-x-2">
                <Checkbox id="dashboard-sales" defaultChecked />
                <label htmlFor="dashboard-sales" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Mostrar gráfico de vendas
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="dashboard-commission" defaultChecked />
                <label htmlFor="dashboard-commission" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Mostrar gráfico de comissões
                </label>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Período padrão para relatórios</h3>
              <div className="flex space-x-2">
                <Button 
                  variant={timeframeFilter === "week" ? "default" : "outline"} 
                  size="sm" 
                  onClick={() => setTimeframeFilter("week")}
                >
                  Semana
                </Button>
                <Button 
                  variant={timeframeFilter === "month" ? "default" : "outline"} 
                  size="sm" 
                  onClick={() => setTimeframeFilter("month")}
                >
                  Mês
                </Button>
                <Button 
                  variant={timeframeFilter === "quarter" ? "default" : "outline"} 
                  size="sm" 
                  onClick={() => setTimeframeFilter("quarter")}
                >
                  Trimestre
                </Button>
                <Button 
                  variant={timeframeFilter === "year" ? "default" : "outline"} 
                  size="sm" 
                  onClick={() => setTimeframeFilter("year")}
                >
                  Ano
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Informações da conta</h3>
              <div className="rounded-md border p-4">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">Fornecedor: {user?.username}</p>
                  <p className="text-sm text-muted-foreground">Email: {user?.email}</p>
                  <p className="text-sm text-muted-foreground">Empresa: {user?.companyName || "Não informado"}</p>
                  <p className="text-sm text-muted-foreground">CNPJ: {user?.cnpj || "Não informado"}</p>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex items-center justify-between">
            <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => {
              toast({
                title: "Configurações salvas",
                description: "Suas preferências foram atualizadas com sucesso.",
              });
              setIsSettingsOpen(false);
            }}>
              Salvar alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
