import { useState } from "react";
import { useLocation, Link } from "wouter";
import { 
  ArrowLeft, 
  Trash2, 
  Plus, 
  Minus, 
  ChevronRight,
  ShoppingBag
} from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Header } from "@/components/layout/header";
import { MobileNavigation } from "@/components/layout/mobile-navigation";

export default function CartPage() {
  const [, navigate] = useLocation();
  const { items, removeItem, updateQuantity, getTotalPrice } = useCart();
  const [animatedItemId, setAnimatedItemId] = useState<number | null>(null);

  const handleRemove = (productId: number) => {
    setAnimatedItemId(productId);
    
    // Aguarda a animação terminar antes de remover o item
    setTimeout(() => {
      removeItem(productId);
      setAnimatedItemId(null);
    }, 300);
  };

  const handleUpdateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      handleRemove(productId);
      return;
    }
    
    updateQuantity(productId, quantity);
  };

  const handleCheckout = () => {
    navigate("/checkout");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="mobile-header flex items-center px-4 py-3">
        <Button 
          variant="ghost" 
          size="icon" 
          className="touch-target mr-2" 
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-bold">Seu Carrinho</h1>
      </div>
      
      <main className="flex-grow mobile-container p-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-10">
            <div className="bg-slate-100 p-5 rounded-full mb-4">
              <ShoppingBag className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-xl font-bold mb-2">Seu carrinho está vazio</h2>
            <p className="text-muted-foreground mb-6">
              Explore nossos produtos e adicione itens ao seu carrinho
            </p>
            <Button 
              className="btn-primary" 
              onClick={() => navigate("/")}
            >
              Explorar Produtos
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-6">
              {items.map((item) => (
                <div
                  key={item.product.id}
                  className={`app-like-card p-4 transition-all ${
                    animatedItemId === item.product.id ? "opacity-0 transform translate-x-full" : ""
                  }`}
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-lg overflow-hidden mr-4">
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="flex-grow">
                      <h3 className="font-medium text-base line-clamp-2">
                        {item.product.name}
                      </h3>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="text-primary font-bold">
                          {formatCurrency(Number(item.product.price))}
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleUpdateQuantity(item.product.id, item.quantity - 1)}
                            className="p-1 rounded-full bg-gray-100 touch-target press-effect"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          
                          <span className="px-2 min-w-[30px] text-center font-medium">
                            {item.quantity}
                          </span>
                          
                          <button
                            onClick={() => handleUpdateQuantity(item.product.id, item.quantity + 1)}
                            className="p-1 rounded-full bg-gray-100 touch-target press-effect"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleRemove(item.product.id)}
                      className="ml-2 p-2 text-gray-400 hover:text-red-500 touch-target"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="app-like-card p-4">
              <h3 className="font-bold text-lg mb-4">Resumo do Pedido</h3>
              
              <div className="space-y-3 mb-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{formatCurrency(getTotalPrice())}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Frete</span>
                  <span className="text-green-600">Grátis</span>
                </div>
                
                <div className="border-t pt-3 mt-3 font-bold flex justify-between">
                  <span>Total</span>
                  <span className="text-lg">{formatCurrency(getTotalPrice())}</span>
                </div>
              </div>
              
              <Button 
                className="w-full py-6 text-base font-bold press-effect"
                onClick={handleCheckout}
              >
                Finalizar Compra
              </Button>
              
              <Link 
                href="/" 
                className="block text-center text-primary mt-4 py-2 text-sm"
              >
                Continuar Comprando
              </Link>
            </div>
          </>
        )}
      </main>
      
      <MobileNavigation />
    </div>
  );
}