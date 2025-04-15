import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Search, 
  Filter, 
  RefreshCw, 
  ArrowUpDown, 
  Package,
  Eye,
  BellOff,
  CheckSquare
} from "lucide-react";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// StockAlert interface que já está no inventory-management.tsx
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

export const InventoryAlerts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date-desc");
  const [selectedAlert, setSelectedAlert] = useState<StockAlert | null>(null);
  const [showAlertDetails, setShowAlertDetails] = useState(false);

  // Buscar alertas
  const { data: alerts, isLoading: isLoadingAlerts, refetch: refetchAlerts } = useQuery<StockAlert[]>({
    queryKey: ['/api/supplier/inventory/alerts'],
    enabled: !!user?.id,
  });

  // Mutation para marcar alerta como lido
  const markAsReadMutation = useMutation({
    mutationFn: async (alertId: number) => {
      const response = await apiRequest(
        "PATCH", 
        `/api/supplier/inventory/alerts/${alertId}/read`,
        {}
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/supplier/inventory/alerts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/supplier/inventory/alerts/count'] });
      
      toast({
        title: "Alerta marcado como lido",
        description: "O alerta foi marcado como lido com sucesso.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao marcar alerta como lido",
        description: error.message || "Não foi possível marcar o alerta como lido.",
        variant: "destructive",
      });
    },
  });

  // Mutation para resolver alerta
  const resolveAlertMutation = useMutation({
    mutationFn: async (alertId: number) => {
      const response = await apiRequest(
        "PATCH", 
        `/api/supplier/inventory/alerts/${alertId}/resolve`,
        {}
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/supplier/inventory/alerts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/supplier/inventory/alerts/count'] });
      
      toast({
        title: "Alerta resolvido",
        description: "O alerta foi marcado como resolvido com sucesso.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao resolver alerta",
        description: error.message || "Não foi possível resolver o alerta.",
        variant: "destructive",
      });
    },
  });

  // Função para exibir detalhes do alerta
  const handleViewAlertDetails = (alert: StockAlert) => {
    setSelectedAlert(alert);
    setShowAlertDetails(true);

    // Se o alerta não foi lido, marcá-lo como lido
    if (!alert.isRead) {
      markAsReadMutation.mutate(alert.id);
    }
  };

  // Função para resolver alerta
  const handleResolveAlert = (alertId: number) => {
    resolveAlertMutation.mutate(alertId);
    setShowAlertDetails(false);
  };

  // Filtrar e ordenar alertas
  const filteredAlerts = alerts
    ? alerts
        .filter(alert => {
          const matchesSearch = !searchTerm || 
            (alert.productName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
             alert.message.toLowerCase().includes(searchTerm.toLowerCase()));
          
          const matchesStatus = statusFilter === "all" || 
            (statusFilter === "unread" && !alert.isRead) ||
            (statusFilter === "read" && alert.isRead) ||
            (statusFilter === "resolved" && alert.resolvedAt);
          
          const matchesType = typeFilter === "all" || alert.alertType === typeFilter;
          
          return matchesSearch && matchesStatus && matchesType;
        })
        .sort((a, b) => {
          switch (sortBy) {
            case "date-asc":
              return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            case "date-desc":
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            case "priority-asc":
              return a.priority - b.priority;
            case "priority-desc":
              return b.priority - a.priority;
            case "product-asc":
              return (a.productName || "").localeCompare(b.productName || "");
            case "product-desc":
              return (b.productName || "").localeCompare(a.productName || "");
            default:
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          }
        })
    : [];

  // Contagens de status
  const totalAlerts = filteredAlerts.length;
  const unreadAlerts = filteredAlerts.filter(alert => !alert.isRead).length;
  const resolvedAlerts = filteredAlerts.filter(alert => alert.resolvedAt).length;

  // Obter badge de tipo de alerta
  const getAlertTypeBadge = (type: string) => {
    switch (type) {
      case "low_stock":
        return <Badge variant="warning" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Estoque Baixo
        </Badge>;
      case "out_of_stock":
        return <Badge variant="destructive" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Esgotado
        </Badge>;
      case "restock_needed":
        return <Badge variant="outline" className="flex items-center gap-1 border-amber-500 text-amber-700">
          <Package className="h-3 w-3" />
          Reabastecimento
        </Badge>;
      case "stock_updated":
        return <Badge variant="success" className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Atualizado
        </Badge>;
      case "batch_update":
        return <Badge variant="outline" className="flex items-center gap-1">
          <RefreshCw className="h-3 w-3" />
          Atualização em Lote
        </Badge>;
      case "inventory_audit":
        return <Badge variant="outline" className="flex items-center gap-1 border-blue-500 text-blue-700">
          <Clock className="h-3 w-3" />
          Auditoria
        </Badge>;
      case "forecasted_shortage":
        return <Badge variant="outline" className="flex items-center gap-1 border-purple-500 text-purple-700">
          <AlertTriangle className="h-3 w-3" />
          Previsão de Escassez
        </Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  // Obter badge de prioridade
  const getPriorityBadge = (priority: number) => {
    if (priority >= 8) {
      return <Badge variant="destructive" className="flex items-center gap-1">
        <AlertCircle className="h-3 w-3" />
        Alta
      </Badge>;
    } else if (priority >= 5) {
      return <Badge variant="warning" className="flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" />
        Média
      </Badge>;
    } else {
      return <Badge variant="outline" className="flex items-center gap-1">
        <Clock className="h-3 w-3" />
        Baixa
      </Badge>;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl font-bold">Alertas de Estoque</CardTitle>
            <CardDescription>
              Monitore e gerencie alertas relacionados ao seu inventário
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            onClick={() => refetchAlerts()}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Estatísticas de alertas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border p-3">
            <div className="text-sm text-muted-foreground">Total de Alertas</div>
            <div className="text-2xl font-bold mt-1">{totalAlerts}</div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-sm text-muted-foreground">Não Lidos</div>
            <div className="text-2xl font-bold mt-1 text-amber-600">{unreadAlerts}</div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-sm text-muted-foreground">Resolvidos</div>
            <div className="text-2xl font-bold mt-1 text-green-600">{resolvedAlerts}</div>
          </div>
        </div>

        {/* Filtros e Pesquisa */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar alertas por produto ou mensagem..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <span className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <SelectValue placeholder="Filtrar por status" />
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="unread">Não lidos</SelectItem>
                <SelectItem value="read">Lidos</SelectItem>
                <SelectItem value="resolved">Resolvidos</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px]">
                <span className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <SelectValue placeholder="Filtrar por tipo" />
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="low_stock">Estoque baixo</SelectItem>
                <SelectItem value="out_of_stock">Esgotado</SelectItem>
                <SelectItem value="restock_needed">Reabastecimento</SelectItem>
                <SelectItem value="stock_updated">Atualizado</SelectItem>
                <SelectItem value="batch_update">Atualização em lote</SelectItem>
                <SelectItem value="inventory_audit">Auditoria</SelectItem>
                <SelectItem value="forecasted_shortage">Previsão de escassez</SelectItem>
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
                <SelectItem value="date-desc">Data (Recentes primeiro)</SelectItem>
                <SelectItem value="date-asc">Data (Antigos primeiro)</SelectItem>
                <SelectItem value="priority-desc">Prioridade (Alta primeiro)</SelectItem>
                <SelectItem value="priority-asc">Prioridade (Baixa primeiro)</SelectItem>
                <SelectItem value="product-asc">Produto (A-Z)</SelectItem>
                <SelectItem value="product-desc">Produto (Z-A)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tabela de Alertas */}
        {isLoadingAlerts ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="w-full h-16" />
            ))}
          </div>
        ) : filteredAlerts.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Status</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Mensagem</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAlerts.map((alert) => (
                  <TableRow key={alert.id} className={!alert.isRead ? "bg-muted/30" : ""}>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            {alert.resolvedAt ? (
                              <CheckSquare className="h-5 w-5 text-green-500" />
                            ) : !alert.isRead ? (
                              <AlertCircle className="h-5 w-5 text-amber-500" />
                            ) : (
                              <CheckCircle className="h-5 w-5 text-muted-foreground" />
                            )}
                          </TooltipTrigger>
                          <TooltipContent>
                            {alert.resolvedAt ? "Resolvido" : !alert.isRead ? "Não lido" : "Lido"}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {alert.productImage && (
                          <img 
                            src={alert.productImage} 
                            alt={alert.productName || "Produto"} 
                            className="w-8 h-8 object-cover rounded-md"
                          />
                        )}
                        <div className="font-medium">{alert.productName || `Produto #${alert.productId}`}</div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {alert.message}
                    </TableCell>
                    <TableCell>{getAlertTypeBadge(alert.alertType)}</TableCell>
                    <TableCell>{getPriorityBadge(alert.priority)}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(alert.createdAt), "dd/MM/yyyy HH:mm", { locale: pt })}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <ArrowUpDown className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewAlertDetails(alert)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver detalhes
                          </DropdownMenuItem>
                          
                          {!alert.isRead && (
                            <DropdownMenuItem onClick={() => markAsReadMutation.mutate(alert.id)}>
                              <BellOff className="h-4 w-4 mr-2" />
                              Marcar como lido
                            </DropdownMenuItem>
                          )}
                          
                          {!alert.resolvedAt && (
                            <DropdownMenuItem onClick={() => resolveAlertMutation.mutate(alert.id)}>
                              <CheckSquare className="h-4 w-4 mr-2" />
                              Resolver alerta
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 border rounded-lg">
            <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum alerta encontrado</h3>
            <p className="text-muted-foreground mb-4 text-center">
              {searchTerm || statusFilter !== "all" || typeFilter !== "all" 
                ? "Nenhum resultado encontrado com os filtros atuais. Tente modificar sua busca."
                : "Você não possui alertas de estoque ativos. Isso é um bom sinal!"}
            </p>
          </div>
        )}

        {/* Modal de Detalhes do Alerta */}
        <Dialog open={showAlertDetails} onOpenChange={setShowAlertDetails}>
          <DialogContent className="sm:max-w-[600px]">
            {selectedAlert && (
              <>
                <DialogHeader>
                  <div className="flex items-center justify-between">
                    <DialogTitle>Detalhes do Alerta</DialogTitle>
                    {getAlertTypeBadge(selectedAlert.alertType)}
                  </div>
                  <DialogDescription>
                    Informações detalhadas sobre o alerta selecionado
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <div className="text-sm text-muted-foreground">Produto</div>
                    <div className="font-medium text-lg flex items-center gap-2">
                      {selectedAlert.productImage && (
                        <img 
                          src={selectedAlert.productImage} 
                          alt={selectedAlert.productName || "Produto"} 
                          className="w-8 h-8 object-cover rounded-md"
                        />
                      )}
                      {selectedAlert.productName || `Produto #${selectedAlert.productId}`}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Prioridade</div>
                      <div>{getPriorityBadge(selectedAlert.priority)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Status</div>
                      <div>
                        {selectedAlert.resolvedAt ? (
                          <Badge variant="success" className="flex items-center gap-1">
                            <CheckSquare className="h-3 w-3" />
                            Resolvido
                          </Badge>
                        ) : !selectedAlert.isRead ? (
                          <Badge variant="warning" className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Não lido
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Lido
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Data de Criação</div>
                      <div className="font-medium">
                        {format(new Date(selectedAlert.createdAt), "dd/MM/yyyy HH:mm", { locale: pt })}
                      </div>
                    </div>
                    {selectedAlert.resolvedAt && (
                      <div>
                        <div className="text-sm text-muted-foreground">Data de Resolução</div>
                        <div className="font-medium">
                          {format(new Date(selectedAlert.resolvedAt), "dd/MM/yyyy HH:mm", { locale: pt })}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <div className="text-sm text-muted-foreground">Mensagem</div>
                    <div className="p-3 rounded-md border mt-1 text-sm">{selectedAlert.message}</div>
                  </div>
                  
                  {(selectedAlert.quantity !== null || selectedAlert.previousQuantity !== null) && (
                    <div className="grid grid-cols-2 gap-4">
                      {selectedAlert.previousQuantity !== null && (
                        <div>
                          <div className="text-sm text-muted-foreground">Quantidade Anterior</div>
                          <div className="font-medium">{selectedAlert.previousQuantity}</div>
                        </div>
                      )}
                      {selectedAlert.quantity !== null && (
                        <div>
                          <div className="text-sm text-muted-foreground">Quantidade Atual</div>
                          <div className="font-medium">{selectedAlert.quantity}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <DialogFooter className="gap-2">
                  {!selectedAlert.resolvedAt && (
                    <Button 
                      onClick={() => handleResolveAlert(selectedAlert.id)} 
                      variant="default"
                      className="flex items-center gap-2"
                    >
                      <CheckSquare className="h-4 w-4" />
                      Resolver Alerta
                    </Button>
                  )}
                  
                  <Button 
                    onClick={() => setShowAlertDetails(false)} 
                    variant={selectedAlert.resolvedAt ? "default" : "outline"}
                  >
                    Fechar
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};