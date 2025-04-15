import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { 
  PlusCircle, 
  AlarmClock, 
  History, 
  RotateCcw, 
  Search, 
  Filter, 
  Package, 
  Bell, 
  ArrowUpDown,
  AlertTriangle,
  Check,
  X,
  ShoppingCart,
  Info,
  List
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { SupplierSidebar } from "@/components/supplier/supplier-sidebar";
import { Progress } from "@/components/ui/progress";
import { StockStatusSummary } from "@/components/dashboard/stock-status-summary";
import { Pagination } from "@/components/ui/pagination";
import { BulkInventoryUpdate } from "@/components/supplier/bulk-inventory-update";
import { InventoryAlerts } from "@/components/supplier/inventory-alerts";
import { InventoryHistory } from "@/components/supplier/inventory-history";
import { apiRequest } from "@/lib/queryClient";

export default function GerenciamentoInventario() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("estoque");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [newQuantity, setNewQuantity] = useState("");
  const [updateReason, setUpdateReason] = useState("");
  const [itemsPerPage] = useState(10);

  // Buscar produtos e inventário do fornecedor
  const { 
    data: inventoryData, 
    isLoading: isLoadingInventory,
    refetch: refetchInventory
  } = useQuery({
    queryKey: ["/api/supplier/inventory", { status: selectedStatus }],
    enabled: !!user?.id,
  });

  // Agrupar itens para paginação
  const currentItems = inventoryData?.filter((item: any) => {
    if (!searchTerm) return true;
    return (
      item.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.productId?.toString().includes(searchTerm)
    );
  }) || [];

  // Estado do estoque
  const stockStats = {
    total: currentItems.length,
    inStock: currentItems.filter((item: any) => item.status === "in_stock").length,
    lowStock: currentItems.filter((item: any) => item.status === "low_stock").length,
    outOfStock: currentItems.filter((item: any) => item.status === "out_of_stock").length,
    backOrder: currentItems.filter((item: any) => item.status === "back_order").length,
    discontinued: currentItems.filter((item: any) => item.status === "discontinued").length,
  };

  // Mutação para atualizar inventário individual
  const updateInventoryMutation = useMutation({
    mutationFn: async ({ productId, quantity, reason }: { productId: number, quantity: number, reason: string }) => {
      const res = await apiRequest("PUT", `/api/supplier/inventory/${productId}`, {
        quantity,
        notes: reason || "Atualização manual"
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Estoque atualizado",
        description: "A quantidade em estoque foi atualizada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/supplier/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/supplier/inventory/stats"] });
      setIsUpdateDialogOpen(false);
      setSelectedProduct(null);
      setNewQuantity("");
      setUpdateReason("");
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar estoque",
        description: error.message || "Ocorreu um erro ao atualizar o estoque. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  // Função para abrir diálogo de atualização
  const handleUpdateClick = (product: any) => {
    setSelectedProduct(product);
    setNewQuantity(product.quantity.toString());
    setIsUpdateDialogOpen(true);
  };

  // Função para realizar atualização
  const handleUpdateSubmit = () => {
    if (!selectedProduct) return;
    
    const quantity = parseInt(newQuantity);
    
    if (isNaN(quantity) || quantity < 0) {
      toast({
        title: "Quantidade inválida",
        description: "Por favor, insira um número válido maior ou igual a zero.",
        variant: "destructive",
      });
      return;
    }
    
    updateInventoryMutation.mutate({
      productId: selectedProduct.productId,
      quantity,
      reason: updateReason
    });
  };

  // Formatar data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Mapear status para badges
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "in_stock":
        return <Badge variant="success">Em estoque</Badge>;
      case "low_stock":
        return <Badge variant="warning">Estoque baixo</Badge>;
      case "out_of_stock":
        return <Badge variant="destructive">Sem estoque</Badge>;
      case "back_order":
        return <Badge variant="secondary">Em espera</Badge>;
      case "discontinued":
        return <Badge variant="outline">Descontinuado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Calcular índices para paginação
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedItems = currentItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(currentItems.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  useEffect(() => {
    // Resetar a página atual quando o termo de busca muda
    setCurrentPage(1);
  }, [searchTerm, selectedStatus]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex-grow bg-gray-100 py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <aside className="md:col-span-1">
              <SupplierSidebar />
            </aside>
            
            <div className="md:col-span-3 space-y-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h1 className="text-2xl font-bold mb-2 flex items-center">
                  <Package className="mr-2 h-6 w-6 text-primary" />
                  Gerenciamento de Estoque
                </h1>
                <p className="text-gray-500 mb-4">
                  Monitore e gerencie o estoque de todos os seus produtos em um só lugar.
                </p>
                
                <StockStatusSummary />
                
                <Tabs defaultValue="estoque" className="mt-6" value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid grid-cols-3 mb-6">
                    <TabsTrigger value="estoque" className="flex items-center">
                      <Package className="mr-2 h-4 w-4" />
                      Estoque Atual
                    </TabsTrigger>
                    <TabsTrigger value="alertas" className="flex items-center">
                      <Bell className="mr-2 h-4 w-4" />
                      Alertas
                    </TabsTrigger>
                    <TabsTrigger value="historico" className="flex items-center">
                      <History className="mr-2 h-4 w-4" />
                      Histórico
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="estoque" className="space-y-4">
                    <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input 
                          placeholder="Buscar por nome ou ID do produto..." 
                          className="pl-10"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                          <SelectTrigger className="w-[180px]">
                            <div className="flex items-center">
                              <Filter className="mr-2 h-4 w-4" />
                              <span>{selectedStatus ? 'Filtrar por status' : 'Todos os status'}</span>
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Todos</SelectItem>
                            <SelectItem value="in_stock">Em estoque</SelectItem>
                            <SelectItem value="low_stock">Estoque baixo</SelectItem>
                            <SelectItem value="out_of_stock">Sem estoque</SelectItem>
                            <SelectItem value="back_order">Em espera</SelectItem>
                            <SelectItem value="discontinued">Descontinuado</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <BulkInventoryUpdate 
                          onSuccess={() => {
                            refetchInventory();
                            toast({
                              title: "Estoque atualizado em massa",
                              description: "Todos os produtos selecionados foram atualizados com sucesso.",
                            });
                          }}
                        />
                      </div>
                    </div>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Inventário de Produtos</CardTitle>
                        <CardDescription>
                          Visualize e gerencie o estoque de todos os seus produtos. 
                          {stockStats.total > 0 && (
                            <span className="font-medium">
                              {" "}Total: {stockStats.total} produtos, 
                              {" "}{stockStats.inStock} em estoque, 
                              {" "}{stockStats.lowStock} com estoque baixo, 
                              {" "}{stockStats.outOfStock} sem estoque
                            </span>
                          )}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {isLoadingInventory ? (
                          <div className="space-y-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <div key={i} className="flex items-center space-x-4">
                                <Skeleton className="h-12 w-12 rounded-md" />
                                <div className="space-y-2">
                                  <Skeleton className="h-4 w-[250px]" />
                                  <Skeleton className="h-4 w-[200px]" />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : paginatedItems.length > 0 ? (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Produto</TableHead>
                                <TableHead>Quantidade</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Última Atualização</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {paginatedItems.map((item: any) => (
                                <TableRow key={item.id}>
                                  <TableCell className="font-medium">
                                    <div className="flex items-center">
                                      {item.productImage ? (
                                        <img 
                                          src={item.productImage} 
                                          alt={item.productName} 
                                          className="w-10 h-10 object-cover mr-3 rounded-md"
                                        />
                                      ) : (
                                        <div className="w-10 h-10 bg-gray-200 rounded-md flex items-center justify-center mr-3">
                                          <Package className="h-5 w-5 text-gray-500" />
                                        </div>
                                      )}
                                      <div>
                                        <p className="font-medium">{item.productName}</p>
                                        <p className="text-sm text-gray-500">ID: {item.productId}</p>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center">
                                      <span className={`font-semibold ${
                                        item.status === "out_of_stock" ? "text-red-500" :
                                        item.status === "low_stock" ? "text-amber-500" :
                                        "text-green-500"
                                      }`}>
                                        {item.quantity}
                                      </span>
                                      
                                      {item.lowStockThreshold > 0 && (
                                        <div className="ml-2 text-xs text-gray-500">
                                          (Min: {item.lowStockThreshold})
                                        </div>
                                      )}
                                    </div>
                                    
                                    {item.lowStockThreshold > 0 && (
                                      <Progress 
                                        value={Math.min((item.quantity / item.restockLevel) * 100, 100)} 
                                        className="h-1.5 mt-1"
                                        color={
                                          item.status === "out_of_stock" ? "bg-red-500" :
                                          item.status === "low_stock" ? "bg-amber-500" :
                                          "bg-green-500"
                                        }
                                      />
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {getStatusBadge(item.status)}
                                  </TableCell>
                                  <TableCell>
                                    {formatDate(item.lastUpdated || item.createdAt)}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleUpdateClick(item)}
                                    >
                                      Atualizar
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-8 text-center">
                            <Package className="h-12 w-12 text-gray-300 mb-2" />
                            <h3 className="text-lg font-medium">Nenhum item encontrado</h3>
                            <p className="text-gray-500 mt-1">
                              {searchTerm ? 
                                `Não encontramos produtos correspondentes a "${searchTerm}"` : 
                                "Não existem produtos no inventário que correspondam ao filtro selecionado."
                              }
                            </p>
                          </div>
                        )}
                      </CardContent>
                      
                      {paginatedItems.length > 0 && totalPages > 1 && (
                        <CardFooter className="border-t pt-6 flex justify-center">
                          <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={paginate}
                          />
                        </CardFooter>
                      )}
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="alertas">
                    <InventoryAlerts 
                      onReadAlert={() => {
                        queryClient.invalidateQueries({ queryKey: ["/api/supplier/inventory/alerts"] });
                      }}
                      onResolveAlert={() => {
                        queryClient.invalidateQueries({ queryKey: ["/api/supplier/inventory/alerts"] });
                        queryClient.invalidateQueries({ queryKey: ["/api/supplier/inventory"] });
                      }}
                    />
                  </TabsContent>
                  
                  <TabsContent value="historico">
                    <InventoryHistory />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atualizar Estoque</DialogTitle>
            <DialogDescription>
              Atualize a quantidade em estoque para o produto selecionado.
            </DialogDescription>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {selectedProduct.productImage ? (
                  <img 
                    src={selectedProduct.productImage} 
                    alt={selectedProduct.productName} 
                    className="w-16 h-16 object-cover rounded-md"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center">
                    <Package className="h-8 w-8 text-gray-500" />
                  </div>
                )}
                
                <div>
                  <h3 className="font-semibold text-lg">{selectedProduct.productName}</h3>
                  <p className="text-sm text-gray-500">ID: {selectedProduct.productId}</p>
                </div>
              </div>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="current-quantity" className="text-right">
                    Quantidade Atual
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="current-quantity"
                      value={selectedProduct.quantity}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="new-quantity" className="text-right">
                    Nova Quantidade
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="new-quantity"
                      type="number"
                      min="0"
                      value={newQuantity}
                      onChange={(e) => setNewQuantity(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="reason" className="text-right">
                    Motivo
                  </Label>
                  <div className="col-span-3">
                    <Select value={updateReason} onValueChange={setUpdateReason}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um motivo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Reposição de estoque">Reposição de estoque</SelectItem>
                        <SelectItem value="Ajuste de inventário">Ajuste de inventário</SelectItem>
                        <SelectItem value="Devolução">Devolução</SelectItem>
                        <SelectItem value="Perdas/Danos">Perdas/Danos</SelectItem>
                        <SelectItem value="Correção de erro">Correção de erro</SelectItem>
                        <SelectItem value="Outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpdateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleUpdateSubmit}
              disabled={updateInventoryMutation.isPending}
            >
              {updateInventoryMutation.isPending ? "Atualizando..." : "Atualizar Estoque"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
}