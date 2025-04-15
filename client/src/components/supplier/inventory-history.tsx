import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { 
  Search, 
  Filter, 
  RefreshCw, 
  ArrowUpDown, 
  History,
  Calendar,
  User,
  Package,
  ClipboardCheck,
  Truck,
  Plus,
  Minus,
  AlertTriangle,
  BarChart
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Interface para histórico de inventário já definida em inventory-management.tsx
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

export const InventoryHistory = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date-desc");
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<InventoryHistory | null>(null);
  const [showHistoryDetails, setShowHistoryDetails] = useState(false);

  // Buscar histórico de inventário
  const { data: historyItems, isLoading, refetch } = useQuery<InventoryHistory[]>({
    queryKey: ['/api/supplier/inventory/history', dateRange],
    queryFn: async () => {
      let url = '/api/supplier/inventory/history';
      const params = new URLSearchParams();
      
      if (dateRange.from) {
        params.append('startDate', dateRange.from.toISOString());
      }
      
      if (dateRange.to) {
        params.append('endDate', dateRange.to.toISOString());
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Falha ao buscar histórico de inventário");
      }
      return response.json();
    },
    enabled: !!user?.id,
  });

  // Filtrar e ordenar histórico
  const filteredHistory = historyItems
    ? historyItems
        .filter(item => {
          const matchesSearch = !searchTerm || 
            (item.productName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
             item.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
             (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase())));
          
          const matchesAction = actionFilter === "all" || item.action === actionFilter;
          
          return matchesSearch && matchesAction;
        })
        .sort((a, b) => {
          switch (sortBy) {
            case "date-asc":
              return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            case "date-desc":
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            case "product-asc":
              return (a.productName || "").localeCompare(b.productName || "");
            case "product-desc":
              return (b.productName || "").localeCompare(a.productName || "");
            case "quantity-asc":
              return a.quantityAfter - b.quantityAfter;
            case "quantity-desc":
              return b.quantityAfter - a.quantityAfter;
            default:
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          }
        })
    : [];

  // Ver detalhes do histórico
  const handleViewDetails = (item: InventoryHistory) => {
    setSelectedHistoryItem(item);
    setShowHistoryDetails(true);
  };

  // Obter ícone da ação
  const getActionIcon = (action: string) => {
    switch (action) {
      case "initial":
        return <Package className="h-4 w-4 text-blue-500" />;
      case "restock":
        return <Plus className="h-4 w-4 text-green-500" />;
      case "adjustment":
        return <BarChart className="h-4 w-4 text-amber-500" />;
      case "sold":
        return <Minus className="h-4 w-4 text-red-500" />;
      case "return":
        return <Truck className="h-4 w-4 text-purple-500" />;
      case "audit":
        return <ClipboardCheck className="h-4 w-4 text-indigo-500" />;
      case "batch_update":
        return <RefreshCw className="h-4 w-4 text-cyan-500" />;
      case "manual":
        return <User className="h-4 w-4 text-slate-500" />;
      case "reserved":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      default:
        return <History className="h-4 w-4 text-gray-500" />;
    }
  };

  // Obter texto da ação
  const getActionText = (action: string) => {
    switch (action) {
      case "initial":
        return "Cadastro Inicial";
      case "restock":
        return "Reabastecimento";
      case "adjustment":
        return "Ajuste Manual";
      case "sold":
        return "Venda/Saída";
      case "return":
        return "Devolução";
      case "audit":
        return "Auditoria";
      case "batch_update":
        return "Atualização em Lote";
      case "manual":
        return "Alteração Manual";
      case "reserved":
        return "Reserva";
      default:
        return action;
    }
  };

  // Obter badge da ação
  const getActionBadge = (action: string) => {
    switch (action) {
      case "initial":
        return <Badge variant="outline" className="border-blue-500 text-blue-700 flex items-center gap-1">
          <Package className="h-3 w-3" />
          Cadastro Inicial
        </Badge>;
      case "restock":
        return <Badge variant="success" className="flex items-center gap-1">
          <Plus className="h-3 w-3" />
          Reabastecimento
        </Badge>;
      case "adjustment":
        return <Badge variant="outline" className="border-amber-500 text-amber-700 flex items-center gap-1">
          <BarChart className="h-3 w-3" />
          Ajuste Manual
        </Badge>;
      case "sold":
        return <Badge variant="outline" className="border-red-500 text-red-700 flex items-center gap-1">
          <Minus className="h-3 w-3" />
          Venda
        </Badge>;
      case "return":
        return <Badge variant="outline" className="border-purple-500 text-purple-700 flex items-center gap-1">
          <Truck className="h-3 w-3" />
          Devolução
        </Badge>;
      case "audit":
        return <Badge variant="outline" className="border-indigo-500 text-indigo-700 flex items-center gap-1">
          <ClipboardCheck className="h-3 w-3" />
          Auditoria
        </Badge>;
      case "batch_update":
        return <Badge variant="outline" className="border-cyan-500 text-cyan-700 flex items-center gap-1">
          <RefreshCw className="h-3 w-3" />
          Atualização em Lote
        </Badge>;
      case "manual":
        return <Badge variant="outline" className="flex items-center gap-1">
          <User className="h-3 w-3" />
          Manual
        </Badge>;
      case "reserved":
        return <Badge variant="outline" className="border-amber-500 text-amber-700 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Reserva
        </Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  const clearDateFilter = () => {
    setDateRange({ from: undefined, to: undefined });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl font-bold">Histórico de Estoque</CardTitle>
            <CardDescription>
              Visualize todo o histórico de alterações no estoque
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            onClick={() => refetch()}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filtros e Pesquisa */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por produto, usuário ou notas..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="min-w-[240px] justify-start text-left font-normal flex items-center gap-2"
                >
                  <Calendar className="h-4 w-4" />
                  <span>
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "dd/MM/yyyy")} - {format(dateRange.to, "dd/MM/yyyy")}
                        </>
                      ) : (
                        format(dateRange.from, "dd/MM/yyyy")
                      )
                    ) : (
                      "Selecione um período"
                    )}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <div className="p-3 border-b">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-sm">Filtro de Data</h4>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={clearDateFilter}
                      disabled={!dateRange.from && !dateRange.to}
                    >
                      Limpar
                    </Button>
                  </div>
                </div>
                <CalendarComponent
                  mode="range"
                  selected={{
                    from: dateRange.from,
                    to: dateRange.to,
                  }}
                  onSelect={(range) => setDateRange(range || { from: undefined, to: undefined })}
                  locale={pt}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[180px]">
                <span className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <SelectValue placeholder="Filtrar por ação" />
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as ações</SelectItem>
                <SelectItem value="initial">Cadastro Inicial</SelectItem>
                <SelectItem value="restock">Reabastecimento</SelectItem>
                <SelectItem value="adjustment">Ajuste Manual</SelectItem>
                <SelectItem value="sold">Venda/Saída</SelectItem>
                <SelectItem value="return">Devolução</SelectItem>
                <SelectItem value="audit">Auditoria</SelectItem>
                <SelectItem value="batch_update">Atualização em Lote</SelectItem>
                <SelectItem value="manual">Alteração Manual</SelectItem>
                <SelectItem value="reserved">Reserva</SelectItem>
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
                <SelectItem value="product-asc">Produto (A-Z)</SelectItem>
                <SelectItem value="product-desc">Produto (Z-A)</SelectItem>
                <SelectItem value="quantity-asc">Quantidade (Menor primeiro)</SelectItem>
                <SelectItem value="quantity-desc">Quantidade (Maior primeiro)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tabela de Histórico */}
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="w-full h-16" />
            ))}
          </div>
        ) : filteredHistory.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead className="text-center">Antes</TableHead>
                  <TableHead className="text-center">Depois</TableHead>
                  <TableHead className="text-center">Variação</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead className="text-right">Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(item.createdAt), "dd/MM/yyyy HH:mm", { locale: pt })}
                    </TableCell>
                    <TableCell className="font-medium max-w-[150px] truncate">
                      {item.productName || `Produto #${item.productId}`}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getActionIcon(item.action)}
                        <span className="hidden md:inline">{getActionText(item.action)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {item.quantityBefore}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.quantityAfter}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={
                        item.quantityAfter > item.quantityBefore
                          ? "text-green-600 font-medium"
                          : item.quantityAfter < item.quantityBefore
                          ? "text-red-600 font-medium"
                          : ""
                      }>
                        {item.quantityAfter > item.quantityBefore ? '+' : ''}
                        {item.quantityAfter - item.quantityBefore}
                      </span>
                    </TableCell>
                    <TableCell>
                      {item.userName || `Usuário #${item.userId}`}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleViewDetails(item)}
                      >
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 border rounded-lg">
            <History className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum histórico encontrado</h3>
            <p className="text-muted-foreground mb-4 text-center">
              {searchTerm || actionFilter !== "all" || dateRange.from || dateRange.to
                ? "Nenhum resultado encontrado com os filtros atuais. Tente modificar sua busca."
                : "Não há registros de alterações de estoque no período selecionado."}
            </p>
          </div>
        )}

        {/* Modal de Detalhes do Histórico */}
        <Dialog open={showHistoryDetails} onOpenChange={setShowHistoryDetails}>
          <DialogContent className="sm:max-w-[550px]">
            {selectedHistoryItem && (
              <>
                <DialogHeader>
                  <div className="flex items-center justify-between">
                    <DialogTitle>Detalhes da Alteração</DialogTitle>
                    {getActionBadge(selectedHistoryItem.action)}
                  </div>
                  <DialogDescription>
                    Informações detalhadas sobre a alteração de estoque
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <div className="text-sm text-muted-foreground">Produto</div>
                    <div className="font-medium text-lg">
                      {selectedHistoryItem.productName || `Produto #${selectedHistoryItem.productId}`}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Data da Alteração</div>
                      <div className="font-medium">
                        {format(new Date(selectedHistoryItem.createdAt), "dd/MM/yyyy HH:mm:ss", { locale: pt })}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Realizado por</div>
                      <div className="font-medium">
                        {selectedHistoryItem.userName || `Usuário #${selectedHistoryItem.userId}`}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 py-2 px-4 bg-muted rounded-md">
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Anterior</div>
                      <div className="text-xl font-bold">{selectedHistoryItem.quantityBefore}</div>
                    </div>
                    <div className="text-center flex flex-col items-center justify-center">
                      <div className={
                        selectedHistoryItem.quantityAfter > selectedHistoryItem.quantityBefore
                          ? "text-green-600 font-medium flex items-center"
                          : selectedHistoryItem.quantityAfter < selectedHistoryItem.quantityBefore
                          ? "text-red-600 font-medium flex items-center"
                          : "text-muted-foreground flex items-center"
                      }>
                        {selectedHistoryItem.quantityAfter > selectedHistoryItem.quantityBefore ? (
                          <Plus className="h-4 w-4 mr-1" />
                        ) : selectedHistoryItem.quantityAfter < selectedHistoryItem.quantityBefore ? (
                          <Minus className="h-4 w-4 mr-1" />
                        ) : (
                          <ArrowUpDown className="h-4 w-4 mr-1" />
                        )}
                        {selectedHistoryItem.quantityAfter > selectedHistoryItem.quantityBefore ? '+' : ''}
                        {selectedHistoryItem.quantityAfter - selectedHistoryItem.quantityBefore}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Atual</div>
                      <div className="text-xl font-bold">{selectedHistoryItem.quantityAfter}</div>
                    </div>
                  </div>
                  
                  {selectedHistoryItem.notes && (
                    <div>
                      <div className="text-sm text-muted-foreground">Notas</div>
                      <div className="p-3 rounded-md border mt-1 text-sm">{selectedHistoryItem.notes}</div>
                    </div>
                  )}
                  
                  {selectedHistoryItem.reason && (
                    <div>
                      <div className="text-sm text-muted-foreground">Motivo</div>
                      <div className="p-3 rounded-md border mt-1 text-sm">{selectedHistoryItem.reason}</div>
                    </div>
                  )}
                  
                  {selectedHistoryItem.batchId && (
                    <div>
                      <div className="text-sm text-muted-foreground">ID do Lote</div>
                      <div className="font-medium">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger className="underline decoration-dotted">
                              {selectedHistoryItem.batchId}
                            </TooltipTrigger>
                            <TooltipContent>
                              Alterações em lote compartilham o mesmo ID
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  )}
                </div>
                
                <DialogFooter>
                  <Button onClick={() => setShowHistoryDetails(false)}>Fechar</Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};