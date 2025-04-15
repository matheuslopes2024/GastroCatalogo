import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, RefreshCw, Save, Search, UploadCloud } from 'lucide-react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Link, useLocation } from 'wouter';
import { Product } from '@shared/schema';
import SupplierSidebar from '@/components/supplier/supplier-sidebar';

interface ProductUpdateItem {
  id: number;
  name: string;
  price: string;
  stock: number | null;
  lowStockThreshold: number | null;
  sku: string | null;
  selected: boolean;
  changed: boolean;
}

interface BulkUpdatePayload {
  productIds: number[];
  updates: {
    stock?: number | null;
    lowStockThreshold?: number | null;
    sku?: string | null;
    stockStatus?: string;
  };
}

export default function BulkUpdate() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const supplierId = user?.id;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<ProductUpdateItem[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductUpdateItem[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [currentTab, setCurrentTab] = useState('stock');
  const [bulkStock, setBulkStock] = useState<number | null>(null);
  const [bulkThreshold, setBulkThreshold] = useState<number | null>(null);
  const [bulkSku, setBulkSku] = useState<string | null>(null);
  const [bulkStatus, setBulkStatus] = useState<string>('in_stock');
  const [progress, setProgress] = useState(0);
  
  // Carregar produtos do fornecedor
  const { data: productData, isLoading, error, refetch } = useQuery<Product[]>({
    queryKey: ['/api/supplier/products', supplierId],
    enabled: !!supplierId,
  });
  
  // Atualização em massa
  const updateMutation = useMutation({
    mutationFn: async (payload: BulkUpdatePayload) => {
      return await apiRequest('POST', '/api/supplier/products/bulk-update', payload);
    },
    onSuccess: () => {
      toast({
        title: 'Produtos atualizados com sucesso',
        description: 'As alterações foram salvas no banco de dados.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/supplier/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/supplier/products/low-stock'] });
      resetForm();
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar produtos',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao salvar as alterações.',
        variant: 'destructive'
      });
    }
  });
  
  // Inicializar produtos quando os dados são carregados
  useEffect(() => {
    if (productData) {
      const transformedProducts = productData.map(product => ({
        id: product.id,
        name: product.name,
        price: product.price,
        stock: product.stock,
        lowStockThreshold: product.lowStockThreshold,
        sku: product.sku,
        selected: false,
        changed: false,
      }));
      setProducts(transformedProducts);
      setFilteredProducts(transformedProducts);
    }
  }, [productData]);
  
  // Filtrar produtos com base na pesquisa
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProducts(products);
    } else {
      const lowerQuery = searchQuery.toLowerCase();
      const filtered = products.filter(product => 
        product.name.toLowerCase().includes(lowerQuery) || 
        (product.sku && product.sku.toLowerCase().includes(lowerQuery))
      );
      setFilteredProducts(filtered);
    }
  }, [searchQuery, products]);
  
  // Selecionar/desselecionar todos os produtos
  useEffect(() => {
    if (selectAll) {
      setFilteredProducts(prev => prev.map(p => ({ ...p, selected: true })));
      setProducts(prev => prev.map(p => {
        if (filteredProducts.some(fp => fp.id === p.id)) {
          return { ...p, selected: true };
        }
        return p;
      }));
    } else {
      setFilteredProducts(prev => prev.map(p => ({ ...p, selected: false })));
      setProducts(prev => prev.map(p => {
        if (filteredProducts.some(fp => fp.id === p.id)) {
          return { ...p, selected: false };
        }
        return p;
      }));
    }
  }, [selectAll]);
  
  const handleProductSelect = (id: number, selected: boolean) => {
    setProducts(prev => prev.map(p => 
      p.id === id ? { ...p, selected } : p
    ));
    
    setFilteredProducts(prev => prev.map(p => 
      p.id === id ? { ...p, selected } : p
    ));
    
    // Verificar se todos estão selecionados para atualizar o selectAll
    const allSelected = filteredProducts.every(p => p.id === id ? selected : p.selected);
    setSelectAll(allSelected);
  };
  
  const resetForm = () => {
    setBulkStock(null);
    setBulkThreshold(null);
    setBulkSku(null);
    setBulkStatus('in_stock');
    setSelectAll(false);
    setProducts(prev => prev.map(p => ({ ...p, selected: false, changed: false })));
    setFilteredProducts(prev => prev.map(p => ({ ...p, selected: false, changed: false })));
    setProgress(0);
  };
  
  const applyBulkChanges = () => {
    // Marcar quais produtos foram alterados
    setProducts(prev => prev.map(p => {
      if (p.selected) {
        return { 
          ...p, 
          changed: true,
          stock: currentTab === 'stock' ? bulkStock : p.stock,
          lowStockThreshold: currentTab === 'threshold' ? bulkThreshold : p.lowStockThreshold,
          sku: currentTab === 'sku' ? bulkSku : p.sku
        };
      }
      return p;
    }));
    
    setFilteredProducts(prev => prev.map(p => {
      if (p.selected) {
        return { 
          ...p, 
          changed: true,
          stock: currentTab === 'stock' ? bulkStock : p.stock,
          lowStockThreshold: currentTab === 'threshold' ? bulkThreshold : p.lowStockThreshold,
          sku: currentTab === 'sku' ? bulkSku : p.sku
        };
      }
      return p;
    }));
    
    toast({
      title: 'Alterações aplicadas',
      description: 'Clique em "Salvar alterações" para confirmar a atualização dos produtos.',
    });
  };
  
  const handleSubmit = async () => {
    const selectedProducts = products.filter(p => p.changed);
    
    if (selectedProducts.length === 0) {
      toast({
        title: 'Nenhuma alteração para salvar',
        description: 'Selecione produtos e aplique alterações antes de salvar.',
        variant: 'destructive'
      });
      return;
    }
    
    // Simular progresso
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setProgress(progress);
      if (progress >= 90) {
        clearInterval(interval);
      }
    }, 200);
    
    // Preparar payload para a API
    const payload: BulkUpdatePayload = {
      productIds: selectedProducts.map(p => p.id),
      updates: {}
    };
    
    // Adicionar apenas os campos que foram modificados
    if (selectedProducts.some(p => p.stock !== null)) {
      payload.updates.stock = bulkStock;
    }
    
    if (selectedProducts.some(p => p.lowStockThreshold !== null)) {
      payload.updates.lowStockThreshold = bulkThreshold;
    }
    
    if (selectedProducts.some(p => p.sku !== null)) {
      payload.updates.sku = bulkSku;
    }
    
    // Status é calculado com base no estoque
    payload.updates.stockStatus = bulkStatus;
    
    try {
      await updateMutation.mutateAsync(payload);
      setProgress(100);
      
      // Reiniciar progresso após sucesso
      setTimeout(() => {
        setProgress(0);
      }, 1000);
      
    } catch (error) {
      setProgress(0);
      clearInterval(interval);
    }
  };
  
  const getSelectedCount = () => {
    return products.filter(p => p.selected).length;
  };
  
  const getChangedCount = () => {
    return products.filter(p => p.changed).length;
  };
  
  if (!supplierId) {
    return (
      <div className="flex min-h-screen">
        <SupplierSidebar />
        <div className="flex-1 p-8">
          <div className="max-w-5xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Acesso Restrito</CardTitle>
                <CardDescription>
                  Você precisa estar logado como fornecedor para acessar esta página.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button onClick={() => setLocation('/auth')}>Fazer login</Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen">
      <SupplierSidebar />
      <div className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          <Breadcrumb className="mb-6">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/supplier/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/supplier/products">Produtos</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink>Atualização em Massa</BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">Atualização em Massa</h1>
              <p className="text-muted-foreground">
                Atualize múltiplos produtos simultaneamente
              </p>
            </div>
            <Link href="/supplier/products">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar para produtos
              </Button>
            </Link>
          </div>
          
          {progress > 0 && (
            <div className="mb-6">
              <Progress value={progress} className="h-2 mb-2" />
              <p className="text-sm text-muted-foreground">
                {progress < 100 ? 'Processando alterações...' : 'Alterações salvas com sucesso!'}
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Selecionar Produtos</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => refetch()}
                      disabled={isLoading}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Atualizar
                    </Button>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="selectAll" 
                        checked={selectAll} 
                        onCheckedChange={(checked) => setSelectAll(!!checked)}
                      />
                      <Label htmlFor="selectAll">Selecionar todos</Label>
                    </div>
                  </div>
                </div>
                <CardDescription>
                  {getSelectedCount() > 0 ? (
                    <span className="font-medium text-primary">
                      {getSelectedCount()} produtos selecionados
                    </span>
                  ) : (
                    'Selecione os produtos que deseja atualizar'
                  )}
                </CardDescription>
                
                <div className="relative mt-2">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar produtos por nome ou SKU..." 
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-12">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    <p className="mt-2 text-muted-foreground">Carregando produtos...</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-12">
                    <p className="text-red-500">Erro ao carregar produtos</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => refetch()}
                    >
                      Tentar novamente
                    </Button>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">Nenhum produto encontrado</p>
                  </div>
                ) : (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12"></TableHead>
                          <TableHead>Nome do Produto</TableHead>
                          <TableHead>Estoque</TableHead>
                          <TableHead>Limite mín.</TableHead>
                          <TableHead>SKU</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProducts.map((product) => (
                          <TableRow 
                            key={product.id} 
                            className={product.changed ? 'bg-primary/5' : ''}
                          >
                            <TableCell>
                              <Checkbox 
                                checked={product.selected} 
                                onCheckedChange={(checked) => handleProductSelect(product.id, !!checked)}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell>{product.stock ?? 'Não definido'}</TableCell>
                            <TableCell>{product.lowStockThreshold ?? 'Não definido'}</TableCell>
                            <TableCell>{product.sku ?? 'Não definido'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Atualização em Massa</CardTitle>
                <CardDescription>
                  Configure os novos valores para os produtos selecionados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs 
                  defaultValue="stock" 
                  value={currentTab}
                  onValueChange={setCurrentTab}
                  className="mb-4"
                >
                  <TabsList className="grid grid-cols-3 mb-4">
                    <TabsTrigger value="stock">Estoque</TabsTrigger>
                    <TabsTrigger value="threshold">Limite</TabsTrigger>
                    <TabsTrigger value="sku">SKU</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="stock" className="pt-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="stock">Quantidade em estoque</Label>
                        <Input 
                          id="stock" 
                          type="number" 
                          min="0"
                          placeholder="Quantidade" 
                          value={bulkStock === null ? '' : bulkStock}
                          onChange={(e) => setBulkStock(e.target.value ? Number(e.target.value) : null)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="stockStatus">Status do estoque</Label>
                        <Select value={bulkStatus} onValueChange={setBulkStatus}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="in_stock">Em estoque</SelectItem>
                            <SelectItem value="low_stock">Estoque baixo</SelectItem>
                            <SelectItem value="out_of_stock">Esgotado</SelectItem>
                            <SelectItem value="backorder">Em espera</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="threshold" className="pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="threshold">Limite de estoque baixo</Label>
                      <Input 
                        id="threshold" 
                        type="number" 
                        min="1"
                        placeholder="Limite" 
                        value={bulkThreshold === null ? '' : bulkThreshold}
                        onChange={(e) => setBulkThreshold(e.target.value ? Number(e.target.value) : null)}
                      />
                      <p className="text-sm text-muted-foreground">
                        Você receberá alertas quando o estoque estiver abaixo deste valor.
                      </p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="sku" className="pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="sku">Código SKU</Label>
                      <Input 
                        id="sku" 
                        placeholder="SKU" 
                        value={bulkSku === null ? '' : bulkSku}
                        onChange={(e) => setBulkSku(e.target.value || null)}
                      />
                      <p className="text-sm text-muted-foreground">
                        Código único para identificação do produto no estoque.
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
                
                <div className="flex justify-end mt-4">
                  <Button 
                    variant="secondary" 
                    onClick={applyBulkChanges}
                    disabled={getSelectedCount() === 0}
                  >
                    Aplicar alterações
                  </Button>
                </div>
              </CardContent>
              
              <Separator />
              
              <CardFooter className="pt-6">
                <div className="space-y-4 w-full">
                  <div>
                    <p className="font-medium">Resumo das alterações:</p>
                    <ul className="text-sm mt-2 space-y-1">
                      <li className="flex justify-between">
                        <span>Produtos selecionados:</span>
                        <span className="font-medium">{getSelectedCount()}</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Produtos a serem alterados:</span>
                        <span className="font-medium">{getChangedCount()}</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <Button 
                      onClick={handleSubmit} 
                      disabled={getChangedCount() === 0 || updateMutation.isPending}
                      className="w-full"
                    >
                      {updateMutation.isPending ? (
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
                    
                    <Button 
                      variant="outline" 
                      onClick={resetForm}
                      disabled={updateMutation.isPending}
                      className="w-full"
                    >
                      Limpar alterações
                    </Button>
                  </div>
                </div>
              </CardFooter>
            </Card>
          </div>
          
          {getChangedCount() > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Alterações pendentes</CardTitle>
                <CardDescription>
                  Produtos que serão atualizados ao salvar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome do Produto</TableHead>
                      <TableHead>Estoque</TableHead>
                      <TableHead>Limite mín.</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products
                      .filter(p => p.changed)
                      .map(product => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>{product.stock ?? 'Não definido'}</TableCell>
                          <TableCell>{product.lowStockThreshold ?? 'Não definido'}</TableCell>
                          <TableCell>{product.sku ?? 'Não definido'}</TableCell>
                          <TableCell>{bulkStatus}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleSubmit} 
                  disabled={updateMutation.isPending}
                  className="w-full"
                >
                  {updateMutation.isPending ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Salvando alterações...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="mr-2 h-4 w-4" />
                      Salvar todas as alterações
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}