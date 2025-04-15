import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SupplierLayout } from '@/components/supplier/supplier-layout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  Database,
  Search,
  Check,
  X,
  Save,
  RefreshCw,
  FileDown,
  FilePlus,
  Filter,
  ArrowUp,
  ArrowDown,
  XCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';
import { Product } from '@shared/schema';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiRequest } from '@/lib/queryClient';

// Interface para produto com campos adicionais para controle de UI
interface ProductWithUIState extends Product {
  isEditing: boolean;
  isDirty: boolean;
  newStock?: number;
  newLowStockThreshold?: number;
  newSku?: string;
  hasError?: boolean;
  errorMessage?: string;
}

export default function BulkUpdatePage() {
  const { user } = useAuth();
  const supplierId = user?.id;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<Set<number>>(new Set());
  const [filterOption, setFilterOption] = useState('all');
  const [sortBy, setSortBy] = useState('name_asc');
  const [bulkUpdateMode, setBulkUpdateMode] = useState(false);
  const [bulkUpdateValue, setBulkUpdateValue] = useState<string>('');
  const [bulkOperation, setBulkOperation] = useState<'set' | 'add' | 'subtract'>('set');
  const [bulkField, setBulkField] = useState<'stock' | 'lowStockThreshold'>('stock');
  const [isSaving, setIsSaving] = useState(false);
  
  // Buscar produtos do fornecedor
  const {
    data: products,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery<Product[]>({
    queryKey: ['/api/supplier/products', { supplierId }],
    enabled: !!supplierId,
  });
  
  // Produtos para edição com estado de UI
  const [editableProducts, setEditableProducts] = useState<ProductWithUIState[]>([]);
  
  // Atualizar editableProducts quando products mudar
  useEffect(() => {
    if (products) {
      setEditableProducts(
        products.map(product => ({
          ...product,
          isEditing: false,
          isDirty: false,
          newStock: product.stock,
          newLowStockThreshold: product.lowStockThreshold,
          newSku: product.sku,
        }))
      );
    }
  }, [products]);
  
  // Mutation para atualizar produtos em massa
  const updateProductsMutation = useMutation({
    mutationFn: async (updatedProducts: { id: number, stock?: number, lowStockThreshold?: number, sku?: string }[]) => {
      const response = await apiRequest('POST', '/api/supplier/products/bulk-update', { products: updatedProducts });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['/api/supplier/products']});
      queryClient.invalidateQueries({queryKey: ['/api/supplier/products/low-stock']});
      toast({
        title: 'Estoque atualizado com sucesso',
        description: 'Os produtos selecionados foram atualizados no sistema.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar estoque',
        description: error.message || 'Ocorreu um erro ao atualizar os produtos.',
        variant: 'destructive',
      });
    },
  });
  
  // Aplicar filtro de busca e ordenação
  const filteredProducts = React.useMemo(() => {
    if (!editableProducts) return [];
    
    // Filtrar por termo de busca
    let filtered = editableProducts.filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    // Filtrar por opção selecionada
    switch (filterOption) {
      case 'low-stock':
        filtered = filtered.filter(p => 
          p.stock !== null && 
          p.lowStockThreshold !== null && 
          p.stock < p.lowStockThreshold
        );
        break;
      case 'out-of-stock':
        filtered = filtered.filter(p => p.stock === 0 || p.stock === null);
        break;
      case 'edits-pending':
        filtered = filtered.filter(p => p.isDirty);
        break;
      case 'selected':
        filtered = filtered.filter(p => selectedProductIds.has(p.id));
        break;
    }
    
    // Ordenar
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'stock_asc':
          return (a.stock ?? 0) - (b.stock ?? 0);
        case 'stock_desc':
          return (b.stock ?? 0) - (a.stock ?? 0);
        case 'sku_asc':
          return (a.sku ?? '').localeCompare(b.sku ?? '');
        case 'sku_desc':
          return (b.sku ?? '').localeCompare(a.sku ?? '');
        default:
          return 0;
      }
    });
  }, [editableProducts, searchTerm, filterOption, sortBy, selectedProductIds]);
  
  // Manipuladores de eventos
  const handleSelectAll = () => {
    const allSelected = filteredProducts.every(p => selectedProductIds.has(p.id));
    
    if (allSelected) {
      // Desmarcar todos
      const newSelected = new Set(selectedProductIds);
      filteredProducts.forEach(p => newSelected.delete(p.id));
      setSelectedProductIds(newSelected);
    } else {
      // Marcar todos
      const newSelected = new Set(selectedProductIds);
      filteredProducts.forEach(p => newSelected.add(p.id));
      setSelectedProductIds(newSelected);
    }
  };
  
  const handleSelectProduct = (productId: number) => {
    const newSelected = new Set(selectedProductIds);
    
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    
    setSelectedProductIds(newSelected);
  };
  
  const handleEditToggle = (productId: number) => {
    setEditableProducts(prev => 
      prev.map(p => 
        p.id === productId 
          ? { ...p, isEditing: !p.isEditing } 
          : p
      )
    );
  };
  
  const handleStockChange = (productId: number, value: string) => {
    const numValue = value === '' ? undefined : parseInt(value, 10);
    
    setEditableProducts(prev => 
      prev.map(p => {
        if (p.id === productId) {
          const hasChanged = numValue !== p.stock;
          return { 
            ...p, 
            newStock: numValue,
            isDirty: hasChanged || p.newLowStockThreshold !== p.lowStockThreshold || p.newSku !== p.sku,
            hasError: numValue !== undefined && numValue < 0 ? true : false,
            errorMessage: numValue !== undefined && numValue < 0 ? 'Estoque não pode ser negativo' : undefined
          };
        }
        return p;
      })
    );
  };
  
  const handleThresholdChange = (productId: number, value: string) => {
    const numValue = value === '' ? undefined : parseInt(value, 10);
    
    setEditableProducts(prev => 
      prev.map(p => {
        if (p.id === productId) {
          const hasChanged = numValue !== p.lowStockThreshold;
          return { 
            ...p, 
            newLowStockThreshold: numValue,
            isDirty: hasChanged || p.newStock !== p.stock || p.newSku !== p.sku,
            hasError: numValue !== undefined && numValue < 0 ? true : false,
            errorMessage: numValue !== undefined && numValue < 0 ? 'Limite não pode ser negativo' : undefined
          };
        }
        return p;
      })
    );
  };
  
  const handleSkuChange = (productId: number, value: string) => {
    setEditableProducts(prev => 
      prev.map(p => {
        if (p.id === productId) {
          const hasChanged = value !== p.sku;
          return { 
            ...p, 
            newSku: value,
            isDirty: hasChanged || p.newStock !== p.stock || p.newLowStockThreshold !== p.lowStockThreshold
          };
        }
        return p;
      })
    );
  };
  
  const handleSaveChanges = async () => {
    const productsToUpdate = editableProducts
      .filter(p => p.isDirty && !p.hasError)
      .map(p => ({
        id: p.id,
        stock: p.newStock,
        lowStockThreshold: p.newLowStockThreshold,
        sku: p.newSku
      }));
    
    if (productsToUpdate.length === 0) {
      toast({
        title: 'Nenhuma alteração para salvar',
        description: 'Faça alterações nos produtos antes de salvar.',
      });
      return;
    }
    
    setIsSaving(true);
    try {
      await updateProductsMutation.mutateAsync(productsToUpdate);
      
      // Resetar estados
      setEditableProducts(prev => 
        prev.map(p => ({
          ...p,
          isEditing: false,
          isDirty: false,
          stock: p.isDirty ? p.newStock : p.stock,
          lowStockThreshold: p.isDirty ? p.newLowStockThreshold : p.lowStockThreshold,
          sku: p.isDirty ? p.newSku : p.sku,
        }))
      );
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleBulkUpdate = () => {
    if (!bulkUpdateValue || isNaN(parseInt(bulkUpdateValue))) {
      toast({
        title: 'Valor inválido',
        description: 'Por favor, insira um número válido para a atualização em massa.',
        variant: 'destructive',
      });
      return;
    }
    
    const numValue = parseInt(bulkUpdateValue);
    
    setEditableProducts(prev => 
      prev.map(p => {
        if (selectedProductIds.has(p.id)) {
          let newValue: number | undefined;
          
          if (bulkField === 'stock') {
            switch (bulkOperation) {
              case 'set':
                newValue = numValue;
                break;
              case 'add':
                newValue = (p.stock ?? 0) + numValue;
                break;
              case 'subtract':
                newValue = Math.max(0, (p.stock ?? 0) - numValue);
                break;
            }
            
            return {
              ...p,
              newStock: newValue,
              isDirty: newValue !== p.stock,
              hasError: newValue < 0,
              errorMessage: newValue < 0 ? 'Estoque não pode ser negativo' : undefined
            };
          } else {
            switch (bulkOperation) {
              case 'set':
                newValue = numValue;
                break;
              case 'add':
                newValue = (p.lowStockThreshold ?? 0) + numValue;
                break;
              case 'subtract':
                newValue = Math.max(0, (p.lowStockThreshold ?? 0) - numValue);
                break;
            }
            
            return {
              ...p,
              newLowStockThreshold: newValue,
              isDirty: newValue !== p.lowStockThreshold,
              hasError: newValue < 0,
              errorMessage: newValue < 0 ? 'Limite não pode ser negativo' : undefined
            };
          }
        }
        return p;
      })
    );
    
    setBulkUpdateMode(false);
    setBulkUpdateValue('');
  };
  
  const cancelAllChanges = () => {
    setEditableProducts(prev => 
      prev.map(p => ({
        ...p,
        isEditing: false,
        isDirty: false,
        newStock: p.stock,
        newLowStockThreshold: p.lowStockThreshold,
        newSku: p.sku,
        hasError: false,
        errorMessage: undefined
      }))
    );
    
    toast({
      title: 'Alterações canceladas',
      description: 'Todas as alterações foram descartadas.',
    });
  };
  
  // Estatísticas
  const stats = React.useMemo(() => {
    return {
      total: editableProducts.length,
      selected: selectedProductIds.size,
      pending: editableProducts.filter(p => p.isDirty).length,
      errors: editableProducts.filter(p => p.hasError).length,
      lowStock: editableProducts.filter(p => p.stock !== null && p.lowStockThreshold !== null && p.stock < p.lowStockThreshold).length,
      outOfStock: editableProducts.filter(p => p.stock === 0 || p.stock === null).length,
    };
  }, [editableProducts, selectedProductIds]);

  return (
    <SupplierLayout activeItem="estoque-atualizacao">
      <div className="container p-6 max-w-7xl">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center">
              <Database className="mr-2 h-8 w-8 text-primary" />
              Atualização em Massa
            </h1>
            <p className="text-muted-foreground mt-1">
              Atualize o estoque de múltiplos produtos de forma rápida e eficiente
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-4 md:mt-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Carregando...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Atualizar
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedProductIds(new Set(editableProducts.filter(p => p.stock !== null && p.lowStockThreshold !== null && p.stock < p.lowStockThreshold).map(p => p.id)))}
            >
              <AlertTriangle className="mr-2 h-4 w-4 text-amber-500" />
              Selecionar produtos com estoque baixo
            </Button>
          </div>
        </header>

        {/* Painel de estatísticas */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total de produtos</CardDescription>
              <CardTitle className="text-2xl">{stats.total}</CardTitle>
            </CardHeader>
          </Card>
          
          <Card className={stats.selected > 0 ? "border-primary bg-primary/5" : ""}>
            <CardHeader className="pb-2">
              <CardDescription>Selecionados</CardDescription>
              <CardTitle className={`text-2xl ${stats.selected > 0 ? "text-primary" : ""}`}>
                {stats.selected}
              </CardTitle>
            </CardHeader>
          </Card>
          
          <Card className={stats.pending > 0 ? "border-blue-300 bg-blue-50" : ""}>
            <CardHeader className="pb-2">
              <CardDescription>Alterações pendentes</CardDescription>
              <CardTitle className={`text-2xl ${stats.pending > 0 ? "text-blue-600" : ""}`}>
                {stats.pending}
              </CardTitle>
            </CardHeader>
          </Card>
          
          <Card className={stats.errors > 0 ? "border-red-300 bg-red-50" : ""}>
            <CardHeader className="pb-2">
              <CardDescription>Erros</CardDescription>
              <CardTitle className={`text-2xl ${stats.errors > 0 ? "text-red-600" : ""}`}>
                {stats.errors}
              </CardTitle>
            </CardHeader>
          </Card>
          
          <Card className={stats.lowStock > 0 ? "border-amber-300 bg-amber-50" : ""}>
            <CardHeader className="pb-2">
              <CardDescription>Estoque baixo</CardDescription>
              <CardTitle className={`text-2xl ${stats.lowStock > 0 ? "text-amber-600" : ""}`}>
                {stats.lowStock}
              </CardTitle>
            </CardHeader>
          </Card>
          
          <Card className={stats.outOfStock > 0 ? "border-red-300 bg-red-50" : ""}>
            <CardHeader className="pb-2">
              <CardDescription>Sem estoque</CardDescription>
              <CardTitle className={`text-2xl ${stats.outOfStock > 0 ? "text-red-600" : ""}`}>
                {stats.outOfStock}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Controles de busca, filtros e ordenação */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 mb-4">
          <div className="flex flex-grow items-center gap-2">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar produto ou SKU..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <select
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={filterOption}
              onChange={(e) => setFilterOption(e.target.value)}
            >
              <option value="all">Todos os produtos</option>
              <option value="selected">Selecionados</option>
              <option value="low-stock">Estoque baixo</option>
              <option value="out-of-stock">Sem estoque</option>
              <option value="edits-pending">Alterações pendentes</option>
            </select>
            
            <select
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="name_asc">Nome (A-Z)</option>
              <option value="name_desc">Nome (Z-A)</option>
              <option value="stock_asc">Estoque (menor primeiro)</option>
              <option value="stock_desc">Estoque (maior primeiro)</option>
              <option value="sku_asc">SKU (A-Z)</option>
              <option value="sku_desc">SKU (Z-A)</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchTerm('')}
              disabled={!searchTerm}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Limpar filtros
            </Button>
            
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setBulkUpdateMode(true)}
              disabled={selectedProductIds.size === 0}
            >
              <FilePlus className="mr-2 h-4 w-4" />
              Atualização em massa
            </Button>
          </div>
        </div>

        {/* Modo de atualização em massa */}
        {bulkUpdateMode && (
          <Card className="mb-6 bg-muted/30">
            <CardHeader>
              <CardTitle className="text-lg">Atualização em massa</CardTitle>
              <CardDescription>
                Atualize {selectedProductIds.size} produtos de uma vez
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div>
                  <label className="text-sm font-medium mb-2 block">Campo para atualizar</label>
                  <select
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={bulkField}
                    onChange={(e) => setBulkField(e.target.value as 'stock' | 'lowStockThreshold')}
                  >
                    <option value="stock">Estoque atual</option>
                    <option value="lowStockThreshold">Limite mínimo</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Operação</label>
                  <select
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={bulkOperation}
                    onChange={(e) => setBulkOperation(e.target.value as 'set' | 'add' | 'subtract')}
                  >
                    <option value="set">Definir como</option>
                    <option value="add">Adicionar</option>
                    <option value="subtract">Subtrair</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Valor</label>
                  <Input
                    type="number"
                    min="0"
                    value={bulkUpdateValue}
                    onChange={(e) => setBulkUpdateValue(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setBulkUpdateMode(false)}>
                Cancelar
              </Button>
              <Button variant="default" onClick={handleBulkUpdate}>
                Aplicar aos selecionados
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Barra de ações */}
        <Card className="mb-4">
          <CardContent className="p-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Checkbox
                id="select-all"
                checked={filteredProducts.length > 0 && filteredProducts.every(p => selectedProductIds.has(p.id))}
                onCheckedChange={handleSelectAll}
              />
              <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                Selecionar todos
              </label>
              
              <span className="text-muted-foreground text-sm">
                {selectedProductIds.size} de {filteredProducts.length} produtos selecionados
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={cancelAllChanges}
                disabled={!editableProducts.some(p => p.isDirty)}
              >
                <X className="mr-2 h-4 w-4" />
                Cancelar alterações
              </Button>
              
              <Button
                variant="default"
                size="sm"
                onClick={handleSaveChanges}
                disabled={isSaving || !editableProducts.some(p => p.isDirty && !p.hasError)}
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar alterações
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de produtos */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center items-center p-12">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Carregando produtos...</span>
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
                <h3 className="text-lg font-medium">Erro ao carregar produtos</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {error instanceof Error ? error.message : 'Ocorreu um erro ao buscar os produtos.'}
                </p>
                <Button onClick={() => refetch()} variant="outline">
                  Tentar novamente
                </Button>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <Database className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium">Nenhum produto encontrado</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchTerm || filterOption !== 'all' 
                    ? 'Tente ajustar os filtros para ver mais resultados.' 
                    : 'Você ainda não cadastrou nenhum produto.'}
                </p>
                {(searchTerm || filterOption !== 'all') && (
                  <Button onClick={() => {setSearchTerm(''); setFilterOption('all');}} variant="outline">
                    Limpar filtros
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <Checkbox
                          checked={filteredProducts.length > 0 && filteredProducts.every(p => selectedProductIds.has(p.id))}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead className="w-[120px]">SKU</TableHead>
                      <TableHead className="w-[120px] text-center">Estoque</TableHead>
                      <TableHead className="w-[120px] text-center">Limite mínimo</TableHead>
                      <TableHead className="w-[80px] text-center">Status</TableHead>
                      <TableHead className="w-[120px] text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow key={product.id} className={product.isDirty ? 'bg-blue-50' : ''}>
                        <TableCell>
                          <Checkbox
                            checked={selectedProductIds.has(product.id)}
                            onCheckedChange={() => handleSelectProduct(product.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{product.name}</div>
                          {product.hasError && (
                            <div className="text-xs text-red-600 mt-1">
                              {product.errorMessage}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {product.isEditing ? (
                            <Input
                              value={product.newSku ?? ''}
                              onChange={(e) => handleSkuChange(product.id, e.target.value)}
                              className="h-9"
                            />
                          ) : (
                            <span className="text-muted-foreground">
                              {product.sku || 'N/A'}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {product.isEditing ? (
                            <Input
                              type="number"
                              min="0"
                              value={product.newStock === undefined ? '' : product.newStock}
                              onChange={(e) => handleStockChange(product.id, e.target.value)}
                              className={`h-9 text-center ${product.hasError && product.newStock !== undefined ? 'border-red-500' : (product.stock !== product.newStock ? 'border-blue-500' : '')}`}
                            />
                          ) : (
                            <span className={
                              product.stock === 0 ? 'text-red-600 font-medium' : 
                              (product.stock !== null && product.lowStockThreshold !== null && product.stock < product.lowStockThreshold) ? 'text-amber-600 font-medium' : ''
                            }>
                              {product.stock ?? 'N/A'}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {product.isEditing ? (
                            <Input
                              type="number"
                              min="0"
                              value={product.newLowStockThreshold === undefined ? '' : product.newLowStockThreshold}
                              onChange={(e) => handleThresholdChange(product.id, e.target.value)}
                              className={`h-9 text-center ${product.hasError && product.newLowStockThreshold !== undefined ? 'border-red-500' : (product.lowStockThreshold !== product.newLowStockThreshold ? 'border-blue-500' : '')}`}
                            />
                          ) : (
                            <span className="text-muted-foreground">
                              {product.lowStockThreshold ?? 'N/A'}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {product.stock === 0 ? (
                            <Badge variant="destructive">Esgotado</Badge>
                          ) : product.stock !== null && product.lowStockThreshold !== null && product.stock < product.lowStockThreshold ? (
                            <Badge variant="outline" className="text-amber-600 border-amber-300">Baixo</Badge>
                          ) : (
                            <Badge variant="outline" className="text-green-600 border-green-300">OK</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditToggle(product.id)}
                              title={product.isEditing ? "Cancelar edição" : "Editar produto"}
                            >
                              {product.isEditing ? (
                                <X className="h-4 w-4" />
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                </svg>
                              )}
                            </Button>
                            <Link href={`/fornecedor/produtos/edit/${product.id}`}>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Ver produto"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
          <CardFooter className="border-t p-2 text-sm text-muted-foreground flex justify-between">
            <div>
              {filteredProducts.length} produto(s) exibido(s)
              {searchTerm || filterOption !== 'all' ? ` (filtrados de ${editableProducts.length})` : ''}
            </div>
            <div className="flex items-center gap-2">
              {stats.pending > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSaveChanges}
                  disabled={isSaving || !editableProducts.some(p => p.isDirty && !p.hasError)}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Salvar {stats.pending} alterações
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>

        {/* Rodapé com ações adicionais */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <Link href="/fornecedor/estoque/alertas">
              <Button variant="outline" size="sm">
                <AlertTriangle className="mr-2 h-4 w-4 text-amber-500" />
                Ver alertas de estoque
              </Button>
            </Link>
            <Link href="/fornecedor">
              <Button variant="ghost" size="sm">
                Voltar ao dashboard
              </Button>
            </Link>
          </div>
          
          <div className="mt-4 sm:mt-0">
            <Link href="/fornecedor/produtos/novo">
              <Button size="sm">
                <FilePlus className="mr-2 h-4 w-4" />
                Cadastrar novo produto
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </SupplierLayout>
  );
}