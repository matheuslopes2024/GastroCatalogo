import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CalendarIcon,
  CircleArrowDown,
  CircleArrowUp,
  Clock,
  Download,
  Filter,
  History,
  Info,
  Layers,
  Loader2,
  PackageOpen,
  PackagePlus,
  PanelLeftClose,
  Pencil,
  RefreshCw,
  Search,
  Settings,
  Truck,
  X,
  ChevronRight,
  PackageMinus,
  FileText,
  FileDown,
  MinusCircle,
  PlusCircle,
  RotateCcw,
  BarChart,
  FileSpreadsheet,
} from "lucide-react";
import { format, subDays, isSameDay, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface InventoryHistoryProps {
  productId?: number;
  embedded?: boolean;
}

// Tipos para o histórico de inventário
type HistoryAction =
  | "add"
  | "remove"
  | "adjust"
  | "restock"
  | "sale"
  | "return"
  | "damage"
  | "count"
  | "expiration"
  | "transfer"
  | "batch_update";

interface HistoryEntry {
  id: number;
  createdAt: string | Date;
  productId: number;
  productName: string;
  action: HistoryAction;
  quantityBefore: number;
  quantityAfter: number;
  difference: number;
  notes: string | null;
  reason: string | null;
  supplierId: number;
  userId: number;
  userName: string;
  batchId: string | null;
}

// Configurações para exportação
interface ExportSettings {
  format: "csv" | "excel";
  dateRange: "all" | "7days" | "30days" | "custom";
  customStartDate: Date | null;
  customEndDate: Date | null;
  includeProductDetails: boolean;
  includeUserDetails: boolean;
  includeNotes: boolean;
}

export function InventoryHistory({ productId, embedded = false }: InventoryHistoryProps) {
  const { user } = useAuth();
  
  // Estados
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(!embedded);
  const [customDateFrom, setCustomDateFrom] = useState<Date | null>(null);
  const [customDateTo, setCustomDateTo] = useState<Date | null>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    format: "csv",
    dateRange: "all",
    customStartDate: null,
    customEndDate: null,
    includeProductDetails: true,
    includeUserDetails: true,
    includeNotes: true,
  });
  const [historyEntryDetails, setHistoryEntryDetails] = useState<HistoryEntry | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [productFilter, setProductFilter] = useState<string>("");
  const [products, setProducts] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  
  // Query para buscar histórico de inventário
  const {
    data: historyData,
    isLoading: isLoadingHistory,
    refetch: refetchHistory,
  } = useQuery({
    queryKey: [
      "/api/supplier/inventory/history",
      {
        productId: productId || productFilter,
        action: actionFilter,
        dateFrom: getDateFromFilter(),
        dateTo: customDateTo,
        page,
        pageSize,
      },
    ],
    enabled: !!user?.id,
  });
  
  // Query para buscar produtos do fornecedor (para o filtro)
  const { data: productsData } = useQuery({
    queryKey: ["/api/supplier/products", { limit: 100, includeInventory: true }],
    enabled: !!user?.id && !productId && !embedded,
    onSuccess: (data) => {
      if (data?.items) {
        setProducts(data.items);
      }
    },
  });
  
  // Função para obter data inicial com base no filtro
  function getDateFromFilter(): Date | null {
    switch (dateFilter) {
      case "7days":
        return subDays(new Date(), 7);
      case "30days":
        return subDays(new Date(), 30);
      case "custom":
        return customDateFrom;
      default:
        return null;
    }
  }
  
  // Filtrar histórico baseado na busca
  const filteredHistory = historyData?.items?.filter((entry: HistoryEntry) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      entry.productName?.toLowerCase().includes(query) ||
      entry.notes?.toLowerCase().includes(query) ||
      entry.userName?.toLowerCase().includes(query) ||
      entry.batchId?.toLowerCase().includes(query)
    );
  });
  
  // Função para renderizar ícone da ação de histórico
  const renderActionIcon = (action: HistoryAction) => {
    switch (action) {
      case "add":
        return <PackagePlus className="h-4 w-4 text-green-500" />;
      case "remove":
        return <PackageMinus className="h-4 w-4 text-red-500" />;
      case "adjust":
        return <Settings className="h-4 w-4 text-blue-500" />;
      case "restock":
        return <Truck className="h-4 w-4 text-purple-500" />;
      case "sale":
        return <ArrowUp className="h-4 w-4 text-green-500" />;
      case "return":
        return <RotateCcw className="h-4 w-4 text-amber-500" />;
      case "damage":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "count":
        return <Layers className="h-4 w-4 text-blue-500" />;
      case "expiration":
        return <Clock className="h-4 w-4 text-orange-500" />;
      case "transfer":
        return <RefreshCw className="h-4 w-4 text-indigo-500" />;
      case "batch_update":
        return <FileSpreadsheet className="h-4 w-4 text-cyan-500" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };
  
  // Função para obter rótulo da ação
  const getActionLabel = (action: HistoryAction) => {
    switch (action) {
      case "add":
        return "Adição";
      case "remove":
        return "Remoção";
      case "adjust":
        return "Ajuste";
      case "restock":
        return "Reposição";
      case "sale":
        return "Venda";
      case "return":
        return "Devolução";
      case "damage":
        return "Danificado";
      case "count":
        return "Contagem";
      case "expiration":
        return "Expiração";
      case "transfer":
        return "Transferência";
      case "batch_update":
        return "Atualização em Massa";
      default:
        return action;
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
  
  // Função para abrir o diálogo de detalhes
  const showHistoryEntryDetails = (entry: HistoryEntry) => {
    setHistoryEntryDetails(entry);
    setDetailsDialogOpen(true);
  };
  
  // Função para exportar histórico
  const exportHistory = () => {
    // Simulação de exportação - em um ambiente real, isso faria uma chamada API
    // para gerar o arquivo e depois baixá-lo
    
    let filename = `historico_estoque_${format(new Date(), "yyyyMMdd")}`;
    
    if (exportSettings.format === "csv") {
      filename += ".csv";
    } else {
      filename += ".xlsx";
    }
    
    // Fechando o diálogo
    setExportDialogOpen(false);
    
    // Em um ambiente real, aqui faria o download do arquivo
    // Por enquanto, mostramos apenas uma mensagem de simulação
    alert(
      `Exportação simulada: ${filename} com configurações: ${JSON.stringify(
        exportSettings,
        null,
        2
      )}`
    );
  };
  
  // Renderizar indicador de diferença
  const renderDifference = (difference: number) => {
    if (difference > 0) {
      return (
        <div className="flex items-center text-green-500">
          <PlusCircle className="mr-1 h-3 w-3" />
          <span>+{difference}</span>
        </div>
      );
    } else if (difference < 0) {
      return (
        <div className="flex items-center text-red-500">
          <MinusCircle className="mr-1 h-3 w-3" />
          <span>{difference}</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center text-muted-foreground">
          <span>0</span>
        </div>
      );
    }
  };
  
  // Função para ir para a próxima página
  const goToNextPage = () => {
    if (historyData?.hasMore) {
      setPage(page + 1);
    }
  };
  
  // Função para ir para a página anterior
  const goToPreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };
  
  return (
    <div className={embedded ? "" : "space-y-6"}>
      {!embedded && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Histórico de Inventário</h2>
            <p className="text-muted-foreground">
              Visualize todas as alterações de estoque
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => refetchHistory()}
              className="h-9"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Atualizar
            </Button>
            <Button
              variant="outline"
              onClick={() => setExportDialogOpen(true)}
              className="h-9"
            >
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>
      )}
      
      <Card className={embedded ? "border-0 shadow-none" : ""}>
        {!embedded && (
          <CardHeader className="pb-3">
            <CardTitle>Registro de Atividades de Estoque</CardTitle>
            <CardDescription>
              Acompanhe as movimentações, ajustes e atualizações de inventário
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
                  placeholder="Buscar no histórico..."
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
                {!productId && (
                  <div>
                    <Label htmlFor="product-filter" className="text-xs">Produto</Label>
                    <Select
                      value={productFilter}
                      onValueChange={setProductFilter}
                    >
                      <SelectTrigger id="product-filter" className="h-9">
                        <SelectValue placeholder="Todos os produtos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todos os produtos</SelectItem>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id.toString()}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div>
                  <Label htmlFor="action-filter" className="text-xs">Tipo de Ação</Label>
                  <Select
                    value={actionFilter}
                    onValueChange={setActionFilter}
                  >
                    <SelectTrigger id="action-filter" className="h-9">
                      <SelectValue placeholder="Todas as ações" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas as ações</SelectItem>
                      <SelectItem value="add">Adição</SelectItem>
                      <SelectItem value="remove">Remoção</SelectItem>
                      <SelectItem value="adjust">Ajuste</SelectItem>
                      <SelectItem value="restock">Reposição</SelectItem>
                      <SelectItem value="sale">Venda</SelectItem>
                      <SelectItem value="return">Devolução</SelectItem>
                      <SelectItem value="damage">Danificado</SelectItem>
                      <SelectItem value="count">Contagem</SelectItem>
                      <SelectItem value="expiration">Expiração</SelectItem>
                      <SelectItem value="transfer">Transferência</SelectItem>
                      <SelectItem value="batch_update">Atualização em Massa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="date-filter" className="text-xs">Período</Label>
                  <Select
                    value={dateFilter}
                    onValueChange={setDateFilter}
                  >
                    <SelectTrigger id="date-filter" className="h-9">
                      <SelectValue placeholder="Selecione o período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todo o histórico</SelectItem>
                      <SelectItem value="7days">Últimos 7 dias</SelectItem>
                      <SelectItem value="30days">Últimos 30 dias</SelectItem>
                      <SelectItem value="custom">Período personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {dateFilter === "custom" && (
                  <div className="sm:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                    <div>
                      <Label htmlFor="date-from" className="text-xs">Data inicial</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal h-9"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {customDateFrom ? (
                              format(customDateFrom, "dd/MM/yyyy")
                            ) : (
                              <span>Selecione a data inicial</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={customDateFrom}
                            onSelect={setCustomDateFrom}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div>
                      <Label htmlFor="date-to" className="text-xs">Data final</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal h-9"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {customDateTo ? (
                              format(customDateTo, "dd/MM/yyyy")
                            ) : (
                              <span>Selecione a data final</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={customDateTo}
                            onSelect={setCustomDateTo}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                )}
                
                <div className="sm:col-span-3 flex justify-end gap-2 mt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setActionFilter("");
                      setDateFilter("all");
                      setProductFilter("");
                      setCustomDateFrom(null);
                      setCustomDateTo(null);
                      setSearchQuery("");
                      setPage(1);
                    }}
                  >
                    Limpar Filtros
                  </Button>
                  <Button
                    onClick={() => {
                      setPage(1);
                      refetchHistory();
                    }}
                  >
                    Aplicar Filtros
                  </Button>
                </div>
              </div>
            )}
            
            <div>
              <ScrollArea className={embedded ? "h-[350px]" : "h-[500px]"}>
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead className="w-[50px]">Ação</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead className="text-center w-[90px]">Qde Anterior</TableHead>
                      <TableHead className="text-center w-[90px]">Nova Qde</TableHead>
                      <TableHead className="text-center w-[80px]">Diferença</TableHead>
                      <TableHead className="w-[180px]">Usuário</TableHead>
                      <TableHead className="w-[100px]">Data</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingHistory ? (
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
                            <div className="w-12 h-4 mx-auto bg-gray-200 rounded animate-pulse" />
                          </TableCell>
                          <TableCell>
                            <div className="w-12 h-4 mx-auto bg-gray-200 rounded animate-pulse" />
                          </TableCell>
                          <TableCell>
                            <div className="w-12 h-4 mx-auto bg-gray-200 rounded animate-pulse" />
                          </TableCell>
                          <TableCell>
                            <div className="w-20 h-4 bg-gray-200 rounded animate-pulse" />
                          </TableCell>
                          <TableCell>
                            <div className="w-20 h-4 bg-gray-200 rounded animate-pulse" />
                          </TableCell>
                          <TableCell>
                            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : filteredHistory?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-32 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <History className="h-8 w-8 text-muted-foreground mb-2" />
                            <p className="text-muted-foreground">
                              Nenhum registro encontrado
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
                      filteredHistory?.map((entry: HistoryEntry) => (
                        <TableRow key={entry.id}>
                          <TableCell>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center">
                                    {renderActionIcon(entry.action)}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{getActionLabel(entry.action)}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{entry.productName}</p>
                              {entry.batchId && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <span>Lote: {entry.batchId}</span>
                                </span>
                              )}
                              {entry.notes && (
                                <span className="text-xs text-muted-foreground line-clamp-1">
                                  {entry.notes}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center font-mono">
                            {entry.quantityBefore}
                          </TableCell>
                          <TableCell className="text-center font-mono">
                            {entry.quantityAfter}
                          </TableCell>
                          <TableCell className="text-center">
                            {renderDifference(entry.difference)}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {entry.userName}
                              {entry.reason && (
                                <div className="text-xs text-muted-foreground">
                                  Motivo: {entry.reason}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="text-sm text-muted-foreground">
                                    {formatRelativeDate(entry.createdAt)}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{formatAbsoluteDate(entry.createdAt)}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => showHistoryEntryDetails(entry)}
                            >
                              <Info className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
              
              {/* Paginação */}
              {(page > 1 || historyData?.hasMore) && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Página {page} de {historyData?.totalPages || "?"}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToPreviousPage}
                      disabled={page <= 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToNextPage}
                      disabled={!historyData?.hasMore}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
        
        {!embedded && (
          <CardFooter className="flex justify-between">
            <div className="text-sm text-muted-foreground">
              Total: {historyData?.total || 0} registros de movimentação
            </div>
          </CardFooter>
        )}
      </Card>
      
      {/* Dialog de detalhes da movimentação */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes da Movimentação</DialogTitle>
            <DialogDescription>
              Informações completas sobre esta alteração de estoque
            </DialogDescription>
          </DialogHeader>
          
          {historyEntryDetails && (
            <div className="py-2 space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    {renderActionIcon(historyEntryDetails.action)}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    {getActionLabel(historyEntryDetails.action)}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {formatAbsoluteDate(historyEntryDetails.createdAt)}
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="font-medium">Qtd. Anterior</div>
                  <div className="text-2xl font-mono mt-1">
                    {historyEntryDetails.quantityBefore}
                  </div>
                </div>
                <div>
                  <div className="font-medium">Nova Qtd.</div>
                  <div className="text-2xl font-mono mt-1">
                    {historyEntryDetails.quantityAfter}
                  </div>
                </div>
                <div>
                  <div className="font-medium">Diferença</div>
                  <div className="text-2xl font-mono mt-1 flex items-center">
                    {historyEntryDetails.difference > 0 && (
                      <span className="text-green-500">+</span>
                    )}
                    <span
                      className={
                        historyEntryDetails.difference > 0
                          ? "text-green-500"
                          : historyEntryDetails.difference < 0
                          ? "text-red-500"
                          : ""
                      }
                    >
                      {historyEntryDetails.difference}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="font-medium">Produto</div>
                <div className="text-sm bg-muted p-2 rounded-md">
                  {historyEntryDetails.productName}
                  <div>ID: {historyEntryDetails.productId}</div>
                </div>
              </div>
              
              {historyEntryDetails.batchId && (
                <div className="space-y-2">
                  <div className="font-medium">Lote</div>
                  <div className="text-sm bg-muted p-2 rounded-md">
                    {historyEntryDetails.batchId}
                  </div>
                </div>
              )}
              
              {historyEntryDetails.reason && (
                <div className="space-y-2">
                  <div className="font-medium">Motivo</div>
                  <div className="text-sm bg-muted p-2 rounded-md">
                    {historyEntryDetails.reason}
                  </div>
                </div>
              )}
              
              {historyEntryDetails.notes && (
                <div className="space-y-2">
                  <div className="font-medium">Observações</div>
                  <div className="text-sm bg-muted p-2 rounded-md whitespace-pre-wrap">
                    {historyEntryDetails.notes}
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <div className="font-medium">Responsável</div>
                <div className="text-sm bg-muted p-2 rounded-md">
                  {historyEntryDetails.userName}
                  <div>ID: {historyEntryDetails.userId}</div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDetailsDialogOpen(false)}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog de exportação */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Exportar Histórico de Inventário</DialogTitle>
            <DialogDescription>
              Configure os detalhes para exportar o histórico de movimentações
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-2 space-y-4">
            <div className="space-y-3">
              <Label>Formato de Exportação</Label>
              <Tabs
                defaultValue="csv"
                value={exportSettings.format}
                onValueChange={(value) =>
                  setExportSettings({ ...exportSettings, format: value as "csv" | "excel" })
                }
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="csv" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    CSV
                  </TabsTrigger>
                  <TabsTrigger value="excel" className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    Excel
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            <div className="space-y-3">
              <Label>Período</Label>
              <Tabs
                defaultValue="all"
                value={exportSettings.dateRange}
                onValueChange={(value) =>
                  setExportSettings({
                    ...exportSettings,
                    dateRange: value as ExportSettings["dateRange"],
                  })
                }
              >
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="all">Tudo</TabsTrigger>
                  <TabsTrigger value="7days">7 dias</TabsTrigger>
                  <TabsTrigger value="30days">30 dias</TabsTrigger>
                  <TabsTrigger value="custom">Personalizado</TabsTrigger>
                </TabsList>
              </Tabs>
              
              {exportSettings.dateRange === "custom" && (
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <Label className="text-xs">Data Inicial</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {exportSettings.customStartDate ? (
                            format(exportSettings.customStartDate, "dd/MM/yyyy")
                          ) : (
                            <span>Selecionar</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={exportSettings.customStartDate}
                          onSelect={(date) =>
                            setExportSettings({
                              ...exportSettings,
                              customStartDate: date,
                            })
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div>
                    <Label className="text-xs">Data Final</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {exportSettings.customEndDate ? (
                            format(exportSettings.customEndDate, "dd/MM/yyyy")
                          ) : (
                            <span>Selecionar</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={exportSettings.customEndDate}
                          onSelect={(date) =>
                            setExportSettings({
                              ...exportSettings,
                              customEndDate: date,
                            })
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              <Label>Opções de Conteúdo</Label>
              <div className="grid grid-cols-1 gap-2">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="include-product-details"
                    className="cursor-pointer text-sm"
                  >
                    Incluir detalhes do produto
                  </Label>
                  <div className="flex items-center space-x-2">
                    <Label
                      htmlFor="include-product-details"
                      className="cursor-pointer text-sm"
                    >
                      {exportSettings.includeProductDetails ? "Sim" : "Não"}
                    </Label>
                    <input
                      type="checkbox"
                      id="include-product-details"
                      checked={exportSettings.includeProductDetails}
                      onChange={(e) =>
                        setExportSettings({
                          ...exportSettings,
                          includeProductDetails: e.target.checked,
                        })
                      }
                      className="form-checkbox h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary"
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="include-user-details"
                    className="cursor-pointer text-sm"
                  >
                    Incluir detalhes do usuário
                  </Label>
                  <div className="flex items-center space-x-2">
                    <Label
                      htmlFor="include-user-details"
                      className="cursor-pointer text-sm"
                    >
                      {exportSettings.includeUserDetails ? "Sim" : "Não"}
                    </Label>
                    <input
                      type="checkbox"
                      id="include-user-details"
                      checked={exportSettings.includeUserDetails}
                      onChange={(e) =>
                        setExportSettings({
                          ...exportSettings,
                          includeUserDetails: e.target.checked,
                        })
                      }
                      className="form-checkbox h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary"
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="include-notes"
                    className="cursor-pointer text-sm"
                  >
                    Incluir notas e observações
                  </Label>
                  <div className="flex items-center space-x-2">
                    <Label
                      htmlFor="include-notes"
                      className="cursor-pointer text-sm"
                    >
                      {exportSettings.includeNotes ? "Sim" : "Não"}
                    </Label>
                    <input
                      type="checkbox"
                      id="include-notes"
                      checked={exportSettings.includeNotes}
                      onChange={(e) =>
                        setExportSettings({
                          ...exportSettings,
                          includeNotes: e.target.checked,
                        })
                      }
                      className="form-checkbox h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setExportDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={exportHistory}
              disabled={
                exportSettings.dateRange === "custom" &&
                (!exportSettings.customStartDate || !exportSettings.customEndDate)
              }
            >
              <FileDown className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}