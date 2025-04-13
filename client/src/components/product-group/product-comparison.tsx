import React, { useState, useEffect, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams, useLocation } from "wouter";
import { 
  Card, 
  CardContent,
  CardFooter,
  CardHeader, 
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency } from "@/lib/format";
import { 
  ArrowUpDown, 
  Check, 
  Info, 
  Star, 
  Truck, 
  ShoppingCart, 
  Heart,
  Maximize2,
  Phone,
  Mail,
  ExternalLink,
  Clock,
  Package,
  Shield,
  DollarSign,
  BarChart2,
  Percent,
  ChevronDown,
  ChevronUp,
  Share2,
  Building,
  TrendingDown,
  LucideChevronsDown,
  Award,
  XOctagon,
  CheckCircle2,
  AlertCircle,
  Zap,
  ThumbsUp,
  Scale,
  TimerOff,
  LineChart,
  BarChart,
  ListFilter
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";

// Tipos
interface ProductFeature {
  name: string;
  value: string;
}

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: string;
  originalPrice: string | null;
  discount: number | null;
  rating: string | null;
  ratingsCount: number;
  imageUrl: string | null;
  features: string[] | null;
  supplierId: number;
  categoryId: number;
}

interface Supplier {
  id: number;
  name: string;
  companyName: string | null;
  role: string;
}

interface ProductGroupItem {
  id: number;
  productId: number;
  supplierId: number;
  groupId: number;
  isHighlighted: boolean;
  priceDifference: string | null;
  percentageDifference?: string;
  isMoreExpensive?: boolean;
  matchConfidence: string;
  product?: Product;
  supplier?: Supplier;
}

interface ProductGroup {
  id: number;
  name: string;
  slug: string;
  displayName: string;
  description: string | null;
  features: string[] | null;
  minPrice: string;
  maxPrice: string;
  avgPrice: string;
  productsCount: number;
  suppliersCount: number;
  items: ProductGroupItem[];
}

export default function ProductComparison() {
  const { slug } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [sortBy, setSortBy] = useState<"price" | "rating" | "economy" | "popular">("price");
  const [viewMode, setViewMode] = useState<"cards" | "table" | "detailed">("cards");
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [compareDialogOpen, setCompareDialogOpen] = useState(false);
  const [highlightDiff, setHighlightDiff] = useState(true);
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    "produto", "fornecedor", "preço", "entrega", "avaliação", "features", "economia"
  ]);

  // Buscar o grupo de produtos e seus itens
  const { data: productGroup, isLoading, error } = useQuery({
    queryKey: ["/api/product-groups", slug || "1"], // Caso o slug não seja fornecido, usamos o ID 1 como padrão
    queryFn: async () => {
      // Se não houver slug, buscar o primeiro grupo de produtos
      const url = slug ? `/api/product-groups/${slug}` : `/api/product-groups/1`;
      
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Falha ao carregar grupo de produtos");
      }
      return res.json() as Promise<ProductGroup>;
    },
    enabled: true // Agora sempre habilitado para mostrar pelo menos o primeiro grupo
  });

  // Ordenar os itens com base nos critérios selecionados
  const sortedItems = useMemo(() => {
    if (!productGroup?.items) return [];
    
    return [...productGroup.items].sort((a, b) => {
      if (sortBy === "price") {
        const priceA = parseFloat(a.product?.price || "0");
        const priceB = parseFloat(b.product?.price || "0");
        return sortOrder === "asc" ? priceA - priceB : priceB - priceA;
      } else if (sortBy === "rating") {
        const ratingA = parseFloat(a.product?.rating || "0");
        const ratingB = parseFloat(b.product?.rating || "0");
        return sortOrder === "asc" ? ratingA - ratingB : ratingB - ratingA;
      } else if (sortBy === "economy") {
        const savingsA = calculateSavingsPercentage(a);
        const savingsB = calculateSavingsPercentage(b);
        return sortOrder === "asc" ? savingsA - savingsB : savingsB - savingsA;
      } else { // popular
        const salesA = a.totalSales || 0;
        const salesB = b.totalSales || 0;
        return sortOrder === "asc" ? salesA - salesB : salesB - salesA;
      }
    });
  }, [productGroup, sortBy, sortOrder]);

  // Calcular diferença de preço e economia em relação ao item mais caro
  const processedItems = useMemo(() => {
    if (!sortedItems?.length) return [];
    
    // Encontrar preço máximo e mínimo
    const prices = sortedItems
      .filter(item => item.product?.price)
      .map(item => parseFloat(item.product?.price || "0"));
    
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    
    // Calcular percentuais de economia e diferenças de preço para cada item
    return sortedItems.map(item => {
      const price = parseFloat(item.product?.price || "0");
      const priceDifference = maxPrice - price;
      const percentageDifference = ((maxPrice - price) / maxPrice * 100).toFixed(1);
      
      return {
        ...item,
        priceDifference: priceDifference.toFixed(2),
        percentageDifference,
        isMoreExpensive: price >= maxPrice,
        isCheapest: price <= minPrice + 0.01 // Pequena tolerância para evitar problemas com ponto flutuante
      }
    });
  }, [sortedItems]);

  // Obter itens mais baratos, mais caros e com melhor avaliação
  const cheapestItem = useMemo(() => {
    return processedItems.find(item => item.isCheapest);
  }, [processedItems]);
  
  const mostExpensiveItem = useMemo(() => {
    return processedItems.find(item => item.isMoreExpensive);
  }, [processedItems]);
  
  const bestRatedItem = useMemo(() => {
    if (!processedItems.length) return undefined;
    
    return [...processedItems].sort(
      (a, b) => parseFloat(b.product?.rating || "0") - parseFloat(a.product?.rating || "0")
    )[0];
  }, [processedItems]);

  // Calcular economia percentual
  const calculateSavingsPercentage = (item: ProductGroupItem): number => {
    if (!item?.product?.price || !item?.product?.originalPrice) return 0;
    
    const price = parseFloat(item.product.price);
    const originalPrice = parseFloat(item.product.originalPrice);
    
    if (originalPrice <= price) return 0;
    return ((originalPrice - price) / originalPrice) * 100;
  };

  // Adicionar ou remover item da seleção para comparação detalhada
  const toggleItemSelection = (itemId: number) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter(id => id !== itemId));
    } else {
      if (selectedItems.length < 4) { // Limitar a 4 itens para melhor visualização
        setSelectedItems([...selectedItems, itemId]);
      } else {
        toast({
          title: "Limite de seleção",
          description: "Você pode comparar até 4 produtos ao mesmo tempo",
          variant: "warning"
        });
      }
    }
  };

  // Abrir diálogo de comparação quando tiver pelo menos 2 itens selecionados
  const openCompareDialog = () => {
    if (selectedItems.length < 2) {
      toast({
        title: "Seleção insuficiente",
        description: "Selecione pelo menos 2 produtos para comparar",
        variant: "warning"
      });
      return;
    }
    setCompareDialogOpen(true);
  };

  // Adicionar ao carrinho
  const handleAddToCart = (item: ProductGroupItem) => {
    toast({
      title: "Produto adicionado ao carrinho",
      description: `${item.product?.name} foi adicionado ao carrinho.`,
      duration: 3000,
    });
  };
  
  // Alternar visibilidade de uma coluna
  const toggleColumnVisibility = (column: string) => {
    if (visibleColumns.includes(column)) {
      setVisibleColumns(visibleColumns.filter(c => c !== column));
    } else {
      setVisibleColumns([...visibleColumns, column]);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 mt-4">
        <Skeleton className="h-12 w-full mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error || !productGroup) {
    return (
      <div className="container mx-auto p-4 mt-8 text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-2">Erro ao carregar dados</h2>
        <p className="mb-4">Não foi possível carregar as informações deste grupo de produtos.</p>
        <Button onClick={() => navigate("/")}>Voltar para o início</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{productGroup.displayName}</h1>
        <p className="text-gray-600 mb-4">{productGroup.description}</p>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {productGroup.features?.map((feature, index) => (
            <Badge key={index} variant="outline" className="px-2 py-1 bg-gradient-to-r from-blue-50 to-indigo-50">
              <Check size={14} className="mr-1 text-primary" /> {feature}
            </Badge>
          ))}
        </div>
        
        {/* Resumo estatístico */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-blue-50 border-blue-100">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Preço mais baixo</p>
                  <h3 className="text-2xl font-bold text-primary">
                    {formatCurrency(parseFloat(productGroup.minPrice))}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {cheapestItem?.supplier?.name || ""}
                  </p>
                </div>
                <DollarSign className="h-10 w-10 text-primary/30" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-red-50 border-red-100">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Preço mais alto</p>
                  <h3 className="text-2xl font-bold text-red-500">
                    {formatCurrency(parseFloat(productGroup.maxPrice))}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {mostExpensiveItem?.supplier?.name || ""}
                  </p>
                </div>
                <TrendingDown className="h-10 w-10 text-red-500/30" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-amber-50 border-amber-100">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Melhor avaliação</p>
                  <h3 className="text-2xl font-bold text-amber-500 flex items-center">
                    {bestRatedItem?.product?.rating || "0"}
                    <Star className="h-5 w-5 ml-1 fill-amber-500 text-amber-500" />
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {bestRatedItem?.supplier?.name || ""}
                  </p>
                </div>
                <Award className="h-10 w-10 text-amber-500/30" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-green-50 border-green-100">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Economia máxima</p>
                  <h3 className="text-2xl font-bold text-green-500">
                    {formatCurrency(parseFloat(mostExpensiveItem?.priceDifference || "0"))}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {Math.round(parseFloat(processedItems?.[0]?.percentageDifference || "0"))}% de desconto
                  </p>
                </div>
                <Percent className="h-10 w-10 text-green-500/30" />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Barra de controles */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <span className="text-sm text-muted-foreground">
              Comparando {productGroup.items.length} ofertas de {productGroup.suppliersCount} fornecedores
            </span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {/* Botões de visualização */}
            <div className="bg-muted p-1 rounded-md">
              <Button 
                variant={viewMode === "cards" ? "default" : "ghost"} 
                size="sm"
                onClick={() => setViewMode("cards")}
                className="h-8 px-2"
              >
                <Package size={16} className="mr-1" /> Cards
              </Button>
              <Button 
                variant={viewMode === "table" ? "default" : "ghost"} 
                size="sm"
                onClick={() => setViewMode("table")}
                className="h-8 px-2"
              >
                <BarChart size={16} className="mr-1" /> Tabela
              </Button>
              <Button 
                variant={viewMode === "detailed" ? "default" : "ghost"} 
                size="sm"
                onClick={() => setViewMode("detailed")}
                className="h-8 px-2"
              >
                <LineChart size={16} className="mr-1" /> Detalhada
              </Button>
            </div>
            
            {/* Dropdown de ordenação */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <ArrowUpDown size={14} className="mr-1" /> 
                  {sortOrder === "asc" ? "Crescente" : "Decrescente"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Ordenação</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSortOrder("asc")}>
                  <ChevronUp className="mr-2 h-4 w-4" />
                  Crescente
                  {sortOrder === "asc" && <Check className="ml-auto h-4 w-4" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOrder("desc")}>
                  <ChevronDown className="mr-2 h-4 w-4" />
                  Decrescente
                  {sortOrder === "desc" && <Check className="ml-auto h-4 w-4" />}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Dropdown de critério de ordenação */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <ListFilter size={14} className="mr-1" /> 
                  Ordenar por: {
                    sortBy === "price" ? "Preço" : 
                    sortBy === "rating" ? "Avaliação" : 
                    sortBy === "economy" ? "Economia" : "Popularidade"
                  }
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Critério de ordenação</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSortBy("price")}>
                  <DollarSign className="mr-2 h-4 w-4" />
                  Preço
                  {sortBy === "price" && <Check className="ml-auto h-4 w-4" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("rating")}>
                  <Star className="mr-2 h-4 w-4" />
                  Avaliação
                  {sortBy === "rating" && <Check className="ml-auto h-4 w-4" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("economy")}>
                  <Percent className="mr-2 h-4 w-4" />
                  Economia
                  {sortBy === "economy" && <Check className="ml-auto h-4 w-4" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("popular")}>
                  <BarChart2 className="mr-2 h-4 w-4" />
                  Popularidade
                  {sortBy === "popular" && <Check className="ml-auto h-4 w-4" />}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Botão para comparar itens selecionados */}
            <Button 
              variant="default" 
              size="sm"
              className={`h-8 ${selectedItems.length < 2 ? 'opacity-70' : ''}`}
              onClick={openCompareDialog}
              disabled={selectedItems.length < 2}
            >
              <Scale size={14} className="mr-1" /> 
              Comparar selecionados ({selectedItems.length})
            </Button>
          </div>
        </div>
        
        {/* Visualização em formato de tabela */}
        {viewMode === "table" && (
          <div className="mb-6 overflow-x-auto">
            <Table className="w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead className={visibleColumns.includes("produto") ? "" : "hidden"}>Produto</TableHead>
                  <TableHead className={visibleColumns.includes("fornecedor") ? "" : "hidden"}>Fornecedor</TableHead>
                  <TableHead className={visibleColumns.includes("preço") ? "" : "hidden"}>Preço</TableHead>
                  <TableHead className={visibleColumns.includes("economia") ? "" : "hidden"}>Economia</TableHead>
                  <TableHead className={visibleColumns.includes("avaliação") ? "" : "hidden"}>Avaliação</TableHead>
                  <TableHead className={visibleColumns.includes("entrega") ? "" : "hidden"}>Entrega</TableHead>
                  <TableHead className={visibleColumns.includes("features") ? "" : "hidden"}>Características</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processedItems.map((item) => (
                  <TableRow key={item.id} className={selectedItems.includes(item.id) ? "bg-primary/5" : ""}>
                    <TableCell>
                      <Checkbox 
                        checked={selectedItems.includes(item.id)}
                        onCheckedChange={() => toggleItemSelection(item.id)}
                      />
                    </TableCell>
                    <TableCell className={visibleColumns.includes("produto") ? "" : "hidden"}>
                      <div className="flex items-center gap-2">
                        <div className="h-12 w-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
                          <img 
                            src={item.product?.imageUrl || "https://via.placeholder.com/50x50"} 
                            alt={item.product?.name} 
                            className="h-full w-full object-contain"
                          />
                        </div>
                        <div className="overflow-hidden">
                          <div className="font-medium truncate max-w-[200px]">
                            {item.product?.name}
                            {item.isHighlighted && <Badge className="ml-2">Melhor oferta</Badge>}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            SKU-{item.productId}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className={visibleColumns.includes("fornecedor") ? "" : "hidden"}>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                          {item.supplier?.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium">{item.supplier?.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {item.supplier?.companyName || ""}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className={visibleColumns.includes("preço") ? "" : "hidden"}>
                      <div className="font-medium">
                        {formatCurrency(parseFloat(item.product?.price || "0"))}
                      </div>
                      {item.product?.originalPrice && (
                        <div className="text-xs text-muted-foreground line-through">
                          {formatCurrency(parseFloat(item.product?.originalPrice || "0"))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className={visibleColumns.includes("economia") ? "" : "hidden"}>
                      {!item.isMoreExpensive ? (
                        <div>
                          <div className="text-green-600 font-medium flex items-center">
                            <TrendingDown size={14} className="mr-1" />
                            {formatCurrency(parseFloat(item.priceDifference || "0"))}
                          </div>
                          <div className="text-xs text-green-600">
                            {item.percentageDifference}% mais barato
                          </div>
                        </div>
                      ) : "-"}
                    </TableCell>
                    <TableCell className={visibleColumns.includes("avaliação") ? "" : "hidden"}>
                      <div className="flex items-center">
                        <Star size={16} className="text-yellow-500 fill-yellow-500 mr-1" />
                        <span>{item.product?.rating}</span>
                      </div>
                    </TableCell>
                    <TableCell className={visibleColumns.includes("entrega") ? "" : "hidden"}>
                      <div className="text-sm">3-5 dias úteis</div>
                    </TableCell>
                    <TableCell className={visibleColumns.includes("features") ? "max-w-[200px]" : "hidden"}>
                      <div className="text-sm truncate">
                        {item.product?.features?.[0] || "-"}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleAddToCart(item)}
                      >
                        <ShoppingCart size={16} />
                      </Button>
                      <Link to={`/produtos/${item.product?.slug}`}>
                        <Button variant="ghost" size="icon">
                          <ExternalLink size={16} />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        
        {/* Diálogo de comparação detalhada */}
        <Dialog open={compareDialogOpen} onOpenChange={setCompareDialogOpen}>
          <DialogContent className="max-w-5xl mx-auto">
            <DialogHeader>
              <DialogTitle>Comparação detalhada</DialogTitle>
              <DialogDescription>
                Comparando {selectedItems.length} produtos do grupo "{productGroup.displayName}"
              </DialogDescription>
            </DialogHeader>
            
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-32">Característica</TableHead>
                    {selectedItems.map(itemId => {
                      const item = processedItems.find(i => i.id === itemId);
                      return (
                        <TableHead key={itemId} className="min-w-48">
                          <div className="font-medium">{item?.product?.name}</div>
                          <div className="text-sm text-muted-foreground">{item?.supplier?.name}</div>
                        </TableHead>
                      );
                    })}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Linha de imagem */}
                  <TableRow>
                    <TableCell className="font-medium">Imagem</TableCell>
                    {selectedItems.map(itemId => {
                      const item = processedItems.find(i => i.id === itemId);
                      return (
                        <TableCell key={itemId}>
                          <div className="h-32 w-full flex items-center justify-center">
                            <img 
                              src={item?.product?.imageUrl || "https://via.placeholder.com/150x150"} 
                              alt={item?.product?.name} 
                              className="max-h-full max-w-full object-contain"
                            />
                          </div>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                  
                  {/* Linha de preço */}
                  <TableRow>
                    <TableCell className="font-medium">Preço</TableCell>
                    {selectedItems.map(itemId => {
                      const item = processedItems.find(i => i.id === itemId);
                      return (
                        <TableCell key={itemId}>
                          <div className="font-bold text-xl">
                            {formatCurrency(parseFloat(item?.product?.price || "0"))}
                          </div>
                          {item?.product?.originalPrice && (
                            <div className="text-sm text-muted-foreground line-through">
                              {formatCurrency(parseFloat(item?.product?.originalPrice || "0"))}
                            </div>
                          )}
                          {!item?.isMoreExpensive && (
                            <div className="text-sm text-green-600 mt-1">
                              Economia de {formatCurrency(parseFloat(item?.priceDifference || "0"))}
                            </div>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                  
                  {/* Linha de economia */}
                  <TableRow>
                    <TableCell className="font-medium">Economia</TableCell>
                    {selectedItems.map(itemId => {
                      const item = processedItems.find(i => i.id === itemId);
                      const savings = parseFloat(item?.percentageDifference || "0");
                      return (
                        <TableCell key={itemId}>
                          {!item?.isMoreExpensive ? (
                            <div>
                              <div className="mb-1 text-sm flex justify-between">
                                <span>Mais barato em</span>
                                <span className="text-green-600 font-medium">{savings.toFixed(1)}%</span>
                              </div>
                              <Progress
                                value={savings}
                                max={100}
                                className="h-2 bg-muted"
                                indicatorClassName="bg-green-500"
                              />
                            </div>
                          ) : (
                            <div className="text-center text-muted-foreground">
                              <TimerOff className="h-5 w-5 mx-auto mb-1 opacity-50" />
                              <span className="text-sm">Sem economia</span>
                            </div>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                  
                  {/* Linha de avaliação */}
                  <TableRow>
                    <TableCell className="font-medium">Avaliação</TableCell>
                    {selectedItems.map(itemId => {
                      const item = processedItems.find(i => i.id === itemId);
                      const rating = parseFloat(item?.product?.rating || "0");
                      return (
                        <TableCell key={itemId}>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star 
                                key={star} 
                                size={16} 
                                className={`${rating >= star 
                                  ? "text-yellow-500 fill-yellow-500" 
                                  : "text-gray-300"}`}
                              />
                            ))}
                            <span className="ml-2">{rating.toFixed(1)}</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {item?.product?.ratingsCount || 0} avaliações
                          </div>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                  
                  {/* Linha de características */}
                  <TableRow>
                    <TableCell className="font-medium">Características</TableCell>
                    {selectedItems.map(itemId => {
                      const item = processedItems.find(i => i.id === itemId);
                      return (
                        <TableCell key={itemId}>
                          <ul className="text-sm space-y-1">
                            {(showAllFeatures ? item?.product?.features : item?.product?.features?.slice(0, 5))?.map((feature, idx) => (
                              <li key={idx} className="flex items-start">
                                <Check size={14} className="mr-1 text-green-500 mt-1 flex-shrink-0" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                          {(item?.product?.features?.length || 0) > 5 && !showAllFeatures && (
                            <Button 
                              variant="link" 
                              size="sm" 
                              className="p-0 h-auto text-xs mt-1"
                              onClick={() => setShowAllFeatures(true)}
                            >
                              Ver todas as características
                            </Button>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                  
                  {/* Linha de fornecedor */}
                  <TableRow>
                    <TableCell className="font-medium">Fornecedor</TableCell>
                    {selectedItems.map(itemId => {
                      const item = processedItems.find(i => i.id === itemId);
                      return (
                        <TableCell key={itemId}>
                          <div className="font-medium">{item?.supplier?.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {item?.supplier?.companyName || ""}
                          </div>
                          <div className="flex items-center mt-2 text-xs text-muted-foreground">
                            <Building size={12} className="mr-1" />
                            <span>CNPJ Verificado</span>
                          </div>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                  
                  {/* Linha de entrega */}
                  <TableRow>
                    <TableCell className="font-medium">Entrega</TableCell>
                    {selectedItems.map(itemId => {
                      const item = processedItems.find(i => i.id === itemId);
                      return (
                        <TableCell key={itemId}>
                          <div className="font-medium">3-5 dias úteis</div>
                          <div className="text-sm text-muted-foreground">Frete grátis</div>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="highlight" 
                  checked={highlightDiff}
                  onCheckedChange={() => setHighlightDiff(!highlightDiff)}
                />
                <label htmlFor="highlight" className="text-sm">
                  Destacar diferenças
                </label>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setCompareDialogOpen(false)}>
                  Fechar
                </Button>
                <Button onClick={() => setSelectedItems([])}>
                  Limpar seleção
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      
        {/* Visualização em formato de cards */}
        {viewMode === "cards" && (
          <div className="grid grid-cols-1 gap-6">
            {processedItems.map((item) => (
          <Card key={item.id} className={`overflow-hidden ${item.isHighlighted ? 'border-primary border-2' : ''}`}>
            {item.isHighlighted && (
              <div className="bg-primary text-primary-foreground py-1 px-4 text-center text-sm font-medium">
                MELHOR OFERTA
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 flex flex-col justify-center items-center md:border-r">
                <div className="relative w-full h-32 mb-2 group cursor-pointer">
                  <img 
                    src={item.product?.imageUrl || "https://via.placeholder.com/300x200"} 
                    alt={item.product?.name} 
                    className="w-full h-full object-contain transition-all group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link to={`/produtos/${item.product?.slug}`}>
                      <div className="bg-primary/90 text-white p-2 rounded-full">
                        <Maximize2 size={20} />
                      </div>
                    </Link>
                  </div>
                </div>
                <Link to={`/produtos/${item.product?.slug}`} className="hover:text-primary transition-colors">
                  <h3 className="text-lg font-semibold text-center">{item.product?.name}</h3>
                </Link>
                <div className="flex items-center mt-1">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        size={14} 
                        className={`${parseFloat(item.product?.rating || "0") >= star 
                          ? "text-yellow-500 fill-yellow-500" 
                          : "text-gray-300"}`}
                      />
                    ))}
                  </div>
                  <span className="ml-2 text-sm">{item.product?.rating} ({item.product?.ratingsCount})</span>
                </div>
              </div>
              
              <div className="p-4 flex flex-col justify-center md:border-r">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Fornecedor</h4>
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-primary-foreground flex items-center justify-center text-primary font-bold">
                    {item.supplier?.name.charAt(0)}
                  </div>
                  <div className="ml-3">
                    <p className="font-medium">{item.supplier?.name}</p>
                    <p className="text-sm text-muted-foreground">{item.supplier?.companyName}</p>
                  </div>
                </div>
                
                <div className="mt-3 space-y-2">
                  <div className="flex items-center text-sm">
                    <Truck size={14} className="mr-1 text-primary" />
                    <span>Entrega em 3-5 dias úteis</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Shield size={14} className="mr-1 text-primary" />
                    <span>Garantia do fornecedor</span>
                  </div>
                </div>
                
                <div className="mt-3">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-xs mt-1 px-2">
                        Informações do fornecedor
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Sobre o fornecedor</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                            {item.supplier?.name.charAt(0)}
                          </div>
                          <div className="ml-4">
                            <h3 className="font-bold text-lg">{item.supplier?.name}</h3>
                            <p className="text-muted-foreground">{item.supplier?.companyName}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center">
                            <Building className="h-4 w-4 mr-2 text-primary" />
                            <span>CNPJ Verificado</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-primary" />
                            <span>Ativo há 5 anos</span>
                          </div>
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-2 text-primary" />
                            <span>Pagamento em dia</span>
                          </div>
                          <div className="flex items-center">
                            <BarChart2 className="h-4 w-4 mr-2 text-primary" />
                            <span>25 produtos</span>
                          </div>
                        </div>
                        
                        <div className="border-t pt-4">
                          <h4 className="font-medium mb-2">Contato:</h4>
                          <div className="space-y-2">
                            <div className="flex items-center">
                              <Phone className="h-4 w-4 mr-2 text-primary" />
                              <span>(11) 9999-9999</span>
                            </div>
                            <div className="flex items-center">
                              <Mail className="h-4 w-4 mr-2 text-primary" />
                              <span>contato@{item.supplier?.name.toLowerCase().replace(/\s+/g, '')}.com.br</span>
                            </div>
                          </div>
                        </div>
                        
                        <Button className="w-full">
                          Entrar em contato
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              
              <div className="p-4 md:border-r">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Características</h4>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="features">
                    <AccordionTrigger className="text-xs py-1">Ver todas as características</AccordionTrigger>
                    <AccordionContent>
                      <ul className="text-sm space-y-1">
                        {item.product?.features?.map((feature, index) => (
                          <li key={index} className="flex items-start">
                            <Check size={16} className="mr-1 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
                
                <ul className="text-sm space-y-1 mt-2">
                  {item.product?.features?.slice(0, 3).map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check size={16} className="mr-1 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                {item.matchConfidence && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="mt-3 text-xs flex items-center cursor-help">
                          <Info size={12} className="mr-1" />
                          <span>Compatibilidade: {parseFloat(item.matchConfidence).toFixed(0)}%</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs max-w-[200px]">
                          Este percentual indica o quanto este produto corresponde às especificações padrão deste grupo.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              
              <div className="p-4 flex flex-col items-center justify-center">
                <div className="flex flex-col items-center mb-3">
                  {item.product?.originalPrice && parseFloat(item.product.originalPrice) > parseFloat(item.product.price) && (
                    <span className="text-muted-foreground line-through text-sm">
                      {formatCurrency(parseFloat(item.product.originalPrice))}
                    </span>
                  )}
                  
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(parseFloat(item.product?.price || "0"))}
                  </span>
                  
                  {item.product?.discount && item.product.discount > 0 && (
                    <Badge className="mt-1 bg-red-500 hover:bg-red-600">
                      {item.product.discount}% OFF
                    </Badge>
                  )}
                  
                  {item.priceDifference && parseFloat(item.priceDifference) > 0 && (
                    <span className="text-xs text-muted-foreground mt-1">
                      {formatCurrency(parseFloat(item.priceDifference))} mais caro
                    </span>
                  )}
                  
                  <span className="text-xs text-green-600 mt-1">
                    Em até 12x no cartão
                  </span>
                </div>
                
                <Button 
                  className="w-full"
                  onClick={() => handleAddToCart(item)}
                >
                  <ShoppingCart size={16} className="mr-2" />
                  Comprar
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full mt-2"
                  asChild
                >
                  <Link to={`/produtos/${item.product?.slug}`}>
                    Ver detalhes
                  </Link>
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
        )}
        
        {/* Visualização em formato de tabela */}
        {viewMode === "table" && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Produto</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Especificações</TableHead>
                  <TableHead className="text-right">Preço</TableHead>
                  <TableHead className="text-right">Economia</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedItems.map((item) => (
                  <TableRow key={item.id} className={item.isHighlighted ? "bg-primary/10" : ""}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-md overflow-hidden bg-muted/30 flex items-center justify-center">
                          {item.product?.imageUrl ? (
                            <img 
                              src={item.product.imageUrl} 
                              alt={item.product.name} 
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <ImageIcon className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{item.product?.name}</div>
                          {item.isHighlighted && <Badge className="mt-1">Melhor oferta</Badge>}
                          <div className="flex mt-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star 
                                key={star} 
                                size={12} 
                                className={`${parseFloat(item.product?.rating || "0") >= star 
                                  ? "text-yellow-500 fill-yellow-500" 
                                  : "text-gray-300"}`}
                              />
                            ))}
                            <span className="text-xs text-muted-foreground ml-1">
                              ({item.product?.ratingsCount || 0})
                            </span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                          {item.supplier?.name.charAt(0)}
                        </div>
                        <span>{item.supplier?.name}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Fornecedor verificado
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm space-y-1 max-w-[300px]">
                        {item.product?.features?.slice(0, 2).map((feature, idx) => (
                          <div key={idx} className="flex items-start">
                            <Check size={14} className="text-green-500 mr-1 mt-0.5 flex-shrink-0" />
                            <span className="text-xs">{feature}</span>
                          </div>
                        ))}
                        {(item.product?.features?.length || 0) > 2 && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="text-xs text-primary cursor-pointer hover:underline flex items-center">
                                  <Plus size={12} className="mr-1" />
                                  mais {(item.product?.features?.length || 0) - 2} características
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-md">
                                <div className="space-y-1 p-1">
                                  {item.product?.features?.slice(2).map((feature, idx) => (
                                    <div key={idx} className="flex items-start">
                                      <Check size={14} className="text-green-500 mr-1 mt-0.5" />
                                      <span className="text-xs">{feature}</span>
                                    </div>
                                  ))}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-bold text-lg">
                        {formatCurrency(parseFloat(item.product?.price || "0"))}
                      </div>
                      {item.product?.originalPrice && parseFloat(item.product.originalPrice) > parseFloat(item.product.price) && (
                        <div className="text-sm text-muted-foreground line-through">
                          {formatCurrency(parseFloat(item.product.originalPrice))}
                        </div>
                      )}
                      <div className="text-xs text-green-600 mt-1">
                        Em até 12x no cartão
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {item.isMoreExpensive === false && (
                        <div className="text-sm font-medium text-green-600">
                          {formatCurrency(parseFloat(item.priceDifference || "0"))}
                        </div>
                      )}
                      {item.percentageDifference && item.isMoreExpensive === false && (
                        <div className="text-xs text-green-600">
                          {item.percentageDifference}% mais barato
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-2 items-center">
                        <Button 
                          size="sm" 
                          className="w-full"
                          onClick={() => handleAddToCart(item)}
                        >
                          <ShoppingCart size={14} className="mr-1" />
                          Comprar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          asChild
                        >
                          <Link to={`/produtos/${item.product?.slug}`}>
                            Ver detalhes
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Visualização detalhada com comparação de características */}
        {viewMode === "detailed" && (
          <div className="space-y-8">
            <div className="mb-4 bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h3 className="text-lg font-semibold mb-2 text-blue-700 flex items-center">
                <Info className="h-5 w-5 mr-2" /> Comparação lado a lado
              </h3>
              <p className="text-sm text-blue-600">
                Compare detalhadamente as características, vantagens econômicas e benefícios de cada produto. 
                Destaque os itens com melhor custo-benefício e encontre a opção ideal para sua necessidade.
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <Table className="border rounded-lg">
                <TableCaption>Comparação detalhada de produtos - {productGroup?.displayName}</TableCaption>
                <TableHeader className="bg-muted/30 sticky top-0">
                  <TableRow>
                    <TableHead className="w-[180px] bg-muted/50">Detalhes</TableHead>
                    {sortedItems.map((item) => (
                      <TableHead 
                        key={item.id} 
                        className={`w-[220px] text-center ${
                          item.isHighlighted 
                            ? "bg-primary/10 border-b-2 border-primary" 
                            : item.isCheapest 
                              ? "bg-green-50" 
                              : ""
                        }`}
                      >
                        <div className="flex flex-col items-center gap-2 p-2">
                          <div className="w-16 h-16 rounded-md overflow-hidden bg-muted/30 flex items-center justify-center">
                            {item.product?.imageUrl ? (
                              <img 
                                src={item.product.imageUrl} 
                                alt={item.product.name} 
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <ImageIcon className="h-6 w-6 text-muted-foreground" />
                            )}
                          </div>
                          <div className="text-center">
                            <div className="font-medium text-sm">
                              {item.product?.name.length > 25 
                                ? `${item.product?.name.substring(0, 25)}...` 
                                : item.product?.name}
                            </div>
                            {item.isHighlighted && <Badge className="mt-1">Melhor oferta</Badge>}
                          </div>
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Preço */}
                  <TableRow>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <DollarSign size={16} className="mr-2 text-primary" />
                        Preço
                      </div>
                    </TableCell>
                    {sortedItems.map((item) => (
                      <TableCell key={item.id} className={`text-center ${item.isHighlighted ? "bg-primary/5" : ""}`}>
                        <div className="font-bold text-lg">
                          {formatCurrency(parseFloat(item.product?.price || "0"))}
                        </div>
                        {item.product?.originalPrice && parseFloat(item.product.originalPrice) > parseFloat(item.product.price) && (
                          <div className="text-sm text-muted-foreground line-through">
                            {formatCurrency(parseFloat(item.product.originalPrice))}
                          </div>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  
                  {/* Economia */}
                  <TableRow>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <TrendingDown size={16} className="mr-2 text-primary" />
                        Economia
                      </div>
                    </TableCell>
                    {sortedItems.map((item) => (
                      <TableCell key={item.id} className={`text-center ${item.isHighlighted ? "bg-primary/5" : ""}`}>
                        {item.isMoreExpensive === false && parseFloat(item.priceDifference || "0") > 0 ? (
                          <div>
                            <div className="text-sm font-medium text-green-600">
                              {formatCurrency(parseFloat(item.priceDifference || "0"))}
                            </div>
                            {item.percentageDifference && (
                              <div className="text-xs text-green-600">
                                {item.percentageDifference}% mais barato
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  
                  {/* Fornecedor */}
                  <TableRow>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <Building size={16} className="mr-2 text-primary" />
                        Fornecedor
                      </div>
                    </TableCell>
                    {sortedItems.map((item) => (
                      <TableCell key={item.id} className={`text-center ${item.isHighlighted ? "bg-primary/5" : ""}`}>
                        <div>
                          {item.supplier?.name}
                          <div className="text-xs text-muted-foreground">
                            {item.supplier?.companyName || "Empresa verificada"}
                          </div>
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>
                  
                  {/* Avaliações */}
                  <TableRow>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <Star size={16} className="mr-2 text-primary" />
                        Avaliações
                      </div>
                    </TableCell>
                    {sortedItems.map((item) => (
                      <TableCell key={item.id} className={`text-center ${item.isHighlighted ? "bg-primary/5" : ""}`}>
                        <div className="flex items-center justify-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star} 
                              size={14} 
                              className={`${parseFloat(item.product?.rating || "0") >= star 
                                ? "text-yellow-500 fill-yellow-500" 
                                : "text-gray-300"}`}
                            />
                          ))}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {item.product?.rating} ({item.product?.ratingsCount || 0} avaliações)
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>
                  
                  {/* Entrega */}
                  <TableRow>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <Truck size={16} className="mr-2 text-primary" />
                        Entrega
                      </div>
                    </TableCell>
                    {sortedItems.map((item) => (
                      <TableCell key={item.id} className={`text-center ${item.isHighlighted ? "bg-primary/5" : ""}`}>
                        <div className="text-sm text-green-600">Frete grátis</div>
                        <div className="text-xs text-muted-foreground">3-5 dias úteis</div>
                      </TableCell>
                    ))}
                  </TableRow>
                  
                  {/* Garantia */}
                  <TableRow>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <Shield size={16} className="mr-2 text-primary" />
                        Garantia
                      </div>
                    </TableCell>
                    {sortedItems.map((item) => (
                      <TableCell key={item.id} className={`text-center ${item.isHighlighted ? "bg-primary/5" : ""}`}>
                        <div className="text-sm">12 meses</div>
                        <div className="text-xs text-muted-foreground">Garantia do fabricante</div>
                      </TableCell>
                    ))}
                  </TableRow>
                  
                  {/* Características */}
                  <TableRow className="align-top">
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <ListChecks size={16} className="mr-2 text-primary" />
                        Características
                      </div>
                    </TableCell>
                    {sortedItems.map((item) => (
                      <TableCell key={item.id} className={`${item.isHighlighted ? "bg-primary/5" : ""}`}>
                        <ul className="text-sm space-y-1">
                          {item.product?.features?.map((feature, idx) => (
                            <li key={idx} className="flex items-start">
                              <Check size={14} className="text-green-500 mr-1 mt-0.5 flex-shrink-0" />
                              <span className="text-xs">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </TableCell>
                    ))}
                  </TableRow>
                  
                  {/* Ações */}
                  <TableRow>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <ShoppingCart size={16} className="mr-2 text-primary" />
                        Ações
                      </div>
                    </TableCell>
                    {sortedItems.map((item) => (
                      <TableCell key={item.id} className={`text-center ${item.isHighlighted ? "bg-primary/5" : ""}`}>
                        <div className="flex flex-col gap-2">
                          <Button 
                            size="sm" 
                            className="w-full"
                            onClick={() => handleAddToCart(item)}
                          >
                            Comprar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            asChild
                          >
                            <Link to={`/produtos/${item.product?.slug}`}>
                              Ver detalhes
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}