import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/hooks/use-auth";
import { User, UserRole, Sale, Product } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { BarChart, Users, DollarSign, Settings, Package, Grid, Tags, Percent } from "lucide-react";
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
        <Link href="/admin">
          <a className="flex items-center text-primary p-2 rounded-md bg-primary/10 font-medium">
            <BarChart className="mr-2 h-5 w-5" />
            Dashboard
          </a>
        </Link>
        <Link href="/admin/fornecedores">
          <a className="flex items-center text-gray-700 hover:text-primary p-2 rounded-md hover:bg-gray-50 font-medium">
            <Users className="mr-2 h-5 w-5" />
            Fornecedores
          </a>
        </Link>
        <Link href="/admin/comissoes">
          <a className="flex items-center text-gray-700 hover:text-primary p-2 rounded-md hover:bg-gray-50 font-medium">
            <Percent className="mr-2 h-5 w-5" />
            Comissões
          </a>
        </Link>
        <Link href="/admin/categorias">
          <a className="flex items-center text-gray-700 hover:text-primary p-2 rounded-md hover:bg-gray-50 font-medium">
            <Tags className="mr-2 h-5 w-5" />
            Categorias
          </a>
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
  const { data: products, isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });
  
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
                      <Link href="/admin/fornecedores">
                        <Button variant="outline" className="w-full">
                          Acessar
                        </Button>
                      </Link>
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
                      <Link href="/admin/comissoes">
                        <Button variant="outline" className="w-full">
                          Acessar
                        </Button>
                      </Link>
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
                      <Link href="/admin/categorias">
                        <Button variant="outline" className="w-full">
                          Acessar
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
