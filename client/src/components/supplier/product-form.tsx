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

// Definição do esquema do formulário - com validações mais rigorosas
const productSchema = z.object({
  name: z.string().min(3, { message: "Nome deve ter pelo menos 3 caracteres" }),
  description: z.string().min(5, { message: "Descrição é obrigatória e deve ter pelo menos 5 caracteres" }),
  slug: z.string().min(3, { message: "Slug deve ter pelo menos 3 caracteres" }).or(z.literal("")),
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
    queryKey: [`/api/suppliers/${user?.id}/products/${productId}`],
    enabled: !!productId && !!user?.id,
    queryFn: async () => {
      console.log(`Buscando produto ID ${productId} do fornecedor ID ${user?.id}`);
      const res = await apiRequest("GET", `/api/suppliers/${user?.id}/products/${productId}`);
      if (!res.ok) {
        throw new Error(`Erro ao buscar produto: ${res.status} ${res.statusText}`);
      }
      return await res.json();
    },
  });
  
  // Mutation para criar/atualizar produto
  const productMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!user?.id) {
        throw new Error("ID do usuário não encontrado");
      }
      
      console.log(`Enviando produto para o fornecedor ID ${user.id}, produto ID ${productId || 'novo'}`);
      
      // Atualizar para usar a API correta com o ID do fornecedor
      const url = productId 
        ? `/api/suppliers/${user.id}/products/${productId}` 
        : `/api/suppliers/${user.id}/products`;
        
      const method = productId ? "PATCH" : "POST";
      
      // Verificar se o FormData tem algum conteúdo
      const formDataObj: Record<string, any> = {};
      for (const [key, value] of data.entries()) {
        formDataObj[key] = value;
      }
      
      // Verificação adicional para evitar enviar objetos vazios
      const totalEntries = Object.keys(formDataObj).length;
      console.log(`FormData contém ${totalEntries} campos.`);
      
      if (totalEntries === 0) {
        throw new Error("Nenhum dado foi fornecido para atualização. Verifique os campos do formulário.");
      }
      
      // Adicionar campo especial para PATCH (edição) caso tenhamos apenas o ID
      if (method === "PATCH" && totalEntries <= 1) {
        console.log("Adicionando campo forçado para evitar objeto vazio no PATCH");
        data.append("_forceUpdate", "true");
      }
      
      // Para debug
      console.log(`Enviando requisição para ${url} usando método ${method} com ${totalEntries} campos`);
      
      try {
        // Passar objeto de opções para indicar que estamos enviando um FormData
        const res = await apiRequest(method, url, data, { 
          // Não definir Content-Type aqui, o navegador irá configurar automaticamente
          // com o boundary correto para FormData
          isFormData: true as unknown as string,
          headers: {} as unknown as string
        });
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error(`Erro ${res.status} ao salvar produto:`, errorText);
          
          let errorMsg = `Erro ${res.status}: ${res.statusText}`;
          try {
            const errorJson = JSON.parse(errorText);
            if (errorJson.message) {
              errorMsg = errorJson.message;
            }
            
            // Log adicional para análise completa do erro
            console.error('Resposta de erro detalhada:', {
              status: res.status,
              statusText: res.statusText,
              errorJson
            });
          } catch (e) {
            // Se não conseguir parsear como JSON, usa o texto bruto
            console.error('Erro ao parsear resposta como JSON:', e);
          }
          
          throw new Error(errorMsg);
        }
        
        return await res.json();
      } catch (error) {
        console.error("Erro completo:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Produto salvo com sucesso:", data);
      setIsLoading(false);
      toast({
        title: productId ? "Produto atualizado" : "Produto criado",
        description: productId 
          ? "O produto foi atualizado com sucesso." 
          : "O produto foi criado com sucesso.",
        variant: "default",
      });
      
      // Invalidar as queries corretas com o ID do fornecedor
      if (user?.id) {
        // Invalidar lista de produtos
        queryClient.invalidateQueries({ queryKey: [`/api/suppliers/${user.id}/products`] });
        
        // Invalidar produto específico
        if (productId) {
          queryClient.invalidateQueries({ queryKey: [`/api/suppliers/${user.id}/products/${productId}`] });
        }
        
        // Também invalidar inventário já que pode ter sido atualizado
        queryClient.invalidateQueries({ queryKey: [`/api/suppliers/${user.id}/inventory`] });
      }
      
      onSave();
    },
    onError: (error: Error) => {
      setIsLoading(false);
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
      
      // Função utilitária para garantir conversão segura para string e evitar undefined/null
      const safeToString = (value: any, defaultValue: string = ""): string => {
        if (value === undefined || value === null) return defaultValue;
        return String(value);
      };
      
      // Definir a imagem de pré-visualização se houver
      if (data?.imageUrl) {
        setImagePreview(data.imageUrl);
      }
      
      // Log de debug para verificar dados
      console.log('Inicializando formulário com dados do produto:', {
        id: data?.id,
        name: data?.name,
        categoryId: data?.categoryId,
        price: data?.price,
        inventory: data?.inventory || 'Sem dados de inventário'
      });
      
      // Inicializar o inventário com valores seguros
      const inventoryData = {
        quantity: safeToString(data?.inventory?.quantity, "0"),
        lowStockThreshold: safeToString(data?.inventory?.lowStockThreshold, "10"),
        restockLevel: safeToString(data?.inventory?.restockLevel, "20"),
        reservedQuantity: safeToString(data?.inventory?.reservedQuantity, "0"),
        location: data?.inventory?.location || "",
        batchNumber: data?.inventory?.batchNumber || "",
        expirationDate: safeToString(data?.inventory?.expirationDate, ""),
        notes: data?.inventory?.notes || "",
        status: data?.inventory?.status || "in_stock",
      };
      
      // Inicializar as imagens adicionais com validação
      const additionalImagesData = Array.isArray(data?.additionalImages) 
        ? data.additionalImages
            .filter((img: any) => img !== null && img !== undefined)
            .map((img: any) => ({
              url: img?.url || "",
              data: img?.data || "",
              type: img?.type || "",
            }))
        : [];
        
      // Inicializar categorias adicionais com validação
      const additionalCategoriesData = Array.isArray(data?.additionalCategories) 
        ? data.additionalCategories
            .filter((cat: any) => cat !== null && cat !== undefined)
            .map((cat: any) => safeToString(cat))
        : [];
      
      // Features - pode ser array ou string
      const featuresData = Array.isArray(data?.features) 
        ? data.features.join("\n") 
        : (data?.features || "");
      
      // Reset completo do formulário com todos os valores validados
      form.reset({
        name: data?.name || "",
        description: data?.description || "",
        slug: data?.slug || "",
        price: safeToString(data?.price),
        originalPrice: safeToString(data?.originalPrice),
        discount: safeToString(data?.discount),
        rating: safeToString(data?.rating),
        ratingsCount: safeToString(data?.ratingsCount),
        sku: data?.sku || "",
        categoryId: safeToString(data?.categoryId),
        inventory: inventoryData,
        imageUrl: data?.imageUrl || "",
        imageData: data?.imageData || "",
        imageType: data?.imageType || "",
        additionalImages: additionalImagesData,
        active: data?.active === false ? false : true, // default para true se undefined
        additionalCategories: additionalCategoriesData,
        features: featuresData,
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
    let hasValidData = false;
    
    // Valores padrão para campos obrigatórios e situações de emergência
    const defaultValues: Record<string, string> = {
      name: "Produto sem nome",
      slug: `produto-${Date.now()}`,
      description: "Descrição pendente",
      price: "0.01",
      categoryId: "1",
      active: "true"
    };
    
    // Log para debug dos dados que estão sendo enviados
    console.log("Dados do formulário antes de processar:", data);
    
    const formData = new FormData();
    let hasValidData = false; // Flag para verificar se há dados válidos para enviar
    
    // Função para adicionar de forma segura ao FormData - formatação consistente
    // e manipulação adequada de valores booleanos e numéricos
    const safeAppend = (key: string, value: any, isRequired: boolean = false) => {
      // Valores padrão para campos críticos que não podem ser vazios
      const defaultValues: Record<string, string> = {
        'name': 'Produto sem nome',
        'slug': 'produto-sem-slug',
        'categoryId': '1',
        'price': '0.01',
        'description': ''
      };
      
      // Tratamento de valores null/undefined
      if (value === undefined || value === null) {
        // Se for campo obrigatório, verificar se é um dos críticos que não podem ser vazios
        if (defaultValues[key] !== undefined) {
          formData.append(key, defaultValues[key]);
          console.log(`Campo crítico '${key}' recebeu valor padrão: ${defaultValues[key]}`);
          return true;
        }
        
        if (isRequired && key !== 'description') {
          console.log(`Campo obrigatório '${key}' é undefined ou null`);
          return false;
        }
        return false;
      }
      
      // Tratamento especial para strings - verificar se é vazia
      if (typeof value === 'string' && value.trim() === '') {
        // Se for campo crítico que não pode ser vazio, usar valor padrão
        if (defaultValues[key] !== undefined) {
          formData.append(key, defaultValues[key]);
          console.log(`Campo crítico '${key}' recebeu valor padrão: ${defaultValues[key]}`);
          return true;
        }
        
        if (isRequired && key !== 'description') {
          console.log(`Campo obrigatório '${key}' é uma string vazia`);
          return false;
        }
        
        // Para descrição e outros campos opcionais, permitir string vazia
        formData.append(key, '');
        return true;
      }
      
      // Tratamento para valores booleanos - converter para "true" ou "false"
      if (typeof value === 'boolean') {
        formData.append(key, value ? "true" : "false");
        return true;
      }
      
      // Tratamento para números - verificar se é válido e formatar corretamente
      if (typeof value === 'number' || (typeof value === 'string' && !isNaN(Number(value)))) {
        const numValue = Number(value);
        
        // Tratamento especial para preços
        if (key.includes('price') || key.includes('Price')) {
          if (numValue <= 0) {
            if (isRequired) {
              console.log(`Preço inválido (deve ser maior que 0): ${value}, usando valor padrão 0.01`);
              formData.append(key, "0.01");
              return true;
            } else if (numValue === 0) {
              // Preço zero para campos opcionais é aceitável (sem desconto)
              formData.append(key, "0.00");
              return true;
            }
          }
          
          // Formatar preço com 2 casas decimais
          formData.append(key, numValue.toFixed(2));
          return true;
        }
        
        // Para outros campos numéricos que não são preços
        formData.append(key, value.toString());
        return true;
      }
      
      // Tratamento especial para objetos e outros tipos complexos
      if (typeof value === 'object' && value !== null) {
        try {
          if (Array.isArray(value)) {
            // Para arrays, serializar como JSON
            formData.append(key, JSON.stringify(value));
          } else if (value instanceof Date) {
            // Para datas, usar formato ISO padrão
            formData.append(key, value.toISOString());
          } else if (value instanceof File || value instanceof Blob) {
            // Para arquivos e blobs, anexar diretamente
            formData.append(key, value);
          } else {
            // Para objetos genéricos, serializar como JSON
            formData.append(key, JSON.stringify(value));
          }
          return true;
        } catch (error) {
          console.error(`Erro ao serializar objeto para campo '${key}':`, error);
          
          // Mesmo com erro, enviar string vazia para campos críticos
          if (defaultValues[key] !== undefined) {
            formData.append(key, defaultValues[key]);
            return true;
          }
          return false;
        }
      }
      
      // Para outros tipos primitivos (symbol, function, etc), converter para string
      formData.append(key, String(value));
      return true;
    };
    
    // Garantir que o produto tenha ID quando for atualização
    if (productId) {
      formData.append("id", productId.toString());
    }
    
    // Campos obrigatórios - validação completa antes de enviar
    // Como vimos no erro: "null value in column \"name\" of relation \"products\" violates not-null constraint"
    const validationErrors: { field: string; message: string }[] = [];
    
    // Verificar todos os campos obrigatórios de uma vez
    if (!data.name || data.name.trim() === '') {
      validationErrors.push({
        field: "name",
        message: "O nome do produto não pode ficar em branco."
      });
    }

    if (!data.description || data.description.trim() === '') {
      validationErrors.push({
        field: "description",
        message: "A descrição do produto não pode ficar em branco."
      });
    }

    if (!data.slug || data.slug.trim() === '') {
      validationErrors.push({
        field: "slug",
        message: "O slug do produto não pode ficar em branco."
      });
    }

    if (!data.price || parseFloat(data.price) <= 0) {
      validationErrors.push({
        field: "price",
        message: "O preço do produto deve ser maior que zero."
      });
    }

    if (!data.categoryId) {
      validationErrors.push({
        field: "categoryId",
        message: "Você precisa selecionar uma categoria para o produto."
      });
    }
    
    // Se houver erros, mostrar e retornar
    if (validationErrors.length > 0) {
      setIsLoading(false);
      
      // Mostrar o primeiro erro em um toast
      toast({
        title: `Campo ${validationErrors[0].field} obrigatório`,
        description: validationErrors[0].message,
        variant: "destructive",
      });
      
      // Se houver mais erros, logar para debug
      if (validationErrors.length > 1) {
        console.warn(`Há ${validationErrors.length} campos obrigatórios faltando:`);
        validationErrors.forEach((error, index) => {
          console.warn(`${index + 1}. ${error.field}: ${error.message}`);
          
          // Destacar campo com erro no formulário
          form.setError(error.field as any, { 
            type: "manual", 
            message: error.message 
          });
        });
      }
      
      return;
    }
    
    // Se todas as validações passarem, prosseguir com valores padrão de segurança

    // Nome tem validação extra para garantir que não será nulo
    formData.append("name", data.name.trim());
    hasValidData = true;
    
    // Demais campos obrigatórios - garantindo que serão enviados com trimming seguro
    formData.append("description", data.description?.trim() || "");
    formData.append("slug", data.slug?.trim() || "");
    formData.append("price", data.price?.toString() || "0");
    formData.append("categoryId", data.categoryId?.toString() || "1");
    hasValidData = true;
    
    // Campos opcionais com validação
    if (data.originalPrice && parseFloat(data.originalPrice) > 0) {
      safeAppend("originalPrice", data.originalPrice);
    }
    
    if (data.discount && parseFloat(data.discount) >= 0) {
      safeAppend("discount", data.discount);
    }
    
    safeAppend("rating", data.rating);
    safeAppend("ratingsCount", data.ratingsCount);
    safeAppend("sku", data.sku?.trim());
    
    // Sempre enviar o status ativo
    safeAppend("active", data.active);
    
    // Dados de inventário expandidos
    if (data.inventory) {
      const inv = data.inventory;
      
      if (inv.quantity !== undefined && inv.quantity !== null) {
        if (safeAppend("inventory.quantity", inv.quantity.toString())) hasValidData = true;
      }
      
      if (inv.lowStockThreshold && parseInt(inv.lowStockThreshold) >= 0) {
        safeAppend("inventory.lowStockThreshold", inv.lowStockThreshold);
      }
      
      if (inv.restockLevel && parseInt(inv.restockLevel) >= 0) {
        safeAppend("inventory.restockLevel", inv.restockLevel);
      }
      
      if (inv.reservedQuantity && parseInt(inv.reservedQuantity) >= 0) {
        safeAppend("inventory.reservedQuantity", inv.reservedQuantity);
      }
      
      safeAppend("inventory.location", inv.location?.trim());
      safeAppend("inventory.batchNumber", inv.batchNumber?.trim());
      safeAppend("inventory.expirationDate", inv.expirationDate?.trim());
      safeAppend("inventory.notes", inv.notes?.trim());
      safeAppend("inventory.status", inv.status?.trim());
    }
    
    // Categorias adicionais com validação
    if (data.additionalCategories && data.additionalCategories.length > 0) {
      const validCategories = data.additionalCategories.filter(cat => cat && cat.trim() !== "");
      
      if (validCategories.length > 0) {
        validCategories.forEach((cat, index) => {
          formData.append(`additionalCategories[${index}]`, cat.trim());
        });
      }
    }
    
    // Características do produto
    if (data.features && data.features.trim() !== "") {
      formData.append("features", data.features.trim());
    }
    
    // Imagem principal com validação
    if (imageFile) {
      formData.append("productImage", imageFile);
      hasValidData = true;
    } else if (data.imageUrl && data.imageUrl.trim() !== "") {
      formData.append("imageUrl", data.imageUrl.trim());
      hasValidData = true;
    }
    
    // Imagens adicionais com validação
    if (data.additionalImages && Array.isArray(data.additionalImages) && data.additionalImages.length > 0) {
      // Filtrar apenas imagens com dados válidos
      const validImages = data.additionalImages.filter(img => 
        img && ((img.url && typeof img.url === 'string' && img.url.trim() !== "") || 
                (img.data && img.data !== null))
      );
      
      if (validImages && validImages.length > 0) {
        validImages.forEach((img, index) => {
          if (img.url && img.url.trim() !== "") {
            formData.append(`additionalImages[${index}].url`, img.url.trim());
          }
          if (img.data) {
            formData.append(`additionalImages[${index}].data`, img.data);
          }
          if (img.type) {
            formData.append(`additionalImages[${index}].type`, img.type);
          }
        });
      }
    }
    
    // Verificação final se há dados válidos para enviar
    if (!hasValidData && !productId) {
      setIsLoading(false);
      toast({
        title: "Erro ao enviar formulário",
        description: "Por favor, preencha pelo menos os campos obrigatórios (nome, preço e categoria).",
        variant: "destructive",
      });
      return;
    }
    
    // Converter FormData para objeto para melhor debug
    const formDataObj: Record<string, any> = {};
    try {
      // Usar Array.from para evitar erros com iteradores (para compatibilidade com target ES5)
      Array.from(formData.entries()).forEach(([key, value]) => {
        formDataObj[key] = value;
      });
    } catch (error) {
      console.error("Erro ao converter FormData para objeto:", error);
      // Em caso de erro, pelo menos registrar o ID se existir
      if (productId) {
        formDataObj["id"] = productId;
      }
    }
    
    // Log dos dados que serão enviados para o servidor
    console.log("Enviando dados para o servidor:", formDataObj);
    console.log(`Modo: ${productId ? 'Atualização' : 'Criação'}, Total de campos: ${Object.keys(formDataObj).length}`);
    
    // Verificação de segurança para atualização
    // Adicionar um campo especial para garantir que nunca enviamos um objeto vazio
    // Este campo é apenas para resolver o problema específico com a API
    if (productId) {
      // Log detalhado para atualizações
      console.log(`Atualizando produto ${productId} com ${Object.keys(formDataObj).length} campos`);
      
      // Log dos campos específicos que vão ser atualizados
      const keysList = Object.keys(formDataObj).join(", ");
      console.log(`Campos sendo enviados: ${keysList}`);
      
      // Mesmo se tiver poucos campos, sempre garantir que enviamos dados suficientes
      // para evitar o erro 400 "Nenhum dado válido fornecido para atualização"
      if (Object.keys(formDataObj).length <= 2) { // Apenas o ID e talvez mais um campo
        console.log("Adicionando campos forçados para garantir atualização válida");
        
        // Garantir que pelo menos nome e categoria estão presentes
        if (!formDataObj.name && productId) {
          // Vamos buscar o nome atual do produto para incluir
          console.log("Nome não presente na atualização, usando nome atual");
          formData.append("name", form.getValues("name") || "Produto");
        }
        
        if (!formDataObj.categoryId && productId) {
          // Garantir categoria
          console.log("Categoria não presente na atualização, usando categoria atual");
          formData.append("categoryId", form.getValues("categoryId") || "1");
        }
        
        // Campos timestamp para forçar detecção de mudança
        formData.append("_forceUpdate", "true");
        formData.append("_lastUpdated", new Date().toISOString());
      }
      
      // Adicionar um flag de atualização para informar ao backend
      formData.append("_isUpdate", "true");
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
                      const current = form.getValues('additionalImages') || [];
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