import { useState, useMemo } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Product, Category, insertProductSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Package, DollarSign, Plus, Edit, Trash2, Search, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loading } from "@/components/ui/loading";
import { ImageUpload } from "@/components/ui/image-upload";
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";

// Generate slug from product name
function generateSlug(name: string) {
  return name
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

// Dashboard sidebar with links to other supplier pages
function SupplierSidebar() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold mb-4">Painel do Fornecedor</h2>
      <nav className="space-y-2">
        <Link href="/fornecedor" className="flex items-center text-gray-700 hover:text-primary p-2 rounded-md hover:bg-gray-50 font-medium">
          <BarChart className="mr-2 h-5 w-5" />
          Dashboard
        </Link>
        <Link href="/fornecedor/produtos" className="flex items-center text-primary p-2 rounded-md bg-primary/10 font-medium">
          <Package className="mr-2 h-5 w-5" />
          Meus Produtos
        </Link>
        <Link href="/fornecedor/vendas" className="flex items-center text-gray-700 hover:text-primary p-2 rounded-md hover:bg-gray-50 font-medium">
          <DollarSign className="mr-2 h-5 w-5" />
          Vendas e Comissões
        </Link>
      </nav>
    </div>
  );
}

// Product form schema
const productFormSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  description: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres"),
  // Categoria principal (obrigatória)
  categoryId: z.number({
    required_error: "Selecione uma categoria principal",
    invalid_type_error: "Categoria inválida"
  }),
  // Categorias adicionais (opcional)
  additionalCategories: z.array(z.number()).optional().default([]),
  supplierId: z.number().optional(),
  price: z.string().or(z.number()).pipe(
    z.coerce.number().min(0, "Preço deve ser maior que zero")
  ),
  discount: z.number().nullable().optional(),
  originalPrice: z.string().nullable().optional(),
  features: z.string().optional().transform(val => 
    val ? val.split('\n').filter(line => line.trim().length > 0) : []
  ),
  imageUrl: z.string().url("URL da imagem inválida"),
  imageData: z.string().nullable().optional(),
  imageType: z.string().nullable().optional(),
  active: z.boolean().default(true)
});

type ProductFormValues = z.infer<typeof productFormSchema>;

export default function ProductManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  
  // Fetch supplier products
  // O parâmetro supplierId não é mais necessário pois a API já faz a filtragem automaticamente
  // para fornecedores, mas mantemos para garantir compatibilidade e robustez
  const { data: productsResponse, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["/api/products", { supplierId: user?.id }],
    enabled: !!user?.id,
  });
  
  // Normaliza o formato dos produtos para garantir que sempre seja um array
  const products = useMemo(() => {
    if (!productsResponse) return [];
    
    // Se a resposta for um array, usa diretamente
    if (Array.isArray(productsResponse)) {
      return productsResponse;
    }
    
    // Se a resposta for um objeto com propriedade data que é um array, extrai o array
    if (productsResponse && typeof productsResponse === 'object' && 'data' in productsResponse && Array.isArray(productsResponse.data)) {
      return productsResponse.data;
    }
    
    console.error("Formato de resposta de produtos inesperado:", productsResponse);
    return []; // Retorna array vazio como fallback
  }, [productsResponse]);
  
  // Fetch categories for the select dropdown
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });
  
  // Form for adding new products
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      categoryId: undefined,
      supplierId: user?.id,
      price: "",
      discount: null,
      originalPrice: null,
      features: "",
      imageUrl: "https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?auto=format&fit=crop&w=500&h=300",
      imageData: null,
      imageType: null,
      active: true,
    },
  });
  
  // Form for editing products
  const editForm = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      categoryId: undefined,
      supplierId: user?.id,
      price: "",
      discount: null,
      originalPrice: null,
      features: "",
      imageUrl: "",
      imageData: null,
      imageType: null,
      active: true,
    },
  });
  
  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormValues) => {
      console.log("Iniciando mutação de criação de produto:", data);
      return apiRequest("POST", "/api/products", data)
        .then(response => {
          if (!response.ok) {
            console.error("Erro na resposta API:", response.status, response.statusText);
            return response.json().then(err => {
              throw new Error(err.message || "Erro ao criar produto");
            });
          }
          return response.json();
        })
        .catch(error => {
          console.error("Erro ao criar produto:", error);
          throw error;
        });
    },
    onSuccess: (data) => {
      // Atualiza a consulta principal
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      
      // Adiciona o novo produto diretamente ao cache para atualização imediata
      const currentProducts = queryClient.getQueryData<Product[]>(["/api/products"]) || [];
      
      // Tentar obter o produto adicionado da resposta
      try {
        data.text().then(text => {
          try {
            const newProduct = JSON.parse(text);
            if (newProduct && newProduct.id) {
              queryClient.setQueryData(["/api/products"], [...currentProducts, newProduct]);
              console.log("Produto adicionado em tempo real:", newProduct);
            }
          } catch (e) {
            console.error("Erro ao processar resposta:", e);
          }
        });
      } catch (e) {
        console.error("Erro ao ler resposta:", e);
      }
      
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: "Produto adicionado",
        description: "O produto foi adicionado com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar produto",
        description: "Ocorreu um erro ao adicionar o produto. Por favor, tente novamente.",
        variant: "destructive",
      });
    },
  });
  
  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async (data: ProductFormValues & { id: number }) => {
      console.log("Iniciando mutação de atualização de produto:", data);
      
      // Validações adicionais antes de enviar a requisição
      if (!data.id) {
        throw new Error("ID do produto não especificado");
      }
      
      if (!data.name || data.name.trim().length < 3) {
        throw new Error("Nome do produto inválido. Deve ter pelo menos 3 caracteres.");
      }
      
      if (!data.description || data.description.trim().length < 10) {
        throw new Error("Descrição inválida. Deve ter pelo menos 10 caracteres.");
      }
      
      if (!data.categoryId) {
        throw new Error("Categoria principal é obrigatória.");
      }
      
      if (!data.price || isNaN(Number(data.price)) || Number(data.price) <= 0) {
        throw new Error("Preço inválido. Deve ser um número positivo.");
      }
      
      const { id, ...productData } = data;
      
      // Enviar solicitação com tratamento de erros melhorado
      try {
        const response = await apiRequest("PATCH", `/api/products/${id}`, productData);
        
        if (!response.ok) {
          // Tentar extrair a mensagem de erro da resposta
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Erro ao atualizar produto (${response.status})`);
        }
        
        return response;
      } catch (error) {
        console.error("Erro na requisição de atualização:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      // Invalidar a consulta de produtos para atualização
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      
      // Atualizar o cache com o produto modificado em tempo real
      try {
        data.text().then(text => {
          try {
            const updatedProduct = JSON.parse(text);
            const currentProducts = queryClient.getQueryData<Product[]>(["/api/products"]) || [];
            
            if (updatedProduct && updatedProduct.id) {
              // Substituir o produto antigo pelo atualizado na lista
              const updatedProducts = currentProducts.map(p => 
                p.id === updatedProduct.id ? updatedProduct : p
              );
              
              queryClient.setQueryData(["/api/products"], updatedProducts);
              console.log("Produto atualizado em tempo real:", updatedProduct);
            }
          } catch (e) {
            console.error("Erro ao processar resposta de atualização:", e);
            // Mesmo em caso de erro, garantir que a query seja invalidada
            queryClient.invalidateQueries({ queryKey: ["/api/products"] });
          }
        }).catch(e => {
          console.error("Erro ao ler resposta de atualização:", e);
          // Garantir que a query seja invalidada mesmo com erro ao ler o texto
          queryClient.invalidateQueries({ queryKey: ["/api/products"] });
        });
      } catch (e) {
        console.error("Erro ao ler resposta de atualização:", e);
        // Garantir que a query seja invalidada em caso de qualquer erro
        queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      }
      
      setIsEditDialogOpen(false);
      setEditingProduct(null);
      toast({
        title: "Produto atualizado",
        description: "O produto foi atualizado com sucesso",
      });
    },
    onError: (error: Error) => {
      console.error("Erro detalhado na atualização do produto:", error);
      toast({
        title: "Erro ao atualizar produto",
        description: error.message || "Ocorreu um erro ao atualizar o produto. Por favor, tente novamente.",
        variant: "destructive",
      });
    },
  });
  
  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      console.log("Iniciando mutação de exclusão do produto ID:", id);
      
      if (!id || isNaN(id) || id <= 0) {
        throw new Error("ID de produto inválido para exclusão");
      }
      
      // Tentativa de exclusão com tratamento de erros aprimorado
      try {
        const response = await apiRequest("DELETE", `/api/products/${id}`);
        
        if (!response.ok) {
          // Tentar extrair a mensagem de erro da resposta
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Erro ao excluir produto (${response.status})`);
        }
        
        return response;
      } catch (error) {
        console.error("Erro na requisição de exclusão:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      // Invalidar a consulta principal imediatamente para garantir dados atualizados
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      
      // Atualizar a interface em tempo real removendo o produto desativado
      try {
        data.text().then(text => {
          try {
            const deletedProduct = JSON.parse(text);
            const currentProducts = queryClient.getQueryData<Product[]>(["/api/products"]) || [];
            
            if (deletedProduct && deletedProduct.id) {
              // Atualizar o produto na lista (mudar status para inativo)
              const updatedProducts = currentProducts.map(p => 
                p.id === deletedProduct.id ? {...p, active: false} : p
              );
              
              // Como é uma operação de desativação, ainda mantemos o produto na lista mas com status "inativo"
              queryClient.setQueryData(["/api/products"], updatedProducts);
              console.log("Produto desativado em tempo real:", deletedProduct);
            }
          } catch (e) {
            console.error("Erro ao processar resposta de exclusão:", e);
            // Em caso de erro ao processar a resposta, garantir atualização dos dados
            queryClient.invalidateQueries({ queryKey: ["/api/products"] });
          }
        }).catch(e => {
          console.error("Falha ao processar texto da resposta:", e);
          // Mesmo em caso de erro, invalidamos a query para forçar nova busca
          queryClient.invalidateQueries({ queryKey: ["/api/products"] });
        });
      } catch (e) {
        console.error("Erro ao ler resposta de exclusão:", e);
        // Garantir invalidação da query mesmo em caso de erro
        queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      }
      
      setIsDeleteDialogOpen(false);
      setDeletingProduct(null);
      toast({
        title: "Produto excluído",
        description: "O produto foi desativado com sucesso e não será mais exibido nas buscas",
        duration: 5000,
      });
    },
    onError: (error: Error) => {
      console.error("Erro detalhado na exclusão do produto:", error);
      toast({
        title: "Erro ao excluir produto",
        description: error.message || "Ocorreu um erro ao excluir o produto. Por favor, tente novamente.",
        variant: "destructive",
        duration: 5000,
      });
      
      // Manter o diálogo aberto em caso de erro para que o usuário possa tentar novamente
      // ou fechar manualmente
    },
  });
  
  // Handler for submitting the add product form
  const onSubmit = (data: ProductFormValues) => {
    console.log("Enviando dados do formulário:", data);
    
    try {
      // Validações adicionais antes de submeter o formulário
      if (!data.name || data.name.trim().length < 3) {
        toast({
          title: "Nome inválido",
          description: "O nome do produto deve ter pelo menos 3 caracteres",
          variant: "destructive",
        });
        return;
      }
      
      if (!data.description || data.description.trim().length < 10) {
        toast({
          title: "Descrição inválida",
          description: "A descrição do produto deve ter pelo menos 10 caracteres",
          variant: "destructive",
        });
        return;
      }
      
      if (!data.categoryId) {
        toast({
          title: "Categoria obrigatória",
          description: "Selecione uma categoria principal para o produto",
          variant: "destructive",
        });
        return;
      }
      
      if (!data.price || isNaN(Number(data.price)) || Number(data.price) <= 0) {
        toast({
          title: "Preço inválido",
          description: "O preço do produto deve ser um número positivo",
          variant: "destructive",
        });
        return;
      }
      
      // Certifique-se de que o supplierId esteja definido
      if (!data.supplierId && user) {
        data.supplierId = user.id;
      }
      
      if (!data.supplierId) {
        toast({
          title: "Erro de autenticação",
          description: "Não foi possível identificar o fornecedor. Tente fazer login novamente.",
          variant: "destructive",
        });
        return;
      }
      
      // Gerar um slug único baseado no nome do produto e timestamp para evitar duplicações
      const timestamp = Date.now().toString().slice(-6);
      const baseSlug = generateSlug(data.name);
      const slug = `${baseSlug}-${timestamp}`;
      
      // Versão completa do produto com todas as propriedades necessárias
      const productData = {
        name: data.name.trim(),
        description: data.description.trim(),
        slug,
        categoryId: data.categoryId,
        additionalCategories: Array.isArray(data.additionalCategories) ? data.additionalCategories : [], 
        supplierId: data.supplierId || user?.id,
        price: data.price ? data.price.toString() : "0",
        imageUrl: data.imageUrl || "https://via.placeholder.com/400x300?text=Produto",
        active: true,
        features: Array.isArray(data.features) ? data.features : [],
        discount: data.discount || null,
        originalPrice: data.originalPrice || null,
        imageData: data.imageData || null,
        imageType: data.imageType || null,
        stockQuantity: 0,
        stockStatus: "in_stock",
        stockAlert: 5,
        rating: "0",
        ratingsCount: 0
      };
      
      console.log("Dados completos para envio:", productData);
      createProductMutation.mutate(productData as ProductFormValues);
    } catch (error) {
      console.error("Erro na validação do formulário:", error);
      toast({
        title: "Erro na validação",
        description: "Ocorreu um erro ao processar os dados do formulário. Verifique todos os campos.",
        variant: "destructive",
      });
    }
  };
  
  // Handler for submitting the edit product form
  const onEditSubmit = (data: ProductFormValues) => {
    if (!editingProduct) return;
    
    console.log("Enviando dados de edição:", data);
    
    try {
      // Validações adicionais antes de submeter o formulário de edição
      if (!data.name || data.name.trim().length < 3) {
        toast({
          title: "Nome inválido",
          description: "O nome do produto deve ter pelo menos 3 caracteres",
          variant: "destructive",
        });
        return;
      }
      
      if (!data.description || data.description.trim().length < 10) {
        toast({
          title: "Descrição inválida",
          description: "A descrição do produto deve ter pelo menos 10 caracteres",
          variant: "destructive",
        });
        return;
      }
      
      if (!data.categoryId) {
        toast({
          title: "Categoria obrigatória",
          description: "Selecione uma categoria principal para o produto",
          variant: "destructive",
        });
        return;
      }
      
      if (!data.price || isNaN(Number(data.price)) || Number(data.price) <= 0) {
        toast({
          title: "Preço inválido",
          description: "O preço do produto deve ser um número positivo",
          variant: "destructive",
        });
        return;
      }
      
      // Certifique-se de que o supplierId esteja definido
      const supplierId = data.supplierId || user?.id;
      if (!supplierId) {
        toast({
          title: "Erro de autenticação",
          description: "Não foi possível identificar o fornecedor. Tente fazer login novamente.",
          variant: "destructive",
        });
        return;
      }
      
      // Extrair features do formulário, que vem como string
      let features: string[] = [];
      if (typeof data.features === 'string' && data.features.trim().length > 0) {
        features = data.features.split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0);
      } else if (Array.isArray(data.features)) {
        features = data.features;
      }
      
      // Versão completa do produto para edição com validações aprimoradas
      const productData = {
        id: editingProduct.id,
        name: data.name.trim(),
        description: data.description.trim(),
        slug: editingProduct.slug,
        categoryId: data.categoryId,
        additionalCategories: Array.isArray(data.additionalCategories) ? data.additionalCategories : [],
        supplierId: supplierId,
        price: data.price ? data.price.toString() : "0",
        imageUrl: data.imageUrl || editingProduct.imageUrl,
        active: true,
        features: features,
        discount: data.discount || null,
        originalPrice: data.originalPrice || null,
        imageData: data.imageData || null,
        imageType: data.imageType || null,
        rating: editingProduct.rating,
        ratingsCount: editingProduct.ratingsCount || 0,
        stockQuantity: editingProduct.stockQuantity || 0,
        stockStatus: editingProduct.stockStatus || "in_stock",
        stockAlert: editingProduct.stockAlert || 5
      };
      
      console.log("Dados completos para edição:", productData);
      updateProductMutation.mutate(productData as ProductFormValues & { id: number });
    } catch (error) {
      console.error("Erro na validação do formulário de edição:", error);
      toast({
        title: "Erro na validação",
        description: "Ocorreu um erro ao processar os dados do formulário. Verifique todos os campos.",
        variant: "destructive",
      });
    }
  };
  
  // Handler for confirming product deletion
  const onDeleteConfirm = () => {
    if (!deletingProduct) return;
    deleteProductMutation.mutate(deletingProduct.id);
  };
  
  // Handler for opening the edit dialog
  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    
    // Convert features array to string for editing
    const featuresString = Array.isArray(product.features) 
      ? product.features.join('\n') 
      : "";
    
    // Garantir que additionalCategories seja um array, mesmo se for null
    const additionalCats = Array.isArray(product.additionalCategories) 
      ? product.additionalCategories 
      : [];
    
    console.log("Carregando categorias adicionais:", additionalCats);
    
    editForm.reset({
      ...product,
      features: featuresString,
      price: product.price.toString(), // Convert to string for form
      categoryId: product.categoryId,
      additionalCategories: additionalCats, // Certifique-se de definir as categorias adicionais
    });
    
    setIsEditDialogOpen(true);
  };
  
  // Handler for opening the delete dialog
  const handleDelete = (product: Product) => {
    setDeletingProduct(product);
    setIsDeleteDialogOpen(true);
  };
  
  // Filter products by search term
  const filteredProducts = products?.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const formatCurrency = (price: string | number) => {
    return Number(price).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow bg-gray-100 py-8">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Gerenciamento de Produtos</h1>
            <p className="text-gray-600">
              Cadastre e gerencie seus produtos disponíveis para venda na plataforma.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="md:col-span-1">
              <SupplierSidebar />
            </div>
            
            {/* Main Content */}
            <div className="md:col-span-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Meus Produtos</CardTitle>
                    <CardDescription>
                      Gerencie todos os seus produtos cadastrados
                    </CardDescription>
                  </div>
                  <Button onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Produto
                  </Button>
                </CardHeader>
                <CardContent>
                  {/* Search Bar */}
                  <div className="mb-6">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <Input
                        type="text"
                        placeholder="Buscar produtos..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  {/* Products List */}
                  {isLoadingProducts ? (
                    <Loading />
                  ) : !products || products.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-4">
                        Você ainda não tem produtos cadastrados.
                      </p>
                      <Button onClick={() => setIsAddDialogOpen(true)}>
                        Adicionar meu primeiro produto
                      </Button>
                    </div>
                  ) : filteredProducts && filteredProducts.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">
                        Nenhum produto corresponde à sua busca.
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Produto
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Preço
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Ações
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredProducts?.map((product) => (
                            <tr key={product.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="h-10 w-10 flex-shrink-0">
                                    <img
                                      className="h-10 w-10 rounded-md object-cover"
                                      src={product.imageUrl || "https://via.placeholder.com/40"}
                                      alt={product.name}
                                    />
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">
                                      {product.name}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {categories?.find(c => c.id === product.categoryId)?.name || 'Categoria'}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {formatCurrency(product.price)}
                                </div>
                                {product.originalPrice && (
                                  <div className="text-sm text-gray-500 line-through">
                                    {formatCurrency(product.originalPrice)}
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  product.active 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {product.active ? 'Ativo' : 'Inativo'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleEdit(product)}
                                  className="text-blue-600 hover:text-blue-900 mr-2"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleDelete(product)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
      
      {/* Add Product Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Produto</DialogTitle>
            <DialogDescription>
              Preencha os dados do produto para cadastrá-lo na plataforma.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Produto</FormLabel>
                    <FormControl>
                      <Input placeholder="Lava-louças de Capô" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria Principal</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(Number(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma categoria principal" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories?.map((category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Esta será a categoria principal do produto
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="additionalCategories"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categorias Adicionais</FormLabel>
                      <div className="flex flex-wrap gap-2 p-2 border rounded-md">
                        {categories?.map((category) => (
                          <div key={category.id} className="flex items-center">
                            <Checkbox
                              id={`cat-${category.id}`}
                              checked={field.value?.includes(category.id)}
                              onCheckedChange={(checked) => {
                                const currentValues = field.value || [];
                                const newValues = checked
                                  ? [...currentValues, category.id]
                                  : currentValues.filter(id => id !== category.id);
                                field.onChange(newValues);
                              }}
                            />
                            <label
                              htmlFor={`cat-${category.id}`}
                              className="ml-2 text-sm font-medium cursor-pointer"
                            >
                              {category.name}
                            </label>
                          </div>
                        ))}
                      </div>
                      <FormDescription>
                        Selecione categorias adicionais onde o produto também deve aparecer
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço (R$)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" min="0" placeholder="1999.99" {...field} />
                      </FormControl>
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
                        placeholder="Descrição detalhada do produto..."
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="features"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Características</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Digite cada característica em uma nova linha..."
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Digite cada característica em uma linha separada.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Imagem do Produto</FormLabel>
                    <FormControl>
                      <div className="flex flex-col gap-2">
                        <Input
                          type="hidden"
                          {...field}
                        />
                        <div className="mt-1">
                          {/* Mostramos o upload apenas depois que o produto for criado com ID */}
                          <div className="mt-1 flex items-center">
                            <span className="text-sm text-gray-500">
                              Preencha os dados do produto para primeiro criar o cadastro, depois você poderá fazer o upload da imagem na tela de edição.
                            </span>
                          </div>
                        </div>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Uma imagem de boa qualidade aumenta a visibilidade do seu produto.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createProductMutation.isPending}>
                  {createProductMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Adicionar Produto
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Produto</DialogTitle>
            <DialogDescription>
              Atualize os dados do produto.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Produto</FormLabel>
                    <FormControl>
                      <Input placeholder="Lava-louças de Capô" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria Principal</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(Number(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma categoria principal" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories?.map((category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Esta será a categoria principal do produto
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="additionalCategories"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categorias Adicionais</FormLabel>
                      <div className="flex flex-wrap gap-2 p-2 border rounded-md">
                        {categories?.map((category) => (
                          <div key={category.id} className="flex items-center">
                            <Checkbox
                              id={`edit-cat-${category.id}`}
                              checked={field.value?.includes(category.id)}
                              onCheckedChange={(checked) => {
                                const currentValues = field.value || [];
                                const newValues = checked
                                  ? [...currentValues, category.id]
                                  : currentValues.filter(id => id !== category.id);
                                field.onChange(newValues);
                              }}
                            />
                            <label
                              htmlFor={`edit-cat-${category.id}`}
                              className="ml-2 text-sm font-medium cursor-pointer"
                            >
                              {category.name}
                            </label>
                          </div>
                        ))}
                      </div>
                      <FormDescription>
                        Selecione categorias adicionais onde o produto também deve aparecer
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço (R$)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" min="0" placeholder="1999.99" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descrição detalhada do produto..."
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="features"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Características</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Digite cada característica em uma nova linha..."
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Digite cada característica em uma linha separada.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Imagem do Produto</FormLabel>
                    <FormControl>
                      <div className="flex flex-col gap-2">
                        <Input
                          type="hidden"
                          {...field}
                        />
                        {editingProduct?.id ? (
                          <div>
                            {editingProduct.imageData ? (
                              <div className="mb-4">
                                <p className="text-sm font-medium mb-2">Imagem atual:</p>
                                <div className="w-32 h-32 relative border rounded overflow-hidden">
                                  <img 
                                    src={`data:${editingProduct.imageType};base64,${editingProduct.imageData}`} 
                                    alt={editingProduct.name} 
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              </div>
                            ) : null}
                            <p className="text-sm mb-2">Fazer upload de nova imagem:</p>
                            <ImageUpload 
                              productId={editingProduct.id} 
                              imageUrl={field.value} 
                              onImageUploaded={(newUrl) => {
                                field.onChange(newUrl);
                                // Forçar atualização da interface após o upload
                                queryClient.invalidateQueries({ queryKey: ["/api/products"] });
                                
                                // Fechar o modal de edição e abrir novamente para mostrar a imagem atualizada
                                setTimeout(() => {
                                  setEditingProduct(undefined);
                                  const currentProduct = products?.find(p => p.id === editingProduct.id);
                                  if (currentProduct) {
                                    setTimeout(() => {
                                      setEditingProduct(currentProduct);
                                    }, 300);
                                  }
                                }, 500);
                              }}
                            />
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">
                            Salve o produto primeiro para adicionar uma imagem.
                          </p>
                        )}
                      </div>
                    </FormControl>
                    <FormDescription>
                      Uma imagem de boa qualidade aumenta a visibilidade do seu produto.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Produto ativo</FormLabel>
                      <FormDescription>
                        Desmarque para ocultar o produto na plataforma.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={updateProductMutation.isPending}>
                  {updateProductMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar Alterações
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O produto será desativado e não será mais visível para os usuários.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={onDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              {deleteProductMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Desativar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
