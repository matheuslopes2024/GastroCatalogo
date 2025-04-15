import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChevronsUpDown,
  Package,
  Upload,
  FileSpreadsheet,
  Database,
  Layers,
  Check,
  AlertTriangle,
  X,
  Info,
  UploadCloud,
  RefreshCw,
  Loader2,
  FileText,
  Download,
  Save,
  ClipboardList,
  Trash2,
  Plus,
  PackagePlus,
  PackageMinus,
  ChevronRight,
  CircleArrowDown,
  CircleCheck,
  CircleX,
  AlertCircle,
  Clipboard,
  Copy,
  HelpCircle,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Papa from "papaparse";

interface BulkInventoryUpdateProps {
  onSuccess?: () => void;
}

// Schema para validação do formulário de atualização manual
const updateFormSchema = z.object({
  products: z.array(
    z.object({
      id: z.number(),
      selected: z.boolean().default(false),
      quantity: z.number().int().min(0).optional(),
      lowStockThreshold: z.number().int().min(0).optional(),
      location: z.string().optional(),
      batchId: z.string().optional(),
      expiryDate: z.string().optional(),
    })
  ),
  updateType: z.enum(["absolute", "increment", "decrement"]),
  updateNotes: z.string().optional(),
  updateReason: z.enum([
    "restock",
    "sale",
    "adjustment",
    "inventory_count",
    "return",
    "damage",
    "expiration",
    "other",
  ]),
});

// Schema para validação do formulário de importação de CSV
const csvFormSchema = z.object({
  file: z.instanceof(File),
  separator: z.enum([",", ";", "tab"]),
  hasHeaderRow: z.boolean().default(true),
  mappings: z.object({
    productIdColumn: z.string(),
    skuColumn: z.string().optional(),
    quantityColumn: z.string(),
    updateTypeColumn: z.string().optional(),
    notesColumn: z.string().optional(),
    lowStockThresholdColumn: z.string().optional(),
    locationColumn: z.string().optional(),
    batchIdColumn: z.string().optional(),
    expiryDateColumn: z.string().optional(),
  }),
  defaultUpdateType: z.enum(["absolute", "increment", "decrement"]),
  defaultReason: z.enum([
    "restock",
    "sale",
    "adjustment",
    "inventory_count",
    "return",
    "damage",
    "expiration",
    "other",
  ]),
});

export function BulkInventoryUpdate({ onSuccess }: BulkInventoryUpdateProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estados
  const [activeTab, setActiveTab] = useState("manual");
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [allSelected, setAllSelected] = useState(false);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [validationResults, setValidationResults] = useState<any[]>([]);
  const [validationPassed, setValidationPassed] = useState(false);
  const [processingValidation, setProcessingValidation] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [totalProducts, setTotalProducts] = useState(0);
  const [productOffset, setProductOffset] = useState(0);
  const [hasMoreProducts, setHasMoreProducts] = useState(true);
  const [loadingMoreProducts, setLoadingMoreProducts] = useState(false);
  const [categoriesFilter, setCategoriesFilter] = useState<string>("");
  const [categories, setCategories] = useState<any[]>([]);
  const [quantityFilter, setQuantityFilter] = useState<string>("");
  const [stockStatusFilter, setStockStatusFilter] = useState<string>("");
  
  // Formulário para atualização manual
  const updateForm = useForm<z.infer<typeof updateFormSchema>>({
    resolver: zodResolver(updateFormSchema),
    defaultValues: {
      products: [],
      updateType: "absolute",
      updateNotes: "",
      updateReason: "adjustment",
    },
  });
  
  // Formulário para importação de CSV
  const csvForm = useForm<z.infer<typeof csvFormSchema>>({
    resolver: zodResolver(csvFormSchema),
    defaultValues: {
      separator: ",",
      hasHeaderRow: true,
      mappings: {
        productIdColumn: "",
        skuColumn: "",
        quantityColumn: "",
        updateTypeColumn: "",
        notesColumn: "",
        lowStockThresholdColumn: "",
        locationColumn: "",
        batchIdColumn: "",
        expiryDateColumn: "",
      },
      defaultUpdateType: "absolute",
      defaultReason: "adjustment",
    },
  });

  // Mutation para carregar produtos
  const loadProductsMutation = useMutation({
    mutationFn: async (data: { offset: number; limit: number; category?: string; stockStatus?: string; quantity?: string }) => {
      const res = await apiRequest("GET", "/api/supplier/products", data);
      return await res.json();
    },
    onSuccess: (data) => {
      if (productOffset === 0) {
        // Se é a primeira carga, substituir completamente os produtos
        const productsWithState = data.items.map((product: any) => ({
          ...product,
          selected: false,
          quantity: product.inventory?.quantity || 0,
          lowStockThreshold: product.inventory?.lowStockThreshold || 5,
        }));
        setProducts(productsWithState);
        setFilteredProducts(productsWithState);
      } else {
        // Se é uma carga subsequente, adicionar aos produtos existentes
        const newProducts = data.items.map((product: any) => ({
          ...product,
          selected: false,
          quantity: product.inventory?.quantity || 0,
          lowStockThreshold: product.inventory?.lowStockThreshold || 5,
        }));
        setProducts((prevProducts) => [...prevProducts, ...newProducts]);
        setFilteredProducts((prevFiltered) => [...prevFiltered, ...newProducts]);
      }
      
      setTotalProducts(data.total);
      setHasMoreProducts(data.items.length === data.limit);
      
      // Atualizar formulário
      updateForm.setValue(
        "products",
        data.items.map((product: any) => ({
          id: product.id,
          selected: false,
          quantity: product.inventory?.quantity || 0,
          lowStockThreshold: product.inventory?.lowStockThreshold || 5,
          location: product.inventory?.location || "",
          batchId: product.inventory?.batchNumber || "",
          expiryDate: product.inventory?.expirationDate || "",
        }))
      );
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao carregar produtos",
        description: error.message || "Ocorreu um erro ao carregar os produtos. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Mutation para carregar categorias
  const loadCategoriesMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("GET", "/api/categories");
      return await res.json();
    },
    onSuccess: (data) => {
      setCategories(data);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao carregar categorias",
        description: error.message || "Ocorreu um erro ao carregar as categorias. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Mutation para atualização manual de estoque
  const manualUpdateMutation = useMutation({
    mutationFn: async (values: z.infer<typeof updateFormSchema>) => {
      const selectedProducts = values.products.filter((product) => product.selected);
      
      const payload = {
        products: selectedProducts.map((product) => ({
          productId: product.id,
          quantity: product.quantity,
          lowStockThreshold: product.lowStockThreshold,
          location: product.location,
          batchId: product.batchId,
          expiryDate: product.expiryDate,
        })),
        updateType: values.updateType,
        notes: values.updateNotes,
        reason: values.updateReason,
      };
      
      const res = await apiRequest("POST", "/api/supplier/inventory/bulk-update", payload);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Estoque atualizado com sucesso",
        description: "Os produtos selecionados foram atualizados com sucesso.",
      });
      
      // Limpar seleções
      setSelectedProductIds([]);
      setAllSelected(false);
      
      // Invalidar queries para atualizar dados
      invalidateQueries();
      
      // Carregar produtos novamente
      loadProducts();
      
      // Callback de sucesso
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar estoque",
        description: error.message || "Ocorreu um erro ao atualizar o estoque. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Mutation para importação CSV
  const csvImportMutation = useMutation({
    mutationFn: async (validatedProducts: any[]) => {
      const payload = {
        products: validatedProducts.map((product) => ({
          productId: product.productId,
          quantity: product.quantity,
          lowStockThreshold: product.lowStockThreshold,
          location: product.location,
          batchId: product.batchId,
          expiryDate: product.expiryDate,
        })),
        updateType: csvForm.getValues().defaultUpdateType,
        notes: "Importação CSV",
        reason: csvForm.getValues().defaultReason,
      };
      
      const res = await apiRequest("POST", "/api/supplier/inventory/bulk-update", payload);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Importação concluída com sucesso",
        description: "Os produtos foram atualizados com base no arquivo CSV importado.",
      });
      
      // Resetar estado de importação
      setCsvData([]);
      setCsvHeaders([]);
      setCsvPreview([]);
      csvForm.reset({
        separator: ",",
        hasHeaderRow: true,
        mappings: {
          productIdColumn: "",
          skuColumn: "",
          quantityColumn: "",
          updateTypeColumn: "",
          notesColumn: "",
          lowStockThresholdColumn: "",
          locationColumn: "",
          batchIdColumn: "",
          expiryDateColumn: "",
        },
        defaultUpdateType: "absolute",
        defaultReason: "adjustment",
      });
      setPreviewVisible(false);
      setPreviewData([]);
      setValidationResults([]);
      setValidationPassed(false);
      
      // Invalidar queries para atualizar dados
      invalidateQueries();
      
      // Carregar produtos novamente
      loadProducts();
      
      // Callback de sucesso
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Erro na importação",
        description: error.message || "Ocorreu um erro durante a importação do CSV. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Carregar produtos iniciais
  const loadProducts = (loadMore = false) => {
    setLoadingProducts(!loadMore);
    if (loadMore) setLoadingMoreProducts(true);
    
    const offset = loadMore ? productOffset : 0;
    
    loadProductsMutation.mutate({
      offset,
      limit: 20,
      category: categoriesFilter || undefined,
      stockStatus: stockStatusFilter || undefined,
      quantity: quantityFilter || undefined,
    });
    
    if (loadMore) {
      setProductOffset(offset + 20);
    } else {
      setProductOffset(20);
    }
  };

  // Carregar produtos e categorias ao montar o componente
  useState(() => {
    loadProducts();
    loadCategoriesMutation.mutate();
  });

  // Invalidar queries após atualizações
  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/supplier/products"] });
    queryClient.invalidateQueries({ queryKey: ["/api/supplier/inventory/stats"] });
    queryClient.invalidateQueries({ queryKey: ["/api/supplier/inventory"] });
    queryClient.invalidateQueries({ queryKey: ["/api/supplier/inventory/alerts"] });
    queryClient.invalidateQueries({ queryKey: ["/api/supplier/inventory/history"] });
  };

  // Filtrar produtos por pesquisa
  const filterProducts = (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setFilteredProducts(products);
      return;
    }
    
    const lowercaseQuery = query.toLowerCase();
    const filtered = products.filter(
      (product) =>
        product.name.toLowerCase().includes(lowercaseQuery) ||
        product.sku?.toLowerCase().includes(lowercaseQuery) ||
        product.id.toString().includes(lowercaseQuery)
    );
    
    setFilteredProducts(filtered);
  };

  // Selecionar/deselecionar todos os produtos
  const toggleSelectAll = () => {
    const newSelectAll = !allSelected;
    setAllSelected(newSelectAll);
    
    // Atualizar estado local
    setSelectedProductIds(newSelectAll ? filteredProducts.map((p) => p.id) : []);
    
    // Atualizar estado do formulário
    const updatedProducts = updateForm.getValues().products.map((product) => ({
      ...product,
      selected: newSelectAll && filteredProducts.some((p) => p.id === product.id),
    }));
    
    updateForm.setValue("products", updatedProducts);
  };

  // Alternar seleção de um produto
  const toggleSelectProduct = (productId: number) => {
    const isSelected = selectedProductIds.includes(productId);
    
    // Atualizar estado local
    if (isSelected) {
      setSelectedProductIds(selectedProductIds.filter((id) => id !== productId));
    } else {
      setSelectedProductIds([...selectedProductIds, productId]);
    }
    
    // Atualizar estado do formulário
    const updatedProducts = updateForm.getValues().products.map((product) => {
      if (product.id === productId) {
        return { ...product, selected: !isSelected };
      }
      return product;
    });
    
    updateForm.setValue("products", updatedProducts);
    
    // Verificar se todos estão selecionados
    const allCurrentlySelected = filteredProducts.every((product) =>
      [...selectedProductIds, ...(isSelected ? [] : [productId])].includes(product.id)
    );
    
    setAllSelected(allCurrentlySelected);
  };

  // Atualizar valor de um produto no formulário
  const updateProductField = (productId: number, field: string, value: any) => {
    const updatedProducts = updateForm.getValues().products.map((product) => {
      if (product.id === productId) {
        return { ...product, [field]: value };
      }
      return product;
    });
    
    updateForm.setValue("products", updatedProducts);
  };

  // Submeter o formulário de atualização manual
  const onSubmitManualUpdate = (values: z.infer<typeof updateFormSchema>) => {
    if (selectedProductIds.length === 0) {
      toast({
        title: "Nenhum produto selecionado",
        description: "Selecione pelo menos um produto para atualizar.",
        variant: "destructive",
      });
      return;
    }
    
    setConfirmOpen(true);
  };

  // Confirmar e executar a atualização manual
  const confirmManualUpdate = () => {
    setConfirmOpen(false);
    manualUpdateMutation.mutate(updateForm.getValues());
  };

  // Manipular arquivo CSV selecionado
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    csvForm.setValue("file", file);
    
    // Analisar o arquivo
    Papa.parse(file, {
      complete: (results) => {
        if (results.data && Array.isArray(results.data) && results.data.length > 0) {
          const data = results.data as any[];
          setCsvData(data);
          
          // Extrair cabeçalhos se existirem
          if (csvForm.getValues().hasHeaderRow && data.length > 0) {
            const headers = data[0];
            setCsvHeaders(headers);
            
            // Configurar mapeamentos de colunas
            if (headers.includes("id") || headers.includes("productId")) {
              csvForm.setValue(
                "mappings.productIdColumn",
                headers.includes("id") ? "id" : "productId"
              );
            }
            
            if (headers.includes("sku")) {
              csvForm.setValue("mappings.skuColumn", "sku");
            }
            
            if (
              headers.includes("quantity") ||
              headers.includes("stock") ||
              headers.includes("amount")
            ) {
              csvForm.setValue(
                "mappings.quantityColumn",
                headers.includes("quantity")
                  ? "quantity"
                  : headers.includes("stock")
                  ? "stock"
                  : "amount"
              );
            }
            
            if (headers.includes("updateType") || headers.includes("type")) {
              csvForm.setValue(
                "mappings.updateTypeColumn",
                headers.includes("updateType") ? "updateType" : "type"
              );
            }
            
            if (headers.includes("notes") || headers.includes("observations")) {
              csvForm.setValue(
                "mappings.notesColumn",
                headers.includes("notes") ? "notes" : "observations"
              );
            }
            
            if (
              headers.includes("lowStockThreshold") ||
              headers.includes("threshold")
            ) {
              csvForm.setValue(
                "mappings.lowStockThresholdColumn",
                headers.includes("lowStockThreshold")
                  ? "lowStockThreshold"
                  : "threshold"
              );
            }
            
            if (headers.includes("location")) {
              csvForm.setValue("mappings.locationColumn", "location");
            }
            
            if (
              headers.includes("batchId") ||
              headers.includes("batch") ||
              headers.includes("batchNumber")
            ) {
              csvForm.setValue(
                "mappings.batchIdColumn",
                headers.includes("batchId")
                  ? "batchId"
                  : headers.includes("batch")
                  ? "batch"
                  : "batchNumber"
              );
            }
            
            if (
              headers.includes("expiryDate") ||
              headers.includes("expiry") ||
              headers.includes("expirationDate")
            ) {
              csvForm.setValue(
                "mappings.expiryDateColumn",
                headers.includes("expiryDate")
                  ? "expiryDate"
                  : headers.includes("expiry")
                  ? "expiry"
                  : "expirationDate"
              );
            }
          }
          
          // Definir visualização prévia
          setCsvPreview(data.slice(0, 5));
        }
      },
      error: (error) => {
        toast({
          title: "Erro ao analisar o arquivo CSV",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  // Validar mapeamento de colunas CSV
  const validateCsvMapping = () => {
    const mappings = csvForm.getValues().mappings;
    
    if (!mappings.productIdColumn && !mappings.skuColumn) {
      toast({
        title: "Mapeamento inválido",
        description:
          "É necessário mapear o ID do produto ou o SKU para identificar os produtos.",
        variant: "destructive",
      });
      return false;
    }
    
    if (!mappings.quantityColumn) {
      toast({
        title: "Mapeamento inválido",
        description: "É necessário mapear a coluna de quantidade.",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };

  // Aplicar regras de validação aos dados CSV
  const processCsvData = () => {
    if (!validateCsvMapping()) return;
    
    setProcessingValidation(true);
    setValidationResults([]);
    setValidationPassed(false);
    
    const allData = [...csvData];
    const headerRowOffset = csvForm.getValues().hasHeaderRow ? 1 : 0;
    const data = allData.slice(headerRowOffset);
    
    // Preparar visualização dos dados a serem importados
    const previews: any[] = [];
    
    // Mapear dados do CSV para objetos que serão usados na importação
    const processedData = data.map((row, index) => {
      const getColumnValue = (columnName: string) => {
        const columnIndex = csvHeaders.indexOf(columnName);
        return columnIndex >= 0 ? row[columnIndex] : null;
      };
      
      const mappings = csvForm.getValues().mappings;
      
      const productId = mappings.productIdColumn
        ? getColumnValue(mappings.productIdColumn)
        : null;
      const sku = mappings.skuColumn ? getColumnValue(mappings.skuColumn) : null;
      
      const quantityStr = mappings.quantityColumn
        ? getColumnValue(mappings.quantityColumn)
        : null;
      const quantity = quantityStr ? parseInt(quantityStr, 10) : null;
      
      const updateType = mappings.updateTypeColumn
        ? getColumnValue(mappings.updateTypeColumn)
        : csvForm.getValues().defaultUpdateType;
      
      const notes = mappings.notesColumn
        ? getColumnValue(mappings.notesColumn)
        : null;
      
      const lowStockThresholdStr = mappings.lowStockThresholdColumn
        ? getColumnValue(mappings.lowStockThresholdColumn)
        : null;
      const lowStockThreshold = lowStockThresholdStr
        ? parseInt(lowStockThresholdStr, 10)
        : null;
      
      const location = mappings.locationColumn
        ? getColumnValue(mappings.locationColumn)
        : null;
      
      const batchId = mappings.batchIdColumn
        ? getColumnValue(mappings.batchIdColumn)
        : null;
      
      const expiryDate = mappings.expiryDateColumn
        ? getColumnValue(mappings.expiryDateColumn)
        : null;
      
      // Validar dados mínimos necessários
      const errors: string[] = [];
      
      if (!productId && !sku) {
        errors.push("ID ou SKU do produto não encontrado");
      }
      
      if (quantity === null || isNaN(quantity)) {
        errors.push("Quantidade inválida");
      }
      
      if (
        lowStockThreshold !== null &&
        (isNaN(lowStockThreshold) || lowStockThreshold < 0)
      ) {
        errors.push("Limite de estoque baixo inválido");
      }
      
      const isValid = errors.length === 0;
      
      // Preparar objeto para visualização
      const preview = {
        rowNumber: index + 1 + headerRowOffset,
        productId,
        sku,
        quantity,
        updateType,
        notes,
        lowStockThreshold,
        location,
        batchId,
        expiryDate,
        isValid,
        errors,
      };
      
      previews.push(preview);
      
      return preview;
    });
    
    setPreviewData(previews);
    setPreviewVisible(true);
    setProcessingValidation(false);
    
    // Verificar se todos os registros são válidos
    const allValid = processedData.every((item) => item.isValid);
    setValidationPassed(allValid);
    
    // Mensagem com base no resultado da validação
    if (allValid) {
      toast({
        title: "Validação concluída",
        description: `Todos os ${processedData.length} registros são válidos e prontos para importação.`,
      });
    } else {
      const invalidCount = processedData.filter((item) => !item.isValid).length;
      toast({
        title: "Validação concluída com erros",
        description: `Encontrados ${invalidCount} registros inválidos de um total de ${processedData.length}.`,
        variant: "destructive",
      });
    }
  };

  // Executar importação do CSV
  const executeImport = () => {
    // Filtrar apenas itens válidos
    const validItems = previewData.filter((item) => item.isValid);
    
    if (validItems.length === 0) {
      toast({
        title: "Não há itens válidos para importar",
        description: "Corrija os erros no arquivo CSV e tente novamente.",
        variant: "destructive",
      });
      return;
    }
    
    // Iniciar importação
    setImportProgress(0);
    
    // Simular progresso - em um sistema real, isso seria feito com base no progresso real
    const interval = setInterval(() => {
      setImportProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
    
    // Executar importação
    csvImportMutation.mutate(validItems);
    
    // Limpar intervalo quando a importação for concluída
    csvImportMutation.isPending &&
      setTimeout(() => {
        clearInterval(interval);
        setImportProgress(100);
      }, 2000);
  };

  // Gerar modelo de CSV para download
  const generateCsvTemplate = () => {
    const headers = [
      "productId",
      "sku",
      "quantity",
      "updateType",
      "lowStockThreshold",
      "location",
      "batchId",
      "expiryDate",
      "notes",
    ].join(",");
    
    const exampleRow = [
      "1",
      "PROD001",
      "10",
      "absolute",
      "5",
      "Estante A-3",
      "LOTE-2023-001",
      "2024-12-31",
      "Atualização de inventário mensal",
    ].join(",");
    
    const csv = `${headers}\n${exampleRow}`;
    
    // Criar blob e link para download
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    // Criar link para download
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "modelo_atualizacao_estoque.csv");
    document.body.appendChild(link);
    link.click();
    
    // Limpar
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Aplicar filtros
  const applyFilters = () => {
    setProductOffset(0);
    loadProducts();
  };

  // Limpar filtros
  const clearFilters = () => {
    setCategoriesFilter("");
    setQuantityFilter("");
    setStockStatusFilter("");
    setProductOffset(0);
    loadProducts();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Atualização em Massa de Estoque</h1>
          <p className="text-muted-foreground">
            Atualize o estoque de vários produtos simultaneamente
          </p>
        </div>
        
        {activeTab === "csv" && (
          <Button onClick={() => setTemplateDialogOpen(true)}>
            <FileText className="mr-2 h-4 w-4" />
            Baixar Modelo CSV
          </Button>
        )}
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Método de Atualização</CardTitle>
          <CardDescription>
            Escolha como deseja atualizar seus produtos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            defaultValue="manual"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid grid-cols-2 w-full max-w-md mb-4">
              <TabsTrigger value="manual" className="flex items-center">
                <Package className="mr-2 h-4 w-4" />
                Seleção Manual
              </TabsTrigger>
              <TabsTrigger value="csv" className="flex items-center">
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Importar CSV
              </TabsTrigger>
            </TabsList>
            
            {/* Tab de atualização manual */}
            <TabsContent value="manual">
              <Form {...updateForm}>
                <form onSubmit={updateForm.handleSubmit(onSubmitManualUpdate)}>
                  <div className="space-y-6">
                    {/* Seção de filtros */}
                    <Card>
                      <CardHeader className="py-3">
                        <CardTitle className="text-base">Filtros</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="category">Categoria</Label>
                            <Select
                              value={categoriesFilter}
                              onValueChange={setCategoriesFilter}
                            >
                              <SelectTrigger id="category">
                                <SelectValue placeholder="Todas as categorias" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">Todas as categorias</SelectItem>
                                {categories.map((category) => (
                                  <SelectItem key={category.id} value={category.id.toString()}>
                                    {category.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="stock-status">Status de Estoque</Label>
                            <Select
                              value={stockStatusFilter}
                              onValueChange={setStockStatusFilter}
                            >
                              <SelectTrigger id="stock-status">
                                <SelectValue placeholder="Todos os status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">Todos os status</SelectItem>
                                <SelectItem value="in_stock">Em estoque</SelectItem>
                                <SelectItem value="low_stock">Estoque baixo</SelectItem>
                                <SelectItem value="out_of_stock">Sem estoque</SelectItem>
                                <SelectItem value="back_order">Em espera</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="quantity">Quantidade</Label>
                            <Select
                              value={quantityFilter}
                              onValueChange={setQuantityFilter}
                            >
                              <SelectTrigger id="quantity">
                                <SelectValue placeholder="Qualquer quantidade" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">Qualquer quantidade</SelectItem>
                                <SelectItem value="0">Exatamente 0</SelectItem>
                                <SelectItem value="<10">Menos de 10</SelectItem>
                                <SelectItem value="<20">Menos de 20</SelectItem>
                                <SelectItem value=">20">Mais de 20</SelectItem>
                                <SelectItem value=">50">Mais de 50</SelectItem>
                                <SelectItem value=">100">Mais de 100</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="flex justify-end gap-2 mt-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={clearFilters}
                          >
                            Limpar Filtros
                          </Button>
                          <Button type="button" onClick={applyFilters}>
                            Aplicar Filtros
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Pesquisa e lista de produtos */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="relative w-full max-w-sm">
                          <Input
                            type="search"
                            placeholder="Buscar produtos..."
                            value={searchQuery}
                            onChange={(e) => filterProducts(e.target.value)}
                            className="pl-10"
                          />
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <svg
                              className="w-4 h-4 text-gray-500 dark:text-gray-400"
                              aria-hidden="true"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 20 20"
                            >
                              <path
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
                              />
                            </svg>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className="text-sm text-muted-foreground">
                            {selectedProductIds.length} selecionados de{" "}
                            {filteredProducts.length} produtos
                          </div>
                          
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-8 gap-1"
                                  onClick={toggleSelectAll}
                                >
                                  <Checkbox
                                    checked={allSelected}
                                    className="mr-1"
                                    onCheckedChange={() => {}}
                                  />
                                  <span>
                                    {allSelected ? "Desmarcar Todos" : "Marcar Todos"}
                                  </span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Selecionar todos os produtos visíveis</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                      
                      <Card className="border-dashed">
                        <ScrollArea className="h-[400px] w-full">
                          <Table>
                            <TableHeader className="sticky top-0 bg-background">
                              <TableRow>
                                <TableHead className="w-[50px] text-center"></TableHead>
                                <TableHead className="w-[150px]">ID</TableHead>
                                <TableHead>Produto</TableHead>
                                <TableHead className="w-[120px] text-center">
                                  Estoque Atual
                                </TableHead>
                                <TableHead className="w-[160px] text-center">
                                  Nova Quantidade
                                </TableHead>
                                <TableHead className="w-[140px] text-center">
                                  Limite Baixo
                                </TableHead>
                                <TableHead className="w-[180px]">
                                  Localização
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {loadingProducts ? (
                                Array.from({ length: 5 }).map((_, index) => (
                                  <TableRow key={index}>
                                    <TableCell className="text-center">
                                      <div className="h-4 w-4 rounded animate-pulse bg-muted mx-auto" />
                                    </TableCell>
                                    <TableCell>
                                      <div className="h-4 w-12 rounded animate-pulse bg-muted" />
                                    </TableCell>
                                    <TableCell>
                                      <div className="h-4 w-40 rounded animate-pulse bg-muted" />
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <div className="h-4 w-10 rounded animate-pulse bg-muted mx-auto" />
                                    </TableCell>
                                    <TableCell>
                                      <div className="h-8 w-full rounded animate-pulse bg-muted" />
                                    </TableCell>
                                    <TableCell>
                                      <div className="h-8 w-full rounded animate-pulse bg-muted" />
                                    </TableCell>
                                    <TableCell>
                                      <div className="h-8 w-full rounded animate-pulse bg-muted" />
                                    </TableCell>
                                  </TableRow>
                                ))
                              ) : filteredProducts.length === 0 ? (
                                <TableRow>
                                  <TableCell
                                    colSpan={7}
                                    className="h-24 text-center"
                                  >
                                    <div className="flex flex-col items-center justify-center gap-1">
                                      <Database className="h-8 w-8 text-muted-foreground" />
                                      <p className="text-muted-foreground">
                                        Nenhum produto encontrado
                                      </p>
                                      {searchQuery && (
                                        <Button
                                          variant="link"
                                          onClick={() => filterProducts("")}
                                        >
                                          Limpar busca
                                        </Button>
                                      )}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ) : (
                                filteredProducts.map((product) => (
                                  <TableRow key={product.id}>
                                    <TableCell className="text-center">
                                      <Checkbox
                                        checked={selectedProductIds.includes(
                                          product.id
                                        )}
                                        onCheckedChange={() =>
                                          toggleSelectProduct(product.id)
                                        }
                                      />
                                    </TableCell>
                                    <TableCell className="font-medium">
                                      {product.id}
                                      {product.sku && (
                                        <div className="text-xs text-muted-foreground">
                                          SKU: {product.sku}
                                        </div>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      {product.name}
                                      <div className="text-xs text-muted-foreground truncate max-w-[250px]">
                                        {product.inventory?.status &&
                                          renderStockStatus(product.inventory.status)}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                      {product.inventory?.quantity ?? 0}
                                    </TableCell>
                                    <TableCell>
                                      <Input
                                        type="number"
                                        min="0"
                                        defaultValue={product.inventory?.quantity ?? 0}
                                        disabled={
                                          !selectedProductIds.includes(product.id)
                                        }
                                        onChange={(e) =>
                                          updateProductField(
                                            product.id,
                                            "quantity",
                                            parseInt(e.target.value)
                                          )
                                        }
                                        className={
                                          !selectedProductIds.includes(product.id)
                                            ? "opacity-50"
                                            : ""
                                        }
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Input
                                        type="number"
                                        min="0"
                                        defaultValue={
                                          product.inventory?.lowStockThreshold ?? 5
                                        }
                                        disabled={
                                          !selectedProductIds.includes(product.id)
                                        }
                                        onChange={(e) =>
                                          updateProductField(
                                            product.id,
                                            "lowStockThreshold",
                                            parseInt(e.target.value)
                                          )
                                        }
                                        className={
                                          !selectedProductIds.includes(product.id)
                                            ? "opacity-50"
                                            : ""
                                        }
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Input
                                        type="text"
                                        defaultValue={
                                          product.inventory?.location ?? ""
                                        }
                                        disabled={
                                          !selectedProductIds.includes(product.id)
                                        }
                                        onChange={(e) =>
                                          updateProductField(
                                            product.id,
                                            "location",
                                            e.target.value
                                          )
                                        }
                                        className={
                                          !selectedProductIds.includes(product.id)
                                            ? "opacity-50"
                                            : ""
                                        }
                                        placeholder="Localização no estoque"
                                      />
                                    </TableCell>
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                        </ScrollArea>
                        
                        {hasMoreProducts && (
                          <div className="flex justify-center py-4">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => loadProducts(true)}
                              disabled={loadingMoreProducts}
                            >
                              {loadingMoreProducts ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Carregando...
                                </>
                              ) : (
                                <>
                                  <CircleArrowDown className="mr-2 h-4 w-4" />
                                  Carregar Mais
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </Card>
                    </div>
                    
                    {/* Seção de configurações de atualização */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={updateForm.control}
                        name="updateType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de Atualização</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o tipo de atualização" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="absolute">
                                  <div className="flex items-center">
                                    <Save className="mr-2 h-4 w-4" />
                                    <div>
                                      <span>Definir Valor Absoluto</span>
                                      <p className="text-xs text-muted-foreground">
                                        Substitui a quantidade atual pelo novo valor
                                      </p>
                                    </div>
                                  </div>
                                </SelectItem>
                                <SelectItem value="increment">
                                  <div className="flex items-center">
                                    <PackagePlus className="mr-2 h-4 w-4" />
                                    <div>
                                      <span>Incrementar</span>
                                      <p className="text-xs text-muted-foreground">
                                        Adiciona a quantidade especificada ao estoque atual
                                      </p>
                                    </div>
                                  </div>
                                </SelectItem>
                                <SelectItem value="decrement">
                                  <div className="flex items-center">
                                    <PackageMinus className="mr-2 h-4 w-4" />
                                    <div>
                                      <span>Decrementar</span>
                                      <p className="text-xs text-muted-foreground">
                                        Subtrai a quantidade especificada do estoque atual
                                      </p>
                                    </div>
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={updateForm.control}
                        name="updateReason"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Motivo da Atualização</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o motivo" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="adjustment">
                                  Ajuste de Inventário
                                </SelectItem>
                                <SelectItem value="restock">Reposição</SelectItem>
                                <SelectItem value="sale">Venda</SelectItem>
                                <SelectItem value="return">Devolução</SelectItem>
                                <SelectItem value="inventory_count">
                                  Contagem de Estoque
                                </SelectItem>
                                <SelectItem value="damage">
                                  Produtos Danificados
                                </SelectItem>
                                <SelectItem value="expiration">
                                  Produtos Vencidos
                                </SelectItem>
                                <SelectItem value="other">Outro</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={updateForm.control}
                      name="updateNotes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Observações (opcional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Adicione observações sobre esta atualização de estoque"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Estas observações serão registradas no histórico de
                            inventário.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end gap-2">
                      <Button
                        type="submit"
                        disabled={
                          selectedProductIds.length === 0 ||
                          manualUpdateMutation.isPending
                        }
                      >
                        {manualUpdateMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Atualizando...
                          </>
                        ) : (
                          <>
                            <Database className="mr-2 h-4 w-4" />
                            Atualizar Estoque
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
              </Form>
            </TabsContent>
            
            {/* Tab de importação CSV */}
            <TabsContent value="csv">
              <Form {...csvForm}>
                <form className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="h-full">
                      <CardHeader>
                        <CardTitle>Arquivo CSV</CardTitle>
                        <CardDescription>
                          Carregue um arquivo CSV contendo os dados de estoque
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="border-2 border-dashed rounded-lg p-6 text-center">
                          <input
                            type="file"
                            accept=".csv"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                          />
                          <div className="flex flex-col items-center gap-2">
                            <UploadCloud className="h-10 w-10 text-muted-foreground" />
                            <h3 className="text-lg font-medium">
                              Selecione ou arraste um arquivo
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Arquivos CSV contendo dados de atualização de estoque
                            </p>
                            <Button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="mt-2"
                            >
                              <Upload className="mr-2 h-4 w-4" />
                              Selecionar Arquivo
                            </Button>
                          </div>
                        </div>
                        
                        {csvData.length > 0 && (
                          <div className="space-y-4">
                            <div className="flex items-center gap-2">
                              <Check className="h-5 w-5 text-green-500" />
                              <span>
                                Arquivo carregado: <strong>{csvForm.getValues().file?.name}</strong>
                              </span>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label>O arquivo possui linha de cabeçalho?</Label>
                                <Switch
                                  checked={csvForm.getValues().hasHeaderRow}
                                  onCheckedChange={(checked) =>
                                    csvForm.setValue("hasHeaderRow", checked)
                                  }
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label>Separador de colunas</Label>
                                <div className="flex gap-4">
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="radio"
                                      id="comma"
                                      value=","
                                      checked={csvForm.getValues().separator === ","}
                                      onChange={() => csvForm.setValue("separator", ",")}
                                      className="rounded-full"
                                    />
                                    <Label htmlFor="comma">Vírgula (,)</Label>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="radio"
                                      id="semicolon"
                                      value=";"
                                      checked={csvForm.getValues().separator === ";"}
                                      onChange={() => csvForm.setValue("separator", ";")}
                                      className="rounded-full"
                                    />
                                    <Label htmlFor="semicolon">Ponto e vírgula (;)</Label>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="radio"
                                      id="tab"
                                      value="tab"
                                      checked={csvForm.getValues().separator === "tab"}
                                      onChange={() => csvForm.setValue("separator", "tab")}
                                      className="rounded-full"
                                    />
                                    <Label htmlFor="tab">Tab</Label>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="border rounded-md p-4">
                              <h4 className="text-sm font-medium mb-2">
                                Visualização do arquivo
                              </h4>
                              <div className="overflow-x-auto">
                                <Table className="text-xs">
                                  <TableHeader>
                                    <TableRow>
                                      {csvPreview[0]?.map((cell: any, index: number) => (
                                        <TableHead key={index}>{cell}</TableHead>
                                      ))}
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {csvPreview
                                      .slice(1, 4)
                                      .map((row: any, rowIndex: number) => (
                                        <TableRow key={rowIndex}>
                                          {row.map((cell: any, cellIndex: number) => (
                                            <TableCell key={cellIndex}>
                                              {cell}
                                            </TableCell>
                                          ))}
                                        </TableRow>
                                      ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    
                    <Card className="h-full">
                      <CardHeader>
                        <CardTitle>Mapeamento de Colunas</CardTitle>
                        <CardDescription>
                          Defina como as colunas do CSV correspondem aos campos de atualização
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={csvForm.control}
                              name="mappings.productIdColumn"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    <span className="flex items-center gap-1">
                                      ID do Produto
                                      <Badge variant="outline">Obrigatório*</Badge>
                                    </span>
                                  </FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    disabled={!csvHeaders.length}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Selecione a coluna" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="">
                                        Nenhuma (usar SKU)
                                      </SelectItem>
                                      {csvHeaders.map((header: any) => (
                                        <SelectItem key={header} value={header}>
                                          {header}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormDescription>
                                    Coluna que contém o ID do produto.
                                  </FormDescription>
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={csvForm.control}
                              name="mappings.skuColumn"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    <span className="flex items-center gap-1">
                                      SKU do Produto
                                      <Badge variant="outline">Opcional</Badge>
                                    </span>
                                  </FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    disabled={!csvHeaders.length}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Selecione a coluna" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="">Nenhuma</SelectItem>
                                      {csvHeaders.map((header: any) => (
                                        <SelectItem key={header} value={header}>
                                          {header}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormDescription>
                                    Alternativa ao ID para identificar o produto.
                                  </FormDescription>
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={csvForm.control}
                              name="mappings.quantityColumn"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    <span className="flex items-center gap-1">
                                      Quantidade
                                      <Badge variant="destructive">
                                        Obrigatório
                                      </Badge>
                                    </span>
                                  </FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    disabled={!csvHeaders.length}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Selecione a coluna" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {csvHeaders.map((header: any) => (
                                        <SelectItem key={header} value={header}>
                                          {header}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormDescription>
                                    Coluna que contém a quantidade de estoque.
                                  </FormDescription>
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={csvForm.control}
                              name="mappings.updateTypeColumn"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    <span className="flex items-center gap-1">
                                      Tipo de Atualização
                                      <Badge variant="outline">Opcional</Badge>
                                    </span>
                                  </FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    disabled={!csvHeaders.length}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Selecione a coluna" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="">Nenhuma</SelectItem>
                                      {csvHeaders.map((header: any) => (
                                        <SelectItem key={header} value={header}>
                                          {header}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormDescription>
                                    Coluna que especifica o tipo de atualização
                                    (absolute/increment/decrement).
                                  </FormDescription>
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <Separator />
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={csvForm.control}
                              name="mappings.lowStockThresholdColumn"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Limite de Estoque Baixo</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    disabled={!csvHeaders.length}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Selecione a coluna" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="">Nenhuma</SelectItem>
                                      {csvHeaders.map((header: any) => (
                                        <SelectItem key={header} value={header}>
                                          {header}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={csvForm.control}
                              name="mappings.locationColumn"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Localização</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    disabled={!csvHeaders.length}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Selecione a coluna" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="">Nenhuma</SelectItem>
                                      {csvHeaders.map((header: any) => (
                                        <SelectItem key={header} value={header}>
                                          {header}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={csvForm.control}
                              name="mappings.batchIdColumn"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>ID do Lote</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    disabled={!csvHeaders.length}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Selecione a coluna" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="">Nenhuma</SelectItem>
                                      {csvHeaders.map((header: any) => (
                                        <SelectItem key={header} value={header}>
                                          {header}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={csvForm.control}
                              name="mappings.expiryDateColumn"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Data de Validade</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    disabled={!csvHeaders.length}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Selecione a coluna" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="">Nenhuma</SelectItem>
                                      {csvHeaders.map((header: any) => (
                                        <SelectItem key={header} value={header}>
                                          {header}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={csvForm.control}
                              name="mappings.notesColumn"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Observações</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    disabled={!csvHeaders.length}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Selecione a coluna" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="">Nenhuma</SelectItem>
                                      {csvHeaders.map((header: any) => (
                                        <SelectItem key={header} value={header}>
                                          {header}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <Separator />
                          
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={csvForm.control}
                                name="defaultUpdateType"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Tipo de Atualização Padrão</FormLabel>
                                    <Select
                                      onValueChange={field.onChange}
                                      defaultValue={field.value}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Selecione o tipo" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="absolute">
                                          Valor Absoluto
                                        </SelectItem>
                                        <SelectItem value="increment">
                                          Incrementar
                                        </SelectItem>
                                        <SelectItem value="decrement">
                                          Decrementar
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormDescription>
                                      Aplicado quando não houver coluna específica no
                                      CSV.
                                    </FormDescription>
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={csvForm.control}
                                name="defaultReason"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Motivo da Atualização</FormLabel>
                                    <Select
                                      onValueChange={field.onChange}
                                      defaultValue={field.value}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Selecione o motivo" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="adjustment">
                                          Ajuste de Inventário
                                        </SelectItem>
                                        <SelectItem value="restock">
                                          Reposição
                                        </SelectItem>
                                        <SelectItem value="sale">Venda</SelectItem>
                                        <SelectItem value="return">
                                          Devolução
                                        </SelectItem>
                                        <SelectItem value="inventory_count">
                                          Contagem de Estoque
                                        </SelectItem>
                                        <SelectItem value="damage">
                                          Produtos Danificados
                                        </SelectItem>
                                        <SelectItem value="expiration">
                                          Produtos Vencidos
                                        </SelectItem>
                                        <SelectItem value="other">Outro</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormDescription>
                                      Registrado no histórico de alterações.
                                    </FormDescription>
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-0">
                        <Button
                          type="button"
                          onClick={processCsvData}
                          disabled={
                            csvData.length === 0 ||
                            !csvForm.getValues().mappings.quantityColumn ||
                            (!csvForm.getValues().mappings.productIdColumn &&
                              !csvForm.getValues().mappings.skuColumn) ||
                            processingValidation
                          }
                          className="w-full"
                        >
                          {processingValidation ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Validando...
                            </>
                          ) : (
                            <>
                              <ClipboardList className="mr-2 h-4 w-4" />
                              Validar e Visualizar Dados
                            </>
                          )}
                        </Button>
                      </CardFooter>
                    </Card>
                  </div>
                  
                  {previewVisible && (
                    <Card className="border-2 border-dashed">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <ClipboardList className="h-5 w-5" />
                          Visualização dos Dados para Importação
                        </CardTitle>
                        <CardDescription>
                          {validationPassed
                            ? "Todos os registros estão válidos e prontos para importação"
                            : "Alguns registros contêm erros que precisam ser corrigidos"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {validationPassed ? (
                                <Badge className="bg-green-500 hover:bg-green-600">
                                  <Check className="mr-1 h-3 w-3" />
                                  Validação Bem-sucedida
                                </Badge>
                              ) : (
                                <Badge variant="destructive">
                                  <AlertTriangle className="mr-1 h-3 w-3" />
                                  Erros de Validação
                                </Badge>
                              )}
                              <span className="text-sm text-muted-foreground">
                                {previewData.filter((item) => item.isValid).length} de{" "}
                                {previewData.length} registros válidos
                              </span>
                            </div>
                            
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setPreviewVisible(false)}
                              >
                                <X className="mr-1 h-3 w-3" />
                                Fechar
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                onClick={executeImport}
                                disabled={
                                  !validationPassed ||
                                  previewData.filter((item) => item.isValid).length === 0 ||
                                  csvImportMutation.isPending
                                }
                              >
                                {csvImportMutation.isPending ? (
                                  <>
                                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                    Importando...
                                  </>
                                ) : (
                                  <>
                                    <Database className="mr-1 h-3 w-3" />
                                    Importar Dados
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                          
                          {csvImportMutation.isPending && (
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Progresso de importação</span>
                                <span>{importProgress}%</span>
                              </div>
                              <Progress value={importProgress} className="h-2" />
                            </div>
                          )}
                          
                          <div className="border rounded">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-[60px]">Linha</TableHead>
                                  <TableHead className="w-[100px]">Status</TableHead>
                                  <TableHead className="w-[100px]">ID/SKU</TableHead>
                                  <TableHead>Produto</TableHead>
                                  <TableHead className="w-[100px]">Quantidade</TableHead>
                                  <TableHead className="w-[120px]">Tipo</TableHead>
                                  <TableHead>Detalhes</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {previewData.length === 0 ? (
                                  <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8">
                                      <div className="flex flex-col items-center gap-2">
                                        <ClipboardList className="h-8 w-8 text-muted-foreground" />
                                        <p>Nenhum dado para visualização</p>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  previewData.map((item) => (
                                    <TableRow
                                      key={item.rowNumber}
                                      className={
                                        item.isValid ? "" : "bg-rose-50 dark:bg-rose-950/20"
                                      }
                                    >
                                      <TableCell className="font-mono">
                                        {item.rowNumber}
                                      </TableCell>
                                      <TableCell>
                                        {item.isValid ? (
                                          <Badge variant="outline" className="bg-green-50">
                                            <CircleCheck className="mr-1 h-3 w-3 text-green-500" />
                                            Válido
                                          </Badge>
                                        ) : (
                                          <Badge variant="destructive">
                                            <CircleX className="mr-1 h-3 w-3" />
                                            Erro
                                          </Badge>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        {item.productId ? (
                                          <div className="font-mono">
                                            {item.productId}
                                          </div>
                                        ) : item.sku ? (
                                          <div className="font-mono text-xs">
                                            {item.sku}
                                          </div>
                                        ) : (
                                          <Badge variant="destructive">
                                            Ausente
                                          </Badge>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        {/* Na visualização real, aqui mostraria o nome do produto após lookup pelo ID */}
                                        {item.isValid ? (
                                          "Produto encontrado"
                                        ) : (
                                          <span className="text-red-500">
                                            Produto não encontrado
                                          </span>
                                        )}
                                      </TableCell>
                                      <TableCell className="font-mono text-right">
                                        {item.quantity !== null && !isNaN(item.quantity) ? (
                                          item.quantity
                                        ) : (
                                          <span className="text-red-500">Inválido</span>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        <Badge
                                          variant={
                                            item.updateType === "increment"
                                              ? "default"
                                              : item.updateType === "decrement"
                                              ? "destructive"
                                              : "outline"
                                          }
                                        >
                                          {item.updateType === "absolute"
                                            ? "Absoluto"
                                            : item.updateType === "increment"
                                            ? "Incremento"
                                            : item.updateType === "decrement"
                                            ? "Decremento"
                                            : item.updateType || "Absoluto"}
                                        </Badge>
                                      </TableCell>
                                      <TableCell>
                                        {item.isValid ? (
                                          <div className="flex gap-2 text-xs text-muted-foreground">
                                            {item.lowStockThreshold && (
                                              <span>
                                                Limite: {item.lowStockThreshold}
                                              </span>
                                            )}
                                            {item.location && (
                                              <span>Local: {item.location}</span>
                                            )}
                                            {item.batchId && (
                                              <span>Lote: {item.batchId}</span>
                                            )}
                                          </div>
                                        ) : (
                                          <div className="text-xs text-red-500">
                                            {item.errors.join(", ")}
                                          </div>
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  ))
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Dialog de confirmação da atualização manual */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirmar Atualização de Estoque
            </DialogTitle>
            <DialogDescription>
              Você está prestes a atualizar o estoque de{" "}
              <strong>{selectedProductIds.length}</strong> produtos.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-md bg-muted p-3">
              <div className="font-medium flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                Detalhes da Atualização
              </div>
              <div className="text-sm mt-2 space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Tipo de Atualização:
                  </span>
                  <span className="font-medium">
                    {updateForm.getValues().updateType === "absolute"
                      ? "Valor Absoluto"
                      : updateForm.getValues().updateType === "increment"
                      ? "Incrementar"
                      : "Decrementar"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Motivo da Atualização:
                  </span>
                  <span className="font-medium">
                    {
                      {
                        adjustment: "Ajuste de Inventário",
                        restock: "Reposição",
                        sale: "Venda",
                        return: "Devolução",
                        inventory_count: "Contagem de Estoque",
                        damage: "Produtos Danificados",
                        expiration: "Produtos Vencidos",
                        other: "Outro",
                      }[updateForm.getValues().updateReason]
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Produtos Selecionados:
                  </span>
                  <span className="font-medium">
                    {selectedProductIds.length}
                  </span>
                </div>
                {updateForm.getValues().updateNotes && (
                  <div className="mt-2">
                    <div className="text-muted-foreground">Observações:</div>
                    <div className="text-sm mt-1 p-2 bg-background rounded">
                      {updateForm.getValues().updateNotes}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="text-amber-500 dark:text-amber-400 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <span className="text-sm">
                Esta ação não pode ser desfeita. O histórico de inventário
                registrará todas as alterações.
              </span>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmManualUpdate}
              disabled={manualUpdateMutation.isPending}
            >
              {manualUpdateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Atualizando...
                </>
              ) : (
                "Confirmar Atualização"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog de modelo de CSV */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Modelo de Arquivo CSV
            </DialogTitle>
            <DialogDescription>
              Use este modelo como referência para preparar seu arquivo CSV para
              importação
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-md overflow-x-auto">
              <div className="font-mono text-sm">
                productId,sku,quantity,updateType,lowStockThreshold,location,batchId,expiryDate,notes
                <br />
                1,PROD001,10,absolute,5,"Estante A-3",LOTE-2023-001,2024-12-31,"Atualização de inventário mensal"
                <br />
                2,PROD002,15,increment,3,"Prateleira B-2",LOTE-2023-002,2023-11-30,"Reposição de estoque"
                <br />
                3,PROD003,5,decrement,10,"Armário C-1",LOTE-2023-003,2025-01-15,"Venda"
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-sm">
                Detalhes sobre as colunas do modelo:
              </h4>
              <ul className="list-disc pl-5 text-sm space-y-2">
                <li>
                  <strong>productId</strong>:{" "}
                  <span className="text-muted-foreground">
                    ID do produto no sistema (obrigatório se SKU não for fornecido)
                  </span>
                </li>
                <li>
                  <strong>sku</strong>:{" "}
                  <span className="text-muted-foreground">
                    Código SKU do produto (obrigatório se ID não for fornecido)
                  </span>
                </li>
                <li>
                  <strong>quantity</strong>:{" "}
                  <span className="text-muted-foreground">
                    Quantidade a ser definida ou adicionada/subtraída (obrigatório)
                  </span>
                </li>
                <li>
                  <strong>updateType</strong>:{" "}
                  <span className="text-muted-foreground">
                    Tipo de atualização (absolute, increment, decrement)
                  </span>
                </li>
                <li>
                  <strong>lowStockThreshold</strong>:{" "}
                  <span className="text-muted-foreground">
                    Limite para alertas de estoque baixo
                  </span>
                </li>
                <li>
                  <strong>location</strong>:{" "}
                  <span className="text-muted-foreground">
                    Localização física do produto no estoque
                  </span>
                </li>
                <li>
                  <strong>batchId</strong>:{" "}
                  <span className="text-muted-foreground">
                    Número do lote ou remessa
                  </span>
                </li>
                <li>
                  <strong>expiryDate</strong>:{" "}
                  <span className="text-muted-foreground">
                    Data de validade no formato AAAA-MM-DD
                  </span>
                </li>
                <li>
                  <strong>notes</strong>:{" "}
                  <span className="text-muted-foreground">
                    Observações sobre a atualização
                  </span>
                </li>
              </ul>
            </div>
            
            <div className="bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 p-3 rounded-md text-sm flex items-start gap-2">
              <Info className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <strong>Dica:</strong> Se seu arquivo contiver texto com
                vírgulas, certifique-se de colocar o texto entre aspas duplas.
                Datas devem estar no formato AAAA-MM-DD.
              </div>
            </div>
          </div>
          <DialogFooter className="sm:justify-between">
            <Button
              variant="outline"
              className="hidden sm:flex"
              onClick={() => {
                navigator.clipboard.writeText(
                  "productId,sku,quantity,updateType,lowStockThreshold,location,batchId,expiryDate,notes\n1,PROD001,10,absolute,5,\"Estante A-3\",LOTE-2023-001,2024-12-31,\"Atualização de inventário mensal\"\n2,PROD002,15,increment,3,\"Prateleira B-2\",LOTE-2023-002,2023-11-30,\"Reposição de estoque\"\n3,PROD003,5,decrement,10,\"Armário C-1\",LOTE-2023-003,2025-01-15,\"Venda\""
                );
                toast({
                  title: "Copiado para a área de transferência",
                  description: "O modelo CSV foi copiado para sua área de transferência.",
                });
              }}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copiar Modelo
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setTemplateDialogOpen(false)}
              >
                Fechar
              </Button>
              <Button
                onClick={() => {
                  generateCsvTemplate();
                  setTemplateDialogOpen(false);
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Baixar Modelo CSV
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Função para renderizar badge de status de estoque
function renderStockStatus(status: string) {
  switch (status) {
    case "in_stock":
      return <Badge variant="outline" className="bg-green-50">Em Estoque</Badge>;
    case "low_stock":
      return <Badge variant="warning">Estoque Baixo</Badge>;
    case "out_of_stock":
      return <Badge variant="destructive">Sem Estoque</Badge>;
    case "back_order":
      return <Badge variant="secondary">Em Espera</Badge>;
    case "discontinued":
      return <Badge variant="outline" className="bg-slate-100">Descontinuado</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}