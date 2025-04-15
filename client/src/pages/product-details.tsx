import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Loading, FullPageLoading } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { Star, Check, Heart, ShoppingCart } from "lucide-react";
import { Product, User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { SupplierOptions } from "@/components/product/supplier-options";
import { useCart } from "@/hooks/use-cart";

export default function ProductDetails() {
  const [, params] = useRoute("/produto/:slug");
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Get product details
  const { data: product, isLoading } = useQuery<Product>({
    queryKey: [`/api/products/${params?.slug}`],
    enabled: !!params?.slug,
  });
  
  // Get supplier details (in a real implementation, we would have an API for this)
  const { data: supplier, isLoading: isLoadingSupplier } = useQuery<User>({
    queryKey: [`/api/users/${product?.supplierId}`],
    enabled: !!product?.supplierId,
  });
  
  if (isLoading) return <FullPageLoading />;
  if (!product) return null;
  
  const formatPrice = (price: string | number) => {
    return Number(price).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };
  
  // Features list - in a real implementation, these would come from product.features
  const features = product.features || [
    "Capacidade: 100 pratos/hora",
    "Consumo de água: 3,5L por ciclo",
    "Material: Aço inox AISI 304",
    "Potência: 6,7 kW",
    "Garantia: 12 meses"
  ];
  
  const handleBuyClick = async () => {
    if (!user) {
      toast({
        title: "É necessário fazer login",
        description: "Você precisa estar logado para realizar uma compra",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setLoading(true);
      
      // Calculate commission
      const commissionRate = 0.05; // 5% - in production this would come from the commissionSettings
      const commissionAmount = Number(product.price) * commissionRate;
      
      // Create sale record
      await apiRequest("POST", "/api/sales", {
        productId: product.id,
        supplierId: product.supplierId,
        buyerId: user.id,
        quantity: 1,
        totalPrice: product.price,
        commissionRate: commissionRate.toString(),
        commissionAmount: commissionAmount.toString(),
      });
      
      toast({
        title: "Compra realizada com sucesso!",
        description: "Você será redirecionado para o site do fornecedor para concluir sua compra.",
        variant: "default",
      });
      
      // In a real implementation, we would redirect to the supplier's website or checkout page
      
    } catch (error) {
      toast({
        title: "Erro ao processar a compra",
        description: "Ocorreu um erro ao processar sua compra. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddToFavorites = () => {
    toast({
      title: "Adicionado aos favoritos",
      description: "Este produto foi adicionado à sua lista de favoritos",
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <div className="mb-6 text-sm text-gray-500">
            <a href="/" className="hover:text-primary">Home</a> {" / "}
            <a href={`/busca?categoria=${product.categoryId}`} className="hover:text-primary">
              Categoria
            </a> {" / "}
            <span className="text-gray-700">{product.name}</span>
          </div>
          
          {/* Product Details */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
              {/* Product Image */}
              <div className="bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={
                    product.imageData 
                      ? `/api/product-image/${product.id}` 
                      : (product.imageUrl || "https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?auto=format&fit=crop&w=500&h=400")
                  }
                  alt={product.name}
                  className="w-full h-80 md:h-[400px] object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    // Se houver erro ao carregar a imagem do banco, tenta a URL externa
                    if (target.src.includes('/api/product-image/') && product.imageUrl) {
                      target.src = product.imageUrl;
                    } else {
                      // Caso também falhe, mostra imagem padrão
                      target.src = "https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?auto=format&fit=crop&w=500&h=400";
                    }
                  }}
                />
              </div>
              
              {/* Product Info */}
              <div className="flex flex-col">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                
                {/* Rating */}
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`h-5 w-5 ${
                          i < Math.floor(parseFloat(product.rating.toString()))
                            ? "fill-current"
                            : i < Math.ceil(parseFloat(product.rating.toString()))
                            ? "fill-current"
                            : ""
                        }`} 
                      />
                    ))}
                  </div>
                  <span className="ml-2 text-gray-500">
                    ({product.ratingsCount} avaliações)
                  </span>
                </div>
                
                {/* Price */}
                <div className="mb-6">
                  {product.originalPrice && (
                    <span className="block text-gray-500 line-through">
                      {formatPrice(product.originalPrice)}
                    </span>
                  )}
                  <div className="flex items-center">
                    <span className="text-3xl font-bold text-gray-900 relative inline-block">
                      {formatPrice(product.price)}
                      <span className="absolute bottom-1 left-0 w-full h-1 bg-[#FF5A60] bg-opacity-40 -z-10"></span>
                    </span>
                    {product.discount && product.discount > 0 && (
                      <span className="ml-3 bg-[#FF5A60] text-white text-sm font-semibold px-2 py-1 rounded">
                        -{product.discount}% OFF
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-gray-500 mt-1">
                    à vista ou em até 12x 
                  </span>
                </div>
                
                {/* Supplier */}
                {isLoadingSupplier ? (
                  <div className="mb-4"><Loading /></div>
                ) : (
                  <div className="flex items-center mb-6">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      {supplier?.companyName?.charAt(0) || "F"}
                    </div>
                    <div className="ml-3">
                      <p className="font-medium">{supplier?.companyName || "Fornecedor"}</p>
                      <p className="text-sm text-gray-500">Vendido e entregue por {supplier?.companyName || "Fornecedor"}</p>
                    </div>
                  </div>
                )}
                
                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 mt-auto">
                  <Button
                    className="bg-[#FF5A60] hover:bg-opacity-90 text-white font-bold py-3 px-6 rounded-lg flex-1"
                    onClick={handleBuyClick}
                    disabled={loading}
                  >
                    {loading ? (
                      <>Processando...</>
                    ) : (
                      <>
                        <ShoppingCart className="mr-2 h-5 w-5" />
                        Ver oferta
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                    onClick={handleAddToFavorites}
                  >
                    <Heart className="mr-2 h-5 w-5" />
                    Favoritar
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Description and Features */}
            <div className="border-t border-gray-200 p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Description */}
                <div className="md:col-span-2">
                  <h2 className="text-xl font-bold mb-4">Descrição</h2>
                  <div className="text-gray-700">
                    <p>{product.description}</p>
                  </div>
                </div>
                
                {/* Features */}
                <div>
                  <h2 className="text-xl font-bold mb-4">Características</h2>
                  <ul className="space-y-2">
                    {features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            
            {/* Supplier Options */}
            <div className="border-t border-gray-200 p-6">
              <SupplierOptions productSlug={params?.slug || ''} />
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
