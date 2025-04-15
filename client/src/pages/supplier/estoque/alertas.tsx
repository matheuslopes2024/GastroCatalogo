import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { SupplierLayout } from '@/components/supplier/supplier-layout';
import LowStockAlert from '@/components/supplier/low-stock-alert';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  AlertTriangle, 
  Package, 
  Search, 
  Filter, 
  RefreshCw, 
  ArrowUpDown,
  PlusCircle,
  FileDown,
  Printer
} from 'lucide-react';
import { Link } from 'wouter';
import { Product } from '@shared/schema';

export default function AlertasEstoquePage() {
  const { user } = useAuth();
  const supplierId = user?.id;
  const [searchTerm, setSearchTerm] = React.useState('');
  const [sortBy, setSortBy] = React.useState('stock_asc');
  const [refreshing, setRefreshing] = React.useState(false);

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
    } finally {
      setRefreshing(false);
    }
  };

  // Filtrar produtos por termo de busca
  const filteredProducts = React.useMemo(() => {
    if (!lowStockProducts) return [];
    
    return lowStockProducts.filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [lowStockProducts, searchTerm]);

  // Ordenar produtos
  const sortedProducts = React.useMemo(() => {
    if (!filteredProducts) return [];
    
    const sorted = [...filteredProducts];
    
    switch (sortBy) {
      case 'stock_asc':
        return sorted.sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0));
      case 'stock_desc':
        return sorted.sort((a, b) => (b.stock ?? 0) - (a.stock ?? 0));
      case 'name_asc':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'name_desc':
        return sorted.sort((a, b) => b.name.localeCompare(a.name));
      case 'sku_asc':
        return sorted.sort((a, b) => (a.sku ?? '').localeCompare(b.sku ?? ''));
      case 'sku_desc':
        return sorted.sort((a, b) => (b.sku ?? '').localeCompare(a.sku ?? ''));
      case 'updated_desc':
        return sorted.sort((a, b) => new Date(b.lastStockUpdate ?? 0).getTime() - new Date(a.lastStockUpdate ?? 0).getTime());
      default:
        return sorted;
    }
  }, [filteredProducts, sortBy]);

  // Dados resumidos para o painel
  const summaryData = React.useMemo(() => {
    if (!lowStockProducts) return {
      total: 0,
      outOfStock: 0,
      critical: 0,
      warning: 0
    };
    
    const outOfStock = lowStockProducts.filter(p => p.stock === 0).length;
    const critical = lowStockProducts.filter(p => p.stock !== 0 && p.stock! <= (p.lowStockThreshold ?? 10) / 2).length;
    const warning = lowStockProducts.length - outOfStock - critical;
    
    return {
      total: lowStockProducts.length,
      outOfStock,
      critical,
      warning
    };
  }, [lowStockProducts]);

  const getStockStatusBadge = (product: Product) => {
    if (product.stock === 0) {
      return <Badge variant="destructive">Esgotado</Badge>;
    }
    if (product.stock! <= (product.lowStockThreshold ?? 10) / 2) {
      return <Badge variant="destructive" className="bg-amber-600">Crítico</Badge>;
    }
    return <Badge variant="outline" className="text-amber-600 border-amber-300">Abaixo do limite</Badge>;
  };

  const getStockLastUpdateText = (lastUpdate: string | Date | null | undefined) => {
    if (!lastUpdate) return 'Não informado';
    
    const date = new Date(lastUpdate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `${diffDays} dias atrás`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} semanas atrás`;
    
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <SupplierLayout activeItem="estoque-alertas">
      <div className="container p-6 max-w-7xl">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center">
              <AlertTriangle className="mr-2 h-8 w-8 text-amber-500" />
              Alertas de Estoque
            </h1>
            <p className="text-muted-foreground mt-1">
              Monitore e gerencie produtos com estoque abaixo do limite definido
            </p>
          </div>
          <div className="flex items-center gap-2 mt-4 md:mt-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing || isLoading}
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
            <Link href="/fornecedor/produtos/bulk-update">
              <Button variant="default" size="sm">
                <PlusCircle className="mr-2 h-4 w-4" />
                Atualizar em Massa
              </Button>
            </Link>
          </div>
        </header>

        {/* Painel de resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total de alertas</CardDescription>
              <CardTitle className="text-3xl">{summaryData.total}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                produtos precisam de atenção
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-red-200">
            <CardHeader className="pb-2">
              <CardDescription>Produtos esgotados</CardDescription>
              <CardTitle className="text-3xl text-red-600">{summaryData.outOfStock}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                estoque zerado (indisponível)
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-amber-200">
            <CardHeader className="pb-2">
              <CardDescription>Nível crítico</CardDescription>
              <CardTitle className="text-3xl text-amber-600">{summaryData.critical}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                abaixo de 50% do limite mínimo
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-yellow-100">
            <CardHeader className="pb-2">
              <CardDescription>Alerta preventivo</CardDescription>
              <CardTitle className="text-3xl text-yellow-600">{summaryData.warning}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                abaixo do limite recomendado
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="tabela" className="w-full">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="tabela" className="gap-2">
                <Package className="h-4 w-4" />
                Tabela completa
              </TabsTrigger>
              <TabsTrigger value="resumo" className="gap-2">
                <AlertTriangle className="h-4 w-4" />
                Resumo
              </TabsTrigger>
            </TabsList>
            
            <div className="flex w-full sm:w-auto mt-4 sm:mt-0 gap-2">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar produto ou SKU..."
                  className="pl-8 w-full sm:w-[250px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <select
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="stock_asc">Estoque (menor primeiro)</option>
                <option value="stock_desc">Estoque (maior primeiro)</option>
                <option value="name_asc">Nome (A-Z)</option>
                <option value="name_desc">Nome (Z-A)</option>
                <option value="sku_asc">SKU (A-Z)</option>
                <option value="sku_desc">SKU (Z-A)</option>
                <option value="updated_desc">Atualização recente</option>
              </select>
              
              <Button variant="outline" size="icon">
                <Printer className="h-4 w-4" />
              </Button>
              
              <Button variant="outline" size="icon">
                <FileDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <TabsContent value="tabela" className="mt-0">
            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex justify-center items-center p-8">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : isError ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
                    <h3 className="text-lg font-medium">Erro ao carregar dados</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {error instanceof Error ? error.message : 'Ocorreu um erro ao buscar produtos com estoque baixo.'}
                    </p>
                    <Button onClick={handleRefresh} variant="outline">
                      Tentar novamente
                    </Button>
                  </div>
                ) : sortedProducts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <Package className="h-12 w-12 text-green-500 mb-4" />
                    <h3 className="text-lg font-medium">Nenhum produto encontrado</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {searchTerm ? 'Sua busca não retornou resultados. Tente outros termos.' : 'Todos os produtos estão com estoque adequado.'}
                    </p>
                    {searchTerm && (
                      <Button onClick={() => setSearchTerm('')} variant="outline">
                        Limpar busca
                      </Button>
                    )}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-right">Estoque</TableHead>
                        <TableHead className="text-right">Mínimo</TableHead>
                        <TableHead>Última atualização</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">
                            <Link href={`/fornecedor/produtos/edit/${product.id}`}>
                              <a className="hover:underline">{product.name}</a>
                            </Link>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {product.sku || 'N/A'}
                          </TableCell>
                          <TableCell className="text-center">
                            {getStockStatusBadge(product)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            <span className={product.stock === 0 ? 'text-red-600' : product.stock! <= (product.lowStockThreshold ?? 10) / 2 ? 'text-amber-600' : ''}>
                              {product.stock ?? 0}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            {product.lowStockThreshold ?? 10}
                          </TableCell>
                          <TableCell>
                            {getStockLastUpdateText(product.lastStockUpdate)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Link href={`/fornecedor/produtos/edit/${product.id}`}>
                                <Button size="sm" variant="outline">
                                  Atualizar
                                </Button>
                              </Link>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
              <CardFooter className="border-t p-2 text-sm text-muted-foreground flex justify-between items-center">
                <div>
                  Mostrando {sortedProducts.length} de {lowStockProducts?.length || 0} produtos
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" disabled>
                    <ArrowUpDown className="h-4 w-4 mr-1" />
                    Exportar relatório
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="resumo" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <LowStockAlert supplierId={supplierId!} />
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Package className="w-5 h-5 mr-2" />
                    Ações recomendadas
                  </CardTitle>
                  <CardDescription>
                    O que você pode fazer para resolver os alertas de estoque
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border p-3">
                    <h4 className="font-medium mb-1">Atualização em massa</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Atualize o estoque de vários produtos de uma só vez para agilizar o processo.
                    </p>
                    <Link href="/fornecedor/produtos/bulk-update">
                      <Button size="sm" variant="secondary" className="w-full">
                        Ir para atualização em massa
                      </Button>
                    </Link>
                  </div>
                  
                  <div className="rounded-lg border p-3">
                    <h4 className="font-medium mb-1">Ajustar limites mínimos</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Configure limites mínimos de estoque adequados para cada produto.
                    </p>
                    <Link href="/fornecedor/produtos?filter=low-stock">
                      <Button size="sm" variant="outline" className="w-full">
                        Ver configurações
                      </Button>
                    </Link>
                  </div>
                  
                  <div className="rounded-lg border p-3">
                    <h4 className="font-medium mb-1">Configurar automação</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Configure avisos automáticos quando produtos atingirem o estoque mínimo.
                    </p>
                    <Link href="/fornecedor/configuracoes">
                      <Button size="sm" variant="outline" className="w-full">
                        Ir para configurações
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </SupplierLayout>
  );
}