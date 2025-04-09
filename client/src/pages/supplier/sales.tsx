import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/hooks/use-auth";
import { Product, Sale } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { BarChart, Package, DollarSign, Download, Calendar } from "lucide-react";
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

// Dashboard sidebar with links to other supplier pages
function SupplierSidebar() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold mb-4">Painel do Fornecedor</h2>
      <nav className="space-y-2">
        <Link href="/fornecedor">
          <a className="flex items-center text-gray-700 hover:text-primary p-2 rounded-md hover:bg-gray-50 font-medium">
            <BarChart className="mr-2 h-5 w-5" />
            Dashboard
          </a>
        </Link>
        <Link href="/fornecedor/produtos">
          <a className="flex items-center text-gray-700 hover:text-primary p-2 rounded-md hover:bg-gray-50 font-medium">
            <Package className="mr-2 h-5 w-5" />
            Meus Produtos
          </a>
        </Link>
        <Link href="/fornecedor/vendas">
          <a className="flex items-center text-primary p-2 rounded-md bg-primary/10 font-medium">
            <DollarSign className="mr-2 h-5 w-5" />
            Vendas e Comissões
          </a>
        </Link>
      </nav>
    </div>
  );
}

export default function SupplierSales() {
  const { user } = useAuth();
  const [period, setPeriod] = useState("all");
  
  // Fetch supplier sales
  const { data: sales, isLoading: isLoadingSales } = useQuery<Sale[]>({
    queryKey: ["/api/sales", { supplierId: user?.id }],
    enabled: !!user?.id,
  });
  
  // Fetch supplier products for mapping product names
  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products", { supplierId: user?.id }],
    enabled: !!user?.id,
  });
  
  // Calculate earnings
  const totalSales = sales?.reduce((acc, sale) => acc + Number(sale.totalPrice), 0) || 0;
  const totalCommission = sales?.reduce((acc, sale) => acc + Number(sale.commissionAmount), 0) || 0;
  const netEarnings = totalSales - totalCommission;
  
  // Format currency
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };
  
  // Format date
  const formatDate = (dateString: Date) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };
  
  // Filter sales by period if needed
  const filteredSales = sales ? [...sales] : [];
  if (period !== "all" && filteredSales.length > 0) {
    const today = new Date();
    const periodStartDate = new Date();
    
    switch(period) {
      case "week":
        periodStartDate.setDate(today.getDate() - 7);
        break;
      case "month":
        periodStartDate.setMonth(today.getMonth() - 1);
        break;
      case "quarter":
        periodStartDate.setMonth(today.getMonth() - 3);
        break;
      case "year":
        periodStartDate.setFullYear(today.getFullYear() - 1);
        break;
    }
    
    filteredSales.filter(sale => new Date(sale.createdAt) >= periodStartDate);
  }
  
  // Get product name by ID
  const getProductName = (productId: number) => {
    return products?.find(p => p.id === productId)?.name || `Produto ${productId}`;
  };
  
  // Data for sales by product chart
  const salesByProduct = products?.map(product => {
    const productSales = sales?.filter(sale => sale.productId === product.id) || [];
    const total = productSales.reduce((acc, sale) => acc + Number(sale.totalPrice), 0);
    
    return {
      name: product.name,
      value: total
    };
  }).filter(item => item.value > 0) || [];
  
  // Data for monthly sales chart
  const getMonthlyData = () => {
    if (!sales || sales.length === 0) return [];
    
    const monthlyData = new Map();
    
    sales.forEach(sale => {
      const date = new Date(sale.createdAt);
      const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
      
      if (!monthlyData.has(monthYear)) {
        monthlyData.set(monthYear, {
          month: monthYear,
          vendas: 0,
          comissao: 0
        });
      }
      
      const entry = monthlyData.get(monthYear);
      entry.vendas += Number(sale.totalPrice);
      entry.comissao += Number(sale.commissionAmount);
    });
    
    return Array.from(monthlyData.values()).sort((a, b) => {
      const [aMonth, aYear] = a.month.split('/').map(Number);
      const [bMonth, bYear] = b.month.split('/').map(Number);
      
      if (aYear !== bYear) return aYear - bYear;
      return aMonth - bMonth;
    });
  };
  
  const monthlyData = getMonthlyData();
  
  // Colors for the pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#FF5A60'];

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
              <SupplierSidebar />
              
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
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="week">Última semana</SelectItem>
                          <SelectItem value="month">Último mês</SelectItem>
                          <SelectItem value="quarter">Último trimestre</SelectItem>
                          <SelectItem value="year">Último ano</SelectItem>
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
                      {isLoadingSales ? (
                        <Loading />
                      ) : (
                        <>
                          <h3 className="text-2xl font-bold">{formatCurrency(totalSales)}</h3>
                          <p className="text-xs text-gray-500">
                            {filteredSales.length} {filteredSales.length === 1 ? 'venda' : 'vendas'} realizadas
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
                      {isLoadingSales ? (
                        <Loading />
                      ) : (
                        <>
                          <h3 className="text-2xl font-bold">{formatCurrency(totalCommission)}</h3>
                          <p className="text-xs text-gray-500">
                            Taxa média: {((totalCommission / totalSales) * 100).toFixed(1)}%
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
                      {isLoadingSales ? (
                        <Loading />
                      ) : (
                        <>
                          <h3 className="text-2xl font-bold">{formatCurrency(netEarnings)}</h3>
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
                    {isLoadingSales ? (
                      <Loading />
                    ) : salesByProduct.length === 0 ? (
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
                    {isLoadingSales ? (
                      <Loading />
                    ) : monthlyData.length === 0 ? (
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
                    Lista de todas as suas vendas na plataforma
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingSales ? (
                    <Loading />
                  ) : !filteredSales || filteredSales.length === 0 ? (
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
                          {filteredSales.map((sale) => {
                            const totalValue = Number(sale.totalPrice);
                            const commission = Number(sale.commissionAmount);
                            const net = totalValue - commission;
                            
                            return (
                              <tr key={sale.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {formatDate(sale.createdAt)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">
                                    {getProductName(sale.productId)}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    ID: {sale.productId}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {formatCurrency(totalValue)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-red-500">
                                  -{formatCurrency(commission)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                                  {formatCurrency(net)}
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
