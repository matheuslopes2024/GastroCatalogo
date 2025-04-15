import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  Package,
  ShieldAlert,
  ArrowUpDown,
  RefreshCw,
  Bell,
  BellOff,
  CircleAlert,
  ExternalLink,
  CalendarClock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

interface InventoryAlertsProps {
  onReadAlert?: () => void;
  onResolveAlert?: () => void;
}

export function InventoryAlerts({ onReadAlert, onResolveAlert }: InventoryAlertsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filterType, setFilterType] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedAlertId, setSelectedAlertId] = useState<number | null>(null);
  const [showReadDialog, setShowReadDialog] = useState(false);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [bulkSelected, setBulkSelected] = useState<number[]>([]);
  const [isAllSelected, setIsAllSelected] = useState(false);

  // Buscar alertas de estoque
  const { 
    data: alerts, 
    isLoading: isLoadingAlerts,
    refetch: refetchAlerts
  } = useQuery({
    queryKey: ["/api/supplier/inventory/alerts", { 
      isRead: activeTab === "unread" ? false : undefined,
      resolved: activeTab === "resolved" ? true : undefined,
      type: filterType || undefined
    }],
    enabled: !!user?.id,
  });

  // Filtrar alertas baseado na pesquisa
  const filteredAlerts = alerts?.filter((alert: any) => 
    !searchTerm || 
    alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    alert.productId.toString().includes(searchTerm) ||
    (alert.productName && alert.productName.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  // Obter alerta selecionado
  const getSelectedAlert = () => {
    return alerts?.find((alert: any) => alert.id === selectedAlertId) || null;
  };

  // Mutação para marcar alerta como lido
  const markAsReadMutation = useMutation({
    mutationFn: async (alertId: number) => {
      const res = await apiRequest("PUT", `/api/supplier/inventory/alerts/${alertId}/read`, {});
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Alerta marcado como lido",
        description: "O alerta foi marcado como lido com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/supplier/inventory/alerts"] });
      setShowReadDialog(false);
      
      if (onReadAlert) {
        onReadAlert();
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao marcar alerta",
        description: error.message || "Ocorreu um erro ao marcar o alerta como lido.",
        variant: "destructive",
      });
    }
  });

  // Mutação para marcar vários alertas como lidos
  const markMultipleAsReadMutation = useMutation({
    mutationFn: async (alertIds: number[]) => {
      const res = await apiRequest("PUT", `/api/supplier/inventory/alerts/bulk-read`, { 
        alertIds 
      });
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Alertas marcados como lidos",
        description: `${data.updatedCount} alertas foram marcados como lidos com sucesso.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/supplier/inventory/alerts"] });
      setBulkSelected([]);
      setIsAllSelected(false);
      
      if (onReadAlert) {
        onReadAlert();
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao marcar alertas",
        description: error.message || "Ocorreu um erro ao marcar os alertas como lidos.",
        variant: "destructive",
      });
    }
  });

  // Mutação para resolver alerta
  const resolveAlertMutation = useMutation({
    mutationFn: async (alertId: number) => {
      const res = await apiRequest("PUT", `/api/supplier/inventory/alerts/${alertId}/resolve`, {});
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Alerta resolvido",
        description: "O alerta foi marcado como resolvido com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/supplier/inventory/alerts"] });
      setShowResolveDialog(false);
      
      if (onResolveAlert) {
        onResolveAlert();
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao resolver alerta",
        description: error.message || "Ocorreu um erro ao resolver o alerta.",
        variant: "destructive",
      });
    }
  });

  // Marcar um alerta como lido
  const handleMarkAsRead = (alertId: number) => {
    setSelectedAlertId(alertId);
    setShowReadDialog(true);
  };

  // Resolver um alerta
  const handleResolveAlert = (alertId: number) => {
    setSelectedAlertId(alertId);
    setShowResolveDialog(true);
  };

  // Confirmar marcar como lido
  const confirmMarkAsRead = () => {
    if (selectedAlertId) {
      markAsReadMutation.mutate(selectedAlertId);
    }
  };

  // Confirmar resolver alerta
  const confirmResolveAlert = () => {
    if (selectedAlertId) {
      resolveAlertMutation.mutate(selectedAlertId);
    }
  };

  // Manipular seleção individual
  const handleSelectAlert = (alertId: number, checked: boolean) => {
    if (checked) {
      setBulkSelected(prev => [...prev, alertId]);
    } else {
      setBulkSelected(prev => prev.filter(id => id !== alertId));
      setIsAllSelected(false);
    }
  };

  // Manipular seleção em massa
  const handleSelectAll = (checked: boolean) => {
    setIsAllSelected(checked);
    if (checked) {
      const allIds = filteredAlerts
        .filter((alert: any) => !alert.isRead)
        .map((alert: any) => alert.id);
      setBulkSelected(allIds);
    } else {
      setBulkSelected([]);
    }
  };

  // Marcar todos os selecionados como lidos
  const handleMarkSelectedAsRead = () => {
    if (bulkSelected.length > 0) {
      markMultipleAsReadMutation.mutate(bulkSelected);
    } else {
      toast({
        title: "Nenhum alerta selecionado",
        description: "Por favor, selecione pelo menos um alerta para marcar como lido.",
        variant: "destructive",
      });
    }
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

  // Formatar tipo de alerta
  const getAlertTypeBadge = (type: string) => {
    switch (type) {
      case "low_stock":
        return <Badge variant="warning" className="flex items-center">
          <AlertCircle className="mr-1 h-3 w-3" />
          Estoque Baixo
        </Badge>;
      case "out_of_stock":
        return <Badge variant="destructive" className="flex items-center">
          <ShieldAlert className="mr-1 h-3 w-3" />
          Sem Estoque
        </Badge>;
      case "expiration":
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 flex items-center">
          <Clock className="mr-1 h-3 w-3" />
          Prestes a Expirar
        </Badge>;
      case "restock_needed":
        return <Badge variant="default" className="flex items-center">
          <RefreshCw className="mr-1 h-3 w-3" />
          Reposição Necessária
        </Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  // Verificar se um alerta está selecionado
  const isAlertSelected = (alertId: number) => {
    return bulkSelected.includes(alertId);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Buscar por mensagem ou ID do produto..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center">
                <Filter className="mr-2 h-4 w-4" />
                <span>{filterType ? 'Filtrar por tipo' : 'Todos os tipos'}</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              <SelectItem value="low_stock">Estoque Baixo</SelectItem>
              <SelectItem value="out_of_stock">Sem Estoque</SelectItem>
              <SelectItem value="expiration">Prestes a Expirar</SelectItem>
              <SelectItem value="restock_needed">Reposição Necessária</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            onClick={() => refetchAlerts()}
            className="flex items-center"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader className="pb-2 space-y-1">
          <CardTitle className="text-lg flex items-center">
            <Bell className="mr-2 h-5 w-5 text-amber-500" />
            Alertas de Estoque
          </CardTitle>
          <CardDescription>
            Monitore alertas importantes sobre o seu estoque de produtos.
          </CardDescription>
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="grid grid-cols-3 mb-2">
              <TabsTrigger value="all" className="flex items-center">
                <Bell className="mr-2 h-4 w-4" />
                Todos
                {alerts?.length > 0 && <span className="ml-1.5 text-xs bg-gray-200 rounded-full px-1.5">{alerts.length}</span>}
              </TabsTrigger>
              <TabsTrigger value="unread" className="flex items-center">
                <CircleAlert className="mr-2 h-4 w-4" />
                Não lidos
                {alerts?.filter((a: any) => !a.isRead).length > 0 && 
                  <span className="ml-1.5 text-xs bg-amber-100 text-amber-700 rounded-full px-1.5">
                    {alerts.filter((a: any) => !a.isRead).length}
                  </span>
                }
              </TabsTrigger>
              <TabsTrigger value="resolved" className="flex items-center">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Resolvidos
                {alerts?.filter((a: any) => a.resolvedAt).length > 0 && 
                  <span className="ml-1.5 text-xs bg-green-100 text-green-700 rounded-full px-1.5">
                    {alerts.filter((a: any) => a.resolvedAt).length}
                  </span>
                }
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        
        <CardContent>
          {isLoadingAlerts ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-md" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {activeTab === "unread" && filteredAlerts.filter((a: any) => !a.isRead).length > 0 && (
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="select-all"
                      checked={isAllSelected}
                      onCheckedChange={(checked) => handleSelectAll(!!checked)}
                    />
                    <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                      Selecionar todos
                    </label>
                  </div>
                  
                  {bulkSelected.length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex items-center"
                      onClick={handleMarkSelectedAsRead}
                      disabled={markMultipleAsReadMutation.isPending}
                    >
                      <BellOff className="mr-1.5 h-3.5 w-3.5" />
                      {markMultipleAsReadMutation.isPending
                        ? "Marcando..."
                        : `Marcar ${bulkSelected.length} como lidos`}
                    </Button>
                  )}
                </div>
              )}
              
              {filteredAlerts.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {activeTab === "unread" && (
                          <TableHead className="w-12"></TableHead>
                        )}
                        <TableHead>Tipo</TableHead>
                        <TableHead>Mensagem</TableHead>
                        <TableHead>Produto</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAlerts.map((alert: any) => (
                        <TableRow 
                          key={alert.id} 
                          className={
                            alert.isRead
                              ? "bg-gray-50 opacity-75"
                              : alert.priority > 2 
                                ? "bg-amber-50"
                                : ""
                          }
                        >
                          {activeTab === "unread" && (
                            <TableCell>
                              {!alert.isRead && (
                                <Checkbox
                                  checked={isAlertSelected(alert.id)}
                                  onCheckedChange={(checked) => handleSelectAlert(alert.id, !!checked)}
                                />
                              )}
                            </TableCell>
                          )}
                          <TableCell>
                            {getAlertTypeBadge(alert.alertType)}
                          </TableCell>
                          <TableCell>
                            <div className="max-w-sm">
                              <p className={`${!alert.isRead ? "font-medium" : ""}`}>
                                {alert.message}
                              </p>
                              {alert.resolvedAt && (
                                <p className="text-xs text-green-600 flex items-center mt-1">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Resolvido em {formatDate(alert.resolvedAt)}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Link href={`/produto/${alert.productId}`}>
                              <a className="flex items-center text-blue-600 hover:underline">
                                #{alert.productId}
                                <ExternalLink className="h-3 w-3 ml-1" />
                              </a>
                            </Link>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm">{formatDate(alert.createdAt)}</span>
                              {alert.isRead && (
                                <span className="text-xs text-gray-500 flex items-center mt-0.5">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Lido {alert.readAt ? formatDate(alert.readAt) : ""}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {!alert.isRead && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleMarkAsRead(alert.id)}
                                  className="h-8 px-2 text-gray-500"
                                >
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <BellOff className="h-4 w-4" />
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Marcar como lido</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </Button>
                              )}
                              
                              {!alert.resolvedAt && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleResolveAlert(alert.id)}
                                  className="h-8 px-2 text-green-600"
                                >
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <CheckCircle2 className="h-4 w-4" />
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Marcar como resolvido</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="bg-amber-50 p-3 rounded-full mb-2">
                    <Bell className="h-8 w-8 text-amber-400" />
                  </div>
                  <h3 className="text-lg font-medium">Nenhum alerta encontrado</h3>
                  <p className="text-gray-500 mt-1 max-w-md">
                    {searchTerm
                      ? `Não encontramos alertas correspondentes a "${searchTerm}"`
                      : filterType
                        ? "Não existem alertas que correspondam ao filtro selecionado."
                        : activeTab === "unread"
                          ? "Você não tem alertas não lidos no momento."
                          : activeTab === "resolved"
                            ? "Você não tem alertas resolvidos no momento."
                            : "Você não tem alertas de estoque no momento."
                    }
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Dialog para marcar como lido */}
      <Dialog open={showReadDialog} onOpenChange={setShowReadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marcar alerta como lido</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja marcar este alerta como lido? 
              Isto apenas indica que você viu o alerta, mas não que o problema foi resolvido.
            </DialogDescription>
          </DialogHeader>
          
          {getSelectedAlert() && (
            <div className="p-4 bg-gray-50 rounded-md my-4">
              <div className="flex justify-between mb-2">
                <span className="font-medium">Tipo:</span>
                <span>{getAlertTypeBadge(getSelectedAlert().alertType)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="font-medium">Produto:</span>
                <span>#{getSelectedAlert().productId}</span>
              </div>
              <div className="mt-2">
                <span className="font-medium">Mensagem:</span>
                <p className="mt-1 text-gray-700">{getSelectedAlert().message}</p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReadDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={confirmMarkAsRead}
              disabled={markAsReadMutation.isPending}
            >
              {markAsReadMutation.isPending ? "Marcando..." : "Marcar como lido"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog para resolver alerta */}
      <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolver alerta</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja marcar este alerta como resolvido? 
              Isso indica que o problema foi corrigido e o alerta será arquivado.
            </DialogDescription>
          </DialogHeader>
          
          {getSelectedAlert() && (
            <div className="p-4 bg-gray-50 rounded-md my-4">
              <div className="flex justify-between mb-2">
                <span className="font-medium">Tipo:</span>
                <span>{getAlertTypeBadge(getSelectedAlert().alertType)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="font-medium">Produto:</span>
                <span>#{getSelectedAlert().productId}</span>
              </div>
              <div className="mt-2">
                <span className="font-medium">Mensagem:</span>
                <p className="mt-1 text-gray-700">{getSelectedAlert().message}</p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResolveDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={confirmResolveAlert}
              disabled={resolveAlertMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {resolveAlertMutation.isPending ? "Resolvendo..." : "Marcar como resolvido"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}