import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertCircle,
  Info,
  Loader2,
  PackageCheck,
  PackagePlus,
  Trash2,
  Edit,
  Save,
  ArrowLeft,
  ChevronRight,
  Plus,
  BarChart3,
  ImageIcon,
  Package,
  PackageOpen,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { formatCurrency } from "@/lib/utils";

// Esquema de validação para o formulário de produto
const productSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres"),
  price: z.string().refine(value => {
    const number = parseFloat(value.replace(/\./g, "").replace(",", "."));
    return !isNaN(number) && number > 0;
  }, { message: "O preço deve ser um número válido maior que zero" }),
  originalPrice: z.string().optional().refine(value => {
    if (!value || value === "") return true;
    const number = parseFloat(value.replace(/\./g, "").replace(",", "."));
    return !isNaN(number) && number > 0;
  }, { message: "O preço original deve ser um número válido maior que zero" }),
  categoryId: z.string().min(1, "Selecione uma categoria"),
  active: z.boolean().default(true),
  featuredImage: z.any().optional(),
  additionalImages: z.any().optional(),
  additionalCategories: z.array(z.string()).optional(),
  
  // Campos de inventário
  quantity: z.string().refine(value => {
    const number = parseInt(value);
    return !isNaN(number) && number >= 0;
  }, { message: "A quantidade deve ser um número inteiro válido maior ou igual a zero" }),
  lowStockThreshold: z.string().refine(value => {
    if (!value || value === "") return true;
    const number = parseInt(value);
    return !isNaN(number) && number >= 0;
  }, { message: "O limite de estoque baixo deve ser um número inteiro válido maior ou igual a zero" }),
  restockLevel: z.string().refine(value => {
    if (!value || value === "") return true;
    const number = parseInt(value);
    return !isNaN(number) && number >= 0;
  }, { message: "O nível de reposição deve ser um número inteiro válido maior ou igual a zero" }),
  sku: z.string().optional(),
  location: z.string().optional(),
  weight: z.string().optional().refine(value => {
    if (!value || value === "") return true;
    const number = parseFloat(value.replace(/\./g, "").replace(",", "."));
    return !isNaN(number) && number > 0;
  }, { message: "O peso deve ser um número válido maior que zero" }),
  dimensions: z.string().optional(),
  isDigital: z.boolean().default(false),
});

interface ProductFormProps {
  productId?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ProductForm({ productId, onSuccess, onCancel }: ProductFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("general");
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!productId;

  // Formulário
  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      originalPrice: "",
      categoryId: "",
      active: true,
      additionalCategories: [],
      quantity: "0",
      lowStockThreshold: "",
      restockLevel: "",
      sku: "",
      location: "",
      weight: "",
      dimensions: "",
      isDigital: false,
    },
  });

  // Query para buscar categorias
  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ["/api/categories"],
  });

  // Query para buscar dados do produto em modo de edição
  const { data: product, isLoading: isLoadingProduct } = useQuery({
    queryKey: ["/api/supplier/products", productId],
    enabled: !!productId && !!user?.id,
  });

  // Query para buscar dados de inventário em modo de edição
  const { data: inventory, isLoading: isLoadingInventory } = useQuery({
    queryKey: ["/api/supplier/inventory", productId],
    enabled: !!productId && !!user?.id,
  });

  // Mutation para criar/atualizar produto
  const productMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const url = isEditMode 
        ? `/api/supplier/products/${productId}` 
        : "/api/supplier/products";
      const method = isEditMode ? "PUT" : "POST";
      const res = await apiRequest(method, url, data, true);
      return await res.json();
    },
    onSuccess: (data) => {
      // Após salvar o produto, atualizar o estoque se necessário
      if (data.id) {
        updateInventory(data.id);
      } else {
        finishSubmission("Produto salvo com sucesso!");
      }
    },
    onError: (error: any) => {
      setIsSubmitting(false);
      toast({
        title: "Erro ao salvar produto",
        description: error.message || "Ocorreu um erro ao salvar o produto. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Mutation para atualizar inventário
  const inventoryMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/supplier/inventory/update", data);
      return await res.json();
    },
    onSuccess: () => {
      finishSubmission("Produto e inventário salvos com sucesso!");
    },
    onError: (error: any) => {
      toast({
        title: "Produto salvo, mas houve erro ao atualizar inventário",
        description: error.message || "O produto foi salvo, mas ocorreu um erro ao atualizar o inventário.",
        variant: "destructive",
      });
      finishSubmission("Produto salvo, mas houve erro ao atualizar inventário");
    },
  });

  // Finalizar o processo de submissão
  const finishSubmission = (message: string) => {
    setIsSubmitting(false);
    toast({
      title: "Sucesso",
      description: message,
    });
    
    // Invalidar as queries para recarregar os dados
    queryClient.invalidateQueries({ queryKey: ["/api/supplier/products"] });
    queryClient.invalidateQueries({ queryKey: ["/api/supplier/inventory"] });
    queryClient.invalidateQueries({ queryKey: ["/api/supplier/inventory/stats"] });
    
    // Executar callback de sucesso
    if (onSuccess) {
      onSuccess();
    }
  };

  // Preencher o formulário com os dados do produto em modo de edição
  useEffect(() => {
    if (product && isEditMode) {
      form.reset({
        name: product.name || "",
        description: product.description || "",
        price: product.price ? product.price.toString() : "",
        originalPrice: product.originalPrice ? product.originalPrice.toString() : "",
        categoryId: product.categoryId ? product.categoryId.toString() : "",
        active: product.active !== undefined ? product.active : true,
        additionalCategories: product.additionalCategories || [],
        quantity: inventory?.quantity ? inventory.quantity.toString() : "0",
        lowStockThreshold: inventory?.lowStockThreshold ? inventory.lowStockThreshold.toString() : "",
        restockLevel: inventory?.restockLevel ? inventory.restockLevel.toString() : "",
        sku: inventory?.sku || "",
        location: inventory?.location || "",
        weight: product.weight ? product.weight.toString() : "",
        dimensions: product.dimensions || "",
        isDigital: inventory?.isDigital || false,
      });

      // Carregar preview da imagem
      if (product.imageUrl) {
        setImagePreview(product.imageUrl);
      }
    }
  }, [product, inventory, form, isEditMode]);

  // Manipular envio do formulário
  const onSubmit = async (values: z.infer<typeof productSchema>) => {
    setIsSubmitting(true);

    // Criar FormData
    const formData = new FormData();
    formData.append("name", values.name);
    formData.append("description", values.description);
    formData.append("price", values.price.replace(/\./g, "").replace(",", "."));
    if (values.originalPrice) {
      formData.append("originalPrice", values.originalPrice.replace(/\./g, "").replace(",", "."));
    }
    formData.append("categoryId", values.categoryId);
    formData.append("active", values.active.toString());
    
    if (values.additionalCategories && values.additionalCategories.length > 0) {
      formData.append("additionalCategories", JSON.stringify(values.additionalCategories));
    }
    
    if (values.weight) {
      formData.append("weight", values.weight.replace(/\./g, "").replace(",", "."));
    }
    
    if (values.dimensions) {
      formData.append("dimensions", values.dimensions);
    }

    // Adicionar imagens
    if (selectedImages.length > 0) {
      formData.append("featuredImage", selectedImages[0]);
      
      for (let i = 1; i < selectedImages.length; i++) {
        formData.append("additionalImages", selectedImages[i]);
      }
    }

    // Enviar dados do produto
    productMutation.mutate(formData);
  };

  // Atualizar inventário após salvar o produto
  const updateInventory = async (prodId: number) => {
    const values = form.getValues();
    
    const inventoryData = {
      productId: prodId,
      quantity: parseInt(values.quantity),
      status: parseInt(values.quantity) > 0 ? "in_stock" : "out_of_stock",
      lowStockThreshold: values.lowStockThreshold ? parseInt(values.lowStockThreshold) : undefined,
      restockLevel: values.restockLevel ? parseInt(values.restockLevel) : undefined,
      sku: values.sku,
      location: values.location,
      isDigital: values.isDigital,
      notes: isEditMode ? "Atualizado via formulário de edição" : "Criado com estoque inicial",
    };

    inventoryMutation.mutate(inventoryData);
  };

  // Manipular alteração de imagens
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const filesArray = Array.from(files);
      setSelectedImages(filesArray);
      
      // Mostrar preview da primeira imagem
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(filesArray[0]);
    }
  };

  // Estado de carregamento geral
  const isLoading = isLoadingCategories || (isEditMode && (isLoadingProduct || isLoadingInventory));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Carregando...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">
          {isEditMode ? "Editar Produto" : "Novo Produto"}
        </h2>
        <Button variant="outline" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full md:w-auto md:inline-flex grid-cols-2 md:grid-cols-none">
          <TabsTrigger value="general" className="flex items-center">
            <Package className="h-4 w-4 mr-2" />
            Geral
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center">
            <PackageCheck className="h-4 w-4 mr-2" />
            Inventário
          </TabsTrigger>
        </TabsList>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <TabsContent value="general" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informações do Produto</CardTitle>
                  <CardDescription>
                    Preencha as informações básicas do produto que será exibido no marketplace.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Produto*</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Forno Combinado 10 GNs" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Categoria Principal*</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione uma categoria" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories?.map((category: any) => (
                                <SelectItem key={category.id} value={category.id.toString()}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição*</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Descreva o produto em detalhes..." 
                            rows={5}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preço*</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-2.5">R$</span>
                              <Input className="pl-8" placeholder="0,00" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="originalPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preço Original (opcional)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-2.5">R$</span>
                              <Input className="pl-8" placeholder="0,00" {...field} />
                            </div>
                          </FormControl>
                          <FormDescription>
                            Se preenchido, mostrará um desconto
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="active"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Produto Ativo</FormLabel>
                            <FormDescription>
                              Desmarque para ocultar o produto no marketplace
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <FormLabel>Imagens do Produto</FormLabel>
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 hover:bg-gray-100 transition-colors">
                      {imagePreview ? (
                        <div className="w-full flex flex-col items-center space-y-4">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="max-w-[200px] max-h-[200px] object-contain rounded"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById("product-images")?.click()}
                          >
                            Alterar Imagem
                          </Button>
                        </div>
                      ) : (
                        <div className="w-full flex flex-col items-center space-y-4">
                          <ImageIcon className="h-16 w-16 text-gray-400" />
                          <div className="text-center space-y-2">
                            <p className="text-sm text-gray-500">
                              Arraste e solte ou clique para fazer upload
                            </p>
                            <p className="text-xs text-gray-400">
                              PNG, JPG, WEBP (máx. 5MB)
                            </p>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => document.getElementById("product-images")?.click()}
                            >
                              Selecionar Imagens
                            </Button>
                          </div>
                        </div>
                      )}
                      <input
                        id="product-images"
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleImageChange}
                      />
                    </div>
                    <FormDescription>
                      A primeira imagem será usada como destaque. Recomendamos 
                      imagens de alta qualidade e com fundo branco.
                    </FormDescription>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="inventory" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informações de Inventário</CardTitle>
                  <CardDescription>
                    Gerencie o estoque e configurações de inventário para este produto.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantidade em Estoque*</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lowStockThreshold"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Limite de Estoque Baixo</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" {...field} />
                          </FormControl>
                          <FormDescription>
                            Limite abaixo do qual um alerta será gerado
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
                          <FormLabel>Nível de Reposição</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" {...field} />
                          </FormControl>
                          <FormDescription>
                            Nível ideal de estoque para reposição
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="sku"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SKU</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: FORN-COMB-10GN" {...field} />
                          </FormControl>
                          <FormDescription>
                            Código de identificação único do produto
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
                          <FormLabel>Localização no Estoque</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Galpão A, Prateleira 3" {...field} />
                          </FormControl>
                          <FormDescription>
                            Onde o produto está armazenado
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="weight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Peso (kg)</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: 10,5" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dimensions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dimensões (A x L x P em cm)</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: 50 x 80 x 60" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="isDigital"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Produto Digital</FormLabel>
                          <FormDescription>
                            Marque se o produto é digital (não requer estoque físico)
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  {isEditMode && inventory && (
                    <div className="border rounded-md p-4 bg-gray-50">
                      <h3 className="font-medium text-sm text-gray-800 mb-2">Status do Inventário</h3>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          inventory.status === "in_stock" ? "default" :
                          inventory.status === "low_stock" ? "warning" :
                          inventory.status === "out_of_stock" ? "destructive" :
                          "outline"
                        }>
                          {inventory.status === "in_stock" && "Em Estoque"}
                          {inventory.status === "low_stock" && "Estoque Baixo"}
                          {inventory.status === "out_of_stock" && "Sem Estoque"}
                          {inventory.status === "back_order" && "Pedido Pendente"}
                          {inventory.status === "discontinued" && "Descontinuado"}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          Última atualização: {new Date(inventory.lastUpdated).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <div className="flex justify-end space-x-4 mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="min-w-[120px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Produto
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </Tabs>

      {/* Dialog de confirmação */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar edição?</DialogTitle>
            <DialogDescription>
              Todas as alterações não salvas serão perdidas. Tem certeza que deseja cancelar?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
              Continuar Editando
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                setIsConfirmDialogOpen(false);
                if (onCancel) onCancel();
              }}
            >
              Sim, Cancelar Edição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}