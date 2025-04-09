import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  CommissionSetting,
  Category,
  User,
  UserRole,
  insertCommissionSettingSchema
} from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loading } from "@/components/ui/loading";
import { BarChart, Users, DollarSign, Tags, Percent, Plus, Edit, Trash2, Loader2 } from "lucide-react";
import {
  Form,
  FormControl,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
          <a className="flex items-center text-primary p-2 rounded-md bg-primary/10 font-medium">
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

// Extended schema for the form with proper validation
const commissionFormSchema = insertCommissionSettingSchema.extend({
  rate: z.string().refine(
    (val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0 && num <= 100;
    },
    {
      message: "A taxa deve ser um número entre 0 e 100",
    }
  ),
});

type CommissionFormValues = z.infer<typeof commissionFormSchema>;

export default function AdminCommissions() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingCommission, setEditingCommission] = useState<CommissionSetting | null>(null);
  const [deletingCommission, setDeletingCommission] = useState<CommissionSetting | null>(null);
  
  // Fetch all commission settings
  const { data: commissionSettings, isLoading: isLoadingCommissions } = useQuery<CommissionSetting[]>({
    queryKey: ["/api/commission-settings"],
  });
  
  // Fetch all categories for the select dropdown
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });
  
  // Fetch all suppliers for the select dropdown
  const { data: suppliers } = useQuery<User[]>({
    queryKey: ["/api/users", { role: UserRole.SUPPLIER }],
  });
  
  // Form for adding new commission settings
  const form = useForm<CommissionFormValues>({
    resolver: zodResolver(commissionFormSchema),
    defaultValues: {
      rate: "5.0",
      active: true,
    },
  });
  
  // Form for editing commission settings
  const editForm = useForm<CommissionFormValues>({
    resolver: zodResolver(commissionFormSchema),
    defaultValues: {
      rate: "5.0",
      active: true,
    },
  });
  
  // Create commission setting mutation
  const createCommissionMutation = useMutation({
    mutationFn: async (data: CommissionFormValues) => {
      return apiRequest("POST", "/api/commission-settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/commission-settings"] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: "Configuração de comissão adicionada",
        description: "A configuração de comissão foi adicionada com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar configuração",
        description: "Ocorreu um erro ao adicionar a configuração de comissão.",
        variant: "destructive",
      });
    },
  });
  
  // Update commission setting mutation
  const updateCommissionMutation = useMutation({
    mutationFn: async (data: CommissionFormValues & { id: number }) => {
      const { id, ...commissionData } = data;
      return apiRequest("PATCH", `/api/commission-settings/${id}`, commissionData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/commission-settings"] });
      setIsEditDialogOpen(false);
      setEditingCommission(null);
      toast({
        title: "Configuração atualizada",
        description: "A configuração de comissão foi atualizada com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar configuração",
        description: "Ocorreu um erro ao atualizar a configuração de comissão.",
        variant: "destructive",
      });
    },
  });
  
  // Delete (deactivate) commission setting mutation
  const deleteCommissionMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("PATCH", `/api/commission-settings/${id}`, { active: false });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/commission-settings"] });
      setIsDeleteDialogOpen(false);
      setDeletingCommission(null);
      toast({
        title: "Configuração desativada",
        description: "A configuração de comissão foi desativada com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao desativar configuração",
        description: "Ocorreu um erro ao desativar a configuração de comissão.",
        variant: "destructive",
      });
    },
  });
  
  // Handler for submitting the add commission form
  const onSubmit = (data: CommissionFormValues) => {
    // Convert categoryId and supplierId to numbers if they're defined
    const formattedData = {
      ...data,
      categoryId: data.categoryId ? Number(data.categoryId) : undefined,
      supplierId: data.supplierId ? Number(data.supplierId) : undefined,
    };
    
    createCommissionMutation.mutate(formattedData);
  };
  
  // Handler for submitting the edit commission form
  const onEditSubmit = (data: CommissionFormValues) => {
    if (!editingCommission) return;
    
    const formattedData = {
      ...data,
      categoryId: data.categoryId ? Number(data.categoryId) : undefined,
      supplierId: data.supplierId ? Number(data.supplierId) : undefined,
      id: editingCommission.id,
    };
    
    updateCommissionMutation.mutate(formattedData);
  };
  
  // Handler for opening the edit dialog
  const handleEdit = (commission: CommissionSetting) => {
    setEditingCommission(commission);
    
    editForm.reset({
      categoryId: commission.categoryId ? commission.categoryId.toString() : undefined,
      supplierId: commission.supplierId ? commission.supplierId.toString() : undefined,
      rate: commission.rate.toString(),
      active: commission.active,
    });
    
    setIsEditDialogOpen(true);
  };
  
  // Handler for confirming commission setting deletion
  const handleDeleteConfirm = () => {
    if (!deletingCommission) return;
    deleteCommissionMutation.mutate(deletingCommission.id);
  };
  
  // Handler for opening the delete dialog
  const handleDelete = (commission: CommissionSetting) => {
    setDeletingCommission(commission);
    setIsDeleteDialogOpen(true);
  };
  
  // Helper to get category name
  const getCategoryName = (categoryId?: number) => {
    if (!categoryId) return "Todas as categorias";
    const category = categories?.find(c => c.id === categoryId);
    return category?.name || `Categoria ${categoryId}`;
  };
  
  // Helper to get supplier name
  const getSupplierName = (supplierId?: number) => {
    if (!supplierId) return "Todos os fornecedores";
    const supplier = suppliers?.find(s => s.id === supplierId);
    return supplier?.companyName || supplier?.name || `Fornecedor ${supplierId}`;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow bg-gray-100 py-8">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Configurações de Comissão</h1>
            <p className="text-gray-600">
              Gerencie as taxas de comissão cobradas dos fornecedores.
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
                    <CardTitle>Taxas de Comissão</CardTitle>
                    <CardDescription>
                      Defina taxas de comissão por categoria ou fornecedor
                    </CardDescription>
                  </div>
                  <Button onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Configuração
                  </Button>
                </CardHeader>
                <CardContent>
                  {isLoadingCommissions ? (
                    <Loading />
                  ) : !commissionSettings || commissionSettings.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-4">
                        Nenhuma configuração de comissão definida.
                      </p>
                      <Button onClick={() => setIsAddDialogOpen(true)}>
                        Adicionar primeira configuração
                      </Button>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Aplicação</TableHead>
                          <TableHead>Taxa (%)</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {commissionSettings.map((commission) => (
                          <TableRow key={commission.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">
                                  {commission.categoryId 
                                    ? `Categoria: ${getCategoryName(commission.categoryId)}`
                                    : commission.supplierId 
                                      ? `Fornecedor: ${getSupplierName(commission.supplierId)}`
                                      : "Global (todos os produtos)"}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {commission.categoryId && commission.supplierId 
                                    ? `Específica para ${getSupplierName(commission.supplierId)}`
                                    : ""}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium text-primary">{Number(commission.rate).toFixed(1)}%</div>
                            </TableCell>
                            <TableCell>
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                commission.active 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {commission.active ? 'Ativo' : 'Inativo'}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleEdit(commission)}
                                className="text-blue-600 hover:text-blue-900 mr-2"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleDelete(commission)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
              
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Visão Geral das Comissões</CardTitle>
                  <CardDescription>
                    Entenda como as taxas de comissão são aplicadas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-blue-800 mb-2">Como as comissões funcionam</h3>
                      <p className="text-sm text-blue-700">
                        As taxas de comissão são aplicadas na seguinte ordem de prioridade:
                      </p>
                      <ol className="list-decimal ml-5 mt-2 text-sm text-blue-700">
                        <li>Configuração específica para um fornecedor em uma categoria</li>
                        <li>Configuração específica para um fornecedor</li>
                        <li>Configuração específica para uma categoria</li>
                        <li>Configuração global (padrão)</li>
                      </ol>
                    </div>
                    
                    <div className="bg-amber-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-amber-800 mb-2">Dica</h3>
                      <p className="text-sm text-amber-700">
                        Para definir uma taxa de comissão padrão para toda a plataforma, crie uma configuração sem especificar
                        categoria ou fornecedor. Esta será a taxa aplicada caso não existam configurações mais específicas.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
      
      {/* Add Commission Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Adicionar Configuração de Comissão</DialogTitle>
            <DialogDescription>
              Defina uma nova configuração de taxa de comissão para categorias ou fornecedores específicos.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria (opcional)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Todas as categorias" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Todas as categorias</SelectItem>
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
                name="supplierId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fornecedor (opcional)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Todos os fornecedores" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Todos os fornecedores</SelectItem>
                        {suppliers?.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id.toString()}>
                            {supplier.companyName || supplier.name}
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
                name="rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Taxa de Comissão (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" min="0" max="100" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
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
                      <FormLabel>Ativa</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createCommissionMutation.isPending}>
                  {createCommissionMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Adicionar
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Commission Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Configuração de Comissão</DialogTitle>
            <DialogDescription>
              Atualize esta configuração de taxa de comissão.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6">
              <FormField
                control={editForm.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria (opcional)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Todas as categorias" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Todas as categorias</SelectItem>
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
                name="supplierId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fornecedor (opcional)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Todos os fornecedores" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Todos os fornecedores</SelectItem>
                        {suppliers?.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id.toString()}>
                            {supplier.companyName || supplier.name}
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
                name="rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Taxa de Comissão (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" min="0" max="100" {...field} />
                    </FormControl>
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
                      <FormLabel>Ativa</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={updateCommissionMutation.isPending}>
                  {updateCommissionMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
            <AlertDialogTitle>Desativar configuração de comissão?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação desativará esta configuração de comissão. Você pode reativá-la posteriormente se necessário.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteCommissionMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Desativar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
