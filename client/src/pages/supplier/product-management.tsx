import { useState } from "react";
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
const productFormSchema = insertProductSchema.extend({
  features: z.string().optional().transform(val => 
    val ? val.split('\n').filter(line => line.trim().length > 0) : []
  )
}).omit({
  additionalImages: true // Vamos tratar isso separadamente após a criação do produto
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
  const { data: products, isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ["/api/products", { supplierId: user?.id }],
    enabled: !!user?.id,
  });
  
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
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
      const { id, ...productData } = data;
      return apiRequest("PATCH", `/api/products/${id}`, productData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setIsEditDialogOpen(false);
      setEditingProduct(null);
      toast({
        title: "Produto atualizado",
        description: "O produto foi atualizado com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar produto",
        description: "Ocorreu um erro ao atualizar o produto. Por favor, tente novamente.",
        variant: "destructive",
      });
    },
  });
  
  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("PATCH", `/api/products/${id}`, { active: false });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setIsDeleteDialogOpen(false);
      setDeletingProduct(null);
      toast({
        title: "Produto excluído",
        description: "O produto foi excluído com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir produto",
        description: "Ocorreu um erro ao excluir o produto. Por favor, tente novamente.",
        variant: "destructive",
      });
    },
  });
  
  // Handler for submitting the add product form
  const onSubmit = (data: ProductFormValues) => {
    console.log("Enviando dados do formulário:", data);
    
    // Certifique-se de que o supplierId esteja definido
    if (!data.supplierId && user) {
      data.supplierId = user.id;
    }
    
    // Garanta que todos os campos obrigatórios estejam presentes
    const slug = generateSlug(data.name);
    
    // Versão simplificada do produto para evitar erros de validação
    const productData = {
      name: data.name,
      description: data.description,
      slug: slug,
      categoryId: data.categoryId,
      supplierId: data.supplierId || user?.id,
      price: data.price ? data.price.toString() : "0",
      imageUrl: data.imageUrl,
      active: true,
      features: [] // Array vazio em vez de string
    };
    
    console.log("Dados simplificados para envio:", productData);
    createProductMutation.mutate(productData as ProductFormValues);
  };
  
  // Handler for submitting the edit product form
  const onEditSubmit = (data: ProductFormValues) => {
    if (!editingProduct) return;
    
    console.log("Enviando dados de edição:", data);
    
    // Versão simplificada do produto para edição
    const productData = {
      id: editingProduct.id,
      name: data.name,
      description: data.description,
      categoryId: data.categoryId,
      supplierId: data.supplierId || user?.id,
      price: data.price ? data.price.toString() : "0",
      imageUrl: data.imageUrl,
      active: true,
      features: [] // Array vazio em vez de string
    };
    
    console.log("Dados simplificados para edição:", productData);
    updateProductMutation.mutate(productData as ProductFormValues & { id: number });
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
    
    editForm.reset({
      ...product,
      features: featuresString,
      price: product.price.toString(), // Convert to string for form
      categoryId: product.categoryId,
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
                      <FormLabel>Categoria</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(Number(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma categoria" />
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
                      <FormLabel>Categoria</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(Number(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma categoria" />
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
                          <ImageUpload 
                            productId={editingProduct.id} 
                            imageUrl={field.value} 
                            onImageUploaded={(newUrl) => {
                              field.onChange(newUrl);
                              // Recarregar dados do produto para atualizar a imagem
                              queryClient.invalidateQueries({ queryKey: ["/api/products"] });
                            }}
                          />
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
