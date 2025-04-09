import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { ShoppingCart, Trash2, Plus, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";

export function CartDrawer() {
  const { items, removeItem, updateQuantity, getTotalItems, getTotalPrice, clearCart } = useCart();
  const [, navigate] = useLocation();
  const totalItems = getTotalItems();

  const handleCheckout = () => {
    navigate("/checkout");
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative">
          <ShoppingCart className="h-5 w-5 mr-1" />
          <span className="hidden md:inline">Carrinho</span>
          {totalItems > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center rounded-full">
              {totalItems}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="text-xl flex items-center">
            <ShoppingCart className="mr-2 h-5 w-5" /> 
            Meu Carrinho
          </SheetTitle>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Seu carrinho está vazio</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                Adicione produtos para continuar
              </p>
              <Button onClick={() => navigate("/")} variant="outline">
                Voltar às compras
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <Card key={item.product.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex p-4">
                      <div className="w-20 h-20 rounded-md overflow-hidden mr-4 flex-shrink-0">
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm line-clamp-2">
                          {item.product.name}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {formatCurrency(Number(item.product.price))}
                        </p>
                        
                        <div className="flex items-center mt-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="mx-2 w-8 text-center">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            className="ml-auto h-8 w-8 text-destructive"
                            onClick={() => removeItem(item.product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
        
        {items.length > 0 && (
          <div className="border-t pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Subtotal</span>
              <span className="font-bold">{formatCurrency(getTotalPrice())}</span>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={clearCart}
                className="flex items-center"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Limpar
              </Button>
              <Button onClick={handleCheckout} className="flex items-center">
                Finalizar Compra
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}