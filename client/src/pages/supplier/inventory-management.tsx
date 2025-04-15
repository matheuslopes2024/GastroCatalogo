import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { BulkInventoryUpdate } from "@/components/supplier/bulk-inventory-update";
import { InventoryAlerts } from "@/components/supplier/inventory-alerts";
import { InventoryHistory } from "@/components/supplier/inventory-history";
import { 
  Package, 
  AlertCircle, 
  Clock, 
  FileSpreadsheet, 
  ArrowUpDown,
  Search,
  Filter,
  RefreshCw
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

// Enum para status de inventário
export enum InventoryStatus {
  IN_STOCK = "in_stock",
  LOW_STOCK = "low_stock",
  OUT_OF_STOCK = "out_of_stock",
  DISCONTINUED = "discontinued",
  BACKORDER = "back_order"
}

// Interface para informações de inventário
export interface ProductInventory {
  id: number;
  productId: number;
  supplierId: number;
  quantity: number;
  status: InventoryStatus;
  lowStockThreshold: number;
  restockLevel: number;
  reservedQuantity: number;
  location: string | null;
  batchNumber: string | null;
  expirationDate: string | null;
  notes: string | null;
  createdAt: string;
  lastUpdated: string;
  productName?: string;
  productSlug?: string;
  productCategory?: string;
  productImage?: string;
}

// Interface para alerta de estoque
export interface StockAlert {
  id: number;
  productId: number;
  supplierId: number;
  message: string;
  quantity: number | null;
  alertType: string;
  isRead: boolean;
  resolvedAt: string | null;
  resolvedBy: number | null;
  previousQuantity: number | null;
  createdAt: string;
  priority: number;
  productName?: string;
  productImage?: string;
}

// Interface para histórico de inventário
export interface InventoryHistory {
  id: number;
  productId: number;
  supplierId: number;
  action: string;
  userId: number;
  quantityBefore: number;
  quantityAfter: number;
  notes: string | null;
  reason: string | null;
  batchId: string | null;
  createdAt: string;
  productName?: string;
  userName?: string;
}

// Schema de validação para atualização de inventário
const updateInventorySchema = z.object({
  quantity: z.number().int().min(0, "A quantidade não pode ser negativa"),
  status: z.string(),
  lowStockThreshold: z.number().int().min(0, "O limite de estoque baixo não pode ser negativo"),
  restockLevel: z.number().int().min(0, "O nível de reabastecimento não pode ser negativo"),
  reservedQuantity: z.number().int().min(0, "A quantidade reservada não pode ser negativa").optional(),
  location: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

type UpdateInventoryFormValues = z.infer<typeof updateInventorySchema>;

const InventoryManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("quantity-asc");
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [selectedInventory, setSelectedInventory] = useState<ProductInventory | null>(null);

  // Fetch inventory data for supplier
  const { data: inventoryItems, isLoading: isLoadingInventory, refetch: refetchInventory } = useQuery<ProductInventory[]>({
    queryKey: ['/api/supplier/inventory'],
    enabled: !!user?.id,
  });

  // Count alerts
  const { data: alertsCount } = useQuery<number>({
    queryKey: ['/api/supplier/inventory/alerts/count'],
    enabled: !!user?.id,
  });

  // Mutation for updating inventory
  const updateInventoryMutation = useMutation({
    mutationFn: async (data: { productId: number; inventoryData: Partial<ProductInventory> }) => {
      const response = await apiRequest(
        "PATCH", 
        `/api/supplier/inventory/${data.productId}`,
        data.inventoryData
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/supplier/inventory'] });
      toast({
        title: "Inventário atualizado",
        description: "As informações de estoque foram atualizadas com sucesso.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar inventário",
        description: error.message || "Não foi possível atualizar o inventário. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Form for updating inventory
  const form = useForm<UpdateInventoryFormValues>({
    resolver: zodResolver(updateInventorySchema),
    defaultValues: {
      quantity: 0,
      status: InventoryStatus.IN_STOCK,
      lowStockThreshold: 10,
      restockLevel: 50,
      reservedQuantity: 0,
      location: null,
      notes: null,
    },
  });

  // Effect to populate form when selecting an inventory item
  useEffect(() => {
    if (selectedInventory) {
      form.reset({
        quantity: selectedInventory.quantity,
        status: selectedInventory.status,
        lowStockThreshold: selectedInventory.lowStockThreshold,
        restockLevel: selectedInventory.restockLevel,
        reservedQuantity: selectedInventory.reservedQuantity || 0,
        location: selectedInventory.location,
        notes: selectedInventory.notes,
      });
    }
  }, [selectedInventory, form]);

  // Handle opening inventory update dialog
  const handleOpenInventoryDialog = (inventory: ProductInventory) => {
    setSelectedProductId(inventory.productId);
    setSelectedInventory(inventory);
  };

  // Handle inventory update submission
  const onSubmit = (data: UpdateInventoryFormValues) => {
    if (!selectedProductId) return;

    updateInventoryMutation.mutate({
      productId: selectedProductId,
      inventoryData: data
    });
    
    // Close dialog after submission
    setSelectedProductId(null);
    setSelectedInventory(null);
  };

  // Filter and sort inventory items
  const filteredInventory = inventoryItems 
    ? inventoryItems
        .filter(item => {
          const matchesSearch = !searchTerm || 
            (item.productName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
             item.productSlug?.toLowerCase().includes(searchTerm.toLowerCase()));
          
          const matchesStatus = statusFilter === "all" || item.status === statusFilter;
          
          return matchesSearch && matchesStatus;
        })
        .sort((a, b) => {
          switch (sortBy) {
            case "name-asc":
              return (a.productName || "").localeCompare(b.productName || "");
            case "name-desc":
              return (b.productName || "").localeCompare(a.productName || "");
            case "quantity-asc":
              return a.quantity - b.quantity;
            case "quantity-desc":
              return b.quantity - a.quantity;
            case "updated-asc":
              return new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime();
            case "updated-desc":
              return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
            default:
              return a.quantity - b.quantity;
          }
        })
    : [];

  // Calculate stats
  const totalProducts = filteredInventory?.length || 0;
  const lowStockProducts = filteredInventory?.filter(item => 
    item.status === InventoryStatus.LOW_STOCK || 
    item.quantity <= item.lowStockThreshold
  ).length || 0;
  const outOfStockProducts = filteredInventory?.filter(item => 
    item.status === InventoryStatus.OUT_OF_STOCK || 
    item.quantity === 0
  ).length || 0;

  // Get status badge style
  const getStatusBadge = (status: InventoryStatus, quantity: number, threshold: number) => {
    if (status === InventoryStatus.OUT_OF_STOCK || quantity === 0) {
      return <Badge variant="destructive">Esgotado</Badge>;
    } else if (status === InventoryStatus.LOW_STOCK || quantity <= threshold) {
      return <Badge variant="warning">Estoque Baixo</Badge>;
    } else if (status === InventoryStatus.DISCONTINUED) {
      return <Badge variant="outline">Descontinuado</Badge>;
    } else if (status === InventoryStatus.BACKORDER) {
      return <Badge variant="secondary">Em Espera</Badge>;
    } else {
      return <Badge variant="success">Em Estoque</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gerenciamento de Estoque</h1>
          <p className="text-muted-foreground">
            Controle do inventário, alertas e histórico de estoque dos seus produtos
          </p>
        </div>
        <Button 
          onClick={() => refetchInventory()} 
          variant="outline" 
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar Dados
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Produtos</CardTitle>
            <CardDescription>Total de produtos cadastrados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{totalProducts}</div>
              <Package className="h-8 w-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Estoque Baixo</CardTitle>
            <CardDescription>Produtos com estoque abaixo do limite</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-amber-600">{lowStockProducts}</div>
              <AlertCircle className="h-8 w-8 text-amber-600/60" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Alertas</CardTitle>
            <CardDescription>Alertas ativos de estoque</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-red-600">{alertsCount ?? '0'}</div>
              <Clock className="h-8 w-8 text-red-600/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="inventory" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Inventário
          </TabsTrigger>
          <TabsTrigger value="bulk-update" className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Atualização em Massa
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Alertas de Estoque
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar produtos por nome..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <span className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <SelectValue placeholder="Filtrar por status" />
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value={InventoryStatus.IN_STOCK}>Em estoque</SelectItem>
                  <SelectItem value={InventoryStatus.LOW_STOCK}>Estoque baixo</SelectItem>
                  <SelectItem value={InventoryStatus.OUT_OF_STOCK}>Esgotado</SelectItem>
                  <SelectItem value={InventoryStatus.BACKORDER}>Em espera</SelectItem>
                  <SelectItem value={InventoryStatus.DISCONTINUED}>Descontinuado</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <span className="flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4" />
                    <SelectValue placeholder="Ordenar por" />
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name-asc">Nome (A-Z)</SelectItem>
                  <SelectItem value="name-desc">Nome (Z-A)</SelectItem>
                  <SelectItem value="quantity-asc">Quantidade (Menor-Maior)</SelectItem>
                  <SelectItem value="quantity-desc">Quantidade (Maior-Menor)</SelectItem>
                  <SelectItem value="updated-asc">Atualização (Mais antiga)</SelectItem>
                  <SelectItem value="updated-desc">Atualização (Mais recente)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoadingInventory ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="w-full h-16" />
              ))}
            </div>
          ) : filteredInventory.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Quantidade</TableHead>
                    <TableHead className="text-right">Limite Baixo</TableHead>
                    <TableHead className="text-right">Reabastecimento</TableHead>
                    <TableHead>Última Atualização</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {item.productImage && (
                            <img 
                              src={item.productImage} 
                              alt={item.productName || "Produto"} 
                              className="w-8 h-8 object-cover rounded-md"
                            />
                          )}
                          <div>
                            <span className="font-medium">{item.productName || `Produto #${item.productId}`}</span>
                            {item.productCategory && (
                              <p className="text-xs text-muted-foreground">{item.productCategory}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(item.status, item.quantity, item.lowStockThreshold)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`font-medium ${
                          item.quantity === 0 
                            ? "text-red-600" 
                            : item.quantity <= item.lowStockThreshold 
                            ? "text-amber-600" 
                            : ""
                        }`}>
                          {item.quantity}
                        </span>
                        {item.reservedQuantity > 0 && (
                          <span className="text-xs text-muted-foreground ml-1">
                            ({item.reservedQuantity} reserv.)
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">{item.lowStockThreshold}</TableCell>
                      <TableCell className="text-right">{item.restockLevel}</TableCell>
                      <TableCell className="text-sm">
                        {item.lastUpdated 
                          ? format(new Date(item.lastUpdated), "dd/MM/yyyy HH:mm", { locale: pt }) 
                          : "N/A"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleOpenInventoryDialog(item)}
                            >
                              Atualizar
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                              <DialogTitle>Atualizar Estoque</DialogTitle>
                              <DialogDescription>
                                Atualize as informações de estoque para {item.productName || `Produto #${item.productId}`}
                              </DialogDescription>
                            </DialogHeader>
                            
                            <Form {...form}>
                              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <FormField
                                    control={form.control}
                                    name="quantity"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Quantidade</FormLabel>
                                        <FormControl>
                                          <Input 
                                            type="number" 
                                            {...field} 
                                            onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  
                                  <FormField
                                    control={form.control}
                                    name="status"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Status</FormLabel>
                                        <Select 
                                          value={field.value}
                                          onValueChange={field.onChange}
                                        >
                                          <FormControl>
                                            <SelectTrigger>
                                              <SelectValue placeholder="Selecione um status" />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                            <SelectItem value={InventoryStatus.IN_STOCK}>
                                              Em estoque
                                            </SelectItem>
                                            <SelectItem value={InventoryStatus.LOW_STOCK}>
                                              Estoque baixo
                                            </SelectItem>
                                            <SelectItem value={InventoryStatus.OUT_OF_STOCK}>
                                              Esgotado
                                            </SelectItem>
                                            <SelectItem value={InventoryStatus.BACKORDER}>
                                              Em espera
                                            </SelectItem>
                                            <SelectItem value={InventoryStatus.DISCONTINUED}>
                                              Descontinuado
                                            </SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                  <FormField
                                    control={form.control}
                                    name="lowStockThreshold"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Limite de Estoque Baixo</FormLabel>
                                        <FormControl>
                                          <Input 
                                            type="number" 
                                            {...field} 
                                            onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                                          />
                                        </FormControl>
                                        <FormDescription>
                                          Alerta quando estoque for menor ou igual a este valor
                                        </FormDescription>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  
                                  <FormField
                                    control={form.control}
                                    name="restockLevel"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Nível de Reabastecimento</FormLabel>
                                        <FormControl>
                                          <Input 
                                            type="number" 
                                            {...field} 
                                            onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                                          />
                                        </FormControl>
                                        <FormDescription>
                                          Quantidade ideal a ser mantida em estoque
                                        </FormDescription>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>
                                
                                <FormField
                                  control={form.control}
                                  name="reservedQuantity"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Quantidade Reservada</FormLabel>
                                      <FormControl>
                                        <Input 
                                          type="number" 
                                          {...field} 
                                          onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                                        />
                                      </FormControl>
                                      <FormDescription>
                                        Quantidade atualmente reservada para pedidos em andamento
                                      </FormDescription>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={form.control}
                                  name="location"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Localização</FormLabel>
                                      <FormControl>
                                        <Input 
                                          {...field}
                                          value={field.value || ""} 
                                          onChange={e => field.onChange(e.target.value || null)}
                                        />
                                      </FormControl>
                                      <FormDescription>
                                        Local onde o produto está armazenado (opcional)
                                      </FormDescription>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={form.control}
                                  name="notes"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Notas</FormLabel>
                                      <FormControl>
                                        <Input 
                                          {...field}
                                          value={field.value || ""} 
                                          onChange={e => field.onChange(e.target.value || null)}
                                        />
                                      </FormControl>
                                      <FormDescription>
                                        Observações adicionais sobre o estoque (opcional)
                                      </FormDescription>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <DialogFooter>
                                  <Button 
                                    type="submit" 
                                    disabled={updateInventoryMutation.isPending}
                                  >
                                    {updateInventoryMutation.isPending ? "Atualizando..." : "Atualizar Estoque"}
                                  </Button>
                                </DialogFooter>
                              </form>
                            </Form>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 border rounded-lg">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum produto com estoque encontrado</h3>
              <p className="text-muted-foreground mb-4 text-center">
                {searchTerm || statusFilter !== "all" 
                  ? "Nenhum resultado encontrado com os filtros atuais. Tente modificar sua busca."
                  : "Você ainda não tem produtos com informações de estoque cadastradas."}
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="bulk-update">
          <BulkInventoryUpdate />
        </TabsContent>

        <TabsContent value="alerts">
          <InventoryAlerts />
        </TabsContent>

        <TabsContent value="history">
          <InventoryHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InventoryManagement;