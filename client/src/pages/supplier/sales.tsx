import { useState, useMemo } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/hooks/use-auth";
import { Product, Sale, UserRole } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { BarChart, Package, DollarSign, Download, Calendar, Percent } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip as RechartsTooltip,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { SupplierSidebar } from "@/components/supplier/supplier-sidebar";
import { formatCurrency } from "@/lib/utils";

export default function SupplierSales() {
  const { user } = useAuth();
  const [period, setPeriod] = useState("month");
  
  // Buscar o resumo de vendas do fornecedor usando a API real
  const { 
    data: dashboardData, 
    isLoading: isLoadingDashboard, 
    error: dashboardError 
  } = useQuery({
    queryKey: ["/api/supplier/dashboard/sales-summary", { period }],
    enabled: !!user?.id && user?.role === UserRole.SUPPLIER,
  });
  
  // Buscar produtos populares do fornecedor usando a API real
  const {
    data: topProductsData,
    isLoading: isLoadingTopProducts
  } = useQuery({
    queryKey: ["/api/supplier/dashboard/top-products"],
    enabled: !!user?.id && user?.role === UserRole.SUPPLIER,
  });
  
  // Buscar produtos do fornecedor para referência
  const { data: products, isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ["/api/products", { supplierId: user?.id }],
    enabled: !!user?.id,
  });
  
  // Extrair métricas do dashboard
  const dashboardSummary = useMemo(() => {
    if (isLoadingDashboard || !dashboardData || !dashboardData.summary) {
      return {
        totalSales: 0,
        totalOrders: 0,
        totalRevenue: 0,
        totalCommission: 0,
        netRevenue: 0,
        avgCommissionRate: "0.00"
      };
    }
    
    const { totalSales, totalRevenue, totalCommission, netRevenue } = dashboardData.summary;
    
    // Calcular taxa média de comissão
    const avgCommissionRate = totalRevenue > 0
      ? (totalCommission / totalRevenue * 100).toFixed(2)
      : "0.00";
      
    return {
      totalOrders: totalSales,
      totalSales: totalRevenue,
      totalCommission,
      netRevenue,
      avgCommissionRate
    };
  }, [dashboardData, isLoadingDashboard]);
  
  // Preparar dados para o gráfico de vendas por produto
  const salesByProduct = useMemo(() => {
    if (!topProductsData || !topProductsData.topProducts) return [];
    
    return topProductsData.topProducts
      .filter(product => product.totalRevenue > 0)
      .map(product => ({
        name: product.name,
        value: Number(product.totalRevenue)
      }));
  }, [topProductsData]);
  
  // Preparar dados para o gráfico de vendas mensais
  const monthlyData = useMemo(() => {
    if (!dashboardData || !dashboardData.salesChartData) return [];
    
    return dashboardData.salesChartData.map(item => ({
      month: item.date,
      vendas: Number(item.receita),
      comissao: Number(item.comissao)
    }));
  }, [dashboardData]);
  
  // Extrair vendas recentes para a tabela
  const recentSales = useMemo(() => {
    if (!dashboardData || !dashboardData.recentSales) return [];
    
    return dashboardData.recentSales;
  }, [dashboardData]);
  
  // Função para formatar datas
  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };
  
  // Obter o nome do produto pelo ID
  const getProductName = (productId: number) => {
    if (topProductsData?.topProducts) {
      const product = topProductsData.topProducts.find(p => p.productId === productId);
      if (product) return product.name;
    }
    
    if (products) {
      const product = products.find(p => p.id === productId);
      if (product) return product.name;
    }
    
    return `Produto ${productId}`;
  };
  
  // Cores para o gráfico de pizza
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#FF5A60'];
  
  // Define se há dados para mostrar
  const hasData = !!(dashboardData && dashboardData.summary && dashboardData.summary.totalSales > 0);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow bg-gray-100 py-8">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Vendas e Comissões</h1>
            <p className="text-gray-600">
              Acompanhe suas vendas e comissões na plataforma.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="md:col-span-1">
              <SupplierSidebar activeItem="vendas" />
              
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Filtros</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Período
                      </label>
                      <Select
                        value={period}
                        onValueChange={setPeriod}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um período" />
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
                    
                    <Button className="w-full" variant="outline">
                      <Calendar className="mr-2 h-4 w-4" />
                      Período personalizado
                    </Button>
                    
                    <Button className="w-full" variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      Exportar relatório
                    </Button>
                    
                    <Button className="w-full" variant="outline" asChild>
                      <Link href="/fornecedor/comissoes">
                        <Percent className="mr-2 h-4 w-4" />
                        Detalhes de Comissões
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Main Content */}
            <div className="md:col-span-3 space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-500">Vendas Totais</p>
                      {isLoadingDashboard ? (
                        <Loading />
                      ) : (
                        <>
                          <h3 className="text-2xl font-bold">{formatCurrency(dashboardSummary.totalSales)}</h3>
                          <p className="text-xs text-gray-500">
                            {dashboardSummary.totalOrders} {dashboardSummary.totalOrders === 1 ? 'venda' : 'vendas'} realizadas
                          </p>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-500">Comissões</p>
                      {isLoadingDashboard ? (
                        <Loading />
                      ) : (
                        <>
                          <h3 className="text-2xl font-bold">{formatCurrency(dashboardSummary.totalCommission)}</h3>
                          <p className="text-xs text-gray-500">
                            Taxa média: {dashboardSummary.avgCommissionRate}%
                          </p>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-500">Receita Líquida</p>
                      {isLoadingDashboard ? (
                        <Loading />
                      ) : (
                        <>
                          <h3 className="text-2xl font-bold">{formatCurrency(dashboardSummary.netRevenue)}</h3>
                          <p className="text-xs text-gray-500">
                            Após descontar comissão
                          </p>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sales by Product Chart */}
                <Card className="h-[400px]">
                  <CardHeader>
                    <CardTitle>Vendas por Produto</CardTitle>
                    <CardDescription>
                      Distribuição de vendas por produto
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingDashboard || isLoadingTopProducts ? (
                      <Loading />
                    ) : !hasData || salesByProduct.length === 0 ? (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-gray-500">Nenhuma venda registrada ainda</p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={salesByProduct}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {salesByProduct.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Legend />
                          <RechartsTooltip formatter={(value) => formatCurrency(Number(value))} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
                
                {/* Monthly Sales Chart */}
                <Card className="h-[400px]">
                  <CardHeader>
                    <CardTitle>Vendas Mensais</CardTitle>
                    <CardDescription>
                      Vendas e comissões por mês
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingDashboard ? (
                      <Loading />
                    ) : !hasData || monthlyData.length === 0 ? (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-gray-500">Nenhuma venda registrada ainda</p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={250}>
                        <RechartsBarChart data={monthlyData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <RechartsTooltip formatter={(value) => formatCurrency(Number(value))} />
                          <Legend />
                          <Bar dataKey="vendas" name="Vendas" fill="#007BFF" />
                          <Bar dataKey="comissao" name="Comissão" fill="#FF5A60" />
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              {/* Sales Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Vendas</CardTitle>
                  <CardDescription>
                    Lista de suas vendas recentes na plataforma
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingDashboard ? (
                    <Loading />
                  ) : !hasData || !recentSales || recentSales.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-4">
                        Nenhuma venda registrada neste período.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Data
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Produto
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Valor
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Comissão
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Líquido
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {recentSales.map((sale: any) => {
                            const commissionValue = Number(sale.commissionAmount);
                            const saleValue = Number(sale.totalPrice);
                            const netValue = saleValue - commissionValue;
                            
                            return (
                              <tr key={sale.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {formatDate(sale.createdAt)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">
                                    {getProductName(sale.productId)}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {formatCurrency(saleValue)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {formatCurrency(commissionValue)}
                                  <span className="text-xs text-gray-400 ml-1">
                                    ({Number(sale.commissionRate)}%)
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                  {formatCurrency(netValue)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
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