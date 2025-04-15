import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { UserRole } from "@shared/schema";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Package, 
  Layers,
  AlertTriangle,
  XCircle,
  DollarSign
} from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { useToast } from "@/hooks/use-toast";

// Interface para os dados de estatísticas de estoque
interface StockStatusData {
  totalProducts: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
  totalValue: number;
}

interface StockStatusSummaryProps {
  className?: string;
}

export const StockStatusSummary: React.FC<StockStatusSummaryProps> = ({ className }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Buscar estatísticas de estoque do fornecedor
  const {
    data: stockData,
    isLoading,
    error,
    refetch
  } = useQuery<StockStatusData>({
    queryKey: ["/api/supplier/inventory/stats"],
    enabled: !!user?.id && user?.role === UserRole.SUPPLIER,
    staleTime: 60 * 1000, // 1 minuto
    onError: (error: Error) => {
      console.error("Erro ao buscar estatísticas de estoque:", error);
      toast({
        title: "Erro ao carregar dados de estoque",
        description: "Não foi possível carregar as estatísticas de estoque. Por favor, tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  });

  // Formatar valores monetários no formato brasileiro
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };
  
  // Exibir loading durante carregamento
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-xl font-bold">Situação do Estoque</CardTitle>
          <CardDescription>Carregando estatísticas de inventário...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-10">
          <Loading />
        </CardContent>
      </Card>
    );
  }

  // Se ocorreu um erro, mostrar mensagem amigável
  if (error || !stockData) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-xl font-bold">Situação do Estoque</CardTitle>
          <CardDescription>Estatísticas de inventário</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <p>Não foi possível carregar os dados de estoque.</p>
            <button 
              onClick={() => refetch()} 
              className="mt-4 text-primary hover:underline"
            >
              Tentar novamente
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calcular porcentagens
  const totalProducts = stockData.totalProducts || 0;
  const inStockPercent = totalProducts > 0 ? Math.round((stockData.inStock / totalProducts) * 100) : 0;
  const lowStockPercent = totalProducts > 0 ? Math.round((stockData.lowStock / totalProducts) * 100) : 0;
  const outOfStockPercent = totalProducts > 0 ? Math.round((stockData.outOfStock / totalProducts) * 100) : 0;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <Package className="h-5 w-5" />
          Situação do Estoque
        </CardTitle>
        <CardDescription>Estatísticas em tempo real do seu inventário</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {/* Total de Produtos */}
          <div className="bg-gray-50 rounded-lg p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">Total de Produtos</h3>
              <Package className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-2xl font-bold mt-2">{stockData.totalProducts}</p>
            <p className="text-xs text-gray-500 mt-1">Produtos cadastrados</p>
          </div>
          
          {/* Produtos em Estoque */}
          <div className="bg-green-50 rounded-lg p-4 shadow-sm border border-green-100">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-green-500">Em Estoque</h3>
              <Layers className="h-5 w-5 text-green-400" />
            </div>
            <p className="text-2xl font-bold mt-2 text-green-700">{stockData.inStock}</p>
            <p className="text-xs text-green-600 mt-1">{inStockPercent}% do catálogo</p>
          </div>
          
          {/* Produtos com Estoque Baixo */}
          <div className="bg-amber-50 rounded-lg p-4 shadow-sm border border-amber-100">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-amber-500">Estoque Baixo</h3>
              <AlertTriangle className="h-5 w-5 text-amber-400" />
            </div>
            <p className="text-2xl font-bold mt-2 text-amber-700">{stockData.lowStock}</p>
            <p className="text-xs text-amber-600 mt-1">{lowStockPercent}% do catálogo</p>
          </div>
          
          {/* Produtos Sem Estoque */}
          <div className="bg-red-50 rounded-lg p-4 shadow-sm border border-red-100">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-red-500">Sem Estoque</h3>
              <XCircle className="h-5 w-5 text-red-400" />
            </div>
            <p className="text-2xl font-bold mt-2 text-red-700">{stockData.outOfStock}</p>
            <p className="text-xs text-red-600 mt-1">{outOfStockPercent}% do catálogo</p>
          </div>
          
          {/* Valor Total do Estoque */}
          <div className="bg-blue-50 rounded-lg p-4 shadow-sm border border-blue-100 md:col-span-2 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-blue-500">Valor do Estoque</h3>
              <DollarSign className="h-5 w-5 text-blue-400" />
            </div>
            <p className="text-2xl font-bold mt-2 text-blue-700">{formatCurrency(stockData.totalValue)}</p>
            <p className="text-xs text-blue-600 mt-1">Valor total do inventário</p>
          </div>
        </div>
        
        <div className="mt-4 text-sm text-muted-foreground">
          <p className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-1"></span>
            Em estoque: {inStockPercent}%
          </p>
          <p className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-full bg-amber-500 mr-1"></span>
            Estoque baixo: {lowStockPercent}%
          </p>
          <p className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-1"></span>
            Sem estoque: {outOfStockPercent}%
          </p>
        </div>
      </CardContent>
    </Card>
  );
};