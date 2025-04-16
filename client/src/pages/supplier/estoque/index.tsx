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
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Package, 
  ArrowUpDown,
  BarChart,
  Download,
  Boxes,
  Database,
  Archive,
  ListFilter,
  FileBarChart,
  PlusCircle
} from 'lucide-react';
import { Link } from 'wouter';
import { Product } from '@shared/schema';

export default function EstoquePage() {
  const { user } = useAuth();
  const supplierId = user?.id;

  // Buscar produtos do fornecedor
  const { 
    data: products, 
    isLoading, 
    isError, 
    error 
  } = useQuery<Product[]>({
    queryKey: ['/api/supplier/products', { supplierId }],
    enabled: !!supplierId,
  });

  // Buscar produtos com estoque baixo
  const { 
    data: lowStockProducts 
  } = useQuery<Product[]>({
    queryKey: ['/api/supplier/products/low-stock', supplierId],
    enabled: !!supplierId,
  });

  // Calcular estatísticas de estoque
  const stockStats = React.useMemo(() => {
    if (!products) return {
      total: 0,
      inStock: 0,
      lowStock: 0,
      outOfStock: 0,
      withoutInfo: 0,
      avgStock: 0,
      avgThreshold: 0
    };

    const withStock = products.filter(p => p.stock !== null);
    const inStock = withStock.filter(p => p.stock !== null && p.stock > 0 && (!p.lowStockThreshold || p.stock >= p.lowStockThreshold));
    const lowStock = lowStockProducts?.length || 0;
    const outOfStock = withStock.filter(p => p.stock === 0).length;
    const withoutInfo = products.filter(p => p.stock === null).length;
    
    const totalStock = withStock.reduce((sum, p) => sum + (p.stock || 0), 0);
    const totalThreshold = withStock.filter(p => p.lowStockThreshold !== null)
      .reduce((sum, p) => sum + (p.lowStockThreshold || 0), 0);
    
    const stockCount = withStock.length;
    const thresholdCount = withStock.filter(p => p.lowStockThreshold !== null).length;
    
    return {
      total: products.length,
      inStock: inStock.length,
      lowStock,
      outOfStock,
      withoutInfo,
      avgStock: stockCount > 0 ? Math.round(totalStock / stockCount) : 0,
      avgThreshold: thresholdCount > 0 ? Math.round(totalThreshold / thresholdCount) : 0
    };
  }, [products, lowStockProducts]);

  // Status do inventário
  const inventoryHealth = React.useMemo(() => {
    if (!stockStats.total) return 'unknown';
    if (stockStats.withoutInfo / stockStats.total > 0.5) return 'incomplete';
    if (stockStats.outOfStock / stockStats.total > 0.25) return 'critical';
    if (stockStats.lowStock / stockStats.total > 0.25) return 'warning';
    return 'healthy';
  }, [stockStats]);

  // Categorização dos produtos por status
  const productsByStatus = React.useMemo(() => {
    if (!products) return [];
    
    // Identificar os 10 produtos mais críticos (com menor estoque proporcional ao threshold)
    return products
      .filter(p => p.stock !== null && p.lowStockThreshold !== null && p.stock < p.lowStockThreshold)
      .sort((a, b) => {
        const ratioA = a.stock! / a.lowStockThreshold!;
        const ratioB = b.stock! / b.lowStockThreshold!;
        return ratioA - ratioB;
      })
      .slice(0, 10);
  }, [products]);

  return (
    <SupplierLayout activeItem="estoque">
      <div className="container p-6 max-w-7xl">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center">
              <Boxes className="mr-3 h-10 w-10 text-primary" />
              Gerenciamento de Estoque
            </h1>
            <p className="text-muted-foreground mt-1 max-w-2xl">
              Visualize e gerencie seu inventário de produtos, monitore níveis de estoque e configure limites de alerta.
            </p>
          </div>
          <div className="flex items-center mt-4 md:mt-0 gap-2">
            <Link href="/fornecedor/produtos/bulk-update">
              <Button variant="outline" size="sm">
                <Database className="mr-2 h-4 w-4" />
                Atualização em massa
              </Button>
            </Link>
            <Link href="/fornecedor/produtos/novo">
              <Button variant="default" size="sm">
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar produto
              </Button>
            </Link>
          </div>
        </header>
        
        {/* Painel de visão geral do estoque */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 flex items-center">
            <BarChart className="mr-2 h-5 w-5 text-muted-foreground" />
            Visão geral do estoque
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className={inventoryHealth === 'healthy' ? 'border-green-200 bg-green-50' : ''}>
              <CardHeader className="py-4">
                <CardDescription>Total de produtos</CardDescription>
                <CardTitle className="text-3xl">{stockStats.total}</CardTitle>
              </CardHeader>
              <CardContent className="pb-4 pt-0">
                <p className="text-sm text-muted-foreground">
                  {stockStats.inStock} produtos com estoque saudável
                </p>
              </CardContent>
            </Card>
            
            <Card className={stockStats.lowStock > 0 ? 'border-amber-200 bg-amber-50' : ''}>
              <CardHeader className="py-4">
                <CardDescription>Estoque baixo</CardDescription>
                <CardTitle className={`text-3xl ${stockStats.lowStock > 0 ? 'text-amber-600' : ''}`}>
                  {stockStats.lowStock}
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4 pt-0">
                <p className="text-sm text-muted-foreground">
                  {stockStats.lowStock > 0 
                    ? `${Math.round((stockStats.lowStock / stockStats.total) * 100)}% do seu inventário` 
                    : 'Nenhum produto abaixo do limite'}
                </p>
              </CardContent>
            </Card>
            
            <Card className={stockStats.outOfStock > 0 ? 'border-red-200 bg-red-50' : ''}>
              <CardHeader className="py-4">
                <CardDescription>Sem estoque</CardDescription>
                <CardTitle className={`text-3xl ${stockStats.outOfStock > 0 ? 'text-red-600' : ''}`}>
                  {stockStats.outOfStock}
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4 pt-0">
                <p className="text-sm text-muted-foreground">
                  {stockStats.outOfStock > 0 
                    ? `${Math.round((stockStats.outOfStock / stockStats.total) * 100)}% dos produtos esgotados` 
                    : 'Todos produtos disponíveis'}
                </p>
              </CardContent>
            </Card>
            
            <Card className={stockStats.withoutInfo > 0 ? 'border-blue-200 bg-blue-50' : ''}>
              <CardHeader className="py-4">
                <CardDescription>Sem informação</CardDescription>
                <CardTitle className={`text-3xl ${stockStats.withoutInfo > 0 ? 'text-blue-600' : ''}`}>
                  {stockStats.withoutInfo}
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4 pt-0">
                <p className="text-sm text-muted-foreground">
                  {stockStats.withoutInfo > 0 
                    ? `${Math.round((stockStats.withoutInfo / stockStats.total) * 100)}% sem dados de estoque` 
                    : 'Todos produtos têm dados de estoque'}
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Saúde do inventário</CardDescription>
                <CardTitle className="flex items-center gap-2">
                  {inventoryHealth === 'healthy' && (
                    <>
                      <span className="h-3 w-3 rounded-full bg-green-500"></span>
                      <span>Saudável</span>
                    </>
                  )}
                  {inventoryHealth === 'warning' && (
                    <>
                      <span className="h-3 w-3 rounded-full bg-amber-500"></span>
                      <span>Atenção necessária</span>
                    </>
                  )}
                  {inventoryHealth === 'critical' && (
                    <>
                      <span className="h-3 w-3 rounded-full bg-red-500"></span>
                      <span>Estado crítico</span>
                    </>
                  )}
                  {inventoryHealth === 'incomplete' && (
                    <>
                      <span className="h-3 w-3 rounded-full bg-blue-500"></span>
                      <span>Dados incompletos</span>
                    </>
                  )}
                  {inventoryHealth === 'unknown' && (
                    <>
                      <span className="h-3 w-3 rounded-full bg-gray-500"></span>
                      <span>Sem dados suficientes</span>
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {inventoryHealth === 'healthy' && (
                  <p>Seu inventário está em bom estado. Continue monitorando regularmente.</p>
                )}
                {inventoryHealth === 'warning' && (
                  <p>Vários produtos estão com estoque abaixo do limite mínimo. Considere reabastecer.</p>
                )}
                {inventoryHealth === 'critical' && (
                  <p>Estado crítico! Muitos produtos estão com estoque zero. Priorize o reabastecimento.</p>
                )}
                {inventoryHealth === 'incomplete' && (
                  <p>Muitos produtos não têm informações de estoque. Atualize seus dados.</p>
                )}
                {inventoryHealth === 'unknown' && (
                  <p>Não há dados suficientes para avaliar seu inventário.</p>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Estatísticas</CardDescription>
                <CardTitle>Médias de estoque</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Estoque médio por produto:</span>
                    <span className="font-medium">{stockStats.avgStock} unidades</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Limite mínimo médio:</span>
                    <span className="font-medium">{stockStats.avgThreshold} unidades</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Produtos sem informação:</span>
                    <span className="font-medium">{stockStats.withoutInfo} ({stockStats.total > 0 ? Math.round((stockStats.withoutInfo / stockStats.total) * 100) : 0}%)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="lg:col-span-1">
              <CardHeader className="pb-2">
                <CardDescription>Ações recomendadas</CardDescription>
                <CardTitle>Próximos passos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {stockStats.withoutInfo > 0 && (
                  <div className="flex items-start space-x-2">
                    <Database className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Completar dados de estoque</p>
                      <p className="text-xs text-muted-foreground">
                        {stockStats.withoutInfo} produtos não têm informações de estoque.
                      </p>
                      <Link href="/fornecedor/produtos/bulk-update">
                        <Button variant="link" className="px-0 h-auto text-xs text-blue-600">
                          Atualizar em massa
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
                
                {stockStats.lowStock > 0 && (
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Reabastecer produtos</p>
                      <p className="text-xs text-muted-foreground">
                        {stockStats.lowStock} produtos estão com estoque abaixo do limite.
                      </p>
                      <Link href="/fornecedor/estoque/alertas">
                        <Button variant="link" className="px-0 h-auto text-xs text-amber-600">
                          Ver alertas
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
                
                {stockStats.outOfStock > 0 && (
                  <div className="flex items-start space-x-2">
                    <Package className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Produtos indisponíveis</p>
                      <p className="text-xs text-muted-foreground">
                        {stockStats.outOfStock} produtos estão sem estoque (indisponíveis).
                      </p>
                      <Link href="/fornecedor/produtos?filter=out-of-stock">
                        <Button variant="link" className="px-0 h-auto text-xs text-red-600">
                          Visualizar produtos
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
        
        {/* Atalhos rápidos */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Gestão de estoque</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <Link href="/fornecedor/estoque/alertas">
              <Card className="border-amber-100 hover:border-amber-300 transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <AlertTriangle className="mr-2 h-5 w-5 text-amber-500" />
                    Alertas de Estoque
                  </CardTitle>
                  <CardDescription>
                    Monitore produtos com estoque abaixo do limite mínimo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Produtos com alerta:</span>
                    <Badge variant={stockStats.lowStock > 0 ? "outline" : "secondary"} className={stockStats.lowStock > 0 ? "text-amber-600 border-amber-300" : ""}>
                      {stockStats.lowStock}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/fornecedor/produtos/bulk-update">
              <Card className="border-blue-100 hover:border-blue-300 transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Database className="mr-2 h-5 w-5 text-blue-500" />
                    Atualização em Massa
                  </CardTitle>
                  <CardDescription>
                    Atualize estoque de múltiplos produtos simultaneamente
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total de produtos:</span>
                    <Badge variant="secondary">
                      {stockStats.total}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/fornecedor/produtos">
              <Card className="border-gray-100 hover:border-gray-300 transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Package className="mr-2 h-5 w-5 text-gray-500" />
                    Catálogo de Produtos
                  </CardTitle>
                  <CardDescription>
                    Gerencie produtos individualmente
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Gerenciar produtos:</span>
                    <Link href="/fornecedor/produtos/novo">
                      <Badge variant="outline" className="cursor-pointer hover:bg-secondary">
                        <PlusCircle className="mr-1 h-3 w-3" />
                        Adicionar
                      </Badge>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>
        
        {/* Produtos críticos */}
        {productsByStatus.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5 text-amber-500" />
                Produtos com estoque crítico
              </h2>
              <Link href="/fornecedor/estoque/alertas">
                <Button variant="outline" size="sm">
                  Ver todos os alertas
                </Button>
              </Link>
            </div>
            
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead className="text-right">Estoque atual</TableHead>
                      <TableHead className="text-right">Limite mínimo</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productsByStatus.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">
                          <Link href={`/fornecedor/produtos/edit/${product.id}`}>
                            <a className="hover:underline cursor-pointer">{product.name}</a>
                          </Link>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          <span className={product.stock === 0 ? 'text-red-600' : 'text-amber-600'}>
                            {product.stock}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {product.lowStockThreshold}
                        </TableCell>
                        <TableCell className="text-center">
                          {product.stock === 0 ? (
                            <Badge variant="destructive">Esgotado</Badge>
                          ) : (
                            <Badge variant="outline" className="text-amber-600 border-amber-300">
                              Crítico
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/fornecedor/produtos/edit/${product.id}`}>
                            <Button size="sm" variant="outline">
                              Atualizar
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </section>
        )}
        
        {/* Componente de alertas no final da página */}
        <section>
          <LowStockAlert supplierId={supplierId!} />
        </section>
      </div>
    </SupplierLayout>
  );
}