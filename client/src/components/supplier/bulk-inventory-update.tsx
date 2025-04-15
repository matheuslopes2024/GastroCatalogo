import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  FileSpreadsheet, 
  DownloadCloud, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  AlertTriangle, 
  RefreshCw 
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";

interface BulkUpdateRow {
  productId: number;
  productName?: string;
  sku?: string;
  quantity: number;
  currentQuantity?: number;
  status?: string;
  lowStockThreshold?: number;
  restockLevel?: number;
  error?: string;
}

interface BulkUpdatePreview {
  items: BulkUpdateRow[];
  warnings: number;
  errors: number;
}

interface BulkUpdateResult {
  success: number;
  failed: number;
  details: Array<{
    productId: number;
    productName?: string;
    success: boolean;
    message?: string;
  }>;
}

export const BulkInventoryUpdate = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<BulkUpdatePreview | null>(null);
  const [uploadMode, setUploadMode] = useState<'csv' | 'manual'>('csv');
  const [manualItems, setManualItems] = useState<BulkUpdateRow[]>([{ productId: 0, quantity: 0 }]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<BulkUpdateResult | null>(null);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [operationProgress, setOperationProgress] = useState(0);

  // Mutation for bulk updating inventory
  const bulkUpdateMutation = useMutation({
    mutationFn: async (data: { items: BulkUpdateRow[] }) => {
      const response = await apiRequest(
        "POST", 
        "/api/supplier/inventory/bulk-update",
        data
      );
      return response.json();
    },
    onSuccess: (data: BulkUpdateResult) => {
      queryClient.invalidateQueries({ queryKey: ['/api/supplier/inventory'] });
      setResult(data);
      setShowResultDialog(true);
      setOperationProgress(100);
      
      toast({
        title: "Atualização em massa concluída",
        description: `${data.success} produtos atualizados com sucesso, ${data.failed} falhas.`,
        variant: data.failed > 0 ? "warning" : "default",
      });
    },
    onError: (error: Error) => {
      setOperationProgress(0);
      toast({
        title: "Erro na atualização em massa",
        description: error.message || "Não foi possível concluir a atualização em massa.",
        variant: "destructive",
      });
    },
  });

  // Mutation for validating before update
  const validateDataMutation = useMutation({
    mutationFn: async (data: { items: BulkUpdateRow[] }) => {
      const response = await apiRequest(
        "POST", 
        "/api/supplier/inventory/validate-bulk-update",
        data
      );
      return response.json();
    },
    onSuccess: (data: BulkUpdatePreview) => {
      setPreview(data);
      setOperationProgress(0);
      
      toast({
        title: "Validação concluída",
        description: `${data.items.length} produtos validados, ${data.warnings} avisos, ${data.errors} erros.`,
        variant: data.errors > 0 ? "destructive" : data.warnings > 0 ? "warning" : "default",
      });
    },
    onError: (error: Error) => {
      setOperationProgress(0);
      toast({
        title: "Erro na validação",
        description: error.message || "Não foi possível validar os dados.",
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0]);
    }
  };

  const parseCSV = async (file: File): Promise<BulkUpdateRow[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n');
          
          // Assuming first line is header
          const headers = lines[0].split(',').map(h => h.trim());
          
          const results: BulkUpdateRow[] = [];
          
          // Start from index 1 to skip header
          for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            
            const values = lines[i].split(',').map(v => v.trim());
            const item: any = {};
            
            // Map values to headers
            headers.forEach((header, index) => {
              if (header === 'productId') {
                item[header] = parseInt(values[index]) || 0;
              } else if (header === 'quantity' || header === 'lowStockThreshold' || header === 'restockLevel') {
                item[header] = parseInt(values[index]) || 0;
              } else {
                item[header] = values[index];
              }
            });
            
            // Ensure required fields
            if (!item.productId) {
              item.error = 'ID do produto ausente ou inválido';
            }
            
            if (item.quantity === undefined) {
              item.quantity = 0;
              item.error = (item.error || '') + ' Quantidade ausente, definida como 0.';
            }
            
            results.push(item as BulkUpdateRow);
          }
          
          resolve(results);
        } catch (error) {
          reject(new Error('Falha ao analisar o arquivo CSV. Verifique o formato.'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Erro ao ler o arquivo.'));
      };
      
      reader.readAsText(file);
    });
  };

  const handleUploadCSV = async () => {
    if (!csvFile) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Por favor, selecione um arquivo CSV para continuar.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsProcessing(true);
      setOperationProgress(30);
      
      const parsedData = await parseCSV(csvFile);
      
      if (parsedData.length === 0) {
        throw new Error('Nenhum produto encontrado no arquivo CSV.');
      }
      
      setOperationProgress(60);
      
      validateDataMutation.mutate({ items: parsedData });
    } catch (error: any) {
      toast({
        title: "Erro no processamento",
        description: error.message || "Ocorreu um erro ao processar o arquivo.",
        variant: "destructive",
      });
      setIsProcessing(false);
      setOperationProgress(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddManualRow = () => {
    setManualItems([...manualItems, { productId: 0, quantity: 0 }]);
  };

  const handleRemoveManualRow = (index: number) => {
    const newItems = [...manualItems];
    newItems.splice(index, 1);
    setManualItems(newItems);
  };

  const handleManualItemChange = (index: number, field: keyof BulkUpdateRow, value: any) => {
    const newItems = [...manualItems];
    newItems[index] = {
      ...newItems[index],
      [field]: field === 'productId' || field === 'quantity' || 
               field === 'lowStockThreshold' || field === 'restockLevel' 
                ? parseInt(value) || 0 
                : value,
    };
    setManualItems(newItems);
  };

  const validateManualData = () => {
    if (manualItems.length === 0) {
      toast({
        title: "Nenhum item para validar",
        description: "Adicione pelo menos um item para continuar.",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);
    setOperationProgress(50);
    
    validateDataMutation.mutate({ items: manualItems });
  };

  const processBulkUpdate = () => {
    if (!preview || preview.items.length === 0) {
      toast({
        title: "Nenhum dado para atualizar",
        description: "Valide os dados primeiro antes de executar a atualização.",
        variant: "destructive",
      });
      return;
    }
    
    if (preview.errors > 0) {
      toast({
        title: "Erro na validação",
        description: "Corrija os erros antes de executar a atualização.",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);
    setOperationProgress(50);
    
    // Remove items with errors
    const validItems = preview.items.filter(item => !item.error);
    
    bulkUpdateMutation.mutate({ items: validItems });
  };

  const downloadTemplate = () => {
    const headers = ['productId', 'quantity', 'lowStockThreshold', 'restockLevel', 'status'];
    const template = [
      headers.join(','),
      '1,100,10,50,in_stock',
      '2,50,5,30,in_stock',
      '3,0,10,50,out_of_stock',
    ].join('\n');
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_atualizacao_estoque.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetOperation = () => {
    setPreview(null);
    setResult(null);
    setCsvFile(null);
    setManualItems([{ productId: 0, quantity: 0 }]);
    setShowResultDialog(false);
    setOperationProgress(0);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl font-bold">Atualização em Massa</CardTitle>
            <CardDescription>
              Atualize o estoque de vários produtos simultaneamente
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={resetOperation}
            disabled={isProcessing}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reiniciar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tabs for different input methods */}
        <Tabs value={uploadMode} onValueChange={(v) => setUploadMode(v as 'csv' | 'manual')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="csv" className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Importar CSV
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Entrada Manual
            </TabsTrigger>
          </TabsList>
          
          {/* CSV Upload */}
          <TabsContent value="csv" className="space-y-4 pt-4">
            <div className="flex flex-col gap-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Instruções</AlertTitle>
                <AlertDescription>
                  <p className="mb-2">
                    Faça upload de um arquivo CSV com as colunas: productId, quantity, lowStockThreshold, restockLevel, status.
                  </p>
                  <p>Os valores aceitáveis para "status" são: in_stock, low_stock, out_of_stock, discontinued, back_order.</p>
                </AlertDescription>
              </Alert>
              
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  onClick={downloadTemplate} 
                  className="flex items-center gap-2"
                >
                  <DownloadCloud className="h-4 w-4" />
                  Baixar Modelo
                </Button>
                
                <div className="flex-1">
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    disabled={isProcessing}
                  />
                </div>
                
                <Button 
                  onClick={handleUploadCSV} 
                  disabled={!csvFile || isProcessing}
                  className="flex items-center gap-2"
                >
                  {isProcessing ? 
                    <RefreshCw className="h-4 w-4 animate-spin" /> : 
                    <Upload className="h-4 w-4" />
                  }
                  Validar Dados
                </Button>
              </div>
              
              {csvFile && (
                <div className="text-sm text-muted-foreground">
                  Arquivo selecionado: <span className="font-medium">{csvFile.name}</span> ({Math.round(csvFile.size / 1024)} KB)
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Manual Entry */}
          <TabsContent value="manual" className="space-y-4 pt-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Instruções</AlertTitle>
              <AlertDescription>
                Adicione manualmente os produtos que deseja atualizar. O ID do produto e a quantidade são obrigatórios.
              </AlertDescription>
            </Alert>
            
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">ID</TableHead>
                    <TableHead className="w-[100px]">Quantidade</TableHead>
                    <TableHead className="w-[100px]">Limite Baixo</TableHead>
                    <TableHead className="w-[100px]">Reabastecimento</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead className="w-[80px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {manualItems.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Input
                          type="number"
                          min="1"
                          value={item.productId || ''}
                          onChange={(e) => handleManualItemChange(index, 'productId', e.target.value)}
                          disabled={isProcessing}
                          placeholder="ID"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          value={item.quantity || ''}
                          onChange={(e) => handleManualItemChange(index, 'quantity', e.target.value)}
                          disabled={isProcessing}
                          placeholder="Qtd"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          value={item.lowStockThreshold || ''}
                          onChange={(e) => handleManualItemChange(index, 'lowStockThreshold', e.target.value)}
                          disabled={isProcessing}
                          placeholder="Limite"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          value={item.restockLevel || ''}
                          onChange={(e) => handleManualItemChange(index, 'restockLevel', e.target.value)}
                          disabled={isProcessing}
                          placeholder="Reestoque"
                        />
                      </TableCell>
                      <TableCell>
                        <select
                          className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                          value={item.status || ''}
                          onChange={(e) => handleManualItemChange(index, 'status', e.target.value)}
                          disabled={isProcessing}
                        >
                          <option value="">Status</option>
                          <option value="in_stock">Em estoque</option>
                          <option value="low_stock">Estoque baixo</option>
                          <option value="out_of_stock">Esgotado</option>
                          <option value="discontinued">Descontinuado</option>
                          <option value="back_order">Em espera</option>
                        </select>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveManualRow(index)}
                          disabled={manualItems.length === 1 || isProcessing}
                        >
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <div className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={handleAddManualRow}
                disabled={isProcessing}
              >
                Adicionar Linha
              </Button>
              
              <Button 
                onClick={validateManualData}
                disabled={manualItems.length === 0 || isProcessing}
                className="flex items-center gap-2"
              >
                {isProcessing ? 
                  <RefreshCw className="h-4 w-4 animate-spin" /> : 
                  <Upload className="h-4 w-4" />
                }
                Validar Dados
              </Button>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Progress bar when processing */}
        {operationProgress > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progresso</span>
              <span>{operationProgress}%</span>
            </div>
            <Progress value={operationProgress} className="h-2" />
          </div>
        )}
        
        {/* Preview Section */}
        {preview && (
          <div className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Pré-visualização</h3>
              
              <div className="flex items-center gap-2">
                {preview.errors > 0 && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {preview.errors} erros
                  </Badge>
                )}
                
                {preview.warnings > 0 && (
                  <Badge variant="warning" className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {preview.warnings} avisos
                  </Badge>
                )}
                
                <Badge variant="outline" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  {preview.items.length - preview.errors - preview.warnings} válidos
                </Badge>
              </div>
            </div>
            
            <Separator />
            
            <ScrollArea className="h-64 rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">ID</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-right">Atual</TableHead>
                    <TableHead className="text-right">Nova Qtd</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Validação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.productId}</TableCell>
                      <TableCell>{item.productName || `Produto #${item.productId}`}</TableCell>
                      <TableCell className="text-right">{item.currentQuantity !== undefined ? item.currentQuantity : "N/A"}</TableCell>
                      <TableCell className="text-right font-medium">
                        {item.quantity}
                        {item.currentQuantity !== undefined && item.currentQuantity !== item.quantity && (
                          <span className={item.quantity > (item.currentQuantity || 0) ? "text-green-500 ml-1" : "text-red-500 ml-1"}>
                            ({item.quantity > (item.currentQuantity || 0) ? "+" : ""}
                            {item.quantity - (item.currentQuantity || 0)})
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.status ? (
                          <Badge variant="outline">
                            {item.status === "in_stock" ? "Em estoque" :
                             item.status === "low_stock" ? "Estoque baixo" :
                             item.status === "out_of_stock" ? "Esgotado" :
                             item.status === "discontinued" ? "Descontinuado" :
                             item.status === "back_order" ? "Em espera" : item.status}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">Sem alteração</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.error ? (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {item.error}
                          </Badge>
                        ) : (
                          <Badge variant="success" className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Válido
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
            
            <div className="flex justify-end">
              <Button 
                onClick={processBulkUpdate}
                disabled={isProcessing || preview.errors > 0}
                className="flex items-center gap-2"
              >
                {isProcessing ? 
                  <RefreshCw className="h-4 w-4 animate-spin" /> : 
                  <CheckCircle className="h-4 w-4" />
                }
                Executar Atualização
              </Button>
            </div>
          </div>
        )}
        
        {/* Result Dialog */}
        <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Resultado da Atualização</DialogTitle>
              <DialogDescription>
                Resumo da operação de atualização em massa.
              </DialogDescription>
            </DialogHeader>
            
            {result && (
              <>
                <div className="flex items-center justify-center gap-4 py-2">
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-500">{result.success}</div>
                    <div className="text-sm text-muted-foreground">Sucesso</div>
                  </div>
                  <Separator orientation="vertical" className="h-10" />
                  <div className="text-center">
                    <div className="text-xl font-bold text-red-500">{result.failed}</div>
                    <div className="text-sm text-muted-foreground">Falhas</div>
                  </div>
                  <Separator orientation="vertical" className="h-10" />
                  <div className="text-center">
                    <div className="text-xl font-bold">{result.success + result.failed}</div>
                    <div className="text-sm text-muted-foreground">Total</div>
                  </div>
                </div>
                
                <Separator />
                
                <ScrollArea className="h-64 rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">ID</TableHead>
                        <TableHead>Produto</TableHead>
                        <TableHead>Resultado</TableHead>
                        <TableHead>Mensagem</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.details.map((detail, index) => (
                        <TableRow key={index}>
                          <TableCell>{detail.productId}</TableCell>
                          <TableCell>{detail.productName || `Produto #${detail.productId}`}</TableCell>
                          <TableCell>
                            {detail.success ? (
                              <Badge variant="success" className="flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Sucesso
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                Falha
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>{detail.message || (detail.success ? "Atualizado com sucesso" : "Erro na atualização")}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
                
                <DialogFooter>
                  <Button onClick={() => setShowResultDialog(false)}>Fechar</Button>
                  <Button variant="outline" onClick={resetOperation}>Nova Atualização</Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};