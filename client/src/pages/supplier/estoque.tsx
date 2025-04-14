import { useState, useMemo, useEffect } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { UserRole } from "@shared/schema";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loading } from "@/components/ui/loading";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Package, 
  AlertTriangle, 
  Search, 
  ArrowUpDown, 
  Check, 
  X, 
  Boxes,
  RefreshCw,
  Plus,
  ChevronLeft,
  Info,
  Save
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Componente para a barra lateral de navegação do fornecedor
function SupplierSidebar() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold mb-4">Painel do Fornecedor</h2>
      <nav className="space-y-2">
        <Link href="/fornecedor/dashboard" className="flex items-center text-gray-700 hover:text-primary p-2 rounded-md hover:bg-gray-50 font-medium">
          <Package className="mr-2 h-5 w-5" />
          Dashboard
        </Link>
        <Link href="/fornecedor/produtos" className="flex items-center text-gray-700 hover:text-primary p-2 rounded-md hover:bg-gray-50 font-medium">
          <Package className="mr-2 h-5 w-5" />
          Meus Produtos
        </Link>
        <Link href="/fornecedor/estoque" className="flex items-center text-primary p-2 rounded-md bg-primary/10 font-medium">
          <Boxes className="mr-2 h-5 w-5" />
          Gestão de Estoque
        </Link>
      </nav>
    </div>
  );
}

// Interface para o produto com propriedades relacionadas a estoque
interface ProductWithStock {
  id: number;
  name: string;
  price: string;
  stock: number;
  stockStatus: string;
  stockAlert: number | null;
  supplierId: number;
  active: boolean;
  imageUrl?: string;
  categoryId: number;
  categoryName?: string;
  slug: string;
}

export default function SupplierStockManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<number | "all">("all");
  const [stockStatusFilter, setStockStatusFilter] = useState<string | "all">("all");
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof ProductWithStock;
    direction: "asc" | "desc";
  }>({ key: "name", direction: "asc" });
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [batchUpdateData, setBatchUpdateData] = useState({
    stockChange: 0,
    stockAlertChange: 0,
    updateType: "absolute", // "absolute" ou "relative"
    applyToStock: true,
    applyToStockAlert: false
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Buscar produtos do fornecedor atual
  const { 
    data: productsResponse, 
    isLoading: isLoadingProducts,
    refetch: refetchProducts
  } = useQuery({
    queryKey: ["/api/products", { supplierId: user?.id }],
    enabled: !!user?.id && user?.role === UserRole.SUPPLIER,
  });
  
  // Buscar categorias para filtro
  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
  });

  // Processar produtos para garantir que sejam apenas do fornecedor atual
  // e incluir informações de estoque
  const products = useMemo<ProductWithStock[]>(() => {
    if (!productsResponse) return [];
    
    // Converter para array se necessário
    let productsList: any[] = [];
    if (Array.isArray(productsResponse)) {
      productsList = productsResponse;
    } else if (productsResponse.data && Array.isArray(productsResponse.data)) {
      productsList = productsResponse.data;
    } else {
      return [];
    }
    
    const currentUserId = Number(user?.id);
    
    // Filtar apenas produtos do fornecedor atual e mapear para incluir status de estoque
    return productsList
      .filter(product => {
        const productSupplierId = Number(product.supplierId);
        const belongsToCurrentSupplier = productSupplierId === currentUserId;
        
        if (!belongsToCurrentSupplier) {
          console.log(`[Segurança] Produto ID ${product.id} (fornecedor ${productSupplierId}) filtrado - não pertence ao fornecedor atual (${currentUserId})`);
        }
        
        return belongsToCurrentSupplier;
      })
      .map(product => {
        // Determinar status de estoque
        const stock = typeof product.stock === 'number' ? product.stock : 0;
        const stockAlert = typeof product.stockAlert === 'number' ? product.stockAlert : null;
        
        let stockStatus = "normal";
        if (stockAlert !== null) {
          if (stock <= 0) {
            stockStatus = "esgotado";
          } else if (stock <= stockAlert) {
            stockStatus = "baixo";
          }
        } else {
          if (stock <= 0) {
            stockStatus = "esgotado";
          }
        }
        
        // Encontrar nome da categoria
        const category = categories?.find(cat => cat.id === product.categoryId);
        
        return {
          ...product,
          stock,
          stockStatus,
          stockAlert,
          categoryName: category?.name || "Sem categoria"
        };
      });
  }, [productsResponse, categories, user?.id]);
  
  // Filtrar produtos com base nos filtros selecionados
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Filtro de pesquisa por nome
      const matchesSearch = searchTerm === "" || 
        product.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filtro por categoria
      const matchesCategory = categoryFilter === "all" || 
        product.categoryId === categoryFilter;
      
      // Filtro por status de estoque
      const matchesStockStatus = stockStatusFilter === "all" || 
        product.stockStatus === stockStatusFilter;
      
      return matchesSearch && matchesCategory && matchesStockStatus;
    });
  }, [products, searchTerm, categoryFilter, stockStatusFilter]);
  
  // Ordenar produtos
  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue === null || aValue === undefined) return sortConfig.direction === "asc" ? -1 : 1;
      if (bValue === null || bValue === undefined) return sortConfig.direction === "asc" ? 1 : -1;
      
      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortConfig.direction === "asc" 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      // Para valores numéricos
      return sortConfig.direction === "asc" 
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });
  }, [filteredProducts, sortConfig]);
  
  // Paginação
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedProducts, currentPage, itemsPerPage]);
  
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  
  // Função para alternar ordenação
  const handleSort = (key: keyof ProductWithStock) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc"
    });
  };
  
  // Função para selecionar/desselecionar todos os produtos
  useEffect(() => {
    if (selectAll) {
      const newSelected = new Set<number>();
      filteredProducts.forEach(product => newSelected.add(product.id));
      setSelectedProducts(newSelected);
    } else if (selectedProducts.size === filteredProducts.length) {
      // Se o usuário desselecionar "Selecionar todos", limpar seleções
      setSelectedProducts(new Set());
    }
  }, [selectAll, filteredProducts]);
  
  // Verificar se todos os produtos estão selecionados
  useEffect(() => {
    if (filteredProducts.length > 0 && selectedProducts.size === filteredProducts.length) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [selectedProducts, filteredProducts]);
  
  // Função para alternar seleção individual de produto
  const toggleProductSelection = (productId: number) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };
  
  // Mutation para atualizar estoque de produtos individuais
  const updateProductStockMutation = useMutation({
    mutationFn: async (data: { productId: number, stock: number, stockAlert: number | null }) => {
      const response = await apiRequest(
        "PATCH", 
        `/api/products/${data.productId}`, 
        { stock: data.stock, stockAlert: data.stockAlert }
      );
      return await response.json();
    },
    onSuccess: () => {
      // Invalidar consultas para forçar recarregamento
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Estoque atualizado",
        description: "O estoque do produto foi atualizado com sucesso.",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar estoque",
        description: error.message || "Não foi possível atualizar o estoque do produto.",
        variant: "destructive",
      });
    }
  });
  
  // Mutation para atualização em lote de estoque
  const batchUpdateStockMutation = useMutation({
    mutationFn: async () => {
      const updates = Array.from(selectedProducts).map(productId => {
        const product = products.find(p => p.id === productId);
        if (!product) return null;
        
        let newStock = product.stock;
        let newStockAlert = product.stockAlert;
        
        if (batchUpdateData.applyToStock) {
          newStock = batchUpdateData.updateType === "absolute" 
            ? batchUpdateData.stockChange 
            : Math.max(0, product.stock + batchUpdateData.stockChange);
        }
        
        if (batchUpdateData.applyToStockAlert) {
          newStockAlert = batchUpdateData.updateType === "absolute" 
            ? batchUpdateData.stockAlertChange 
            : (product.stockAlert !== null 
               ? Math.max(0, product.stockAlert + batchUpdateData.stockAlertChange)
               : batchUpdateData.stockAlertChange);
        }
        
        return {
          productId,
          stock: newStock,
          stockAlert: newStockAlert
        };
      }).filter(Boolean);
      
      // Executar atualizações em sequência para evitar sobrecarga do servidor
      for (const update of updates) {
        if (!update) continue;
        await updateProductStockMutation.mutateAsync(update);
      }
      
      return { success: true, count: updates.length };
    },
    onSuccess: (data) => {
      // Limpar seleções após atualização bem-sucedida
      setSelectedProducts(new Set());
      setIsUpdateModalOpen(false);
      
      toast({
        title: "Atualização em lote concluída",
        description: `${data.count} produtos foram atualizados com sucesso.`,
        variant: "default",
      });
      
      // Recarregar dados
      refetchProducts();
    },
    onError: (error) => {
      toast({
        title: "Erro na atualização em lote",
        description: error.message || "Não foi possível atualizar os produtos selecionados.",
        variant: "destructive",
      });
    }
  });
  
  // Função para iniciar atualização individual de estoque
  const updateSingleProductStock = (product: ProductWithStock, newStock: number, newStockAlert: number | null) => {
    updateProductStockMutation.mutate({
      productId: product.id,
      stock: newStock,
      stockAlert: newStockAlert
    });
  };
  
  // Obter contagens para o resumo
  const stockSummary = useMemo(() => {
    const lowStockCount = products.filter(p => p.stockStatus === "baixo").length;
    const outOfStockCount = products.filter(p => p.stockStatus === "esgotado").length;
    const noAlertCount = products.filter(p => p.stockAlert === null).length;
    
    return {
      total: products.length,
      lowStock: lowStockCount,
      outOfStock: outOfStockCount,
      noAlert: noAlertCount
    };
  }, [products]);
  
  const renderStockStatusBadge = (status: string) => {
    switch (status) {
      case "esgotado":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <X className="h-3 w-3" />
            <span>Esgotado</span>
          </Badge>
        );
      case "baixo":
        return (
          <Badge variant="warning" className="bg-amber-500 hover:bg-amber-600 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            <span>Baixo</span>
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1">
            <Check className="h-3 w-3" />
            <span>Normal</span>
          </Badge>
        );
    }
  };

  // Formatadores
  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return numValue.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow bg-gray-100 py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="md:col-span-1">
              <SupplierSidebar />
              
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Resumo do Estoque</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total de Produtos:</span>
                    <Badge variant="outline" className="font-semibold">{stockSummary.total}</Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Estoque Baixo:</span>
                    <Badge variant="warning" className="bg-amber-500 hover:bg-amber-600 font-semibold">{stockSummary.lowStock}</Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Esgotados:</span>
                    <Badge variant="destructive" className="font-semibold">{stockSummary.outOfStock}</Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Sem Alerta:</span>
                    <Badge variant="outline" className="font-semibold">{stockSummary.noAlert}</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Main Content */}
            <div className="md:col-span-3 space-y-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div>
                    <Link href="/fornecedor/dashboard">
                      <Button variant="ghost" size="sm" className="mb-2">
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Voltar ao Dashboard
                      </Button>
                    </Link>
                    <h1 className="text-2xl font-bold">Gerenciamento de Estoque</h1>
                    <p className="text-gray-500">
                      Gerencie o estoque e alertas de seus produtos
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {selectedProducts.size > 0 && (
                      <Button
                        variant="default"
                        onClick={() => setIsUpdateModalOpen(true)}
                        className="flex items-center gap-2"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Atualização em Lote ({selectedProducts.size})
                      </Button>
                    )}
                    
                    <Link href="/fornecedor/produtos/novo">
                      <Button className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Novo Produto
                      </Button>
                    </Link>
                  </div>
                </div>
                
                <Tabs defaultValue="all">
                  <TabsList className="mb-4">
                    <TabsTrigger value="all">Todos Produtos</TabsTrigger>
                    <TabsTrigger value="low">Estoque Baixo</TabsTrigger>
                    <TabsTrigger value="out">Esgotados</TabsTrigger>
                  </TabsList>
                  
                  <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <Input
                        placeholder="Buscar produtos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <Select
                        value={categoryFilter.toString()}
                        onValueChange={(value) => setCategoryFilter(value === "all" ? "all" : parseInt(value))}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas Categorias</SelectItem>
                          {categories?.map((category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Select
                        value={stockStatusFilter.toString()}
                        onValueChange={(value) => setStockStatusFilter(value)}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos Status</SelectItem>
                          <SelectItem value="normal">Estoque Normal</SelectItem>
                          <SelectItem value="baixo">Estoque Baixo</SelectItem>
                          <SelectItem value="esgotado">Esgotado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <TabsContent value="all">
                    <StockManagementTable 
                      products={paginatedProducts}
                      isLoading={isLoadingProducts}
                      selectedProducts={selectedProducts}
                      toggleProductSelection={toggleProductSelection}
                      selectAll={selectAll}
                      setSelectAll={setSelectAll}
                      sortConfig={sortConfig}
                      handleSort={handleSort}
                      updateSingleProductStock={updateSingleProductStock}
                      renderStockStatusBadge={renderStockStatusBadge}
                      formatCurrency={formatCurrency}
                      updateStockMutation={updateProductStockMutation}
                    />
                  </TabsContent>
                  
                  <TabsContent value="low">
                    <StockManagementTable 
                      products={paginatedProducts.filter(p => p.stockStatus === "baixo")}
                      isLoading={isLoadingProducts}
                      selectedProducts={selectedProducts}
                      toggleProductSelection={toggleProductSelection}
                      selectAll={selectAll}
                      setSelectAll={setSelectAll}
                      sortConfig={sortConfig}
                      handleSort={handleSort}
                      updateSingleProductStock={updateSingleProductStock}
                      renderStockStatusBadge={renderStockStatusBadge}
                      formatCurrency={formatCurrency}
                      updateStockMutation={updateProductStockMutation}
                    />
                  </TabsContent>
                  
                  <TabsContent value="out">
                    <StockManagementTable 
                      products={paginatedProducts.filter(p => p.stockStatus === "esgotado")}
                      isLoading={isLoadingProducts}
                      selectedProducts={selectedProducts}
                      toggleProductSelection={toggleProductSelection}
                      selectAll={selectAll}
                      setSelectAll={setSelectAll}
                      sortConfig={sortConfig}
                      handleSort={handleSort}
                      updateSingleProductStock={updateSingleProductStock}
                      renderStockStatusBadge={renderStockStatusBadge}
                      formatCurrency={formatCurrency}
                      updateStockMutation={updateProductStockMutation}
                    />
                  </TabsContent>
                </Tabs>
                
                {/* Paginação */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        Anterior
                      </Button>
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </Button>
                      ))}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Próxima
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
      
      {/* Modal de Atualização em Lote */}
      <Dialog open={isUpdateModalOpen} onOpenChange={setIsUpdateModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Atualização em Lote</DialogTitle>
            <DialogDescription>
              Atualizar {selectedProducts.size} produtos selecionados
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 my-4">
            <div className="space-y-2">
              <Select
                value={batchUpdateData.updateType}
                onValueChange={(value) => setBatchUpdateData({
                  ...batchUpdateData,
                  updateType: value as "absolute" | "relative"
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de Atualização" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="absolute">Valor Absoluto (Substituir)</SelectItem>
                  <SelectItem value="relative">Valor Relativo (Adicionar/Subtrair)</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex items-center gap-2 mt-4">
                <Checkbox 
                  id="applyToStock" 
                  checked={batchUpdateData.applyToStock}
                  onCheckedChange={(checked) => 
                    setBatchUpdateData({
                      ...batchUpdateData,
                      applyToStock: checked as boolean
                    })
                  }
                />
                <label
                  htmlFor="applyToStock"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Atualizar Quantidade em Estoque
                </label>
              </div>
              
              {batchUpdateData.applyToStock && (
                <div className="flex flex-col mt-2">
                  <label className="text-sm mb-1">
                    {batchUpdateData.updateType === "absolute" 
                      ? "Nova quantidade em estoque:" 
                      : "Alterar estoque em:"}
                  </label>
                  <div className="flex items-center">
                    <Input
                      type="number"
                      min={batchUpdateData.updateType === "absolute" ? 0 : undefined}
                      value={batchUpdateData.stockChange}
                      onChange={(e) => 
                        setBatchUpdateData({
                          ...batchUpdateData,
                          stockChange: parseInt(e.target.value) || 0
                        })
                      }
                    />
                    {batchUpdateData.updateType === "relative" && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="ml-2">
                              <Info className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Valores positivos aumentam o estoque,<br/>valores negativos diminuem.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-2 mt-4">
                <Checkbox 
                  id="applyToStockAlert" 
                  checked={batchUpdateData.applyToStockAlert}
                  onCheckedChange={(checked) => 
                    setBatchUpdateData({
                      ...batchUpdateData,
                      applyToStockAlert: checked as boolean
                    })
                  }
                />
                <label
                  htmlFor="applyToStockAlert"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Atualizar Nível de Alerta de Estoque
                </label>
              </div>
              
              {batchUpdateData.applyToStockAlert && (
                <div className="flex flex-col mt-2">
                  <label className="text-sm mb-1">
                    {batchUpdateData.updateType === "absolute" 
                      ? "Novo nível de alerta:" 
                      : "Alterar nível de alerta em:"}
                  </label>
                  <div className="flex items-center">
                    <Input
                      type="number"
                      min={batchUpdateData.updateType === "absolute" ? 0 : undefined}
                      value={batchUpdateData.stockAlertChange}
                      onChange={(e) => 
                        setBatchUpdateData({
                          ...batchUpdateData,
                          stockAlertChange: parseInt(e.target.value) || 0
                        })
                      }
                    />
                    {batchUpdateData.updateType === "relative" && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="ml-2">
                              <Info className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Valores positivos aumentam o nível de alerta,<br/>valores negativos diminuem.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setIsUpdateModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => batchUpdateStockMutation.mutate()}
              disabled={batchUpdateStockMutation.isPending || (!batchUpdateData.applyToStock && !batchUpdateData.applyToStockAlert)}
              className="flex items-center gap-2"
            >
              {batchUpdateStockMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Atualizando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Componente da tabela de gerenciamento de estoque
function StockManagementTable({
  products,
  isLoading,
  selectedProducts,
  toggleProductSelection,
  selectAll,
  setSelectAll,
  sortConfig,
  handleSort,
  updateSingleProductStock,
  renderStockStatusBadge,
  formatCurrency,
  updateStockMutation
}: {
  products: ProductWithStock[];
  isLoading: boolean;
  selectedProducts: Set<number>;
  toggleProductSelection: (id: number) => void;
  selectAll: boolean;
  setSelectAll: (value: boolean) => void;
  sortConfig: { key: keyof ProductWithStock; direction: "asc" | "desc" };
  handleSort: (key: keyof ProductWithStock) => void;
  updateSingleProductStock: (product: ProductWithStock, stock: number, stockAlert: number | null) => void;
  renderStockStatusBadge: (status: string) => React.ReactNode;
  formatCurrency: (value: string | number) => string;
  updateStockMutation: any;
}) {
  // Estado para controle de edição de linha
  const [editingProduct, setEditingProduct] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<{
    stock: number;
    stockAlert: number | null;
  }>({ stock: 0, stockAlert: null });
  
  // Iniciar edição de um produto
  const startEditing = (product: ProductWithStock) => {
    setEditingProduct(product.id);
    setEditValues({
      stock: product.stock,
      stockAlert: product.stockAlert
    });
  };
  
  // Cancelar edição
  const cancelEditing = () => {
    setEditingProduct(null);
  };
  
  // Salvar edição
  const saveEditing = (product: ProductWithStock) => {
    updateSingleProductStock(product, editValues.stock, editValues.stockAlert);
    setEditingProduct(null);
  };
  
  const renderSortIcon = (key: keyof ProductWithStock) => {
    if (sortConfig.key !== key) return <ArrowUpDown className="ml-1 h-3 w-3" />;
    
    return sortConfig.direction === "asc" 
      ? <ChevronLeft className="ml-1 h-3 w-3 rotate-90" /> 
      : <ChevronLeft className="ml-1 h-3 w-3 -rotate-90" />;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loading size="lg" />
      </div>
    );
  }
  
  if (products.length === 0) {
    return (
      <div className="text-center py-8 border rounded-lg">
        <p className="text-gray-500 mb-2">Nenhum produto encontrado com os filtros atuais.</p>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          Recarregar
        </Button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table className="border">
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={selectAll}
                onCheckedChange={setSelectAll}
                aria-label="Selecionar todos"
              />
            </TableHead>
            <TableHead className="w-16">ID</TableHead>
            <TableHead>
              <button 
                className="flex items-center font-semibold"
                onClick={() => handleSort("name")}
              >
                Produto
                {renderSortIcon("name")}
              </button>
            </TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>
              <button 
                className="flex items-center font-semibold"
                onClick={() => handleSort("price")}
              >
                Preço
                {renderSortIcon("price")}
              </button>
            </TableHead>
            <TableHead>
              <button 
                className="flex items-center font-semibold"
                onClick={() => handleSort("stock")}
              >
                Em Estoque
                {renderSortIcon("stock")}
              </button>
            </TableHead>
            <TableHead>
              <button 
                className="flex items-center font-semibold"
                onClick={() => handleSort("stockAlert")}
              >
                Nível de Alerta
                {renderSortIcon("stockAlert")}
              </button>
            </TableHead>
            <TableHead>
              <button 
                className="flex items-center font-semibold"
                onClick={() => handleSort("stockStatus")}
              >
                Status
                {renderSortIcon("stockStatus")}
              </button>
            </TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id} className={product.stockStatus === "esgotado" ? "bg-red-50" : (product.stockStatus === "baixo" ? "bg-amber-50" : "")}>
              <TableCell>
                <Checkbox
                  checked={selectedProducts.has(product.id)}
                  onCheckedChange={() => toggleProductSelection(product.id)}
                  aria-label={`Selecionar ${product.name}`}
                />
              </TableCell>
              <TableCell className="font-medium">{product.id}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-8 h-8 object-cover rounded"
                      onError={(e) => {
                        e.currentTarget.src = "https://via.placeholder.com/32";
                      }}
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                      <Package className="h-4 w-4 text-gray-500" />
                    </div>
                  )}
                  <div className="font-medium">{product.name}</div>
                </div>
              </TableCell>
              <TableCell>{product.categoryName}</TableCell>
              <TableCell>{formatCurrency(product.price)}</TableCell>
              <TableCell>
                {editingProduct === product.id ? (
                  <Input
                    type="number"
                    min="0"
                    value={editValues.stock}
                    onChange={(e) => setEditValues({ ...editValues, stock: parseInt(e.target.value) || 0 })}
                    className="w-24"
                  />
                ) : (
                  <Badge variant={product.stock <= 0 ? "destructive" : (product.stockAlert !== null && product.stock <= product.stockAlert ? "warning" : "outline")}>
                    {product.stock}
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                {editingProduct === product.id ? (
                  <Input
                    type="number"
                    min="0"
                    value={editValues.stockAlert === null ? "" : editValues.stockAlert}
                    onChange={(e) => setEditValues({ 
                      ...editValues, 
                      stockAlert: e.target.value === "" ? null : (parseInt(e.target.value) || 0)
                    })}
                    className="w-24"
                    placeholder="Sem alerta"
                  />
                ) : (
                  <Badge variant="outline">
                    {product.stockAlert === null ? "Não definido" : product.stockAlert}
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                {renderStockStatusBadge(product.stockStatus)}
              </TableCell>
              <TableCell className="text-right">
                {editingProduct === product.id ? (
                  <div className="flex justify-end gap-2">
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={cancelEditing}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => saveEditing(product)}
                      disabled={updateStockMutation.isPending}
                    >
                      {updateStockMutation.isPending ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => startEditing(product)}
                  >
                    Editar
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}