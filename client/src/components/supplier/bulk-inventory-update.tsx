import { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  FileSpreadsheet,
  Upload,
  Download,
  FileText,
  AlertCircle,
  CheckCircle,
  X,
  Info,
  Loader2,
  Table as TableIcon,
  RefreshCw,
  Clipboard,
  FileUp,
  Package,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

// Interface para o componente
interface BulkInventoryUpdateProps {
  onSuccess?: () => void;
}

// Esquema de validação para a entrada manual
const manualEntrySchema = z.object({
  data: z.string().min(1, "Por favor, insira os dados do estoque"),
});

// Esquema de validação para o upload de arquivo
const fileUploadSchema = z.object({
  file: z.instanceof(File, { message: "Por favor, selecione um arquivo" }),
});

// Esquema de validação para as razões
const reasonSchema = z.object({
  reason: z.string().min(3, "Por favor, insira um motivo com pelo menos 3 caracteres"),
  notes: z.string().optional(),
});

// Esquema de validação para o processamento dos dados
const processDataSchema = z.object({
  data: z.array(
    z.object({
      productId: z.number(),
      quantity: z.number().min(0, "A quantidade deve ser maior ou igual a zero"),
      lowStockThreshold: z.number().optional(),
      restockLevel: z.number().optional(),
      sku: z.string().optional(),
      location: z.string().optional(),
      status: z.string().optional(),
    })
  ),
});

export function BulkInventoryUpdate({ onSuccess }: BulkInventoryUpdateProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState("manual");
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState<{
    total: number;
    processed: number;
    successful: number;
    failed: number;
  }>({
    total: 0,
    processed: 0,
    successful: 0,
    failed: 0,
  });
  const [processingResults, setProcessingResults] = useState<any[]>([]);
  const [isProcessingComplete, setIsProcessingComplete] = useState(false);
  const [isProcessStarted, setIsProcessStarted] = useState(false);
  const [isShowingResults, setIsShowingResults] = useState(false);

  // Formulários
  const manualForm = useForm<z.infer<typeof manualEntrySchema>>({
    resolver: zodResolver(manualEntrySchema),
    defaultValues: {
      data: "",
    },
  });

  const fileForm = useForm<z.infer<typeof fileUploadSchema>>({
    resolver: zodResolver(fileUploadSchema),
  });

  const reasonForm = useForm<z.infer<typeof reasonSchema>>({
    resolver: zodResolver(reasonSchema),
    defaultValues: {
      reason: "",
      notes: "",
    },
  });

  // Query para buscar produtos
  const { data: products } = useQuery({
    queryKey: ["/api/supplier/products"],
    enabled: !!user?.id,
  });

  // Mutação para atualização em massa
  const bulkUpdateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/supplier/inventory/bulk-update", data);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Atualização concluída",
        description: `${data.successCount} itens atualizados com sucesso.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/supplier/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/supplier/inventory/stats"] });
      
      // Limpar formulários e dados
      manualForm.reset();
      fileForm.reset();
      setParsedData([]);
      setParseError(null);
      setIsPreviewOpen(false);
      setIsConfirmationOpen(false);
      setIsProcessStarted(false);
      setUploadProgress(0);
      
      if (onSuccess) {
        onSuccess();
      }
      
      // Mostrar resultados
      setIsShowingResults(true);
    },
    onError: (error: any) => {
      toast({
        title: "Erro na atualização",
        description: error.message || "Ocorreu um erro ao atualizar o estoque. Tente novamente.",
        variant: "destructive",
      });
      setIsConfirmationOpen(false);
    },
  });

  // Lidar com envio manual
  const handleManualSubmit = (values: z.infer<typeof manualEntrySchema>) => {
    try {
      // Tenta analisar tanto CSV quanto JSON
      let parsed;
      if (values.data.trim().startsWith("{") || values.data.trim().startsWith("[")) {
        // Presumir JSON
        parsed = JSON.parse(values.data);
        if (!Array.isArray(parsed)) {
          parsed = [parsed];
        }
      } else {
        // Presumir CSV
        parsed = parseCSV(values.data);
      }
      
      // Validar e processar os dados
      const processedData = processInventoryData(parsed);
      setParsedData(processedData);
      setParseError(null);
      
      // Mostrar prévia
      const previewItems = processedData.slice(0, 5);
      setPreviewData(previewItems);
      setIsPreviewOpen(true);
    } catch (error: any) {
      setParseError(error.message);
      toast({
        title: "Erro ao processar dados",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Lidar com upload de arquivo
  const handleFileSubmit = (values: z.infer<typeof fileUploadSchema>) => {
    const file = values.file;
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        let parsed;
        
        if (file.name.endsWith(".csv") || file.name.endsWith(".txt")) {
          parsed = parseCSV(content);
        } else if (file.name.endsWith(".json")) {
          parsed = JSON.parse(content);
          if (!Array.isArray(parsed)) {
            parsed = [parsed];
          }
        } else {
          throw new Error("Formato de arquivo não suportado. Use CSV, TXT ou JSON.");
        }
        
        // Validar e processar os dados
        const processedData = processInventoryData(parsed);
        setParsedData(processedData);
        setParseError(null);
        
        // Mostrar prévia
        const previewItems = processedData.slice(0, 5);
        setPreviewData(previewItems);
        setIsPreviewOpen(true);
      } catch (error: any) {
        setParseError(error.message);
        toast({
          title: "Erro ao processar arquivo",
          description: error.message,
          variant: "destructive",
        });
      }
    };
    
    reader.onerror = () => {
      toast({
        title: "Erro ao ler arquivo",
        description: "Ocorreu um erro ao ler o arquivo. Tente novamente.",
        variant: "destructive",
      });
    };
    
    reader.readAsText(file);
  };

  // Lidar com o motivo
  const handleReasonSubmit = (values: z.infer<typeof reasonSchema>) => {
    setIsConfirmationOpen(false);
    
    // Iniciar processo
    setIsProcessStarted(true);
    setProcessingStatus({
      total: parsedData.length,
      processed: 0,
      successful: 0,
      failed: 0,
    });
    
    // Processar em lote
    processInventoryBatch(parsedData, values.reason, values.notes);
  };

  // Processar lote de inventário
  const processInventoryBatch = async (data: any[], reason: string, notes?: string) => {
    // Simular progresso
    let processed = 0;
    let successful = 0;
    let failed = 0;
    const results: any[] = [];
    
    try {
      // Enviar dados para a API
      const response = await bulkUpdateMutation.mutateAsync({
        items: data,
        reason,
        notes,
      });
      
      // Atualizar status
      setProcessingStatus({
        total: data.length,
        processed: data.length,
        successful: response.successCount,
        failed: response.failedCount,
      });
      
      // Atualizar resultados
      setProcessingResults(response.results || []);
      setIsProcessingComplete(true);
    } catch (error) {
      console.error("Erro ao processar lote:", error);
      // Em caso de erro, marcar todos como falha
      setProcessingStatus({
        total: data.length,
        processed: data.length,
        successful: 0,
        failed: data.length,
      });
      setIsProcessingComplete(true);
    }
  };

  // Analisar CSV
  const parseCSV = (csvText: string): any[] => {
    const lines = csvText.split(/\r\n|\n|\r/).filter(line => line.trim() !== "");
    
    if (lines.length === 0) {
      throw new Error("O arquivo CSV está vazio.");
    }
    
    const headers = lines[0].split(",").map(header => header.trim().toLowerCase());
    
    // Verificar cabeçalhos obrigatórios
    if (!headers.includes("productid") && !headers.includes("product_id") && !headers.includes("id")) {
      throw new Error("O CSV deve ter uma coluna 'productId', 'product_id' ou 'id'.");
    }
    
    if (!headers.includes("quantity") && !headers.includes("qtd") && !headers.includes("quantidade")) {
      throw new Error("O CSV deve ter uma coluna 'quantity', 'qtd' ou 'quantidade'.");
    }
    
    const result = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map(value => value.trim());
      
      if (values.length !== headers.length) {
        continue; // Pular linhas com número incorreto de colunas
      }
      
      const entry: any = {};
      
      headers.forEach((header, index) => {
        // Mapear cabeçalhos para nomes de propriedades
        let key = header;
        
        if (header === "product_id" || header === "id") key = "productId";
        if (header === "qtd" || header === "quantidade") key = "quantity";
        if (header === "low_stock_threshold" || header === "min_stock") key = "lowStockThreshold";
        if (header === "restock_level" || header === "max_stock") key = "restockLevel";
        
        // Converter valores para os tipos corretos
        let value = values[index];
        
        if (key === "productId" || key === "quantity" || key === "lowStockThreshold" || key === "restockLevel") {
          value = parseInt(value, 10);
          if (isNaN(value)) {
            value = key === "productId" ? 0 : (key === "quantity" ? 0 : undefined);
          }
        }
        
        entry[key] = value;
      });
      
      result.push(entry);
    }
    
    return result;
  };

  // Processar dados de inventário
  const processInventoryData = (data: any[]): any[] => {
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("Os dados fornecidos não são válidos.");
    }
    
    // Mapear e validar cada item
    return data.map((item, index) => {
      const processedItem: any = {};
      
      // Validar e processar productId
      const productId = typeof item.productId === "string" ? parseInt(item.productId, 10) : item.productId;
      if (isNaN(productId) || productId <= 0) {
        throw new Error(`Linha ${index + 1}: ID do produto inválido.`);
      }
      processedItem.productId = productId;
      
      // Validar e processar quantity
      const quantity = typeof item.quantity === "string" ? parseInt(item.quantity, 10) : item.quantity;
      if (isNaN(quantity) || quantity < 0) {
        throw new Error(`Linha ${index + 1}: Quantidade inválida.`);
      }
      processedItem.quantity = quantity;
      
      // Processar campos opcionais se existirem
      if (item.lowStockThreshold !== undefined) {
        const threshold = typeof item.lowStockThreshold === "string" ? 
                        parseInt(item.lowStockThreshold, 10) : item.lowStockThreshold;
        if (!isNaN(threshold) && threshold >= 0) {
          processedItem.lowStockThreshold = threshold;
        }
      }
      
      if (item.restockLevel !== undefined) {
        const restock = typeof item.restockLevel === "string" ? 
                     parseInt(item.restockLevel, 10) : item.restockLevel;
        if (!isNaN(restock) && restock >= 0) {
          processedItem.restockLevel = restock;
        }
      }
      
      if (item.sku !== undefined) {
        processedItem.sku = String(item.sku);
      }
      
      if (item.location !== undefined) {
        processedItem.location = String(item.location);
      }
      
      if (item.status !== undefined) {
        processedItem.status = String(item.status);
      }
      
      return processedItem;
    });
  };

  // Baixar modelo CSV
  const downloadCSVTemplate = () => {
    const headers = ["productId", "quantity", "lowStockThreshold", "restockLevel", "location", "status"];
    const csv = [headers.join(",")].join("\n");
    
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "inventory_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Baixar modelo JSON
  const downloadJSONTemplate = () => {
    const template = [
      {
        productId: 1,
        quantity: 100,
        lowStockThreshold: 10,
        restockLevel: 50,
        location: "Prateleira A1",
        status: "in_stock"
      }
    ];
    
    const json = JSON.stringify(template, null, 2);
    const blob = new Blob([json], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "inventory_template.json");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copiar dados de exemplo para a área de transferência
  const copyExampleToClipboard = () => {
    const example = `productId,quantity,lowStockThreshold,restockLevel,location,status
1,100,10,50,Prateleira A1,in_stock
2,75,5,30,Prateleira A2,in_stock
3,0,5,20,Prateleira B1,out_of_stock`;
    
    navigator.clipboard.writeText(example).then(() => {
      toast({
        title: "Copiado!",
        description: "Exemplo copiado para a área de transferência.",
      });
    });
  };

  // Continuar para confirmação
  const handleContinueToConfirmation = () => {
    setIsPreviewOpen(false);
    setIsConfirmationOpen(true);
  };

  // Renderizar resultado do processamento
  const renderProcessingResult = (result: any) => {
    if (result.success) {
      return (
        <div className="flex items-center space-x-2">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span>Sucesso</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <span>{result.error || "Falha"}</span>
        </div>
      );
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileSpreadsheet className="mr-2 h-5 w-5 text-blue-600" />
            Atualização em Massa de Inventário
          </CardTitle>
          <CardDescription>
            Atualize vários produtos de uma vez através de CSV, JSON ou entrada direta.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual" className="flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Entrada Manual
              </TabsTrigger>
              <TabsTrigger value="file" className="flex items-center">
                <Upload className="h-4 w-4 mr-2" />
                Upload de Arquivo
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="manual" className="mt-4 space-y-4">
              <div className="bg-amber-50 p-4 rounded-md border border-amber-200 mb-4">
                <div className="flex">
                  <Info className="h-5 w-5 text-amber-600 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-800">Como usar a entrada manual:</h4>
                    <p className="text-sm text-amber-700">
                      Cole seus dados em formato CSV ou JSON. Cada linha/item deve conter pelo menos o ID do produto e a quantidade.
                    </p>
                    <div className="flex mt-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyExampleToClipboard}
                        className="h-8 text-xs bg-white"
                      >
                        <Clipboard className="h-3.5 w-3.5 mr-1" />
                        Copiar Exemplo
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={downloadCSVTemplate}
                        className="h-8 text-xs bg-white"
                      >
                        <Download className="h-3.5 w-3.5 mr-1" />
                        CSV Template
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={downloadJSONTemplate}
                        className="h-8 text-xs bg-white"
                      >
                        <Download className="h-3.5 w-3.5 mr-1" />
                        JSON Template
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              <Form {...manualForm}>
                <form onSubmit={manualForm.handleSubmit(handleManualSubmit)} className="space-y-4">
                  <FormField
                    control={manualForm.control}
                    name="data"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dados do Inventário</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Cole seus dados CSV ou JSON aqui..."
                            rows={10}
                            className="font-mono text-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Campos necessários: productId, quantity. Opcionais: lowStockThreshold, restockLevel, location, status.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {parseError && (
                    <div className="bg-red-50 p-3 rounded-md border border-red-200 text-sm text-red-800">
                      <div className="flex">
                        <AlertCircle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0" />
                        <span>{parseError}</span>
                      </div>
                    </div>
                  )}
                  
                  <Button type="submit" disabled={manualForm.formState.isSubmitting}>
                    {manualForm.formState.isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <TableIcon className="h-4 w-4 mr-2" />
                        Pré-visualizar dados
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </TabsContent>
            
            <TabsContent value="file" className="mt-4 space-y-4">
              <div className="bg-blue-50 p-4 rounded-md border border-blue-200 mb-4">
                <div className="flex">
                  <Info className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-800">Como fazer upload de arquivo:</h4>
                    <p className="text-sm text-blue-700">
                      Faça upload de um arquivo CSV, TXT ou JSON. Os formatos suportados são os mesmos da entrada manual.
                    </p>
                    <div className="flex mt-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={downloadCSVTemplate}
                        className="h-8 text-xs bg-white"
                      >
                        <Download className="h-3.5 w-3.5 mr-1" />
                        CSV Template
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={downloadJSONTemplate}
                        className="h-8 text-xs bg-white"
                      >
                        <Download className="h-3.5 w-3.5 mr-1" />
                        JSON Template
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              <Form {...fileForm}>
                <form onSubmit={fileForm.handleSubmit(handleFileSubmit)} className="space-y-4">
                  <FormField
                    control={fileForm.control}
                    name="file"
                    render={({ field: { value, onChange, ...fieldProps } }) => (
                      <FormItem>
                        <FormLabel>Arquivo de Inventário</FormLabel>
                        <FormControl>
                          <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors">
                            <input
                              type="file"
                              ref={fileInputRef}
                              className="hidden"
                              accept=".csv,.txt,.json"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  onChange(file);
                                }
                              }}
                              {...fieldProps}
                            />
                            <FileUp className="h-12 w-12 text-gray-400 mb-2" />
                            {value ? (
                              <div className="flex flex-col items-center">
                                <Badge variant="outline" className="mb-2 py-1 px-3">
                                  {value.name}
                                </Badge>
                                <span className="text-sm text-gray-600">
                                  {(value.size / 1024).toFixed(2)} KB
                                </span>
                              </div>
                            ) : (
                              <>
                                <p className="text-sm font-medium">
                                  Arraste e solte ou clique para selecionar
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  CSV, TXT ou JSON (max. 10MB)
                                </p>
                              </>
                            )}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="mt-4"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              Selecionar Arquivo
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {parseError && (
                    <div className="bg-red-50 p-3 rounded-md border border-red-200 text-sm text-red-800">
                      <div className="flex">
                        <AlertCircle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0" />
                        <span>{parseError}</span>
                      </div>
                    </div>
                  )}
                  
                  <Button 
                    type="submit" 
                    disabled={!fileForm.getValues("file") || fileForm.formState.isSubmitting}
                  >
                    {fileForm.formState.isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <TableIcon className="h-4 w-4 mr-2" />
                        Pré-visualizar dados
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Dialog de prévia */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Pré-visualização dos Dados</DialogTitle>
            <DialogDescription>
              Verifique se os dados estão corretos antes de prosseguir.
              {parsedData.length > 5 && ` Mostrando 5 de ${parsedData.length} itens.`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-[400px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID do Produto</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Limite Min.</TableHead>
                  <TableHead>Nível Reposição</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewData.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.productId}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.lowStockThreshold ?? "—"}</TableCell>
                    <TableCell>{item.restockLevel ?? "—"}</TableCell>
                    <TableCell>{item.location ?? "—"}</TableCell>
                    <TableCell>{item.status ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <DialogFooter className="flex gap-2 sm:justify-between">
            <div className="hidden sm:block">
              <Badge variant="outline" className="text-sm font-normal">
                Total: {parsedData.length} itens
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleContinueToConfirmation}>
                Continuar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog de confirmação */}
      <Dialog open={isConfirmationOpen} onOpenChange={setIsConfirmationOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Atualização</DialogTitle>
            <DialogDescription>
              Você está prestes a atualizar {parsedData.length} itens de inventário.
              Por favor, forneça um motivo para esta atualização.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...reasonForm}>
            <form onSubmit={reasonForm.handleSubmit(handleReasonSubmit)} className="space-y-4">
              <FormField
                control={reasonForm.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo da Atualização</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Contagem de estoque semanal" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={reasonForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas Adicionais (opcional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Detalhes adicionais sobre esta atualização..." 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsConfirmationOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={reasonForm.formState.isSubmitting}
                >
                  {reasonForm.formState.isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    "Atualizar Inventário"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Dialog de processamento */}
      <Dialog open={isProcessStarted} onOpenChange={(open) => {
        if (!open && isProcessingComplete) {
          setIsProcessStarted(false);
          setIsShowingResults(true);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isProcessingComplete ? "Processamento Concluído" : "Processando Atualização"}
            </DialogTitle>
            <DialogDescription>
              {isProcessingComplete
                ? "A atualização do inventário foi concluída."
                : "Por favor, aguarde enquanto atualizamos seu inventário."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {!isProcessingComplete && (
              <div className="flex flex-col items-center justify-center p-6">
                <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
                <p className="text-sm text-center text-gray-600">
                  Processando {processingStatus.processed} de {processingStatus.total} itens...
                </p>
              </div>
            )}
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progresso:</span>
                <span>
                  {Math.round((processingStatus.processed / Math.max(processingStatus.total, 1)) * 100)}%
                </span>
              </div>
              <Progress 
                value={(processingStatus.processed / Math.max(processingStatus.total, 1)) * 100} 
                className="h-2"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-green-50 rounded-md p-3 border border-green-100 text-center">
                <p className="text-xs text-green-700 mb-1">Sucessos</p>
                <p className="text-xl font-semibold text-green-800">{processingStatus.successful}</p>
              </div>
              <div className="bg-red-50 rounded-md p-3 border border-red-100 text-center">
                <p className="text-xs text-red-700 mb-1">Falhas</p>
                <p className="text-xl font-semibold text-red-800">{processingStatus.failed}</p>
              </div>
            </div>
          </div>
          
          {isProcessingComplete && (
            <DialogFooter>
              <Button onClick={() => {
                setIsProcessStarted(false);
                setIsShowingResults(true);
              }}>
                Ver Resultados
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Dialog de resultados */}
      <Dialog open={isShowingResults} onOpenChange={setIsShowingResults}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Resultados da Atualização</DialogTitle>
            <DialogDescription>
              {processingStatus.successful} de {processingStatus.total} itens foram atualizados com sucesso.
            </DialogDescription>
          </DialogHeader>
          
          {processingResults.length > 0 ? (
            <div className="max-h-[400px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID do Produto</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Resultado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processingResults.map((result, index) => (
                    <TableRow key={index}>
                      <TableCell>{result.productId}</TableCell>
                      <TableCell>{result.quantity}</TableCell>
                      <TableCell>{renderProcessingResult(result)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="bg-amber-50 p-4 rounded-md border border-amber-200 text-sm text-amber-800">
              <div className="flex">
                <Info className="h-5 w-5 text-amber-600 mr-2 flex-shrink-0" />
                <span>
                  Não há detalhes específicos disponíveis para esta atualização.
                </span>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => {
              setIsShowingResults(false);
              // Limpar estado
              setProcessingResults([]);
              setProcessingStatus({
                total: 0,
                processed: 0,
                successful: 0,
                failed: 0,
              });
              setIsProcessingComplete(false);
            }}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}