import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { queryClient } from "@/lib/queryClient";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectLabel, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Calculator,
  CalendarDays,
  ChevronDown,
  HelpCircle,
  Info,
  Percent,
  Search,
  ShoppingBag,
  DollarSign,
  BarChart4,
  PieChart,
  TrendingUp,
  Filter,
  RefreshCcw,
  Edit,
  Save,
  X,
  Plus,
  AlertTriangle,
  CheckCircle2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import SupplierSidebar from "@/components/supplier/supplier-sidebar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

// Tipos relacionados às comissões
interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  productsCount: number;
}

interface Product {
  id: number;
  name: string;
  description: string;
  categoryId: number;
  price: string;
  imageUrl: string;
  active: boolean;
  createdAt: string;
}

interface CommissionSetting {
  id: number;
  categoryId: number | null;
  supplierId: number | null;
  rate: string;
  active: boolean;
  createdAt: string;
}

interface ProductCommission {
  product: Product;
  category?: Category;
  commission: {
    rate: string;
    type: "category" | "supplier" | "specific" | "global";
    settingId: number;
  };
}

// Componente de Loading
function Loading() {
  return (
    <div className="flex items-center justify-center py-6">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}

// Componente para visualizar detalhes de uma comissão
function CommissionRateIndicator({ rate }: { rate: string }) {
  const rateValue = parseFloat(rate);
  const getColor = () => {
    if (rateValue <= 2) return "text-green-600";
    if (rateValue <= 4) return "text-blue-600";
    if (rateValue <= 6) return "text-amber-600";
    return "text-red-600";
  };

  return (
    <div className="flex items-center space-x-2">
      <span className={`font-bold text-lg ${getColor()}`}>{rateValue.toFixed(1)}%</span>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Info className="h-4 w-4 text-gray-400" />
          </TooltipTrigger>
          <TooltipContent className="max-w-sm">
            <p>Taxa de comissão aplicada sobre o valor de venda do produto.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

// Componente para visualizar o tipo de comissão
function CommissionTypeIndicator({ type }: { type: "category" | "supplier" | "specific" | "global" }) {
  const getTypeInfo = () => {
    switch (type) {
      case "category":
        return { label: "Categoria", color: "bg-amber-100 text-amber-800" };
      case "supplier":
        return { label: "Fornecedor", color: "bg-blue-100 text-blue-800" };
      case "specific":
        return { label: "Específica", color: "bg-emerald-100 text-emerald-800" };
      case "global":
        return { label: "Global", color: "bg-gray-100 text-gray-800" };
    }
  };

  const typeInfo = getTypeInfo();

  return (
    <Badge className={typeInfo.color + " font-semibold"}>
      {typeInfo.label}
    </Badge>
  );
}

// Esquema para validação do formulário de comissão específica por produto
const productCommissionFormSchema = z.object({
  productId: z.number({
    required_error: "Produto é obrigatório",
  }).min(1, "Selecione um produto válido"),
  rate: z.string()
    .min(1, "Taxa é obrigatória")
    .regex(/^\d+(\.\d{1,2})?$/, "Formato inválido, use apenas números (ex: 2.5)")
    .refine((val) => {
      const numVal = parseFloat(val);
      return numVal >= 0.1 && numVal <= 15;
    }, {
      message: "A taxa deve estar entre 0.1% e 15%"
    }),
  active: z.boolean().default(true),
  remarks: z.string().max(255, "Observações devem ter no máximo 255 caracteres").optional(),
  validUntil: z.string().optional(),
});

type ProductCommissionFormValues = z.infer<typeof productCommissionFormSchema>;

// Interface para comissão específica por produto
interface ProductCommissionSetting {
  id: number;
  productId: number;
  supplierId: number;
  rate: string;
  active: boolean;
  createdAt: string;
}

// Componente principal para a página de comissões do fornecedor
export default function SupplierCommissions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("produtos");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<string>("rate_desc");
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingCommission, setEditingCommission] = useState<ProductCommissionSetting | null>(null);
  
  // Buscar as comissões específicas por produto
  const { data: productCommissions, isLoading: isLoadingProductCommissions } = useQuery({
    queryKey: ["/api/supplier/products/commissions/specific"],
    queryFn: async () => {
      const res = await fetch("/api/supplier/products/commissions/specific");
      if (!res.ok) {
        throw new Error("Erro ao carregar comissões específicas por produto");
      }
      return res.json();
    },
  });
  
  // Mutation para criar/atualizar comissão específica de produto
  const updateProductCommissionMutation = useMutation({
    mutationFn: async (data: ProductCommissionFormValues) => {
      const url = editingCommission 
        ? `/api/supplier/products/commissions/${editingCommission.id}` 
        : "/api/supplier/products/commissions";
      
      const method = editingCommission ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Erro ao salvar comissão específica");
      }
      
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: editingCommission ? "Comissão atualizada" : "Comissão criada",
        description: editingCommission 
          ? "A comissão específica foi atualizada com sucesso." 
          : "Nova comissão específica criada com sucesso.",
        variant: "default",
      });
      
      // Resetar o estado e fechar o diálogo
      setIsDialogOpen(false);
      setSelectedProduct(null);
      setEditingCommission(null);
      
      // Invalidar as queries para recarregar os dados
      queryClient.invalidateQueries({ queryKey: ["/api/supplier/products/commissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/supplier/products/commissions/specific"] });
      queryClient.invalidateQueries({ queryKey: ["/api/supplier/commissions/summary"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Mutation para excluir comissão específica de produto
  const deleteProductCommissionMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/supplier/products/commissions/${id}`, {
        method: "DELETE"
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Erro ao excluir comissão específica");
      }
      
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Comissão excluída",
        description: "A comissão específica foi removida com sucesso.",
        variant: "default",
      });
      
      // Invalidar as queries para recarregar os dados
      queryClient.invalidateQueries({ queryKey: ["/api/supplier/products/commissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/supplier/products/commissions/specific"] });
      queryClient.invalidateQueries({ queryKey: ["/api/supplier/commissions/summary"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Buscar as configurações de comissão aplicáveis a este fornecedor
  const { data: commissionSettings, isLoading: isLoadingCommissions } = useQuery({
    queryKey: ["/api/supplier/commissions"],
    queryFn: async () => {
      const res = await fetch("/api/supplier/commissions");
      if (!res.ok) {
        throw new Error("Erro ao carregar configurações de comissão");
      }
      return res.json();
    },
  });

  // Buscar produtos do fornecedor com suas respectivas comissões
  const { data: productsWithCommissions, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["/api/supplier/products/commissions"],
    queryFn: async () => {
      const res = await fetch("/api/supplier/products/commissions");
      if (!res.ok) {
        throw new Error("Erro ao carregar produtos com comissões");
      }
      return res.json();
    },
  });

  // Buscar categorias
  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) {
        throw new Error("Erro ao carregar categorias");
      }
      return res.json();
    },
  });

  // Buscar resumo de comissões (estatísticas gerais)
  const { data: commissionSummary, isLoading: isLoadingSummary } = useQuery({
    queryKey: ["/api/supplier/commissions/summary"],
    queryFn: async () => {
      const res = await fetch("/api/supplier/commissions/summary");
      if (!res.ok) {
        throw new Error("Erro ao carregar resumo de comissões");
      }
      return res.json();
    },
  });

  // Filtrar produtos baseado na busca e categoria
  const filteredProducts = productsWithCommissions ? productsWithCommissions.filter((item: ProductCommission) => {
    const matchesSearch = searchTerm === "" || 
      item.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || item.product.categoryId.toString() === categoryFilter;
    
    return matchesSearch && matchesCategory;
  }) : [];

  // Ordenar produtos baseado na seleção
  const sortedProducts = filteredProducts ? [...filteredProducts].sort((a: ProductCommission, b: ProductCommission) => {
    switch (sortOrder) {
      case "rate_asc":
        return parseFloat(a.commission.rate) - parseFloat(b.commission.rate);
      case "rate_desc":
        return parseFloat(b.commission.rate) - parseFloat(a.commission.rate);
      case "name_asc":
        return a.product.name.localeCompare(b.product.name);
      case "name_desc":
        return b.product.name.localeCompare(a.product.name);
      case "price_asc":
        return parseFloat(a.product.price) - parseFloat(b.product.price);
      case "price_desc":
        return parseFloat(b.product.price) - parseFloat(a.product.price);
      default:
        return 0;
    }
  }) : [];

  // Renderizar o sumário de comissões
  const renderCommissionSummary = () => {
    if (isLoadingSummary) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-4 w-1/3 mb-2" />
                <Skeleton className="h-8 w-1/2 mb-1" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (!commissionSummary) return null;

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Taxa Média</p>
                <h3 className="text-2xl font-bold flex items-center">
                  {commissionSummary.avgRate}%
                </h3>
                <p className="text-xs text-gray-600 mt-1">
                  {commissionSummary.specificRatesCount} taxas específicas aplicadas
                </p>
              </div>
              <Percent className="h-10 w-10 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total de Comissões</p>
                <h3 className="text-2xl font-bold flex items-center">
                  {formatCurrency(commissionSummary.totalCommission)}
                </h3>
                <p className="text-xs text-gray-600 mt-1">
                  Nos últimos 30 dias
                </p>
              </div>
              <DollarSign className="h-10 w-10 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Produtos</p>
                <h3 className="text-2xl font-bold flex items-center">
                  {commissionSummary.totalProducts}
                </h3>
                <p className="text-xs text-gray-600 mt-1">
                  Em {commissionSummary.categoriesCount} categorias
                </p>
              </div>
              <ShoppingBag className="h-10 w-10 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Taxa Mais Aplicada</p>
                <h3 className="text-2xl font-bold flex items-center">
                  {commissionSummary.mostCommonRate}%
                </h3>
                <p className="text-xs text-gray-600 mt-1">
                  Em {commissionSummary.mostCommonRateCount} produtos
                </p>
              </div>
              <Calculator className="h-10 w-10 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Função para obter o nome da categoria
  const getCategoryName = (categoryId: number) => {
    if (!categories) return "Carregando...";
    const category = categories.find((cat: Category) => cat.id === categoryId);
    return category ? category.name : "Categoria Desconhecida";
  };

  // Função para renderizar a tabela de produtos com comissões
  const renderProductsTable = () => {
    if (isLoadingProducts) {
      return <Loading />;
    }

    if (!productsWithCommissions || productsWithCommissions.length === 0) {
      return (
        <div className="text-center py-10">
          <ShoppingBag className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-700">Nenhum produto encontrado</h3>
          <p className="text-gray-500 max-w-md mx-auto mt-2">
            Não encontramos produtos para exibir. Tente ajustar seus filtros ou adicione novos produtos ao seu catálogo.
          </p>
        </div>
      );
    }

    return (
      <div>
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Taxa de Comissão</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Valor Líquido</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedProducts.map((item: ProductCommission) => {
                const commissionValue = (parseFloat(item.product.price) * parseFloat(item.commission.rate)) / 100;
                const netValue = parseFloat(item.product.price) - commissionValue;
                
                return (
                  <TableRow key={item.product.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                          <img 
                            src={item.product.imageUrl} 
                            alt={item.product.name} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://via.placeholder.com/40?text=Produto";
                            }}
                          />
                        </div>
                        <div>
                          <p className="font-medium">{item.product.name}</p>
                          {!item.product.active && (
                            <Badge variant="outline" className="text-red-500 border-red-200 bg-red-50 text-xs">
                              Inativo
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getCategoryName(item.product.categoryId)}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(item.product.price)}
                    </TableCell>
                    <TableCell>
                      <CommissionRateIndicator rate={item.commission.rate} />
                    </TableCell>
                    <TableCell>
                      <CommissionTypeIndicator type={item.commission.type} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div>
                        <p className="font-medium">{formatCurrency(netValue.toString())}</p>
                        <p className="text-xs text-gray-500">
                          Após {formatCurrency(commissionValue.toString())} de comissão
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <p className="text-sm text-gray-500 mt-3">
          Exibindo {sortedProducts.length} de {productsWithCommissions.length} produtos
        </p>
      </div>
    );
  };

  // Função para renderizar as taxas de comissão aplicáveis
  const renderCommissionRates = () => {
    if (isLoadingCommissions) {
      return <Loading />;
    }

    if (!commissionSettings || commissionSettings.length === 0) {
      return (
        <div className="text-center py-10">
          <Percent className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-700">Nenhuma configuração de comissão</h3>
          <p className="text-gray-500 max-w-md mx-auto mt-2">
            Não encontramos configurações de comissão específicas para o seu perfil. 
            A taxa padrão da plataforma será aplicada às suas vendas.
          </p>
        </div>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>Taxas de Comissão Aplicáveis</CardTitle>
          <CardDescription>
            Estas são as configurações de comissão que afetam os seus produtos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Aplicação</TableHead>
                <TableHead>Taxa</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prioridade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {commissionSettings.map((setting: CommissionSetting & { priority: number, type: string }) => (
                <TableRow key={setting.id}>
                  <TableCell>
                    <Badge 
                      className={
                        setting.type === 'global' ? 'bg-gray-100 text-gray-800' :
                        setting.type === 'category' ? 'bg-amber-100 text-amber-800' :
                        setting.type === 'supplier' ? 'bg-blue-100 text-blue-800' :
                        'bg-emerald-100 text-emerald-800'
                      }
                    >
                      {setting.type === 'global' ? 'Global' :
                       setting.type === 'category' ? 'Categoria' :
                       setting.type === 'supplier' ? 'Fornecedor' :
                       'Específica'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      {setting.type === 'category' && (
                        <p>
                          Categoria: {getCategoryName(setting.categoryId!)}
                        </p>
                      )}
                      {setting.type === 'supplier' && (
                        <p>
                          Fornecedor: {user?.companyName || user?.name}
                        </p>
                      )}
                      {setting.type === 'specific' && (
                        <p>
                          {getCategoryName(setting.categoryId!)} / {user?.companyName || user?.name}
                        </p>
                      )}
                      {setting.type === 'global' && (
                        <p>Todos os produtos</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-primary">{Number(setting.rate).toFixed(1)}%</div>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      setting.active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {setting.active ? 'Ativa' : 'Inativa'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
                        {setting.priority}
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-4 w-4 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-sm max-w-xs">
                              Prioridade na aplicação da taxa: <br />
                              1. Específica (categoria + fornecedor) <br />
                              2. Fornecedor <br />
                              3. Categoria <br />
                              4. Global (padrão)
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-6">
          <div>
            <p className="text-sm text-gray-500">
              Dúvidas sobre comissões? Entre em contato com nosso suporte ou acesse nossa 
              <a href="/faq/comissoes" className="text-primary ml-1 hover:underline">
                Central de Ajuda
              </a>
            </p>
          </div>
        </CardFooter>
      </Card>
    );
  };

  // Renderização principal
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow bg-gray-100 py-8">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Comissões</h1>
            <p className="text-gray-600">
              Visualize e entenda as taxas de comissão aplicadas aos seus produtos.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="md:col-span-1">
              <SupplierSidebar activeItem="comissoes" />
              
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Comissões Explicadas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 text-sm">
                    <p>
                      As comissões são taxas aplicadas sobre o valor de venda dos seus produtos e representam 
                      o custo do serviço da plataforma.
                    </p>
                    <div className="bg-amber-50 p-3 rounded-md">
                      <h4 className="font-medium text-amber-800 mb-1">Como funciona</h4>
                      <p className="text-amber-700">
                        As taxas são definidas pelo administrador da plataforma e podem variar por categoria de produto 
                        ou ser específicas para o seu perfil.
                      </p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-md">
                      <h4 className="font-medium text-blue-800 mb-1">Ordem de prioridade</h4>
                      <ol className="list-decimal text-blue-700 ml-4 space-y-1">
                        <li>Taxa específica (categoria + fornecedor)</li>
                        <li>Taxa do fornecedor</li>
                        <li>Taxa da categoria</li>
                        <li>Taxa global</li>
                      </ol>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Main Content */}
            <div className="md:col-span-3 space-y-6">
              {/* Quick Stats */}
              {renderCommissionSummary()}
              
              {/* Tabs para alternar entre produtos e taxas */}
              <Tabs defaultValue="produtos" value={activeTab} onValueChange={setActiveTab}>
                <div className="flex items-center justify-between mb-4">
                  <TabsList>
                    <TabsTrigger value="produtos" className="px-4">
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      Produtos
                    </TabsTrigger>
                    <TabsTrigger value="taxas" className="px-4">
                      <Percent className="mr-2 h-4 w-4" />
                      Taxas Aplicadas
                    </TabsTrigger>
                  </TabsList>
                  <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Atualizar dados
                  </Button>
                </div>
                
                <TabsContent value="produtos" className="space-y-4">
                  {/* Filtros para produtos */}
                  <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input 
                        placeholder="Buscar produtos..." 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="w-full sm:w-[200px]">
                        <div className="flex items-center">
                          <Filter className="mr-2 h-4 w-4" />
                          <SelectValue placeholder="Filtrar por categoria" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="all">Todas as categorias</SelectItem>
                          {!isLoadingCategories && categories && categories.map((category: Category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <Select value={sortOrder} onValueChange={setSortOrder}>
                      <SelectTrigger className="w-full sm:w-[200px]">
                        <div className="flex items-center">
                          <BarChart4 className="mr-2 h-4 w-4" />
                          <SelectValue placeholder="Ordenar por" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Taxa de Comissão</SelectLabel>
                          <SelectItem value="rate_asc">Taxa: Menor para Maior</SelectItem>
                          <SelectItem value="rate_desc">Taxa: Maior para Menor</SelectItem>
                          <SelectLabel>Preço</SelectLabel>
                          <SelectItem value="price_asc">Preço: Menor para Maior</SelectItem>
                          <SelectItem value="price_desc">Preço: Maior para Menor</SelectItem>
                          <SelectLabel>Nome</SelectLabel>
                          <SelectItem value="name_asc">Nome: A-Z</SelectItem>
                          <SelectItem value="name_desc">Nome: Z-A</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    
                    {/* Botão para adicionar comissão específica */}
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          onClick={() => {
                            setEditingCommission(null);
                            setSelectedProduct(null);
                          }}
                          className="flex items-center"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Adicionar comissão específica
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle className="flex items-center">
                            {editingCommission ? (
                              <>
                                <Edit className="h-5 w-5 mr-2 text-primary" />
                                Editar comissão específica
                              </>
                            ) : (
                              <>
                                <Plus className="h-5 w-5 mr-2 text-primary" />
                                Nova comissão específica
                              </>
                            )}
                          </DialogTitle>
                          <DialogDescription>
                            {editingCommission 
                              ? "Atualize os detalhes da comissão específica para este produto."
                              : "Defina uma taxa de comissão específica para um produto."}
                          </DialogDescription>
                        </DialogHeader>
                        
                        <ProductCommissionForm 
                          editingCommission={editingCommission} 
                          products={productsWithCommissions?.map((item: ProductCommission) => item.product) || []}
                          onSubmit={(data) => {
                            updateProductCommissionMutation.mutate(data);
                          }}
                          isLoading={updateProductCommissionMutation.isPending}
                          selectedProduct={selectedProduct}
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  {/* Tabela de produtos */}
                  {renderProductsTable()}
                </TabsContent>
                
                <TabsContent value="taxas">
                  {/* Tabela de taxas de comissão */}
                  {renderCommissionRates()}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

// Componente de formulário para adicionar/editar comissões específicas por produto
interface ProductCommissionFormProps {
  editingCommission: ProductCommissionSetting | null;
  products: Product[];
  onSubmit: (data: ProductCommissionFormValues) => void;
  isLoading: boolean;
  selectedProduct: Product | null;
}

function ProductCommissionForm({
  editingCommission,
  products,
  onSubmit,
  isLoading,
  selectedProduct
}: ProductCommissionFormProps) {
  const form = useForm<ProductCommissionFormValues>({
    resolver: zodResolver(productCommissionFormSchema),
    defaultValues: {
      productId: selectedProduct?.id || editingCommission?.productId || 0,
      rate: editingCommission?.rate || "",
      active: editingCommission?.active ?? true,
    },
  });
  
  // Atualizar form quando selectedProduct mudar
  React.useEffect(() => {
    if (selectedProduct) {
      form.setValue("productId", selectedProduct.id);
    }
  }, [selectedProduct, form]);
  
  // Atualizar form quando editingCommission mudar
  React.useEffect(() => {
    if (editingCommission) {
      form.setValue("productId", editingCommission.productId);
      form.setValue("rate", editingCommission.rate);
      form.setValue("active", editingCommission.active);
    }
  }, [editingCommission, form]);
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="productId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Produto</FormLabel>
              <Select
                disabled={!!selectedProduct || !!editingCommission}
                onValueChange={(value) => field.onChange(parseInt(value))}
                value={field.value ? field.value.toString() : undefined}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um produto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id.toString()}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Escolha o produto para aplicar a taxa específica de comissão.
              </FormDescription>
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
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <FormControl>
                  <Input 
                    placeholder="2.5" 
                    {...field} 
                    className="pl-10"
                  />
                </FormControl>
              </div>
              <FormDescription>
                Informe a taxa de comissão em porcentagem (ex: 2.5 para 2.5%).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Status da comissão</FormLabel>
                <FormDescription>
                  Desative a comissão temporariamente sem excluí-la.
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
        
        <DialogFooter>
          <Button type="submit" disabled={isLoading}>
            {isLoading && (
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            )}
            {editingCommission ? "Atualizar" : "Criar"} Comissão
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}