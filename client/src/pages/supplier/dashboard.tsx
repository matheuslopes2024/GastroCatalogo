import { useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/hooks/use-auth";
import { UserRole } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { Package, DollarSign, TrendingUp, Users, Plus, BarChart } from "lucide-react";
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
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold mb-4">Painel do Fornecedor</h2>
      <nav className="space-y-2">
        <Link href="/fornecedor">
          <a className="flex items-center text-primary p-2 rounded-md bg-primary/10 font-medium">
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
          <a className="flex items-center text-gray-700 hover:text-primary p-2 rounded-md hover:bg-gray-50 font-medium">
            <DollarSign className="mr-2 h-5 w-5" />
            Vendas e Comissões
          </a>
        </Link>
      </nav>
    </div>
  );
}

export default function SupplierDashboard() {
  const { user } = useAuth();
  
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
  
  // Sample chart data - in a real implementation, this would be derived from the sales data
  const salesData = [
    { month: 'Jan', vendas: 4000, comissao: 240 },
    { month: 'Fev', vendas: 3000, comissao: 180 },
    { month: 'Mar', vendas: 5000, comissao: 300 },
    { month: 'Abr', vendas: 2780, comissao: 167 },
    { month: 'Mai', vendas: 1890, comissao: 113 },
    { month: 'Jun', vendas: 2390, comissao: 143 },
    { month: 'Jul', vendas: 3490, comissao: 209 },
  ];
  
  // Calculate earnings
  const totalSales = sales?.reduce((acc, sale) => acc + Number(sale.totalPrice), 0) || 0;
  const totalCommission = sales?.reduce((acc, sale) => acc + Number(sale.commissionAmount), 0) || 0;
  const netEarnings = totalSales - totalCommission;
  
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
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
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
