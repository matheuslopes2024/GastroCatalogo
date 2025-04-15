import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  History,
  RotateCcw,
  Search,
  Filter,
  Calendar,
  Package,
  ArrowDown,
  ArrowUp,
  Pencil,
  RefreshCw,
  MinusCircle,
  PlusCircle,
  FileBarChart,
  FileCheck,
  Copy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Pagination } from "@/components/ui/pagination";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function InventoryHistory() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [filterType, setFilterType] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  
  // Buscar histórico de inventário
  const { 
    data: historyEntries, 
    isLoading: isLoadingHistory,
    refetch: refetchHistory
  } = useQuery({
    queryKey: ["/api/supplier/inventory/history", { 
      action: filterType || undefined,
      date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined
    }],
    enabled: !!user?.id,
  });

  // Filtrar histórico baseado na pesquisa
  const filteredEntries = historyEntries?.filter((entry: any) => 
    !searchTerm || 
    (entry.notes && entry.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
    entry.productId.toString().includes(searchTerm) ||
    entry.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (entry.batchId && entry.batchId.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  // Calcular índices para paginação
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedEntries = filteredEntries.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredEntries.length / itemsPerPage);

  // Ver detalhes de uma entrada
  const handleViewDetails = (entry: any) => {
    setSelectedEntry(entry);
    setIsDetailsOpen(true);
  };

  // Paginar
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

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

  // Formatar diferença de quantidade
  const formatQuantityDifference = (before: number, after: number) => {
    const diff = after - before;
    if (diff > 0) {
      return (
        <span className="text-green-600 flex items-center whitespace-nowrap">
          <ArrowUp className="inline-block h-3 w-3 mr-1" />
          +{diff}
        </span>
      );
    } else if (diff < 0) {
      return (
        <span className="text-red-600 flex items-center whitespace-nowrap">
          <ArrowDown className="inline-block h-3 w-3 mr-1" />
          {diff}
        </span>
      );
    } else {
      return (
        <span className="text-gray-500 flex items-center whitespace-nowrap">
          0
        </span>
      );
    }
  };

  // Obter ícone para a ação
  const getActionIcon = (action: string) => {
    switch (action) {
      case "add":
        return <PlusCircle className="h-4 w-4 text-green-600" />;
      case "remove":
        return <MinusCircle className="h-4 w-4 text-red-600" />;
      case "update":
        return <Pencil className="h-4 w-4 text-blue-600" />;
      case "audit":
        return <FileCheck className="h-4 w-4 text-purple-600" />;
      case "restock":
        return <RefreshCw className="h-4 w-4 text-cyan-600" />;
      case "batch_update":
        return <Copy className="h-4 w-4 text-amber-600" />;
      case "import":
        return <FileBarChart className="h-4 w-4 text-gray-600" />;
      default:
        return <RotateCcw className="h-4 w-4 text-gray-600" />;
    }
  };

  // Formatar tipo de ação
  const formatAction = (action: string) => {
    switch (action) {
      case "add":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center">
          <PlusCircle className="mr-1 h-3 w-3" />
          Adição
        </Badge>;
      case "remove":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex items-center">
          <MinusCircle className="mr-1 h-3 w-3" />
          Remoção
        </Badge>;
      case "update":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center">
          <Pencil className="mr-1 h-3 w-3" />
          Atualização
        </Badge>;
      case "audit":
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 flex items-center">
          <FileCheck className="mr-1 h-3 w-3" />
          Auditoria
        </Badge>;
      case "restock":
        return <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200 flex items-center">
          <RefreshCw className="mr-1 h-3 w-3" />
          Reposição
        </Badge>;
      case "batch_update":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center">
          <Copy className="mr-1 h-3 w-3" />
          Atualização em Lote
        </Badge>;
      case "import":
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 flex items-center">
          <FileBarChart className="mr-1 h-3 w-3" />
          Importação
        </Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Buscar por produto, notas ou lote..." 
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
                <span>{filterType ? 'Filtrar por ação' : 'Todas as ações'}</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas</SelectItem>
              <SelectItem value="add">Adição</SelectItem>
              <SelectItem value="remove">Remoção</SelectItem>
              <SelectItem value="update">Atualização</SelectItem>
              <SelectItem value="audit">Auditoria</SelectItem>
              <SelectItem value="restock">Reposição</SelectItem>
              <SelectItem value="batch_update">Atualização em Lote</SelectItem>
              <SelectItem value="import">Importação</SelectItem>
            </SelectContent>
          </Select>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className="flex items-center"
              >
                <Calendar className="mr-2 h-4 w-4" />
                {selectedDate ? (
                  format(selectedDate, 'dd/MM/yyyy')
                ) : (
                  "Selecionar Data"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                locale={ptBR}
                className="border rounded-md"
                footer={
                  <div className="flex justify-between items-center p-2 border-t">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setSelectedDate(undefined)}
                    >
                      Limpar
                    </Button>
                    
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={() => setSelectedDate(new Date())}
                    >
                      Hoje
                    </Button>
                  </div>
                }
              />
            </PopoverContent>
          </Popover>
          
          <Button 
            variant="outline" 
            onClick={() => refetchHistory()}
            className="flex items-center"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <History className="mr-2 h-5 w-5 text-blue-600" />
            Histórico de Inventário
          </CardTitle>
          <CardDescription>
            Monitore todas as alterações realizadas no seu inventário de produtos.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {isLoadingHistory ? (
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
          ) : filteredEntries.length > 0 ? (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ação</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead>Alteração</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedEntries.map((entry: any) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          {formatAction(entry.action)}
                        </TableCell>
                        <TableCell>
                          <Link href={`/produto/${entry.productId}`}>
                            <a className="flex items-center text-blue-600 hover:underline">
                              #{entry.productId}
                            </a>
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                {formatQuantityDifference(entry.quantityBefore, entry.quantityAfter)}
                              </span>
                              <span className="text-xs text-gray-500">
                                ({entry.quantityBefore} → {entry.quantityAfter})
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate">
                            {entry.reason || "Sem motivo especificado"}
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatDate(entry.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(entry)}
                            className="h-8 px-2"
                          >
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  Ver Detalhes
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Ver detalhes completos</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {totalPages > 1 && (
                <div className="flex justify-center mt-4">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={paginate}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="bg-blue-50 p-3 rounded-full mb-2">
                <History className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="text-lg font-medium">Nenhum registro encontrado</h3>
              <p className="text-gray-500 mt-1 max-w-md">
                {searchTerm
                  ? `Não encontramos registros correspondentes a "${searchTerm}"`
                  : filterType
                    ? "Não existem registros que correspondam ao filtro selecionado."
                    : selectedDate
                      ? `Não há registros para o dia ${format(selectedDate, 'dd/MM/yyyy')}.`
                      : "Você não tem histórico de inventário no momento."
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para detalhes do registro */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              {selectedEntry && getActionIcon(selectedEntry.action)}
              <span className="ml-2">Detalhes da Alteração de Estoque</span>
            </DialogTitle>
            <DialogDescription>
              Informações detalhadas sobre esta alteração de estoque.
            </DialogDescription>
          </DialogHeader>
          
          {selectedEntry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">ID do Registro</p>
                  <p className="text-sm">{selectedEntry.id}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Data</p>
                  <p className="text-sm">{formatDate(selectedEntry.createdAt)}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Ação</p>
                  <p className="text-sm">{formatAction(selectedEntry.action)}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Produto</p>
                  <p className="text-sm">#{selectedEntry.productId}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Usuário</p>
                  <p className="text-sm">#{selectedEntry.userId}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Lote (se aplicável)</p>
                  <p className="text-sm">{selectedEntry.batchId || "N/A"}</p>
                </div>
              </div>
              
              <div className="border rounded-md p-4 bg-gray-50">
                <div className="flex justify-between mb-2">
                  <p className="text-sm font-medium">Quantidade Antes:</p>
                  <p className="text-sm">{selectedEntry.quantityBefore}</p>
                </div>
                <div className="flex justify-between mb-2">
                  <p className="text-sm font-medium">Quantidade Depois:</p>
                  <p className="text-sm">{selectedEntry.quantityAfter}</p>
                </div>
                <div className="flex justify-between">
                  <p className="text-sm font-medium">Diferença:</p>
                  <p className="text-sm font-medium">
                    {formatQuantityDifference(selectedEntry.quantityBefore, selectedEntry.quantityAfter)}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">Motivo</p>
                <p className="text-sm p-3 bg-gray-100 rounded-md">
                  {selectedEntry.reason || "Sem motivo especificado"}
                </p>
              </div>
              
              {selectedEntry.notes && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">Notas Adicionais</p>
                  <p className="text-sm p-3 bg-gray-100 rounded-md whitespace-pre-line">
                    {selectedEntry.notes}
                  </p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}