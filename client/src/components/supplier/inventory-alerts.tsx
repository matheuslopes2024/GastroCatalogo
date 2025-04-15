import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Clock,
  EyeOff,
  Eye,
  Filter,
  MoreVertical,
  Loader2,
  Package,
  Search,
  ChevronRight,
  RefreshCw,
  Ban,
  Bell,
  MessageCircle,
  CheckCircle,
  X,
  CircleAlert,
  PanelLeftClose,
  CircleSlash,
  BookmarkCheck,
  Clock8,
  CalendarClock,
  CircleCheck,
  CircleX,
  HelpCircle,
  Gauge,
  Check,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface InventoryAlertsProps {
  productId?: number;
  embedded?: boolean;
}

// Tipos para as alertas
type AlertType = 
  | "low_stock"
  | "out_of_stock"
  | "expiring_soon"
  | "restock_needed"
  | "inventory_discrepancy"
  | "forecasted_shortage";

type AlertStatus = "pending" | "in_progress" | "resolved" | "dismissed";

type AlertPriority = "critical" | "high" | "medium" | "low";

interface Alert {
  id: number;
  productId: number;
  productName: string;
  message: string;
  quantity: number | null;
  createdAt: string | Date;
  supplierId: number;
  alertType: AlertType;
  isRead: boolean;
  resolvedAt: string | Date | null;
  resolvedBy: number | null;
  priority: AlertPriority;
  status: AlertStatus;
  threshold?: number;
  currentLevel?: number;
}

export function InventoryAlerts({ productId, embedded = false }: InventoryAlertsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Estados
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>(embedded ? "pending" : "");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [showFilters, setShowFilters] = useState(!embedded);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [resolutionDialogOpen, setResolutionDialogOpen] = useState(false);
  const [resolutionNote, setResolutionNote] = useState("");
  const [alertSettingsOpen, setAlertSettingsOpen] = useState(false);
  const [alertSettings, setAlertSettings] = useState({
    lowStockEnabled: true,
    lowStockThreshold: 5,
    expiringEnabled: true,
    expiringDays: 30,
    automatedAlerts: true,
    emailNotifications: false,
  });
  
  // Query para buscar alertas de estoque
  const {
    data: alerts,
    isLoading: isLoadingAlerts,
    refetch: refetchAlerts,
  } = useQuery({
    queryKey: [
      "/api/supplier/inventory/alerts",
      { productId, type: typeFilter, status: statusFilter, priority: priorityFilter },
    ],
    enabled: !!user?.id,
  });
  
  // Mutation para marcar alerta como lido
  const markAsReadMutation = useMutation({
    mutationFn: async (alertId: number) => {
      const res = await apiRequest("POST", `/api/supplier/inventory/alerts/${alertId}/read`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/supplier/inventory/alerts"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao marcar alerta como lido",
        description: error.message || "Ocorreu um erro. Tente novamente.",
        variant: "destructive",
      });
    },
  });
  
  // Mutation para resolver alerta
  const resolveAlertMutation = useMutation({
    mutationFn: async (data: { alertId: number; notes: string }) => {
      const res = await apiRequest("POST", `/api/supplier/inventory/alerts/${data.alertId}/resolve`, {
        notes: data.notes,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Alerta resolvido",
        description: "O alerta foi marcado como resolvido com sucesso.",
      });
      setResolutionDialogOpen(false);
      setResolutionNote("");
      queryClient.invalidateQueries({ queryKey: ["/api/supplier/inventory/alerts"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao resolver alerta",
        description: error.message || "Ocorreu um erro. Tente novamente.",
        variant: "destructive",
      });
    },
  });
  
  // Mutation para descartar alerta
  const dismissAlertMutation = useMutation({
    mutationFn: async (alertId: number) => {
      const res = await apiRequest("POST", `/api/supplier/inventory/alerts/${alertId}/dismiss`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Alerta descartado",
        description: "O alerta foi descartado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/supplier/inventory/alerts"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao descartar alerta",
        description: error.message || "Ocorreu um erro. Tente novamente.",
        variant: "destructive",
      });
    },
  });
  
  // Mutation para salvar configurações de alerta
  const saveAlertSettingsMutation = useMutation({
    mutationFn: async (settings: typeof alertSettings) => {
      const res = await apiRequest("POST", "/api/supplier/inventory/alert-settings", settings);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Configurações salvas",
        description: "As configurações de alerta foram atualizadas com sucesso.",
      });
      setAlertSettingsOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/supplier/inventory/alert-settings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar configurações",
        description: error.message || "Ocorreu um erro. Tente novamente.",
        variant: "destructive",
      });
    },
  });
  
  // Query para buscar configurações de alerta
  const { data: alertSettingsData } = useQuery({
    queryKey: ["/api/supplier/inventory/alert-settings"],
    enabled: !!user?.id,
    onSuccess: (data) => {
      if (data) {
        setAlertSettings({
          lowStockEnabled: data.lowStockEnabled ?? true,
          lowStockThreshold: data.lowStockThreshold ?? 5,
          expiringEnabled: data.expiringEnabled ?? true,
          expiringDays: data.expiringDays ?? 30,
          automatedAlerts: data.automatedAlerts ?? true,
          emailNotifications: data.emailNotifications ?? false,
        });
      }
    },
  });
  
  // Filtrar alertas baseado na busca
  const filteredAlerts = alerts?.filter((alert: Alert) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      alert.productName?.toLowerCase().includes(query) ||
      alert.message?.toLowerCase().includes(query) ||
      alert.id.toString().includes(query)
    );
  });
  
  // Função para renderizar ícone do tipo de alerta
  const renderAlertTypeIcon = (type: AlertType) => {
    switch (type) {
      case "low_stock":
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case "out_of_stock":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "expiring_soon":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "restock_needed":
        return <Package className="h-4 w-4 text-purple-500" />;
      case "inventory_discrepancy":
        return <CircleAlert className="h-4 w-4 text-orange-500" />;
      case "forecasted_shortage":
        return <Gauge className="h-4 w-4 text-indigo-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };
  
  // Função para obter rótulo do tipo de alerta
  const getAlertTypeLabel = (type: AlertType) => {
    switch (type) {
      case "low_stock":
        return "Estoque Baixo";
      case "out_of_stock":
        return "Sem Estoque";
      case "expiring_soon":
        return "Prestes a Vencer";
      case "restock_needed":
        return "Reposição Necessária";
      case "inventory_discrepancy":
        return "Discrepância de Inventário";
      case "forecasted_shortage":
        return "Escassez Prevista";
      default:
        return type;
    }
  };
  
  // Função para renderizar ícone de prioridade
  const renderPriorityIcon = (priority: AlertPriority) => {
    switch (priority) {
      case "critical":
        return <CircleX className="h-4 w-4 text-red-500" />;
      case "high":
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case "medium":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case "low":
        return <CircleAlert className="h-4 w-4 text-blue-500" />;
      default:
        return <CircleAlert className="h-4 w-4" />;
    }
  };
  
  // Função para obter rótulo de prioridade
  const getPriorityLabel = (priority: AlertPriority) => {
    switch (priority) {
      case "critical":
        return "Crítica";
      case "high":
        return "Alta";
      case "medium":
        return "Média";
      case "low":
        return "Baixa";
      default:
        return priority;
    }
  };
  
  // Função para renderizar badge de status
  const renderStatusBadge = (status: AlertStatus) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock8 className="mr-1 h-3 w-3" />
            Pendente
          </Badge>
        );
      case "in_progress":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            Em Progresso
          </Badge>
        );
      case "resolved":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Resolvido
          </Badge>
        );
      case "dismissed":
        return (
          <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
            <Ban className="mr-1 h-3 w-3" />
            Descartado
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  // Função para obter classe de prioridade
  const getPriorityClass = (priority: AlertPriority) => {
    switch (priority) {
      case "critical":
        return "bg-red-50 dark:bg-red-950/30";
      case "high":
        return "bg-orange-50 dark:bg-orange-950/30";
      case "medium":
        return "";
      case "low":
        return "";
      default:
        return "";
    }
  };
  
  // Função para formatar data relativa
  const formatRelativeDate = (date: Date | string) => {
    if (!date) return "";
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return formatDistanceToNow(dateObj, { addSuffix: true, locale: ptBR });
  };
  
  // Função para formatar data absoluta
  const formatAbsoluteDate = (date: Date | string) => {
    if (!date) return "";
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return format(dateObj, "dd/MM/yyyy HH:mm", { locale: ptBR });
  };
  
  // Função para marcar alerta como lido
  const markAsRead = (alertId: number) => {
    markAsReadMutation.mutate(alertId);
  };
  
  // Função para abrir dialog de resolução
  const openResolutionDialog = (alert: Alert) => {
    setSelectedAlert(alert);
    setResolutionDialogOpen(true);
  };
  
  // Função para resolver alerta
  const resolveAlert = () => {
    if (!selectedAlert) return;
    
    resolveAlertMutation.mutate({
      alertId: selectedAlert.id,
      notes: resolutionNote,
    });
  };
  
  // Função para descartar alerta
  const dismissAlert = (alertId: number) => {
    dismissAlertMutation.mutate(alertId);
  };
  
  // Função para salvar configurações de alerta
  const saveAlertSettings = () => {
    saveAlertSettingsMutation.mutate(alertSettings);
  };
  
  // Efeito para carregar configurações
  useEffect(() => {
    if (alertSettingsData) {
      setAlertSettings(alertSettingsData);
    }
  }, [alertSettingsData]);
  
  return (
    <div className={embedded ? "" : "space-y-6"}>
      {!embedded && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Alertas de Inventário</h2>
            <p className="text-muted-foreground">
              Gerencie alertas sobre níveis de estoque e produtos
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => refetchAlerts()}
              className="h-9"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Atualizar
            </Button>
            <Button
              variant="outline"
              onClick={() => setAlertSettingsOpen(true)}
              className="h-9"
            >
              <Bell className="mr-2 h-4 w-4" />
              Configurações
            </Button>
          </div>
        </div>
      )}
      
      <Card className={embedded ? "border-0 shadow-none" : ""}>
        {!embedded && (
          <CardHeader className="pb-3">
            <CardTitle>Lista de Alertas</CardTitle>
            <CardDescription>
              Visualize e gerencie alertas automáticos de inventário
            </CardDescription>
          </CardHeader>
        )}
        
        <CardContent className={embedded ? "p-0" : ""}>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between gap-3">
              <div className="relative w-full sm:max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar alertas..."
                  className="pl-8 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              {!embedded && (
                <Button
                  variant="outline"
                  className="gap-1 h-9"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4" />
                  Filtros
                  {showFilters ? <PanelLeftClose className="h-4 w-4 ml-1" /> : <ChevronRight className="h-4 w-4 ml-1" />}
                </Button>
              )}
            </div>
            
            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="type-filter" className="text-xs">Tipo de Alerta</Label>
                  <Select
                    value={typeFilter}
                    onValueChange={setTypeFilter}
                  >
                    <SelectTrigger id="type-filter" className="h-9">
                      <SelectValue placeholder="Todos os tipos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos os tipos</SelectItem>
                      <SelectItem value="low_stock">Estoque Baixo</SelectItem>
                      <SelectItem value="out_of_stock">Sem Estoque</SelectItem>
                      <SelectItem value="expiring_soon">Prestes a Vencer</SelectItem>
                      <SelectItem value="restock_needed">Reposição Necessária</SelectItem>
                      <SelectItem value="inventory_discrepancy">Discrepância de Inventário</SelectItem>
                      <SelectItem value="forecasted_shortage">Escassez Prevista</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="status-filter" className="text-xs">Status</Label>
                  <Select
                    value={statusFilter}
                    onValueChange={setStatusFilter}
                  >
                    <SelectTrigger id="status-filter" className="h-9">
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos os status</SelectItem>
                      <SelectItem value="pending">Pendentes</SelectItem>
                      <SelectItem value="in_progress">Em Progresso</SelectItem>
                      <SelectItem value="resolved">Resolvidos</SelectItem>
                      <SelectItem value="dismissed">Descartados</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="priority-filter" className="text-xs">Prioridade</Label>
                  <Select
                    value={priorityFilter}
                    onValueChange={setPriorityFilter}
                  >
                    <SelectTrigger id="priority-filter" className="h-9">
                      <SelectValue placeholder="Todas as prioridades" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas as prioridades</SelectItem>
                      <SelectItem value="critical">Crítica</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="low">Baixa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            
            <div>
              <ScrollArea className={embedded ? "h-[350px]" : "h-[500px]"}>
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead className="w-[50px]">Tipo</TableHead>
                      <TableHead>Detalhes do Alerta</TableHead>
                      <TableHead className="w-[120px]">Prioridade</TableHead>
                      <TableHead className="w-[120px]">Status</TableHead>
                      <TableHead className="w-[100px]">Data</TableHead>
                      <TableHead className="w-[60px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingAlerts ? (
                      Array.from({ length: 5 }).map((_, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
                          </TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              <div className="w-3/4 h-4 bg-gray-200 rounded animate-pulse" />
                              <div className="w-1/2 h-3 bg-gray-200 rounded animate-pulse" />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="w-20 h-6 bg-gray-200 rounded animate-pulse" />
                          </TableCell>
                          <TableCell>
                            <div className="w-24 h-6 bg-gray-200 rounded animate-pulse" />
                          </TableCell>
                          <TableCell>
                            <div className="w-20 h-4 bg-gray-200 rounded animate-pulse" />
                          </TableCell>
                          <TableCell>
                            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : filteredAlerts?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-32 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <Bell className="h-8 w-8 text-muted-foreground mb-2" />
                            <p className="text-muted-foreground">
                              Nenhum alerta encontrado
                            </p>
                            {searchQuery && (
                              <Button 
                                variant="link" 
                                onClick={() => setSearchQuery("")}
                                className="mt-2"
                              >
                                Limpar busca
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAlerts?.map((alert: Alert) => (
                        <TableRow 
                          key={alert.id}
                          className={`${getPriorityClass(alert.priority)} ${!alert.isRead ? "bg-primary-50 dark:bg-primary-950/10" : ""}`}
                        >
                          <TableCell>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center">
                                    {renderAlertTypeIcon(alert.alertType)}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{getAlertTypeLabel(alert.alertType)}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {alert.productName}
                                {!alert.isRead && (
                                  <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary">
                                    Novo
                                  </Badge>
                                )}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {alert.message}
                              </p>
                              {alert.threshold && alert.currentLevel !== undefined && (
                                <div className="mt-1 text-xs text-muted-foreground">
                                  <span className="inline-flex items-center gap-1">
                                    <Gauge className="h-3 w-3" />
                                    Nível: <span className="font-medium">{alert.currentLevel}</span>
                                    {" / "}
                                    Limite: <span className="font-medium">{alert.threshold}</span>
                                  </span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              {renderPriorityIcon(alert.priority)}
                              <span>{getPriorityLabel(alert.priority)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {renderStatusBadge(alert.status)}
                          </TableCell>
                          <TableCell>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="text-sm text-muted-foreground">
                                    {formatRelativeDate(alert.createdAt)}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{formatAbsoluteDate(alert.createdAt)}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {!alert.isRead && (
                                  <DropdownMenuItem
                                    onClick={() => markAsRead(alert.id)}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    Marcar como lido
                                  </DropdownMenuItem>
                                )}
                                
                                {alert.status === "pending" && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() => openResolutionDialog(alert)}
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Resolver
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => dismissAlert(alert.id)}
                                    >
                                      <Ban className="h-4 w-4 mr-2" />
                                      Descartar
                                    </DropdownMenuItem>
                                  </>
                                )}
                                
                                <DropdownMenuSeparator />
                                
                                <DropdownMenuItem
                                  onClick={() => window.location.href = `/supplier/product-management?productId=${alert.productId}`}
                                >
                                  <Package className="h-4 w-4 mr-2" />
                                  Ver produto
                                </DropdownMenuItem>
                                
                                {alert.status === "resolved" && (
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedAlert(alert);
                                      // Aqui você poderia abrir um diálogo para mostrar detalhes da resolução
                                    }}
                                  >
                                    <MessageCircle className="h-4 w-4 mr-2" />
                                    Ver resolução
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </div>
        </CardContent>
        
        {!embedded && (
          <CardFooter className="flex justify-between">
            <div className="text-sm text-muted-foreground">
              Total: {filteredAlerts?.length || 0} alertas
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setTypeFilter("");
                  setStatusFilter("");
                  setPriorityFilter("");
                  setSearchQuery("");
                }}
              >
                Limpar Filtros
              </Button>
              
              <Button
                size="sm"
                onClick={() => refetchAlerts()}
              >
                Atualizar
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>
      
      {/* Diálogo de resolução de alerta */}
      <Dialog open={resolutionDialogOpen} onOpenChange={setResolutionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Resolver Alerta</DialogTitle>
            <DialogDescription>
              Forneça informações sobre a resolução do alerta para registrar no histórico.
            </DialogDescription>
          </DialogHeader>
          
          {selectedAlert && (
            <div className="py-4">
              <div className="mb-4 p-3 rounded-lg bg-muted">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {renderAlertTypeIcon(selectedAlert.alertType)}
                  </div>
                  <div>
                    <p className="font-medium">{selectedAlert.productName}</p>
                    <p className="text-sm text-muted-foreground">{selectedAlert.message}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="resolution-note">Nota de Resolução</Label>
                <Textarea
                  id="resolution-note"
                  placeholder="Descreva como o alerta foi resolvido..."
                  rows={3}
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setResolutionDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={resolveAlert}
              disabled={resolveAlertMutation.isPending}
            >
              {resolveAlertMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resolvendo...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Resolver Alerta
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo de configurações de alerta */}
      <Dialog open={alertSettingsOpen} onOpenChange={setAlertSettingsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Configurações de Alerta</DialogTitle>
            <DialogDescription>
              Personalize como os alertas de inventário funcionam para sua loja.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-5">
            <div className="space-y-3">
              <h3 className="font-medium">Alertas de Estoque Baixo</h3>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="low-stock-enabled" className="cursor-pointer">
                  Ativar Alertas de Estoque Baixo
                </Label>
                <Switch
                  id="low-stock-enabled"
                  checked={alertSettings.lowStockEnabled}
                  onCheckedChange={(checked) =>
                    setAlertSettings({ ...alertSettings, lowStockEnabled: checked })
                  }
                />
              </div>
              
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="low-stock-threshold">
                  Limite de Estoque Baixo Padrão
                </Label>
                <Input
                  id="low-stock-threshold"
                  type="number"
                  min="1"
                  value={alertSettings.lowStockThreshold}
                  onChange={(e) =>
                    setAlertSettings({
                      ...alertSettings,
                      lowStockThreshold: parseInt(e.target.value) || 1,
                    })
                  }
                  disabled={!alertSettings.lowStockEnabled}
                />
                <p className="text-xs text-muted-foreground">
                  Produtos com estoque abaixo deste número gerarão alertas.
                </p>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <h3 className="font-medium">Alertas de Validade</h3>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="expiring-enabled" className="cursor-pointer">
                  Ativar Alertas de Produtos Prestes a Vencer
                </Label>
                <Switch
                  id="expiring-enabled"
                  checked={alertSettings.expiringEnabled}
                  onCheckedChange={(checked) =>
                    setAlertSettings({ ...alertSettings, expiringEnabled: checked })
                  }
                />
              </div>
              
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="expiring-days">
                  Dias Antes da Validade
                </Label>
                <Input
                  id="expiring-days"
                  type="number"
                  min="1"
                  value={alertSettings.expiringDays}
                  onChange={(e) =>
                    setAlertSettings({
                      ...alertSettings,
                      expiringDays: parseInt(e.target.value) || 1,
                    })
                  }
                  disabled={!alertSettings.expiringEnabled}
                />
                <p className="text-xs text-muted-foreground">
                  Produtos que vencerão dentro desse número de dias gerarão alertas.
                </p>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <h3 className="font-medium">Preferências de Notificação</h3>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="automated-alerts" className="cursor-pointer">
                  Alertas Automáticos
                </Label>
                <Switch
                  id="automated-alerts"
                  checked={alertSettings.automatedAlerts}
                  onCheckedChange={(checked) =>
                    setAlertSettings({ ...alertSettings, automatedAlerts: checked })
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="email-notifications" className="cursor-pointer">
                  Receber Notificações por Email
                </Label>
                <Switch
                  id="email-notifications"
                  checked={alertSettings.emailNotifications}
                  onCheckedChange={(checked) =>
                    setAlertSettings({ ...alertSettings, emailNotifications: checked })
                  }
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAlertSettingsOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={saveAlertSettings}
              disabled={saveAlertSettingsMutation.isPending}
            >
              {saveAlertSettingsMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Salvar Configurações
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}