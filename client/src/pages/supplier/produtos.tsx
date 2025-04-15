import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
// Importação do layout do fornecedor
import { SupplierLayout } from "@/components/layouts/supplier-layout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ProductForm } from "@/components/supplier/product-form";
import { 
  Loader2, 
  Plus, 
  Package, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye, 
  ArrowUpDown, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Archive,
  FileUp,
  FileDown,
  RefreshCw,
  Layers,
  Tag
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProdutosPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [openedProductId, setOpenedProductId] = useState<number | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [productToDelete, setProductToDelete] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("todos");

  // Buscar produtos do fornecedor usando a API de produtos por fornecedor
  const { 
    data: productsData, 
    isLoading: isLoadingProducts,
    refetch: refetchProducts,
    error: productsError
  } = useQuery({
    queryKey: [`/api/suppliers/${user?.id}/products`, currentPage, sortBy, sortOrder, searchQuery, categoryFilter, statusFilter],
    enabled: !!user?.id,
    queryFn: async () => {
      try {
        // Log para debug
        console.log(`Carregando produtos para o fornecedor ID ${user?.id}`);
        
        // Usando a API de produtos do fornecedor atual que sabemos que está funcionando (conforme visto nos logs do console)
        const url = `/api/suppliers/${user?.id}/products?page=${currentPage}&limit=${itemsPerPage}&sort=${sortBy}&order=${sortOrder}&search=${searchQuery}${categoryFilter ? `&category=${categoryFilter}` : ""}${statusFilter ? `&status=${statusFilter}` : ""}`;
        
        const res = await apiRequest("GET", url);
        
        if (!res.ok) {
          throw new Error(`Erro ao buscar produtos: ${res.status} ${res.statusText}`);
        }
        
        const data = await res.json();
        console.log("Produtos carregados:", data);
        
        // Formatar resposta no formato esperado pela interface
        return {
          products: Array.isArray(data) ? data : [],
          pagination: {
            currentPage,
            totalPages: Math.ceil((Array.isArray(data) ? data.length : 0) / itemsPerPage),
            totalItems: Array.isArray(data) ? data.length : 0
          }
        };
      } catch (error) {
        console.error("Erro ao carregar produtos:", error);
        throw error;
      }
    },
  });

  // Buscar categorias
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
    enabled: !!user?.id,
  });

  // Mutation para excluir produto
  const deleteMutation = useMutation({
    mutationFn: async (productId: number) => {
      if (!user?.id) {
        throw new Error("ID do usuário não encontrado");
      }
      
      console.log(`Excluindo produto ID ${productId} do fornecedor ID ${user.id}`);
      
      // Usar o endpoint correto para exclusão de produtos
      const res = await apiRequest("DELETE", `/api/suppliers/${user.id}/products/${productId}`);
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Erro ao excluir produto");
      }
      
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Produto excluído",
        description: "O produto foi excluído com sucesso.",
        variant: "default",
      });
      
      // Atualizar a consulta correta após exclusão
      queryClient.invalidateQueries({ queryKey: [`/api/suppliers/${user?.id}/products`] });
      setShowDeleteDialog(false);
      setProductToDelete(null);
    },
    onError: (error: Error) => {
      console.error("Erro na exclusão do produto:", error);
      toast({
        title: "Erro ao excluir",
        description: error.message || "Não foi possível excluir o produto. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  // Manipuladores de eventos
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset para a primeira página ao buscar
  };

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value);
    setCurrentPage(1);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleDeleteClick = (productId: number) => {
    setProductToDelete(productId);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = () => {
    if (productToDelete) {
      deleteMutation.mutate(productToDelete);
    }
  };

  const handleEditClick = (product: any) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleAddClick = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  const handleFormClose = (saved: boolean) => {
    setIsFormOpen(false);
    setEditingProduct(null);
    if (saved) {
      refetchProducts();
    }
  };

  // Para filtragem baseada na aba ativa
  const filteredProducts = useMemo(() => {
    if (!productsData?.products) return [];
    
    let filtered = [...productsData.products];
    
    if (activeTab === "ativos") {
      filtered = filtered.filter(product => product.active);
    } else if (activeTab === "inativos") {
      filtered = filtered.filter(product => !product.active);
    } else if (activeTab === "estoque-baixo") {
      filtered = filtered.filter(product => 
        product.inventory && 
        (product.inventory.status === "low_stock" || product.inventory.quantity <= (product.inventory.lowStockThreshold || 10))
      );
    } else if (activeTab === "sem-estoque") {
      filtered = filtered.filter(product => 
        product.inventory && 
        (product.inventory.status === "out_of_stock" || product.inventory.quantity === 0)
      );
    }
    
    return filtered;
  }, [productsData, activeTab]);

  // Renderizar estados de carregamento
  const renderLoading = () => {
    return Array(5).fill(0).map((_, index) => (
      <TableRow key={`skeleton-${index}`}>
        <TableCell>
          <Skeleton className="h-4 w-8 rounded-full" />
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded" />
            <Skeleton className="h-4 w-40" />
          </div>
        </TableCell>
        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
        <TableCell><Skeleton className="h-4 w-20 rounded-full" /></TableCell>
        <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
      </TableRow>
    ));
  };

  // Renderizar estado de produto vazio
  const renderEmptyState = () => (
    <TableRow>
      <TableCell colSpan={6} className="h-32 text-center">
        <div className="flex flex-col items-center justify-center">
          <Package className="h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-lg font-medium">Nenhum produto encontrado</p>
          <p className="text-sm text-muted-foreground mb-4">
            {searchQuery || categoryFilter || statusFilter
              ? "Tente ajustar os filtros de busca"
              : "Você ainda não tem produtos cadastrados"}
          </p>
          <Button onClick={handleAddClick}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Produto
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );

  return (
    <SupplierLayout>
      <div className="container mx-auto py-6 px-4 md:px-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">Gerenciamento de Produtos</h1>
            <p className="text-muted-foreground">
              Adicione, edite e gerencie seus produtos
            </p>
          </div>
          <Button onClick={handleAddClick} className="ml-auto">
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Produto
          </Button>
        </div>

        <Tabs defaultValue="todos" value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5">
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="ativos">Ativos</TabsTrigger>
            <TabsTrigger value="inativos">Inativos</TabsTrigger>
            <TabsTrigger value="estoque-baixo">Estoque Baixo</TabsTrigger>
            <TabsTrigger value="sem-estoque">Sem Estoque</TabsTrigger>
          </TabsList>
        </Tabs>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="flex-1 w-full lg:max-w-sm">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar produtos..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={handleSearchChange}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                <div className="w-full sm:w-auto">
                  <Select value={categoryFilter} onValueChange={handleCategoryChange}>
                    <SelectTrigger className="min-w-[150px]">
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas Categorias</SelectItem>
                      {Array.isArray(categories) && categories.map((category: any) => (
                        <SelectItem key={category.id} value={String(category.id)}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="w-full sm:w-auto">
                  <Select value={statusFilter} onValueChange={handleStatusChange}>
                    <SelectTrigger className="min-w-[150px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos Status</SelectItem>
                      <SelectItem value="active">Ativos</SelectItem>
                      <SelectItem value="inactive">Inativos</SelectItem>
                      <SelectItem value="low-stock">Estoque Baixo</SelectItem>
                      <SelectItem value="out-of-stock">Sem Estoque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="w-full sm:w-auto ml-auto">
                  <Button variant="outline" size="icon" onClick={() => refetchProducts()}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">ID</TableHead>
                    <TableHead className="min-w-[200px]">
                      <div 
                        className="flex items-center gap-1 cursor-pointer" 
                        onClick={() => handleSort("name")}
                      >
                        Produto
                        {sortBy === "name" && (
                          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="text-right">
                      <div 
                        className="flex items-center justify-end gap-1 cursor-pointer" 
                        onClick={() => handleSort("price")}
                      >
                        Preço
                        {sortBy === "price" && (
                          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Estoque</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingProducts ? (
                    renderLoading()
                  ) : !filteredProducts.length ? (
                    renderEmptyState()
                  ) : (
                    filteredProducts.map((product: any) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.id}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded bg-muted flex items-center justify-center overflow-hidden">
                              {product.imageUrl ? (
                                <img 
                                  src={product.imageUrl} 
                                  alt={product.name} 
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <Package className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-xs text-muted-foreground">
                                SKU: {product.sku || `PROD-${product.id}`}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div>
                            {formatCurrency(product.price)}
                          </div>
                          {product.originalPrice && (
                            <div className="text-xs text-muted-foreground line-through">
                              {formatCurrency(product.originalPrice)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {product.inventory ? (
                            <div>
                              <div className="font-medium">{product.inventory.quantity}</div>
                              <div className="text-xs text-muted-foreground">
                                {product.inventory.quantity <= (product.inventory.lowStockThreshold || 10) 
                                  ? 'Baixo' 
                                  : 'Normal'}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Não rastreado</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {product.active ? (
                            <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              Ativo
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-100">
                              <XCircle className="mr-1 h-3 w-3" />
                              Inativo
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                                <span className="sr-only">Abrir menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleEditClick(product)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => window.open(`/produtos/${product.id}/fornecedor/${user?.id}`, '_blank')}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Visualizar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-red-600 focus:text-red-600" 
                                onClick={() => handleDeleteClick(product.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
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
            
            {/* Paginação */}
            {productsData?.pagination?.totalPages > 1 && (
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-muted-foreground">
                  Mostrando {Math.min((currentPage - 1) * itemsPerPage + 1, productsData.pagination.totalItems)} - {Math.min(currentPage * itemsPerPage, productsData.pagination.totalItems)} de {productsData.pagination.totalItems} produtos
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  {Array.from({ length: productsData.pagination.totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === productsData.pagination.totalPages}
                  >
                    Próximo
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex-col gap-3 sm:flex-row items-start">
            <Button variant="outline" className="flex items-center" disabled>
              <FileUp className="mr-2 h-4 w-4" />
              Importar Produtos
            </Button>
            <Button variant="outline" className="flex items-center" disabled>
              <FileDown className="mr-2 h-4 w-4" />
              Exportar Lista
            </Button>
            <div className="ml-auto flex items-center gap-2">
              <Label htmlFor="per-page" className="text-sm">Itens por página:</Label>
              <Select 
                value={String(itemsPerPage)} 
                onValueChange={(value) => {
                  setItemsPerPage(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger id="per-page" className="h-8 w-[70px]">
                  <SelectValue placeholder={itemsPerPage} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardFooter>
        </Card>

        {/* Modal de formulário de produto */}
        {isFormOpen && (
          <Dialog open={isFormOpen} onOpenChange={(open) => !open && handleFormClose(false)}>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? "Editar Produto" : "Adicionar Novo Produto"}
                </DialogTitle>
                <DialogDescription>
                  Preencha os campos abaixo com os detalhes do produto
                </DialogDescription>
              </DialogHeader>
              <ProductForm 
                productId={editingProduct?.id}
                product={editingProduct} 
                onSave={() => handleFormClose(true)}
                onCancel={() => handleFormClose(false)}
              />
            </DialogContent>
          </Dialog>
        )}

        {/* Diálogo de confirmação de exclusão */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Isso excluirá permanentemente o produto 
                e removerá os dados de nossos servidores.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteConfirm}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  "Sim, excluir produto"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </SupplierLayout>
  );
}