import React, { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "wouter";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  ExternalLink,
  Maximize2,
  Info,
  Check,
  Shield,
  ShieldCheck,
  Star, 
  Truck, 
  Package, 
  ShoppingCart, 
  Heart,
  Building, 
  Crown,
  Phone,
  Mail,
  Calendar,
  Clock,
  CheckCircle,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";

export default function SupplierProductDetail() {
  const { productId, supplierId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [isInWishlist, setIsInWishlist] = useState(false);

  // Buscar dados do produto e fornecedor
  const { data, isLoading, error } = useQuery({
    queryKey: [`/api/products/${productId}/supplier/${supplierId}`],
    queryFn: async () => {
      const res = await fetch(`/api/products/${productId}/supplier/${supplierId}`);
      if (!res.ok) {
        throw new Error("Erro ao carregar dados do fornecedor");
      }
      return res.json();
    },
    enabled: !!productId && !!supplierId
  });

  // Extrair produto e fornecedor dos dados
  const product = data?.product;
  const supplier = data?.supplier;

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

  // Se estiver carregando, mostrar skeletons
  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Skeleton className="h-8 w-2/3 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <Skeleton className="h-96 rounded-md" />
          <div>
            <Skeleton className="h-10 w-3/4 mb-2" />
            <Skeleton className="h-6 w-1/4 mb-4" />
            <Skeleton className="h-6 w-1/2 mb-2" />
            <Skeleton className="h-20 w-full mb-6" />
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Se houver erro, mostrar mensagem de erro
  if (error || !product) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="bg-red-50 border border-red-200 p-6 rounded-lg mb-8">
          <h2 className="text-xl font-bold text-red-700 mb-2">Erro ao carregar produto</h2>
          <p className="text-red-600">
            Não foi possível carregar as informações deste produto no fornecedor solicitado.
            Por favor, tente novamente mais tarde ou volte para a página anterior.
          </p>
          <Button 
            className="mt-4" 
            variant="outline"
            onClick={() => navigate(-1)}
          >
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Breadcrumbs */}
      <Breadcrumb className="mb-6">
        <BreadcrumbItem>
          <BreadcrumbLink as={Link} href="/">Início</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink as={Link} href={`/categorias/${product.categorySlug || 'todas'}`}>
            {product.categoryName || 'Todas as categorias'}
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink as={Link} href={`/produtos/${product.slug}`}>
            {product.name}
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink className="font-semibold text-primary">
            {supplier.name}
          </BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      {/* Cabeçalho do produto */}
      <div className="flex flex-col md:flex-row items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                  key={star} 
                  size={16} 
                  className={`${parseFloat(product.rating || "0") >= star 
                    ? "text-yellow-500 fill-yellow-500" 
                    : "text-gray-300"}`}
                />
              ))}
              <span className="ml-2 text-sm">{product.rating} ({product.ratingsCount || 0} avaliações)</span>
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Em estoque
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            Código: {product.id} | Fornecido por <span className="font-medium text-foreground">{supplier.name}</span>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
        {/* Coluna da imagem */}
        <div className="md:col-span-1">
          <div className="bg-gray-50 rounded-md p-4 flex items-center justify-center h-[300px] md:h-[400px] mb-4 relative">
            <img 
              src={product.imageUrl || product.images?.[0]?.imageUrl || "/assets/produto-sem-imagem.png"} 
              alt={product.name} 
              className="max-h-full max-w-full object-contain"
            />
            <Button 
              size="sm" 
              variant="outline" 
              className="absolute top-2 right-2 h-8 w-8 p-0"
              onClick={() => {
                // Abrir imagem em tela cheia ou modal
                window.open(product.imageUrl || product.images?.[0]?.imageUrl || "/assets/produto-sem-imagem.png", '_blank');
              }}
            >
              <Maximize2 size={16} />
            </Button>
          </div>

          {/* Selos de garantia */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 rounded-md p-3 flex items-center">
              <ShieldCheck size={20} className="text-blue-600 mr-2" />
              <div className="text-xs">
                <p className="font-medium text-blue-800">Garantia de {product.warranty || '90 dias'}</p>
                <p className="text-blue-700">Direto do fornecedor</p>
              </div>
            </div>
            <div className="bg-green-50 rounded-md p-3 flex items-center">
              <Truck size={20} className="text-green-600 mr-2" />
              <div className="text-xs">
                <p className="font-medium text-green-800">Entrega Rápida</p>
                <p className="text-green-700">{product.deliveryTime || '3-5 dias úteis'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Coluna de informações e ações */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader className="border-b pb-3">
              <CardTitle className="text-2xl">Detalhes do Fornecedor</CardTitle>
              <CardDescription>
                Você está visualizando este produto fornecido por {supplier.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
              <div>
                {/* Informações do fornecedor */}
                <div className="flex items-center mb-4">
                  <div className="relative">
                    <div className="h-16 w-16 rounded-md bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl overflow-hidden">
                      {supplier.imageUrl ? (
                        <img 
                          src={supplier.imageUrl} 
                          alt={supplier.name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{supplier.name?.charAt(0) || "F"}</span>
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-green-500 text-white text-xs p-1 rounded-full">
                      <CheckCircle size={16} />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-medium">{supplier.name}</h4>
                    <p className="text-muted-foreground">{supplier.companyName}</p>
                    <div className="flex flex-col gap-1 mt-1">
                      <div className="flex items-center">
                        <Star size={14} className="text-yellow-500 fill-yellow-500" />
                        <span className="ml-1 text-sm">
                          {supplier.rating || "4.8"} de avaliação ({supplier.ratingsCount || "241"})
                        </span>
                      </div>
                      <Badge variant="outline" className="w-fit text-xs bg-green-50 text-green-700 border-green-200">
                        Fornecedor Premium
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center">
                    <Building size={16} className="mr-2 text-primary" />
                    <span>Fornecedor verificado</span>
                  </div>
                  
                  <div className="flex items-center">
                    <Calendar size={16} className="mr-2 text-primary" />
                    <span>
                      Ativo há {supplier.activeYears || 5} anos
                    </span>
                  </div>
                  
                  <div className="flex items-center">
                    <Clock size={16} className="mr-2 text-primary" />
                    <span>Tempo médio de resposta: 2 horas</span>
                  </div>
                </div>

                <h4 className="font-medium mb-2">Entre em contato:</h4>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Phone size={16} className="mr-2" />
                    {supplier.phone || "(11) 99999-9999"}
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-start">
                    <Mail size={16} className="mr-2" />
                    {supplier.email || "contato@" + supplier.name.toLowerCase().replace(/\s+/g, '') + ".com.br"}
                  </Button>
                </div>
              </div>

              <div className="flex flex-col">
                {/* Preço */}
                <div className="bg-gray-50 p-4 rounded-md mb-4">
                  <div className="flex flex-col">
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
                        <Badge variant="outline" className="ml-2 text-xs bg-red-50 text-red-600 border-red-200">
                          {product.discount}% OFF
                        </Badge>
                      )}
                    </div>
                    
                    <div className="text-sm text-muted-foreground mt-1">
                      Em até 12x de {formatCurrency(parseFloat(product.price) / 12)} sem juros
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center text-sm">
                      <Truck size={14} className="mr-1 text-green-600" />
                      <span className="text-green-700">Entrega em {product.deliveryTime || '3-5 dias úteis'}</span>
                    </div>
                    
                    <div className="flex items-center mt-1 text-sm">
                      <Check size={14} className="mr-1 text-green-600" />
                      <span className="text-green-700">Em estoque: {product.stock || 10} unidades</span>
                    </div>
                  </div>
                </div>
                
                {/* Quantidade e botões de ação */}
                <div className="mb-4">
                  <label className="text-sm font-medium mb-2 block">Quantidade:</label>
                  <div className="flex items-center mb-4">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={decrementQuantity} 
                      disabled={quantity <= 1}
                    >
                      -
                    </Button>
                    <span className="mx-4 font-medium">{quantity}</span>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={incrementQuantity}
                      disabled={quantity >= (product.stock || 10)}
                    >
                      +
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-3 mt-auto">
                  <Button 
                    className="w-full"
                    size="lg"
                    onClick={handleAddToCart}
                  >
                    <ShoppingCart className="mr-2" size={18} />
                    Adicionar ao Carrinho
                  </Button>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={toggleWishlist}
                    >
                      <Heart className={`mr-2 ${isInWishlist ? "fill-red-500 text-red-500" : ""}`} size={16} />
                      {isInWishlist ? "Salvo" : "Favoritar"}
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full"
                      asChild
                    >
                      <Link href={`/produtos/${product.slug}`}>
                        <ExternalLink className="mr-2" size={16} />
                        Ver todas as opções
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Descrição do produto */}
          <div className="mt-6">
            <h2 className="text-xl font-bold mb-3">Descrição do produto</h2>
            <div className="text-muted-foreground">
              <p className="mb-4">{product.description}</p>
              
              {product.features && product.features.length > 0 && (
                <>
                  <h3 className="text-lg font-medium text-foreground mb-2">Características principais:</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {product.features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Botão de voltar com link para comparação */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-10">
        <div className="flex items-start">
          <Info size={18} className="text-blue-500 mr-3 mt-1 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-blue-800 mb-1">Deseja comparar mais fornecedores?</h4>
            <p className="text-sm text-blue-700 mb-3">
              Volte para a página de comparação para ver as ofertas de outros fornecedores para este mesmo produto.
            </p>
            <Button 
              variant="outline" 
              className="bg-white" 
              asChild
            >
              <Link href={`/produtos/${product.slug}`}>
                <ExternalLink size={16} className="mr-2" />
                Ver todas as opções de fornecedores
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}