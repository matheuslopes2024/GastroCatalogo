import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/hooks/use-auth";
import { User, UserRole, Product, InsertUser } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loading } from "@/components/ui/loading";
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
  BarChart, 
  Users, 
  DollarSign, 
  Tags, 
  Percent, 
  Search, 
  Check, 
  X, 
  Eye, 
  AlertCircle, 
  Loader2,
  PlusCircle,
  Edit
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

// Admin sidebar with links to other admin pages
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
          <a className="flex items-center text-primary p-2 rounded-md bg-primary/10 font-medium">
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
          <a className="flex items-center text-gray-700 hover:text-primary p-2 rounded-md hover:bg-gray-50 font-medium">
            <Tags className="mr-2 h-5 w-5" />
            Categorias
          </a>
        </Link>
      </nav>
    </div>
  );
}

// Esquema de validação para o formulário de fornecedor
const supplierFormSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  username: z.string().min(3, "Nome de usuário deve ter pelo menos 3 caracteres"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  companyName: z.string().min(3, "Nome da empresa deve ter pelo menos 3 caracteres"),
  cnpj: z.string().min(14, "CNPJ inválido").max(18, "CNPJ inválido").optional().or(z.literal("")),
  phone: z.string().min(10, "Telefone inválido").max(15, "Telefone inválido").optional().or(z.literal("")),
  role: z.literal(UserRole.SUPPLIER),
  active: z.boolean().default(true),
});

export default function AdminSuppliers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [viewingSupplier, setViewingSupplier] = useState<User | null>(null);
  const [isSupplierDetailOpen, setIsSupplierDetailOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isNewSupplierOpen, setIsNewSupplierOpen] = useState(false);
  const [isEditSupplierOpen, setIsEditSupplierOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<User | null>(null);
  const [deletingSupplier, setDeletingSupplier] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  
  // Fetch all suppliers
  const { data: suppliers, isLoading: isLoadingSuppliers } = useQuery<User[]>({
    queryKey: ["/api/users", { role: UserRole.SUPPLIER }],
  });
  
  // Fetch products for the supplier detail view
  const { data: supplierProducts, isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ["/api/products", { supplierId: viewingSupplier?.id }],
    enabled: !!viewingSupplier,
  });
  
  // Update user mutation (used for activate/deactivate)
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<User> }) => {
      return apiRequest("PATCH", `/api/users/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Fornecedor atualizado",
        description: "As informações do fornecedor foram atualizadas com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar fornecedor",
        description: "Ocorreu um erro ao atualizar o fornecedor.",
        variant: "destructive",
      });
    },
  });
  
  // Handler for activating/deactivating a supplier
  const handleToggleActive = (supplier: User) => {
    updateUserMutation.mutate({
      id: supplier.id,
      data: { active: !supplier.active },
    });
  };
  
  // Handler for viewing supplier details
  const handleViewSupplier = (supplier: User) => {
    setViewingSupplier(supplier);
    setIsSupplierDetailOpen(true);
  };
  
  // Handler for confirming supplier deletion
  const handleDeleteConfirm = () => {
    if (!deletingSupplier) return;
    
    updateUserMutation.mutate({
      id: deletingSupplier.id,
      data: { active: false },
    });
    
    setIsConfirmDeleteOpen(false);
    setDeletingSupplier(null);
  };
  
  // Handler for confirming supplier deletion
  const handleDeleteClick = (supplier: User) => {
    setDeletingSupplier(supplier);
    setIsConfirmDeleteOpen(true);
  };
  
  // Filter suppliers based on search term and active tab
  const filteredSuppliers = suppliers
    ?.filter(supplier => 
      (supplier.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.email?.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (activeTab === "all" || 
       (activeTab === "active" && supplier.active) || 
       (activeTab === "inactive" && !supplier.active))
    ) || [];
  
  // Mutation para criar novos fornecedores
  const createSupplierMutation = useMutation({
    mutationFn: async (data: z.infer<typeof supplierFormSchema>) => {
      return apiRequest("POST", "/api/register", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsNewSupplierOpen(false);
      toast({
        title: "Fornecedor criado",
        description: "O fornecedor foi criado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar fornecedor",
        description: "Ocorreu um erro ao criar o fornecedor. Verifique se o email ou nome de usuário já estão em uso.",
        variant: "destructive",
      });
    },
  });
  
  // Form para novo fornecedor
  const supplierForm = useForm<z.infer<typeof supplierFormSchema>>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      name: "",
      email: "",
      username: "",
      password: "",
      companyName: "",
      cnpj: "",
      phone: "",
      role: UserRole.SUPPLIER,
      active: true,
    },
  });
  
  // Handler para submissão do formulário de novo fornecedor
  const onSubmitNewSupplier = (values: z.infer<typeof supplierFormSchema>) => {
    createSupplierMutation.mutate(values);
  };
  
  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow bg-gray-100 py-8">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Gerenciamento de Fornecedores</h1>
            <p className="text-gray-600">
              Gerencie os fornecedores cadastrados na plataforma.
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
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <CardTitle>Fornecedores</CardTitle>
                      <CardDescription>
                        Gerenciar fornecedores cadastrados na plataforma
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <Input
                          type="text"
                          placeholder="Buscar fornecedores..."
                          className="pl-10 w-full"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                      <Button 
                        onClick={() => setIsNewSupplierOpen(true)}
                        className="whitespace-nowrap"
                      >
                        Novo Fornecedor
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-6">
                    <TabsList>
                      <TabsTrigger value="all">Todos</TabsTrigger>
                      <TabsTrigger value="active">Ativos</TabsTrigger>
                      <TabsTrigger value="inactive">Inativos</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  
                  {isLoadingSuppliers ? (
                    <Loading />
                  ) : !suppliers || suppliers.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-4">
                        Nenhum fornecedor cadastrado.
                      </p>
                    </div>
                  ) : filteredSuppliers.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">
                        Nenhum fornecedor corresponde à sua busca.
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Fornecedor
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Contato
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
                          {filteredSuppliers.map((supplier) => (
                            <tr key={supplier.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                                    {supplier.companyName?.charAt(0) || supplier.name?.charAt(0) || 'F'}
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">
                                      {supplier.companyName || supplier.name}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {supplier.cnpj || 'Sem CNPJ'}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{supplier.email}</div>
                                <div className="text-sm text-gray-500">{supplier.phone || 'Sem telefone'}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  supplier.active 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {supplier.active ? 'Ativo' : 'Inativo'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleViewSupplier(supplier)}
                                  className="text-blue-600 hover:text-blue-900 mr-2"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleToggleActive(supplier)}
                                  className={`${
                                    supplier.active 
                                      ? 'text-red-600 hover:text-red-900' 
                                      : 'text-green-600 hover:text-green-900'
                                  } mr-2`}
                                >
                                  {supplier.active ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleDeleteClick(supplier)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  <AlertCircle className="h-4 w-4" />
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
      
      {/* Supplier Detail Dialog */}
      <Dialog open={isSupplierDetailOpen} onOpenChange={setIsSupplierDetailOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Fornecedor</DialogTitle>
            <DialogDescription>
              Informações detalhadas sobre o fornecedor.
            </DialogDescription>
          </DialogHeader>
          
          {viewingSupplier && (
            <div className="space-y-6">
              {/* Supplier Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Empresa</h3>
                  <p className="mt-1 text-sm text-gray-900">{viewingSupplier.companyName || 'Não informado'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">CNPJ</h3>
                  <p className="mt-1 text-sm text-gray-900">{viewingSupplier.cnpj || 'Não informado'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Nome do Responsável</h3>
                  <p className="mt-1 text-sm text-gray-900">{viewingSupplier.name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Email</h3>
                  <p className="mt-1 text-sm text-gray-900">{viewingSupplier.email}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Telefone</h3>
                  <p className="mt-1 text-sm text-gray-900">{viewingSupplier.phone || 'Não informado'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Data de Cadastro</h3>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(viewingSupplier.createdAt)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Status</h3>
                  <p className="mt-1">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      viewingSupplier.active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {viewingSupplier.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </p>
                </div>
              </div>
              
              {/* Supplier Products */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Produtos do Fornecedor</h3>
                
                {isLoadingProducts ? (
                  <Loading />
                ) : !supplierProducts || supplierProducts.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    Este fornecedor ainda não possui produtos cadastrados.
                  </p>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {supplierProducts.map((product) => (
                      <div key={product.id} className="flex items-center p-2 border rounded-md">
                        <div className="h-10 w-10 bg-gray-200 rounded-md overflow-hidden mr-3">
                          <img 
                            src={product.imageUrl || "https://via.placeholder.com/40"} 
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{product.name}</p>
                          <p className="text-xs text-gray-500">
                            {Number(product.price).toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })}
                          </p>
                        </div>
                        <div>
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            product.active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {product.active ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => setIsSupplierDetailOpen(false)}
                >
                  Fechar
                </Button>
                <Button 
                  variant={viewingSupplier.active ? "destructive" : "default"}
                  onClick={() => {
                    handleToggleActive(viewingSupplier);
                    setIsSupplierDetailOpen(false);
                  }}
                >
                  {viewingSupplier.active ? 'Desativar Fornecedor' : 'Ativar Fornecedor'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar fornecedor?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação desativará o fornecedor e seus produtos não serão mais exibidos na plataforma.
              Esta ação pode ser revertida posteriormente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              {updateUserMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Desativar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* New Supplier Form Dialog */}
      <Dialog open={isNewSupplierOpen} onOpenChange={(open) => {
        setIsNewSupplierOpen(open);
        if (!open) {
          supplierForm.reset();
        }
      }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Novo Fornecedor</DialogTitle>
            <DialogDescription>
              Preencha o formulário abaixo para adicionar um novo fornecedor.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...supplierForm}>
            <form onSubmit={supplierForm.handleSubmit(onSubmitNewSupplier)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={supplierForm.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Empresa</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome da empresa" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={supplierForm.control}
                  name="cnpj"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CNPJ</FormLabel>
                      <FormControl>
                        <Input placeholder="CNPJ da empresa" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={supplierForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Responsável</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={supplierForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="Email para contato" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={supplierForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input placeholder="Telefone para contato" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={supplierForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome de Usuário</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome de usuário para login" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={supplierForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Senha para login" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  type="button"
                  onClick={() => setIsNewSupplierOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={createSupplierMutation.isPending}
                >
                  {createSupplierMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Adicionar Fornecedor
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
