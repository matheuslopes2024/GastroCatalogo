import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';
import { AlertTriangle, Package, ChevronRight, RefreshCw } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { Product } from '@shared/schema';

interface LowStockAlertProps {
  supplierId: number;
}

export default function LowStockAlert({ supplierId }: LowStockAlertProps) {
  const { toast } = useToast();
  const [refreshing, setRefreshing] = useState(false);

  // Buscar produtos com estoque baixo
  const { 
    data: lowStockProducts, 
    isLoading, 
    isError, 
    error, 
    refetch 
  } = useQuery<Product[]>({
    queryKey: ['/api/supplier/products/low-stock', supplierId],
    enabled: !!supplierId,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
      toast({
        title: 'Alertas atualizados',
        description: 'A lista de produtos com estoque baixo foi atualizada.',
      });
    } catch (err) {
      toast({
        title: 'Erro ao atualizar',
        description: 'Não foi possível atualizar a lista de produtos com estoque baixo.',
        variant: 'destructive',
      });
    } finally {
      setRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-amber-500" />
            <Skeleton className="h-6 w-40" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-full mt-2" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between items-center">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-500">Erro ao carregar alertas</CardTitle>
          <CardDescription>
            {error instanceof Error ? error.message : 'Ocorreu um erro ao buscar produtos com estoque baixo.'}
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            Tentar novamente
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Se não há produtos com estoque baixo
  if (!lowStockProducts || lowStockProducts.length === 0) {
    return (
      <Card className="border-green-100">
        <CardHeader>
          <CardTitle className="flex items-center text-green-600">
            <Package className="w-5 h-5 mr-2" />
            Estoque em dia
          </CardTitle>
          <CardDescription>
            Nenhum produto está com estoque abaixo do limite mínimo.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Atualizando...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Atualizar
              </>
            )}
          </Button>
          <Link href="/supplier/products">
            <Button variant="ghost" size="sm">
              Ver todos produtos
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="border-amber-200">
      <CardHeader>
        <CardTitle className="flex items-center text-amber-600">
          <AlertTriangle className="w-5 h-5 mr-2" />
          Alertas de Estoque Baixo
        </CardTitle>
        <CardDescription>
          Produtos que estão com estoque abaixo do limite mínimo definido.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {lowStockProducts.slice(0, 5).map((product) => (
            <div key={product.id} className="flex justify-between items-center">
              <div>
                <Link href={`/supplier/products/edit/${product.id}`}>
                  <span className="font-medium hover:underline cursor-pointer">{product.name}</span>
                </Link>
                {product.stock === 0 && (
                  <Badge variant="destructive" className="ml-2">Esgotado</Badge>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <span className={`font-medium ${product.stock === 0 ? 'text-red-600' : 'text-amber-600'}`}>
                  {product.stock ?? 0}/{product.lowStockThreshold ?? 10}
                </span>
                <Link href={`/supplier/products/edit/${product.id}`}>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
          
          {lowStockProducts.length > 5 && (
            <div className="pt-2 border-t border-border">
              <Link href="/supplier/products?filter=low-stock">
                <Button variant="ghost" size="sm" className="w-full justify-between">
                  Ver todos ({lowStockProducts.length})
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={refreshing}
          className="w-full"
        >
          {refreshing ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Atualizando...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Atualizar alertas
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}