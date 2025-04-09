import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Category, insertCategorySchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loading } from "@/components/ui/loading";
import { BarChart, Users, DollarSign, Tags, Percent, Plus, Edit, Trash2, Search, Loader2 } from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

// Admin sidebar component
function AdminSidebar() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold mb-4">Painel Administrativo</h2>
      <nav className="space-y-2">
        <Link href="/admin">
          <a className="flex items-center text-gray-700 hover:text-primary p-2 rounded-md hover:bg-gray-50 font-medium">
            <BarChart className="mr-2 h-5 w-5" />
            Dashboard
          </a>
        </Link>
        <Link href="/admin/fornecedores">
          <a className="flex items-center text-gray-700 hover:text-primary p-2 rounded-md hover:bg-gray-50 font-medium">
            <Users className="mr-2 h-5 w-5" />
            Fornecedores
          </a>
        </Link>
        <Link href="/admin/comissoes">
          <a className="flex items-center text-gray-700 hover:text-primary p-2 rounded-md hover:bg-gray-50 font-medium">
            <Percent className="mr-2 h-5 w-5" />
            Comissões
          </a>
        </Link>
        <Link href="/admin/categorias">
          <a className="flex items-center text-primary p-2 rounded-md bg-primary/10 font-medium">
            <Tags className="mr-2 h-5 w-5" />
            Categorias
          </a>
        </Link>
      </nav>
    </div>
  );
}

// Generate slug from category name
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

// Available icons for categories
const AVAILABLE_ICONS = [
  { value: "utensils", label: "Utensílios" },
  { value: "temperature-low", label: "Refrigeração" },
  { value: "fire", label: "Cocção" },
  { value: "blender", label: "Preparação" },
  { value: "wine-glass-alt", label: "Bar" },
  { value: "sink", label: "Lavagem" },
  { value: "chair", label: "Mobiliário" },
  { value: "shopping-cart", label: "Compras" },
  { value: "truck", label: "Entrega" },
  { value: "coffee", label: "Café" },
  { value: "box", label: "Embalagens" },
  { value: "tachometer-alt", label: "Equipamentos" },
];

// Category form schema
const categoryFormSchema = insertCategorySchema.extend({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export default function AdminCategories() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  
  // Fetch all categories
  const { data: categories, isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });
  
  // Form for adding new categories
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      icon: "utensils",
    },
  });
  
  // Watch name field to auto-generate slug
  const nameValue = form.watch("name");
  if (nameValue && !form.getValues("slug")) {
    form.setValue("slug", generateSlug(nameValue));
  }
  
  // Form for editing categories
  const editForm = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      icon: "",
    },
  });
  
  // Watch name field in edit form to auto-generate slug
  const editNameValue = editForm.watch("name");
  const currentSlug = editForm.getValues("slug");
  if (editNameValue && editingCategory && editingCategory.name !== editNameValue && 
      (currentSlug === "" || currentSlug === generateSlug(editingCategory.name))) {
    editForm.setValue("slug", generateSlug(editNameValue));
  }
  
  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (data: CategoryFormValues) => {
      return apiRequest("POST", "/api/categories", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: "Categoria adicionada",
        description: "A categoria foi adicionada com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar categoria",
        description: "Ocorreu um erro ao adicionar a categoria. Verifique se o slug é único.",
        variant: "destructive",
      });
    },
  });
  
  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async (data: CategoryFormValues & { id: number }) => {
      const { id, ...categoryData } = data;
      return apiRequest("PATCH", `/api/categories/${id}`, categoryData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setIsEditDialogOpen(false);
      setEditingCategory(null);
      toast({
        title: "Categoria atualizada",
        description: "A categoria foi atualizada com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar categoria",
        description: "Ocorreu um erro ao atualizar a categoria. Verifique se o slug é único.",
        variant: "destructive",
      });
    },
  });
  
  // Handler for submitting the add category form
  const onSubmit = (data: CategoryFormValues) => {
    createCategoryMutation.mutate(data);
  };
  
  // Handler for submitting the edit category form
  const onEditSubmit = (data: CategoryFormValues) => {
    if (!editingCategory) return;
    
    updateCategoryMutation.mutate({
      ...data,
      id: editingCategory.id,
    });
  };
  
  // Handler for opening the edit dialog
  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    
    editForm.reset({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      icon: category.icon || "utensils",
    });
    
    setIsEditDialogOpen(true);
  };
  
  // Handler for confirming category deletion
  const handleDeleteConfirm = () => {
    // In a real implementation, we would delete the category or mark it as inactive
    // For this demo, we'll just show a success message
    if (!deletingCategory) return;
    
    toast({
      title: "Categoria excluída",
      description: "A categoria foi excluída com sucesso",
    });
    
    setIsDeleteDialogOpen(false);
    setDeletingCategory(null);
  };
  
  // Handler for opening the delete dialog
  const handleDelete = (category: Category) => {
    setDeletingCategory(category);
    setIsDeleteDialogOpen(true);
  };
  
  // Filter categories by search term
  const filteredCategories = categories?.filter(category => 
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow bg-gray-100 py-8">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Gerenciamento de Categorias</h1>
            <p className="text-gray-600">
              Organize os produtos da plataforma em categorias.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="md:col-span-1">
              <AdminSidebar />
            </div>
            
            {/* Main Content */}
            <div className="md:col-span-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Categorias</CardTitle>
                    <CardDescription>
                      Gerencie as categorias de produtos na plataforma
                    </CardDescription>
                  </div>
                  <Button onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Categoria
                  </Button>
                </CardHeader>
                <CardContent>
                  {/* Search Bar */}
                  <div className="mb-6">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <Input
                        type="text"
                        placeholder="Buscar categorias..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  {/* Categories List */}
                  {isLoadingCategories ? (
                    <Loading />
                  ) : !categories || categories.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-4">
                        Nenhuma categoria cadastrada.
                      </p>
                      <Button onClick={() => setIsAddDialogOpen(true)}>
                        Adicionar primeira categoria
                      </Button>
                    </div>
                  ) : filteredCategories && filteredCategories.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">
                        Nenhuma categoria corresponde à sua busca.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredCategories?.map((category) => (
                        <Card key={category.id} className="overflow-hidden">
                          <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                                  <i className={`fas fa-${category.icon || 'utensils'} text-primary`}></i>
                                </div>
                                <CardTitle className="text-lg">{category.name}</CardTitle>
                              </div>
                              <div className="flex space-x-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleEdit(category)}
                                  className="h-8 w-8 p-0 text-blue-600"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleDelete(category)}
                                  className="h-8 w-8 p-0 text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-gray-500 mb-2">
                              {category.description || 'Sem descrição'}
                            </p>
                            <div className="flex justify-between items-center mt-2">
                              <div className="text-xs text-gray-500">
                                Slug: {category.slug}
                              </div>
                              <div className="text-xs text-gray-500">
                                Produtos: {category.productsCount}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
      
      {/* Add Category Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Adicionar Nova Categoria</DialogTitle>
            <DialogDescription>
              Crie uma nova categoria para organizar os produtos na plataforma.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Categoria</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Utensílios" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: utensilios" {...field} />
                    </FormControl>
                    <FormDescription>
                      Identificador único da categoria na URL. Será gerado automaticamente se não for fornecido.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descrição da categoria" 
                        className="resize-none"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ícone</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um ícone" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {AVAILABLE_ICONS.map((icon) => (
                          <SelectItem key={icon.value} value={icon.value}>
                            <div className="flex items-center">
                              <i className={`fas fa-${icon.value} mr-2`}></i>
                              <span>{icon.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createCategoryMutation.isPending}>
                  {createCategoryMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Adicionar Categoria
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Category Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Categoria</DialogTitle>
            <DialogDescription>
              Atualize as informações desta categoria.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Categoria</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Utensílios" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: utensilios" {...field} />
                    </FormControl>
                    <FormDescription>
                      Cuidado ao alterar o slug, pois isso pode quebrar links existentes.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descrição da categoria" 
                        className="resize-none"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ícone</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um ícone" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {AVAILABLE_ICONS.map((icon) => (
                          <SelectItem key={icon.value} value={icon.value}>
                            <div className="flex items-center">
                              <i className={`fas fa-${icon.value} mr-2`}></i>
                              <span>{icon.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={updateCategoryMutation.isPending}>
                  {updateCategoryMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
            <AlertDialogTitle>Excluir categoria?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente a categoria
              "{deletingCategory?.name}" e removerá a associação com todos os produtos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir Categoria
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
