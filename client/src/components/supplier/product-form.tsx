import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Package, 
  Loader2, 
  Image as ImageIcon,
  X,
  Tag, 
  CheckCircle,
  UploadCloud,
  Plus
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

// Definição do esquema do formulário
const productSchema = z.object({
  name: z.string().min(3, { message: "Nome deve ter pelo menos 3 caracteres" }),
  description: z.string().optional(),
  slug: z.string().optional(),
  price: z.string().min(1, { message: "Preço é obrigatório" }),
  originalPrice: z.string().optional(),
  discount: z.string().optional(),
  rating: z.string().optional(),
  ratingsCount: z.string().optional(),
  sku: z.string().optional(),
  categoryId: z.string().min(1, { message: "Categoria é obrigatória" }),
  inventory: z.object({
    quantity: z.string().min(0, { message: "Quantidade não pode ser negativa" }),
    lowStockThreshold: z.string().optional(),
    restockLevel: z.string().optional(),
    reservedQuantity: z.string().optional(),
    location: z.string().optional(),
    batchNumber: z.string().optional(),
    expirationDate: z.string().optional(),
    notes: z.string().optional(),
    status: z.string().optional(),
  }).optional(),
  imageUrl: z.string().optional(),
  imageData: z.string().optional(),
  imageType: z.string().optional(),
  additionalImages: z.array(z.object({
    url: z.string().optional(),
    data: z.string().optional(),
    type: z.string().optional()
  })).optional(),
  active: z.boolean().default(true),
  additionalCategories: z.array(z.string()).optional(),
  features: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

export interface ProductFormProps {
  productId?: number;
  onSave: () => void;
  onCancel: () => void;
  product?: any;
}

export function ProductForm({ productId, onSave, onCancel, product }: ProductFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("basic");
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Configurar o formulário
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      originalPrice: "",
      sku: "",
      categoryId: "",
      inventory: {
        quantity: "0",
        lowStockThreshold: "10",
      },
      imageUrl: "",
      active: true,
      additionalCategories: [],
      features: "",
    },
  });

  // Buscar categorias
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
    enabled: !!user?.id,
  });

  // Buscar produto para edição, se houver um ID
  const { data: productData, isLoading: isLoadingProduct } = useQuery({
    queryKey: [`/api/supplier/products/${productId}`],
    enabled: !!productId && !!user?.id,
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/supplier/products/${productId}`);
      return await res.json();
    },
  });

  // Mutation para criar/atualizar produto
  const productMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const { user } = useAuth();
      if (!user?.id) {
        throw new Error("ID do usuário não encontrado");
      }
      
      console.log(`Enviando produto para o fornecedor ID ${user.id}, produto ID ${productId || 'novo'}`);
      
      // Atualizar para usar a API correta com o ID do fornecedor
      const url = productId 
        ? `/api/suppliers/${user.id}/products/${productId}` 
        : `/api/suppliers/${user.id}/products`;
        
      const method = productId ? "PATCH" : "POST";
      
      // Para debug
      console.log(`Enviando requisição para ${url} usando método ${method}`);
      
      const res = await fetch(`${window.location.origin}${url}`, {
        method,
        body: data,
        credentials: "include",
      });
      
      if (!res.ok) {
        console.error(`Erro ${res.status} ao salvar produto:`, await res.text());
        const error = await res.json().catch(() => ({ message: `Erro ${res.status}: ${res.statusText}` }));
        throw new Error(error.message || "Erro ao salvar produto");
      }
      
      return await res.json();
    },
    onSuccess: (data) => {
      console.log("Produto salvo com sucesso:", data);
      toast({
        title: productId ? "Produto atualizado" : "Produto criado",
        description: productId 
          ? "O produto foi atualizado com sucesso." 
          : "O produto foi criado com sucesso.",
        variant: "default",
      });
      
      // Invalidar as queries corretas com o ID do fornecedor
      const { user } = useAuth();
      queryClient.invalidateQueries({ queryKey: [`/api/suppliers/${user?.id}/products`] });
      
      if (productId) {
        queryClient.invalidateQueries({ queryKey: [`/api/suppliers/${user?.id}/products/${productId}`] });
      }
      
      onSave();
    },
    onError: (error: Error) => {
      console.error("Erro detalhado ao salvar produto:", error);
      toast({
        title: "Erro ao salvar produto",
        description: error.message || "Ocorreu um erro ao salvar o produto. Por favor, tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Atualizar formulário com dados do produto quando disponível
  useEffect(() => {
    if (product || (productData && !isLoadingProduct)) {
      const data = product || productData;
      
      if (data.imageUrl) {
        setImagePreview(data.imageUrl);
      }
      
      form.reset({
        name: data.name || "",
        description: data.description || "",
        slug: data.slug || "",
        price: data.price?.toString() || "",
        originalPrice: data.originalPrice?.toString() || "",
        discount: data.discount?.toString() || "",
        rating: data.rating?.toString() || "",
        ratingsCount: data.ratingsCount?.toString() || "",
        sku: data.sku || "",
        categoryId: data.categoryId?.toString() || "",
        inventory: {
          quantity: data.inventory?.quantity?.toString() || "0",
          lowStockThreshold: data.inventory?.lowStockThreshold?.toString() || "10",
          restockLevel: data.inventory?.restockLevel?.toString() || "20",
          reservedQuantity: data.inventory?.reservedQuantity?.toString() || "0",
          location: data.inventory?.location || "",
          batchNumber: data.inventory?.batchNumber || "",
          expirationDate: data.inventory?.expirationDate?.toString() || "",
          notes: data.inventory?.notes || "",
          status: data.inventory?.status || "in_stock",
        },
        imageUrl: data.imageUrl || "",
        imageData: data.imageData || "",
        imageType: data.imageType || "",
        additionalImages: data.additionalImages || [],
        active: typeof data.active === "boolean" ? data.active : true,
        additionalCategories: data.additionalCategories || [],
        features: Array.isArray(data.features) ? data.features.join("\n") : (data.features || ""),
      });
    }
  }, [form, product, productData, isLoadingProduct]);

  // Handler para upload de imagem
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Verificar tipo do arquivo
    if (!file.type.match('image.*')) {
      toast({
        title: "Formato inválido",
        description: "Por favor, selecione uma imagem válida (JPEG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Verificar tamanho do arquivo (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "A imagem deve ter no máximo 5MB",
        variant: "destructive",
      });
      return;
    }

    setImageFile(file);
    
    // Atualizar preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Remover imagem
  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageFile(null);
    form.setValue("imageUrl", "");
  };

  // Handler para envio do formulário
  const onSubmit = (data: ProductFormData) => {
    setIsLoading(true);
    
    const formData = new FormData();
    
    // Converter dados básicos para FormData
    formData.append("name", data.name);
    formData.append("description", data.description || "");
    if (data.slug) formData.append("slug", data.slug);
    formData.append("price", data.price);
    if (data.originalPrice) formData.append("originalPrice", data.originalPrice);
    if (data.discount) formData.append("discount", data.discount);
    if (data.rating) formData.append("rating", data.rating);
    if (data.ratingsCount) formData.append("ratingsCount", data.ratingsCount);
    if (data.sku) formData.append("sku", data.sku);
    formData.append("categoryId", data.categoryId);
    formData.append("active", data.active.toString());
    
    // Dados de inventário expandidos
    if (data.inventory) {
      formData.append("inventory.quantity", data.inventory.quantity);
      if (data.inventory.lowStockThreshold) {
        formData.append("inventory.lowStockThreshold", data.inventory.lowStockThreshold);
      }
      if (data.inventory.restockLevel) {
        formData.append("inventory.restockLevel", data.inventory.restockLevel);
      }
      if (data.inventory.reservedQuantity) {
        formData.append("inventory.reservedQuantity", data.inventory.reservedQuantity);
      }
      if (data.inventory.location) {
        formData.append("inventory.location", data.inventory.location);
      }
      if (data.inventory.batchNumber) {
        formData.append("inventory.batchNumber", data.inventory.batchNumber);
      }
      if (data.inventory.expirationDate) {
        formData.append("inventory.expirationDate", data.inventory.expirationDate);
      }
      if (data.inventory.notes) {
        formData.append("inventory.notes", data.inventory.notes);
      }
      if (data.inventory.status) {
        formData.append("inventory.status", data.inventory.status);
      }
    }
    
    // Categorias adicionais
    if (data.additionalCategories && data.additionalCategories.length > 0) {
      data.additionalCategories.forEach((cat, index) => {
        formData.append(`additionalCategories[${index}]`, cat);
      });
    }
    
    // Características do produto
    if (data.features) formData.append("features", data.features);
    
    // Imagem principal, se houver
    if (imageFile) {
      formData.append("productImage", imageFile);
    } else if (data.imageUrl) {
      formData.append("imageUrl", data.imageUrl);
    }
    
    // Imagens adicionais, se houver
    if (data.additionalImages && data.additionalImages.length > 0) {
      data.additionalImages.forEach((img, index) => {
        if (img.url) {
          formData.append(`additionalImages[${index}].url`, img.url);
        }
        if (img.data) {
          formData.append(`additionalImages[${index}].data`, img.data);
        }
        if (img.type) {
          formData.append(`additionalImages[${index}].type`, img.type);
        }
      });
    }
    
    // Enviar a requisição
    productMutation.mutate(formData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
            <TabsTrigger value="inventory">Inventário</TabsTrigger>
            <TabsTrigger value="images">Imagens</TabsTrigger>
          </TabsList>
          
          {/* Informações Básicas */}
          <TabsContent value="basic" className="space-y-4 pt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Produto</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do produto" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <FormControl>
                      <Input placeholder="Código do produto (SKU)" {...field} />
                    </FormControl>
                    <FormDescription>
                      Um código único para identificar seu produto.
                    </FormDescription>
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
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva seu produto aqui..." 
                      className="min-h-[100px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço (R$)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                          R$
                        </span>
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="0" 
                          placeholder="0.00" 
                          className="pl-8" 
                          {...field} 
                        />
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
                    <FormLabel>Preço Original (R$)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                          R$
                        </span>
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="0" 
                          placeholder="0.00" 
                          className="pl-8" 
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Opcional. Para mostrar um preço riscado (promoção).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="discount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Desconto (%)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type="number" 
                          step="0.1" 
                          min="0" 
                          max="100" 
                          placeholder="0" 
                          {...field} 
                        />
                        <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground">
                          %
                        </span>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Percentual de desconto aplicado ao produto.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Avaliação (0-5)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type="number" 
                          step="0.1" 
                          min="0" 
                          max="5" 
                          placeholder="0" 
                          {...field} 
                        />
                        <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground">
                          ★
                        </span>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Avaliação média do produto (0 a 5 estrelas).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria Principal</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value || (Array.isArray(categories) && categories.length > 0 ? categories[0].id.toString() : "1")}
                    value={field.value || (Array.isArray(categories) && categories.length > 0 ? categories[0].id.toString() : "1")}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Array.isArray(categories) && categories.length > 0 ? (
                        categories.map((category: any) => (
                          <SelectItem 
                            key={category.id} 
                            value={category.id.toString()}
                          >
                            {category.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="1">Categoria Padrão</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="features"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Características do Produto</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Liste as características principais do produto, uma por linha..." 
                      className="min-h-[100px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Informe as especificações técnicas e diferenciais do produto.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Produto Ativo</FormLabel>
                    <FormDescription>
                      Produtos inativos não aparecerão nas buscas e não poderão ser comprados.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </TabsContent>
          
          {/* Inventário */}
          <TabsContent value="inventory" className="space-y-6 pt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="inventory.quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade em Estoque</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        placeholder="0" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="inventory.reservedQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade Reservada</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        placeholder="0" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Quantidade já reservada para pedidos em processamento.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="inventory.lowStockThreshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Limite de Estoque Baixo</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        placeholder="10" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Quando o estoque ficar abaixo deste número, receberá um alerta.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="inventory.restockLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nível de Reabastecimento</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        placeholder="20" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Quantidade ideal para reabastecer quando o estoque estiver baixo.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="inventory.location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Localização</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: Estante A, Prateleira 3" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Onde este produto está armazenado.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="inventory.batchNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número do Lote</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: LOT-2025-001" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Identificador do lote de produção ou recebimento.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="inventory.expirationDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Validade</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Se aplicável, para produtos perecíveis.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="inventory.status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status do Estoque</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value || "in_stock"}
                      value={field.value || "in_stock"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="in_stock">Em Estoque</SelectItem>
                        <SelectItem value="low_stock">Estoque Baixo</SelectItem>
                        <SelectItem value="out_of_stock">Sem Estoque</SelectItem>
                        <SelectItem value="backorder">Em Espera</SelectItem>
                        <SelectItem value="discontinued">Descontinuado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Status atual de disponibilidade do produto.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid gap-4">
              <FormField
                control={form.control}
                name="inventory.notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações de Estoque</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Informações adicionais sobre o estoque deste produto..." 
                        className="min-h-[80px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Anotações internas sobre o inventário deste produto.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>
          
          {/* Imagens */}
          <TabsContent value="images" className="space-y-6 pt-4">
            <div className="grid gap-4">
              <FormItem>
                <FormLabel>Imagem Principal</FormLabel>
                <FormControl>
                  <div className="flex flex-col gap-4">
                    {imagePreview ? (
                      <div className="relative flex items-center justify-center border-2 border-dashed rounded-md overflow-hidden h-60">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="object-contain max-h-full max-w-full" 
                        />
                        <Button 
                          type="button" 
                          variant="destructive" 
                          size="icon" 
                          className="absolute top-2 right-2"
                          onClick={handleRemoveImage}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-60 border-2 border-dashed rounded-md cursor-pointer bg-gray-50 hover:bg-gray-100">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                          <p className="mb-2 text-sm text-muted-foreground">
                            <span className="font-semibold">Clique para upload</span> ou arraste e solte
                          </p>
                          <p className="text-xs text-muted-foreground">
                            PNG, JPG ou JPEG (máx. 5MB)
                          </p>
                        </div>
                        <input 
                          id="dropzone-file" 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={handleImageChange}
                        />
                      </label>
                    )}
                    
                    <input 
                      type="hidden"
                      {...form.register("imageUrl")}
                    />
                  </div>
                </FormControl>
                <FormDescription>
                  Forneça uma imagem clara do seu produto. Tamanho ideal: 800x800px.
                </FormDescription>
                <FormMessage />
              </FormItem>
            </div>
            
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium">Imagens Adicionais</h3>
                  <p className="text-sm text-muted-foreground">
                    Adicione mais imagens para mostrar diferentes ângulos ou detalhes do produto.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => {
                    const current = form.getValues('additionalImages') || [];
                    form.setValue('additionalImages', [
                      ...current,
                      { url: '', data: '', type: '' }
                    ]);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Adicionar Imagem
                </Button>
              </div>
              
              {form.watch('additionalImages')?.map((_, index) => (
                <div key={index} className="flex items-start gap-4 mb-4 p-3 border rounded-md">
                  <div className="flex-1">
                    <FormField
                      control={form.control}
                      name={`additionalImages.${index}.url`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL da Imagem {index + 1}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="mt-8"
                    onClick={() => {
                      const current = form.getValues('additionalImages');
                      form.setValue(
                        'additionalImages',
                        current.filter((_, i) => i !== index)
                      );
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              {!form.watch('additionalImages')?.length && (
                <div className="flex items-center justify-center p-6 border border-dashed rounded-md">
                  <div className="text-center text-muted-foreground">
                    <ImageIcon className="mx-auto h-12 w-12 mb-2 text-muted-foreground/60" />
                    <p>Nenhuma imagem adicional.</p>
                    <p className="text-sm">Clique no botão acima para adicionar imagens.</p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        <Separator className="my-4" />
        
        <div className="flex justify-end gap-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={productMutation.isPending}
          >
            {productMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                {productId ? "Atualizar Produto" : "Criar Produto"}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}