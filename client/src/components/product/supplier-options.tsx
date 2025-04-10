import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Product, User } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle, ShoppingCart, ExternalLink } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useCart } from "@/hooks/use-cart";

interface ProductWithSupplier extends Product {
  supplier: Omit<User, "password"> | null;
  isBestPrice: boolean;
}

interface SupplierOptionsProps {
  productSlug: string;
}

export function SupplierOptions({ productSlug }: SupplierOptionsProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { addItem } = useCart();
  const [processingId, setProcessingId] = useState<number | null>(null);
  
  const { data: products, isLoading, error } = useQuery<ProductWithSupplier[]>({
    queryKey: [`/api/products/${productSlug}/suppliers`],
    enabled: !!productSlug,
  });
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-lg">
        <p>Erro ao carregar opções de fornecedores</p>
      </div>
    );
  }
  
  if (!products || products.length === 0) {
    return null;
  }
  
  // Function to handle adding to cart
  const handleAddToCart = (product: ProductWithSupplier) => {
    addItem(product);
    toast({
      title: "Produto adicionado ao carrinho",
      description: `${product.name} foi adicionado ao seu carrinho`,
    });
  };
  
  // Function to handle Buy/View Offer click
  const handleBuyClick = async (product: ProductWithSupplier) => {
    if (!user) {
      toast({
        title: "É necessário fazer login",
        description: "Você precisa estar logado para realizar uma compra",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setProcessingId(product.id);
      
      // Calculate commission - in a real app, we would get this from the API
      const commissionRate = 0.05; // 5%
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
      setProcessingId(null);
    }
  };
  
  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">Opções de fornecedores</h2>
      
      <div className="space-y-4">
        {products.map((product) => (
          <Card key={product.id} className={`
            border overflow-hidden
            ${product.isBestPrice ? 'border-green-500 shadow-md' : 'border-gray-200'}
          `}>
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Supplier Information */}
                <div className="bg-gray-50 p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-semibold text-gray-700 overflow-hidden">
                        {product.supplier && product.supplier.id ? (
                          <img 
                            src={`/api/supplier-logo/${product.supplier.id}`} 
                            alt={product.supplier?.companyName || "Logo do fornecedor"}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              // Se falhar, mostrar a letra inicial como fallback
                              target.style.display = 'none';
                              const companyName = product.supplier?.companyName || product.supplier?.username || "F";
                              target.parentElement!.textContent = companyName.charAt(0);
                            }}
                          />
                        ) : (
                          (product.supplier?.companyName || product.supplier?.username || "F").charAt(0)
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold">
                          {product.supplier?.companyName || "Fornecedor"}
                        </h3>
                        {product.isBestPrice && (
                          <Badge className="bg-green-500 text-white">Melhor preço</Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-3 text-sm text-gray-600">
                      <p>CNPJ: {product.supplier?.cnpj || "N/A"}</p>
                      <p>Desde: {product.supplier?.createdAt 
                        ? new Date(product.supplier.createdAt).toLocaleDateString('pt-BR') 
                        : "N/A"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                      <span>Entrega verificada</span>
                    </div>
                  </div>
                </div>
                
                {/* Price Section */}
                <div className="p-4 flex flex-col justify-center">
                  <div className="mb-2">
                    {product.originalPrice && (
                      <span className="block text-gray-500 line-through text-sm">
                        {formatCurrency(Number(product.originalPrice))}
                      </span>
                    )}
                    <div className="flex items-center">
                      <span className="text-2xl font-bold text-gray-900">
                        {formatCurrency(Number(product.price))}
                      </span>
                      {product.discount && product.discount > 0 && (
                        <span className="ml-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
                          -{product.discount}% OFF
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">
                    à vista ou em até 12x
                  </span>
                </div>
                
                {/* Delivery Information */}
                <div className="p-4 flex flex-col justify-center">
                  <div className="space-y-1">
                    <p className="text-gray-700 font-medium">
                      Entrega estimada: 3-7 dias úteis
                    </p>
                    {product.isBestPrice && (
                      <p className="text-green-600 font-semibold flex items-center">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Melhor custo-benefício
                      </p>
                    )}
                    <p className="text-sm text-gray-500">
                      Frete a calcular
                    </p>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="p-4 flex flex-col justify-center gap-2">
                  <Button
                    className="bg-primary hover:bg-primary/90"
                    onClick={() => handleBuyClick(product)}
                    disabled={processingId === product.id}
                  >
                    {processingId === product.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processando
                      </>
                    ) : (
                      <>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Ver oferta
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="border-gray-300"
                    onClick={() => handleAddToCart(product)}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Adicionar ao carrinho
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}