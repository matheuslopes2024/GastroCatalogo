import React, { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

import {
  AlertTriangle,
  CheckCircle,
  Edit,
  Save,
  Loader2,
  RefreshCcw,
  AlertCircle,
  Package,
} from "lucide-react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type LowStockProduct = {
  id: number;
  name: string;
  stock: number;
  stockThreshold: number;
  stockPercentage: number;
  alert: 'critical' | 'warning';
  categoryName?: string;
  price: string;
};

export function StockAlert() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [bulkStock, setBulkStock] = useState<string>("");
  const [bulkThreshold, setBulkThreshold] = useState<string>("");
  const [bulkUpdateMode, setBulkUpdateMode] = useState(false);

  // Obter produtos com estoque baixo
  const { 
    data: lowStockProducts = [], 
    isLoading, 
    isError, 
    refetch 
  } = useQuery({
    queryKey: ['/api/supplier/dashboard/low-stock-products'],
    refetchOnWindowFocus: false,
  });

  // Mutação para atualização em massa dos produtos
  const updateMutation = useMutation({
    mutationFn: async (data: { 
      productIds: number[]; 
      updateData: { stock?: number; stockThreshold?: number } 
    }) => {
      const response = await apiRequest(
        "POST", 
        "/api/supplier/products/bulk-update", 
        data
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Produtos atualizados",
        description: "Os produtos foram atualizados com sucesso.",
        variant: "default",
      });
      
      // Limpar seleção e campos
      setSelectedProducts([]);
      setBulkStock("");
      setBulkThreshold("");
      setBulkUpdateMode(false);
      
      // Invalidar consultas para recarregar dados
      queryClient.invalidateQueries({ queryKey: ['/api/supplier/dashboard/low-stock-products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/supplier/products'] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar produtos",
        description: "Ocorreu um erro ao atualizar os produtos. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Manipulador para selecionar/deselecionar todos os produtos
  const handleSelectAll = () => {
    if (selectedProducts.length === lowStockProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(lowStockProducts.map((product: LowStockProduct) => product.id));
    }
  };

  // Manipulador para selecionar/deselecionar um produto
  const handleSelectProduct = (productId: number) => {
    if (selectedProducts.includes(productId)) {
      setSelectedProducts(selectedProducts.filter(id => id !== productId));
    } else {
      setSelectedProducts([...selectedProducts, productId]);
    }
  };

  // Manipulador para atualizar produtos em massa
  const handleBulkUpdate = async () => {
    if (selectedProducts.length === 0) {
      toast({
        title: "Nenhum produto selecionado",
        description: "Selecione pelo menos um produto para atualizar.",
        variant: "destructive",
      });
      return;
    }

    const updateData: { stock?: number; stockThreshold?: number } = {};
    
    if (bulkStock && !isNaN(Number(bulkStock))) {
      updateData.stock = Number(bulkStock);
    }
    
    if (bulkThreshold && !isNaN(Number(bulkThreshold))) {
      updateData.stockThreshold = Number(bulkThreshold);
    }
    
    if (Object.keys(updateData).length === 0) {
      toast({
        title: "Dados de atualização inválidos",
        description: "Informe o estoque ou o limite de alerta para continuar.",
        variant: "destructive",
      });
      return;
    }

    updateMutation.mutate({
      productIds: selectedProducts,
      updateData
    });
  };

  // Formatação do progresso do estoque
  const getProgressColor = (percentage: number): string => {
    if (percentage <= 20) return "bg-red-500";
    if (percentage <= 50) return "bg-amber-500";
    return "bg-emerald-500";
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Verificando estoque
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Erro ao verificar estoque
          </CardTitle>
          <CardDescription>
            Não foi possível obter informações sobre produtos com estoque baixo.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (lowStockProducts.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-500" />
            Estoque adequado
          </CardTitle>
          <CardDescription>
            Todos os seus produtos estão com níveis de estoque adequados.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Package className="h-16 w-16 text-muted-foreground/30" />
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={() => refetch()}>
            Verificar novamente
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Produtos com estoque baixo
        </CardTitle>
        <CardDescription>
          {lowStockProducts.length} produtos estão com estoque abaixo do limite recomendado
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
              >
                {selectedProducts.length === lowStockProducts.length
                  ? "Desmarcar todos"
                  : "Selecionar todos"}
              </Button>
              
              {selectedProducts.length > 0 && (
                <Badge variant="secondary">
                  {selectedProducts.length} selecionados
                </Badge>
              )}
            </div>
            
            <Button
              variant={bulkUpdateMode ? "default" : "outline"}
              size="sm"
              onClick={() => setBulkUpdateMode(!bulkUpdateMode)}
            >
              {bulkUpdateMode ? "Cancelar" : "Atualização em lote"}
            </Button>
          </div>

          {bulkUpdateMode && selectedProducts.length > 0 && (
            <div className={cn(
              "p-4 border rounded-md bg-muted/30 space-y-3",
              selectedProducts.length === 0 && "opacity-50 pointer-events-none"
            )}>
              <h4 className="font-medium">Atualização em lote ({selectedProducts.length} produtos)</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bulk-stock">Novo estoque</Label>
                  <Input
                    id="bulk-stock"
                    type="number"
                    min="0"
                    placeholder="Quantidade"
                    value={bulkStock}
                    onChange={(e) => setBulkStock(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bulk-threshold">Novo limite de alerta</Label>
                  <Input
                    id="bulk-threshold"
                    type="number"
                    min="0"
                    placeholder="Limite"
                    value={bulkThreshold}
                    onChange={(e) => setBulkThreshold(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setBulkStock("");
                    setBulkThreshold("");
                  }}
                >
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Limpar
                </Button>
                
                <Button
                  size="sm"
                  onClick={handleBulkUpdate}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Atualizando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Atualizar selecionados
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead>Limite</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStockProducts.map((product: LowStockProduct) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => handleSelectProduct(product.id)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.categoryName}</TableCell>
                    <TableCell>{product.stock}</TableCell>
                    <TableCell>{product.stockThreshold}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={product.alert === 'critical' ? "destructive" : "warning"}
                          >
                            {product.alert === 'critical' ? 'Crítico' : 'Alerta'}
                          </Badge>
                          <span className="text-xs font-medium">
                            {product.stockPercentage}%
                          </span>
                        </div>
                        <Progress
                          value={product.stockPercentage}
                          className="h-2"
                          indicatorClassName={getProgressColor(product.stockPercentage)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => refetch()}
          disabled={isLoading}
        >
          <RefreshCcw className="mr-2 h-4 w-4" />
          Atualizar lista
        </Button>
        
        <Button 
          variant="default" 
          size="sm" 
          onClick={() => {
            // Link para a página de gerenciamento de produtos
            window.location.href = "/supplier/product-management";
          }}
        >
          <Edit className="mr-2 h-4 w-4" />
          Gerenciar produtos
        </Button>
      </CardFooter>
    </Card>
  );
}