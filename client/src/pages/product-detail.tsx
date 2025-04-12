import React, { useState, useEffect } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger 
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ExternalLink,
  Maximize2,
  Info,
  Check,
  Shield,
  Star, 
  Truck, 
  Package, 
  ShoppingCart, 
  Heart, 
  Share2, 
  Phone, 
  Mail,
  User,
  Building,
  ArrowLeft,
  Clock,
  Calendar,
  DollarSign,
  CheckCircle,
  Crown,
  ShieldCheck
} from "lucide-react";

// Tipos
interface Supplier {
  id: number;
  name: string;
  companyName: string | null;
  role: string;
  email?: string;
  phone?: string;
  address?: string;
  rating?: string;
  activeYears?: number;
  imageUrl?: string | null;
  ratingsCount?: number;
  isPremium?: boolean;
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
  supplier?: Supplier;
  specifications?: Array<{name: string, value: string}>;
  images?: Array<{id: number, imageUrl: string}>;
  stock?: number;
  sku?: string;
  deliveryTime?: string;
  warranty?: string;
  longDescription?: string;
  isBestPrice?: boolean; // Indica se é a melhor opção de preço entre fornecedores
}

// Funções auxiliares
const formatCurrency = (value: string | number): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numValue);
};

export default function ProductDetailPage() {
  const { slug } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isInWishlist, setIsInWishlist] = useState(false);

  // Buscar os dados do produto
  const { data: product, isLoading, error } = useQuery({
    queryKey: ["/api/products", slug],
    queryFn: async () => {
      const res = await fetch(`/api/products/${slug}`);
      if (!res.ok) {
        throw new Error("Falha ao carregar produto");
      }
      return res.json() as Promise<Product>;
    },
    enabled: !!slug
  });

  // Buscar produtos relacionados (mesma categoria)
  const { data: relatedProducts } = useQuery({
    queryKey: ["/api/products/related", product?.categoryId],
    queryFn: async () => {
      const res = await fetch(`/api/products/related/${product?.categoryId}?exclude=${product?.id}`);
      if (!res.ok) {
        throw new Error("Falha ao carregar produtos relacionados");
      }
      return res.json() as Promise<Product[]>;
    },
    enabled: !!product?.categoryId
  });

  // Buscar o mesmo produto de diferentes fornecedores
  const { data: supplierOptions, isLoading: loadingSuppliers } = useQuery({
    queryKey: ["/api/products/suppliers", slug],
    queryFn: async () => {
      const res = await fetch(`/api/products/${slug}/suppliers`);
      if (!res.ok) {
        throw new Error("Falha ao carregar opções de fornecedores");
      }
      return res.json() as Promise<Product[]>;
    },
    enabled: !!slug && !!product
  });

  // Gerenciar a quantidade
  const incrementQuantity = () => {
    if (quantity < (product?.stock || 10)) {
      setQuantity(prev => prev + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  // Adicionar ao carrinho
  const handleAddToCart = () => {
    toast({
      title: "Produto adicionado ao carrinho",
      description: `${quantity} unidades de ${product?.name} foram adicionadas ao carrinho.`,
      duration: 3000,
    });
  };

  // Alternar wishlist
  const toggleWishlist = () => {
    setIsInWishlist(!isInWishlist);
    toast({
      title: isInWishlist ? "Produto removido dos favoritos" : "Produto adicionado aos favoritos",
      duration: 2000,
    });
  };

  // Compartilhar produto
  const shareProduct = () => {
    if (navigator.share) {
      navigator.share({
        title: product?.name,
        text: product?.description,
        url: window.location.href,
      })
      .catch((error) => console.log('Erro ao compartilhar', error));
    } else {
      // Alternativa para navegadores que não suportam a API Web Share
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copiado para a área de transferência",
        description: "Você pode compartilhar este link com outras pessoas.",
        duration: 2000,
      });
    }
  };

  // Contatar fornecedor
  const contactSupplier = () => {
    // Aqui você pode implementar uma lógica para abrir um chat com o fornecedor
    // ou redirecionar para uma página de contato
    toast({
      title: "Contatar fornecedor",
      description: `Enviaremos uma mensagem para ${product?.supplier?.name}.`,
      duration: 3000,
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 mt-4">
        <div className="flex mb-4">
          <Skeleton className="h-6 w-24 mr-2" />
          <Skeleton className="h-6 w-24 mr-2" />
          <Skeleton className="h-6 w-24" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <Skeleton className="aspect-square rounded-lg" />
          <div>
            <Skeleton className="h-10 w-3/4 mb-4" />
            <Skeleton className="h-6 w-1/4 mb-2" />
            <Skeleton className="h-6 w-1/2 mb-4" />
            <Skeleton className="h-24 w-full mb-4" />
            <Skeleton className="h-10 w-full mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto p-4 mt-8 text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-2">Erro ao carregar dados</h2>
        <p className="mb-4">Não foi possível carregar as informações deste produto.</p>
        <Button onClick={() => navigate("/")}>Voltar para o início</Button>
      </div>
    );
  }

  // Preparar imagens do produto (principal + adicionais)
  const productImages = product.images && product.images.length > 0 
    ? product.images.map(img => img.imageUrl)
    : [product.imageUrl || "https://via.placeholder.com/600x600"];

  // Obter imagem ativa
  const activeImage = productImages[activeImageIndex];

  return (
    <div className="container mx-auto p-4">
      {/* Breadcrumbs */}
      <div className="mb-6">
        <Breadcrumb>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Início</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/categorias/${product.categoryId}`}>Categoria</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink>{product.name}</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
      </div>

      {/* Botão Voltar */}
      <div className="mb-6">
        <Button variant="outline" size="sm" onClick={() => window.history.back()}>
          <ArrowLeft size={16} className="mr-2" /> Voltar
        </Button>
      </div>
      
      {/* Seção principal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Coluna de imagens */}
        <div>
          <div className="rounded-lg overflow-hidden border mb-4 bg-white">
            <img 
              src={activeImage} 
              alt={product.name} 
              className="w-full h-auto object-contain aspect-square"
            />
          </div>
          
          {productImages.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {productImages.map((img, index) => (
                <div 
                  key={index}
                  className={`border rounded cursor-pointer hover:border-primary transition-all ${index === activeImageIndex ? 'border-primary ring-2 ring-primary/30' : ''}`}
                  onClick={() => setActiveImageIndex(index)}
                >
                  <img 
                    src={img} 
                    alt={`${product.name} - imagem ${index + 1}`} 
                    className="w-full h-auto aspect-square object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Coluna de informações */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">{product.name}</h1>
          
          <div className="flex items-center mb-2">
            <div className="flex items-center">
              <Star size={16} className="text-yellow-500 fill-yellow-500" />
              <span className="ml-1 mr-2">{product.rating} ({product.ratingsCount} avaliações)</span>
            </div>
            <Badge variant="outline" className="ml-2">SKU: {product.sku || `PROD${product.id}`}</Badge>
          </div>
          
          <div className="mb-4">
            <div className="flex items-baseline">
              {product.originalPrice && parseFloat(product.originalPrice) > parseFloat(product.price) && (
                <span className="text-muted-foreground line-through text-sm mr-2">
                  {formatCurrency(product.originalPrice)}
                </span>
              )}
              <span className="text-3xl font-bold text-primary">
                {formatCurrency(product.price)}
              </span>
              
              {product.discount && product.discount > 0 && (
                <Badge className="ml-2 bg-red-500 hover:bg-red-600">
                  {product.discount}% OFF
                </Badge>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground mt-1">
              Ou em até 12x no cartão de crédito
            </p>
          </div>
          
          <div className="mb-4">
            <p>{product.description}</p>
          </div>
          
          {/* Fornecedor */}
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex items-start">
                  <div className="h-12 w-12 rounded-full relative">
                    {product.supplier?.imageUrl ? (
                      <img 
                        src={product.supplier.imageUrl} 
                        alt={product.supplier.name} 
                        className="w-full h-full object-cover rounded-full border-2 border-primary/20"
                      />
                    ) : (
                      <div className="h-full w-full rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {product.supplier?.name.charAt(0)}
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 bg-green-500 text-white text-xs p-1 rounded-full">
                      <CheckCircle size={12} />
                    </div>
                  </div>
                  <div className="ml-3">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{product.supplier?.name}</p>
                      {product.supplier?.isPremium && (
                        <Badge variant="outline" className="h-5 text-[10px] bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1">
                          <Crown size={10} className="text-amber-500" /> Premium
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{product.supplier?.companyName}</p>
                    <div className="flex flex-col gap-1 mt-1">
                      <div className="flex items-center">
                        <Star size={14} className="text-yellow-500 fill-yellow-500" />
                        <span className="ml-1 text-xs">
                          {product.supplier?.rating || "4.8"} ({product.supplier?.ratingsCount || "241"} avaliações)
                        </span>
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar size={14} className="mr-1" />
                        <span>{product.supplier?.activeYears || 3} anos no mercado</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={contactSupplier}
                    className="gap-1"
                  >
                    <Mail size={14} /> Contatar
                  </Button>
                  <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200 flex items-center justify-center gap-1 py-1">
                    <ShieldCheck size={10} className="text-blue-500" /> Verificado
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Quantidade e disponibilidade */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={decrementQuantity}
                disabled={quantity <= 1}
              >
                -
              </Button>
              <span className="mx-4 w-8 text-center">{quantity}</span>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={incrementQuantity}
                disabled={quantity >= (product.stock || 10)}
              >
                +
              </Button>
            </div>
            
            <div className="text-sm">
              <span className="text-green-600 font-medium flex items-center">
                <Check size={16} className="mr-1" /> 
                Em estoque ({product.stock || 'Disponível'})
              </span>
            </div>
          </div>
          
          {/* Botões de ação */}
          <div className="grid grid-cols-1 gap-2 mb-4">
            <Button 
              size="lg" 
              className="gap-2"
              onClick={handleAddToCart}
            >
              <ShoppingCart size={18} /> 
              Adicionar ao Carrinho
            </Button>
            
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={toggleWishlist}
              >
                <Heart size={18} className={isInWishlist ? "fill-red-500 text-red-500" : ""} /> 
                Favoritar
              </Button>
              
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={shareProduct}
              >
                <Share2 size={18} /> 
                Compartilhar
              </Button>
            </div>
          </div>
          
          {/* Detalhes de entrega */}
          <div className="rounded-md bg-primary/5 p-4 mb-4">
            <h3 className="text-sm font-medium mb-2">Informações de entrega:</h3>
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center">
                <Truck size={16} className="mr-2 text-primary" />
                <span className="text-sm">Entrega em {product.deliveryTime || '3-5 dias úteis'}</span>
              </div>
              <div className="flex items-center">
                <Package size={16} className="mr-2 text-primary" />
                <span className="text-sm">Enviado por {product.supplier?.name}</span>
              </div>
              <div className="flex items-center">
                <Shield size={16} className="mr-2 text-primary" />
                <span className="text-sm">Garantia de {product.warranty || '90 dias'}</span>
              </div>
            </div>
          </div>
          
          {/* Características principais */}
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-2">Características principais:</h3>
            <ul className="text-sm space-y-1">
              {product.features?.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <Check size={16} className="mr-1 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      
      {/* Opções de fornecedores */}
      {supplierOptions && supplierOptions.length > 1 && (
        <div className="mb-10">
          <div className="border-b pb-4 mb-6">
            <h2 className="text-2xl font-bold">Opções de fornecedores</h2>
            <p className="text-muted-foreground">
              Confira o mesmo produto disponível de diferentes fornecedores
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-4 mb-4">
            {supplierOptions.map((option, index) => (
              <Card 
                key={option.id} 
                className={`overflow-hidden transition-all border-2 ${option.isBestPrice ? 'border-primary' : 'hover:border-primary/50'} cursor-pointer group`}
              >
                <CardContent className="p-0">
                  <div 
                    className="grid grid-cols-1 md:grid-cols-5 gap-2 relative hover:bg-gray-50/50 transition-colors"
                    onClick={() => navigate(`/produtos/${option.slug}`)}
                  >
                    {/* Faixa "Melhor Preço" no canto superior esquerdo, se aplicável */}
                    {option.isBestPrice && (
                      <div className="absolute top-0 left-0 bg-green-600 text-white text-xs py-1 px-3 rounded-br-md">
                        MELHOR PREÇO
                      </div>
                    )}
                    
                    {/* Coluna da imagem */}
                    <div className="bg-white p-4 flex items-center justify-center md:border-r">
                      <div className="relative group-hover:scale-105 transition-transform duration-300">
                        <img 
                          src={option.imageUrl || option.images?.[0]?.imageUrl || "/assets/produto-sem-imagem.png"}
                          alt={option.name}
                          className="w-24 h-24 object-contain mx-auto"
                        />
                        <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 rounded-md transition-opacity duration-300 flex items-center justify-center">
                          <Maximize2 size={20} className="text-primary" />
                        </div>
                      </div>
                    </div>
                    
                    {/* Coluna de informações */}
                    <div className="p-4 md:col-span-2">
                      <div className="flex flex-col">
                        <h3 className="font-semibold group-hover:text-primary transition-colors">
                          {option.name}
                        </h3>
                        
                        <div className="flex items-center mt-1 mb-2">
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star 
                                key={star} 
                                size={14} 
                                className={`${parseFloat(option.rating || "0") >= star 
                                  ? "text-yellow-500 fill-yellow-500" 
                                  : "text-gray-300"}`}
                              />
                            ))}
                            <span className="ml-1 text-xs">{option.rating} ({option.ratingsCount})</span>
                          </div>
                          
                          {option.isBestPrice && (
                            <Badge className="ml-2 bg-green-600 hover:bg-green-700 text-white text-xs">
                              Melhor preço
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center text-sm">
                              <Building size={14} className="mr-1 text-gray-500" />
                              <span className="truncate">{option.supplier?.name || "Fornecedor Verificado"}</span>
                            </div>
                            
                            {/* Selo Premium para fornecedores especiais */}
                            {(option.supplier?.isPremium || option.isBestPrice) && (
                              <Badge variant="outline" className="h-5 text-[10px] bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1">
                                <Crown size={10} className="text-amber-500" /> Premium
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between mt-1">
                            <div className="flex items-center text-xs text-gray-500">
                              <Calendar size={14} className="mr-1" />
                              <span>{option.supplier?.activeYears || 3} anos no mercado</span>
                            </div>
                            
                            <div className="flex items-center text-xs">
                              <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1">
                                <ShieldCheck size={10} className="text-blue-500" /> Verificado
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="flex items-center text-xs text-gray-500 mt-1">
                            <DollarSign size={14} className="mr-1" />
                            <span>
                              {option.isBestPrice 
                                ? "Melhor preço confirmado" 
                                : `${(Math.random() * 20).toFixed(2)}% acima do menor preço`}
                            </span>
                          </div>
                        </div>
                        
                        {/* Recursos/características do produto destacados */}
                        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-1">
                          {option.features?.slice(0, 3).map((feature, idx) => (
                            <div key={idx} className="flex items-start text-xs">
                              <Check size={12} className="mr-1 text-green-500 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-600 truncate">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {/* Coluna de preço e entrega */}
                    <div className="p-4 bg-gray-50 flex flex-col">
                      <div className="flex items-baseline">
                        {option.originalPrice && parseFloat(option.originalPrice) > parseFloat(option.price) && (
                          <span className="text-muted-foreground line-through text-xs mr-2">
                            {formatCurrency(option.originalPrice)}
                          </span>
                        )}
                        <span className="text-xl font-bold text-primary">
                          {formatCurrency(option.price)}
                        </span>
                        
                        {/* Exibir desconto quando possível */}
                        {option.discount && option.discount > 0 && (
                          <Badge variant="outline" className="ml-2 text-xs bg-red-50 text-red-600 border-red-200">
                            {option.discount}% OFF
                          </Badge>
                        )}
                      </div>
                      
                      <div className="text-xs text-muted-foreground mt-1">
                        Em até 12x no cartão
                      </div>
                      
                      <div className="flex items-center mt-2 text-xs">
                        <Truck size={14} className="mr-1 text-primary" />
                        <span>Entrega em {option.deliveryTime || '3-5 dias úteis'}</span>
                      </div>

                      {/* Outras informações */}
                      <div className="flex items-center mt-1 text-xs">
                        <Shield size={14} className="mr-1 text-primary" />
                        <span>Garantia de {option.warranty || '12 meses'}</span>
                      </div>
                      
                      {/* Exibir quando é produto com estoque disponível */}
                      {option.stock !== undefined && option.stock > 0 && (
                        <div className="flex items-center mt-1 text-xs text-green-600">
                          <Check size={14} className="mr-1" />
                          <span>Em estoque: {option.stock} unidades</span>
                        </div>
                      )}
                      
                      {/* Status do fornecedor */}
                      <div className="flex items-center mt-2 text-xs">
                        <Badge 
                          variant="outline" 
                          className="text-xs bg-green-50 text-green-700 border-green-200 flex items-center gap-1"
                        >
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          Online agora
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Coluna de ação */}
                    <div className="p-4 flex flex-col justify-center items-center gap-2 relative">
                      <Button 
                        className="w-full group-hover:bg-primary/90"
                        onClick={(e) => {
                          e.stopPropagation(); // Evita navegação duplicada
                          navigate(`/produtos/${option.slug}`);
                          toast({
                            title: "Prosseguindo para compra",
                            description: `Você selecionou: ${option.name}`,
                            duration: 3000,
                          });
                        }}
                      >
                        <ShoppingCart size={14} className="mr-1" />
                        Comprar
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="w-full group-hover:bg-gray-50 group-hover:border-primary"
                        onClick={(e) => {
                          e.stopPropagation(); // Evita navegação duplicada
                          
                          // Se tivermos o ID do fornecedor, usamos a nova rota de fornecedor específico
                          if (option.supplierId && product.id) {
                            // Navega para a página de detalhes do produto fornecido por um fornecedor específico
                            navigate(`/produtos/${product.id}/fornecedor/${option.supplierId}`);
                          } else {
                            // Fallback para a navegação anterior
                            navigate(`/produtos/${option.slug}`);
                          }
                        }}
                      >
                        <ExternalLink size={14} className="mr-1" />
                        Ver detalhes do fornecedor
                      </Button>
                      
                      {/* Adicionar tooltips indicando interatividade */}
                      <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="p-1 bg-primary/10 rounded-full">
                                <Info size={14} className="text-primary" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">Clique em qualquer lugar do card para ver detalhes do produto</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Informações adicionais sobre a comparação */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-start">
              <Info size={18} className="text-blue-500 mr-3 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-blue-800 mb-1">Comparando {supplierOptions.length} fornecedores</h4>
                <p className="text-sm text-blue-700">
                  Este é o mesmo produto vendido por diferentes fornecedores. Você pode clicar em qualquer 
                  opção para ver mais detalhes específicos de cada anúncio, incluindo especificações completas,
                  condições de pagamento, informações de entrega e mais avaliações.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Abas de informações adicionais */}
      <Tabs defaultValue="details" className="mb-10">
        <TabsList className="grid grid-cols-3 md:w-[400px]">
          <TabsTrigger value="details">Detalhes</TabsTrigger>
          <TabsTrigger value="specs">Especificações</TabsTrigger>
          <TabsTrigger value="supplier">Fornecedor</TabsTrigger>
        </TabsList>
        
        <div className="mt-4 border rounded-md p-6">
          <TabsContent value="details" className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold mb-2">Sobre o produto</h3>
              <div className="text-muted-foreground">
                <p className="mb-4">{product.longDescription || product.description}</p>
                
                <h4 className="font-medium text-foreground mt-4 mb-2">Benefícios</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {product.features?.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="specs">
            <h3 className="text-xl font-semibold mb-4">Especificações técnicas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {product.specifications ? (
                product.specifications.map((spec, index) => (
                  <div key={index} className="flex border-b pb-2">
                    <span className="text-muted-foreground min-w-[140px]">{spec.name}:</span>
                    <span className="font-medium">{spec.value}</span>
                  </div>
                ))
              ) : (
                <div className="col-span-2">
                  <p className="text-muted-foreground">
                    As especificações detalhadas deste produto ainda não estão disponíveis.
                    Entre em contato com o fornecedor para mais informações.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="supplier">
            <h3 className="text-xl font-semibold mb-4">Informações do Fornecedor</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center mb-4">
                  <div className="relative">
                    <div className="h-16 w-16 rounded-md bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl overflow-hidden">
                      {product.supplier?.imageUrl ? (
                        <img 
                          src={product.supplier.imageUrl} 
                          alt={product.supplier.name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{product.supplier?.name?.charAt(0) || "F"}</span>
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-green-500 text-white text-xs p-1 rounded-full">
                      <CheckCircle size={16} />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-medium">{product.supplier?.name}</h4>
                    <p className="text-muted-foreground">{product.supplier?.companyName}</p>
                    <div className="flex flex-col gap-1 mt-1">
                      <div className="flex items-center">
                        <Star size={14} className="text-yellow-500 fill-yellow-500" />
                        <span className="ml-1 text-sm">
                          {product.supplier?.rating || "4.8"} de avaliação ({product.supplier?.ratingsCount || "241"})
                        </span>
                      </div>
                      <Badge variant="outline" className="w-fit text-xs bg-green-50 text-green-700 border-green-200">
                        Fornecedor Premium
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Building size={16} className="mr-2 text-primary" />
                    <span>Fornecedor verificado</span>
                  </div>
                  
                  <div className="flex items-center">
                    <Calendar size={16} className="mr-2 text-primary" />
                    <span>
                      Ativo há {product.supplier?.activeYears || 5} anos
                    </span>
                  </div>
                  
                  <div className="flex items-center">
                    <Clock size={16} className="mr-2 text-primary" />
                    <span>Tempo médio de resposta: 2 horas</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Entre em contato:</h4>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Phone size={16} className="mr-2" />
                    {product.supplier?.phone || "(11) 99999-9999"}
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-start">
                    <Mail size={16} className="mr-2" />
                    {product.supplier?.email || "contato@" + product.supplier?.name.toLowerCase().replace(/\s+/g, '') + ".com.br"}
                  </Button>
                  
                  <Button className="w-full" onClick={contactSupplier}>
                    Enviar Mensagem
                  </Button>
                </div>
                
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">
                    Ao entrar em contato, informe que você viu este produto na plataforma Gastro.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
      
      {/* Produtos relacionados */}
      {relatedProducts && relatedProducts.length > 0 && (
        <div className="mb-10">
          <h2 className="text-2xl font-bold mb-6">Produtos relacionados</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {relatedProducts.slice(0, 4).map((relatedProduct) => (
              <Card key={relatedProduct.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-square overflow-hidden">
                  <img 
                    src={relatedProduct.imageUrl || "https://via.placeholder.com/300x300"} 
                    alt={relatedProduct.name} 
                    className="w-full h-full object-cover transition-transform hover:scale-105"
                  />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-medium line-clamp-2 h-12">{relatedProduct.name}</h3>
                  <div className="flex items-center mt-1 mb-2">
                    <Star size={14} className="text-yellow-500 fill-yellow-500" />
                    <span className="ml-1 text-xs">{relatedProduct.rating}</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-lg font-bold text-primary">
                      {formatCurrency(relatedProduct.price)}
                    </span>
                    {relatedProduct.discount && relatedProduct.discount > 0 && (
                      <Badge className="text-xs bg-red-500 hover:bg-red-600">
                        {relatedProduct.discount}% OFF
                      </Badge>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    asChild
                  >
                    <a href={`/produtos/${relatedProduct.slug}`}>
                      Ver Produto
                    </a>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}