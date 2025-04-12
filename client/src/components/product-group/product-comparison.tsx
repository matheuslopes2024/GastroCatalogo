import React, { useState, useEffect, useRef } from "react";
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
import { useToast } from "@/hooks/use-toast";
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
  Building
} from "lucide-react";
import { 
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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

// Funções auxiliares
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

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
  const [sortBy, setSortBy] = useState<"price" | "rating">("price");

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
  const sortedItems = React.useMemo(() => {
    if (!productGroup?.items) return [];
    
    return [...productGroup.items].sort((a, b) => {
      if (sortBy === "price") {
        const priceA = parseFloat(a.product?.price || "0");
        const priceB = parseFloat(b.product?.price || "0");
        return sortOrder === "asc" ? priceA - priceB : priceB - priceA;
      } else {
        const ratingA = parseFloat(a.product?.rating || "0");
        const ratingB = parseFloat(b.product?.rating || "0");
        return sortOrder === "asc" ? ratingA - ratingB : ratingB - ratingA;
      }
    });
  }, [productGroup, sortBy, sortOrder]);

  // Adicionar ao carrinho
  const handleAddToCart = (item: ProductGroupItem) => {
    toast({
      title: "Produto adicionado ao carrinho",
      description: `${item.product?.name} foi adicionado ao carrinho.`,
      duration: 3000,
    });
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
        
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-muted-foreground">
              Comparando {productGroup.items.length} ofertas de {productGroup.suppliersCount} fornecedores
            </span>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            >
              <ArrowUpDown size={14} className="mr-1" /> 
              {sortOrder === "asc" ? "Crescente" : "Decrescente"}
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSortBy(sortBy === "price" ? "rating" : "price")}
            >
              Ordenar por: {sortBy === "price" ? "Preço" : "Avaliação"}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {sortedItems.map((item) => (
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

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Comparação detalhada</h2>
        <Table>
          <TableCaption>Comparação de características e preços entre os produtos</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead>
              <TableHead>Fornecedor</TableHead>
              <TableHead className="text-right">Preço</TableHead>
              <TableHead className="text-right">Economia</TableHead>
              <TableHead className="text-right">Avaliação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedItems.map((item) => (
              <TableRow key={item.id} className={item.isHighlighted ? "bg-primary/10" : ""}>
                <TableCell className="font-medium">
                  {item.product?.name}
                  {item.isHighlighted && <Badge className="ml-2">Melhor oferta</Badge>}
                </TableCell>
                <TableCell>{item.supplier?.name}</TableCell>
                <TableCell className="text-right font-bold">
                  {formatCurrency(parseFloat(item.product?.price || "0"))}
                </TableCell>
                <TableCell className="text-right">
                  {item.product?.discount ? (
                    <span className="text-green-600">
                      {formatCurrency(
                        (parseFloat(item.product.originalPrice || "0") - parseFloat(item.product.price)) || 0
                      )}
                    </span>
                  ) : "-"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end">
                    <Star size={16} className="text-yellow-500 fill-yellow-500 mr-1" />
                    <span>{item.product?.rating}</span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}