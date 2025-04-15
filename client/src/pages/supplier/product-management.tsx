import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pagination } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { ProductForm } from "@/components/supplier/product-form";
import { 
  Loader2, 
  Search, 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye, 
  CheckCircle2, 
  XCircle,
  PackageCheck,
  BarChart3,
  AlertCircle,
  Package,
  Filter,
  ListFilter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function ProductManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showInventoryStatus, setShowInventoryStatus] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [stockFilter, setStockFilter] = useState<string>("");
  const itemsPerPage = 10;

  // Buscar produtos do fornecedor com estoque integrado
  const { 
    data: productsData, 
    isLoading: isLoadingProducts,
    refetch: refetchProducts 
  } = useQuery({
    queryKey: ["/api/supplier/products", "with-inventory", currentPage, sortBy, sortOrder, searchQuery, categoryFilter, stockFilter],
    enabled: !!user?.id,
    queryFn: async () => {
      const url = `/api/supplier/products?page=${currentPage}&limit=${itemsPerPage}&sort=${sortBy}&order=${sortOrder}&search=${searchQuery}${categoryFilter ? `&category=${categoryFilter}` : ""}${stockFilter ? `&stock=${stockFilter}` : ""}&withInventory=true`;
      const res = await apiRequest("GET", url);
      return await res.json();
    }
  });

  // Buscar categorias
  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
    enabled: !!user?.id,
  });

  // Mutação para excluir produto
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: number) => {
      const res = await apiRequest("DELETE", `/api/supplier/products/${productId}`);
      return res.ok;
    },
    onSuccess: () => {
      toast({
        title: "Produto excluído",
        description: "O produto foi excluído com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/supplier/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/supplier/inventory/stats"] });
      setIsConfirmDeleteOpen(false);
      setSelectedProduct(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir produto",
        description: error.message || "Ocorreu um erro ao excluir o produto. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Mutação para atualizar status ativo do produto
  const updateProductStatusMutation = useMutation({
    mutationFn: async ({ productId, active }: { productId: number; active: boolean }) => {
      const res = await apiRequest("PATCH", `/api/supplier/products/${productId}/status`, { active });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Status atualizado",
        description: "O status do produto foi atualizado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/supplier/products"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar status",
        description: error.message || "Ocorreu um erro ao atualizar o status do produto. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Lidar com ações de produto
  const handleProductAction = (action: string, product: any) => {
    setSelectedProduct(product);
    
    switch (action) {
      case "edit":
        setSelectedProductId(product.id);
        break;
      case "delete":
        setIsConfirmDeleteOpen(true);
        break;
      case "toggle-status":
        updateProductStatusMutation.mutate({
          productId: product.id,
          active: !product.active
        });
        break;
      case "view":
        window.open(`/produto/${product.slug}`, "_blank");
        break;
      default:
        break;
    }
  };

  // Lidar com confirmação de exclusão
  const handleConfirmDelete = () => {
    if (selectedProduct) {
      deleteProductMutation.mutate(selectedProduct.id);
    }
  };

  // Calcular o total de páginas
  const totalPages = productsData?.totalPages || 1;

  // Renderizar stock status
  const renderStockStatus = (product: any) => {
    if (!product.inventory) return <Badge variant="outline">Sem informação</Badge>;

    const { status, quantity } = product.inventory;
    
    switch(status) {
      case "in_stock":
        return (
          <div className="flex flex-col">
            <Badge variant="default" className="mb-1">Em Estoque</Badge>
            <span className="text-xs text-gray-500">{quantity} unidades</span>
          </div>
        );
      case "low_stock":
        return (
          <div className="flex flex-col">
            <Badge variant="warning" className="mb-1">Estoque Baixo</Badge>
            <span className="text-xs text-gray-500">{quantity} unidades</span>
          </div>
        );
      case "out_of_stock":
        return <Badge variant="destructive">Sem Estoque</Badge>;
      case "back_order":
        return <Badge variant="secondary">Pedido Pendente</Badge>;
      case "discontinued":
        return <Badge variant="outline">Descontinuado</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  // Alternar ordenação
  const toggleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  // Verificar se está carregando dados
  const isLoading = isLoadingProducts || deleteProductMutation.isPending || updateProductStatusMutation.isPending;

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gerenciamento de Produtos</h1>
          <p className="text-muted-foreground">
            Gerencie seus produtos e monitore o estoque
          </p>
        </div>
        <Button onClick={() => setIsAddProductOpen(true)} className="md:w-auto w-full">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Produto
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Filtros e Pesquisa</CardTitle>
          <CardDescription>
            Refine a lista de produtos com filtros e pesquisa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar produtos..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Select
              value={categoryFilter}
              onValueChange={setCategoryFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas as categorias</SelectItem>
                {categories?.map((category: any) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select
              value={stockFilter}
              onValueChange={setStockFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por estoque" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os status</SelectItem>
                <SelectItem value="in_stock">Em estoque</SelectItem>
                <SelectItem value="low_stock">Estoque baixo</SelectItem>
                <SelectItem value="out_of_stock">Sem estoque</SelectItem>
                <SelectItem value="back_order">Pedido pendente</SelectItem>
                <SelectItem value="discontinued">Descontinuado</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex items-center space-x-2">
              <Switch
                checked={showInventoryStatus}
                onCheckedChange={setShowInventoryStatus}
                id="inventory-status"
              />
              <Label htmlFor="inventory-status">Mostrar status de inventário</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="relative overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">ID</TableHead>
                  <TableHead>
                    <div 
                      className="flex items-center cursor-pointer"
                      onClick={() => toggleSort("name")}
                    >
                      Nome
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead>
                    <div 
                      className="flex items-center cursor-pointer"
                      onClick={() => toggleSort("price")}
                    >
                      Preço
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead>Categoria</TableHead>
                  {showInventoryStatus && (
                    <>
                      <TableHead>
                        <div 
                          className="flex items-center cursor-pointer"
                          onClick={() => toggleSort("inventory.quantity")}
                        >
                          Estoque
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead>Status</TableHead>
                    </>
                  )}
                  <TableHead>
                    <div 
                      className="flex items-center cursor-pointer"
                      onClick={() => toggleSort("createdAt")}
                    >
                      Criado em
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className="w-[100px] text-right">Ativo</TableHead>
                  <TableHead className="w-[100px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  // Esqueleto de carregamento
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      {showInventoryStatus && (
                        <>
                          <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                        </>
                      )}
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                  ))
                ) : productsData?.products?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={showInventoryStatus ? 9 : 7} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Package className="h-10 w-10 mb-2" />
                        <p>Nenhum produto encontrado.</p>
                        <Button 
                          variant="link" 
                          onClick={() => setIsAddProductOpen(true)}
                          className="mt-2"
                        >
                          Adicionar seu primeiro produto
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  productsData?.products?.map((product: any) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {product.imageUrl ? (
                            <img 
                              src={product.imageUrl} 
                              alt={product.name} 
                              className="h-8 w-8 rounded object-cover"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                              <Package className="h-4 w-4" />
                            </div>
                          )}
                          <span className="truncate max-w-[200px]">{product.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(parseFloat(product.price))}</TableCell>
                      <TableCell>
                        {categories?.find((c: any) => c.id === product.categoryId)?.name || 'Sem categoria'}
                      </TableCell>
                      {showInventoryStatus && (
                        <>
                          <TableCell>
                            {product.inventory?.quantity !== undefined ? product.inventory.quantity : "-"}
                          </TableCell>
                          <TableCell>
                            {renderStockStatus(product)}
                          </TableCell>
                        </>
                      )}
                      <TableCell>
                        {new Date(product.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {product.active ? (
                          <Badge variant="default">Ativo</Badge>
                        ) : (
                          <Badge variant="outline">Inativo</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Ações</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleProductAction("edit", product)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleProductAction("view", product)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Visualizar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleProductAction("toggle-status", product)}>
                              {product.active ? (
                                <>
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Desativar
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Ativar
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleProductAction("delete", product)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between px-6 py-4 border-t">
          <div className="text-xs text-muted-foreground">
            {productsData?.total
              ? `Mostrando ${Math.min((currentPage - 1) * itemsPerPage + 1, productsData.total)} a ${Math.min(currentPage * itemsPerPage, productsData.total)} de ${productsData.total} produtos`
              : "Nenhum produto encontrado"
            }
          </div>
          
          {totalPages > 1 && (
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <span className="text-sm">
                Página {currentPage} de {totalPages}
              </span>
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>

      {/* Dialog para adicionar/editar produto */}
      <Dialog open={isAddProductOpen || !!selectedProductId} onOpenChange={(open) => {
        if (!open) {
          setIsAddProductOpen(false);
          setSelectedProductId(null);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <ProductForm 
            productId={selectedProductId || undefined}
            onSuccess={() => {
              setIsAddProductOpen(false);
              setSelectedProductId(null);
              refetchProducts();
            }}
            onCancel={() => {
              setIsAddProductOpen(false);
              setSelectedProductId(null);
            }}
          />
        </DialogContent>
      </Dialog>
      
      {/* Dialog de confirmação para excluir produto */}
      <Dialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o produto <span className="font-medium">{selectedProduct?.name}</span>? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDeleteOpen(false)}>Cancelar</Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmDelete}
              disabled={deleteProductMutation.isPending}
            >
              {deleteProductMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir Produto
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}