import { useEffect, useState, useCallback } from 'react';
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useCart } from '@/hooks/use-cart';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, CheckCircle, ShoppingCart, CreditCard, Lock } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

// Certifique-se de ter a chave pública do Stripe
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Chave pública do Stripe não encontrada (VITE_STRIPE_PUBLIC_KEY)');
}

// Inicializa o Stripe fora do componente para evitar múltiplas instâncias
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// Formulário de pagamento Stripe
const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const { clearCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [, setLocation] = useLocation();

  // Função para processar o pagamento
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      toast({
        title: "Erro no pagamento",
        description: "O Stripe não foi inicializado corretamente",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    // Confirmar o pagamento com o Stripe
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success`,
      },
      redirect: 'if_required'
    });

    if (error) {
      setIsProcessing(false);
      toast({
        title: "Falha no pagamento",
        description: error.message || "Ocorreu um erro ao processar o pagamento",
        variant: "destructive",
      });
    } else {
      // Se não houver erro e não redirecionamos, significa que o pagamento foi bem-sucedido
      toast({
        title: "Pagamento realizado com sucesso!",
        description: "Obrigado pela sua compra",
        variant: "default",
      });
      clearCart();
      setLocation('/checkout/success');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Detalhes do Pagamento
          </CardTitle>
          <CardDescription>
            Preencha os dados do seu cartão para finalizar a compra
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-white p-4 rounded-lg">
            <PaymentElement />
          </div>
          <div className="mt-4 text-sm text-muted-foreground flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Seus dados de pagamento são processados de forma segura pelo Stripe
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={!stripe || isProcessing}
          >
            {isProcessing ? (
              <>
                <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                Processando...
              </>
            ) : (
              'Finalizar Compra'
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
};

// Componente de resumo do carrinho
const CartSummary = () => {
  const { items, calculateTotal } = useCart();
  const [, setLocation] = useLocation();
  const total = calculateTotal();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Resumo do Pedido
        </CardTitle>
        <CardDescription>
          {items.length} {items.length === 1 ? 'item' : 'itens'} no carrinho
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.productId} className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-md overflow-hidden bg-gray-100">
                  <img 
                    src={item.image || 'https://placehold.co/100x100?text=Produto'} 
                    alt={item.productName}
                    className="w-full h-full object-cover" 
                  />
                </div>
                <div>
                  <p className="text-sm font-medium">{item.productName}</p>
                  <p className="text-xs text-muted-foreground">Qtd: {item.quantity}</p>
                </div>
              </div>
              <p className="text-sm font-medium">
                {formatCurrency(parseFloat(item.price) * item.quantity)}
              </p>
            </div>
          ))}
        </div>

        <Separator className="my-4" />
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>{formatCurrency(total)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Frete</span>
            <span>Grátis</span>
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          variant="outline" 
          className="w-full flex items-center justify-center gap-2"
          onClick={() => setLocation('/carrinho')}
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para o carrinho
        </Button>
      </CardFooter>
    </Card>
  );
};

// Página principal de checkout
const CheckoutPage = () => {
  const [clientSecret, setClientSecret] = useState<string>("");
  const { items, calculateTotal } = useCart();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const total = calculateTotal();
  
  useEffect(() => {
    // Redirecionar se o carrinho estiver vazio
    if (items.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione produtos ao carrinho antes de finalizar a compra",
        variant: "destructive",
      });
      setLocation('/');
      return;
    }

    // Criar o PaymentIntent assim que a página carregar
    const createPaymentIntent = async () => {
      try {
        const response = await apiRequest("POST", "/api/create-payment-intent", { 
          items: items,
          amount: total
        });
        
        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (error) {
        console.error("Erro ao criar PaymentIntent:", error);
        toast({
          title: "Erro ao iniciar pagamento",
          description: "Não foi possível conectar ao serviço de pagamento. Tente novamente mais tarde.",
          variant: "destructive",
        });
      }
    };

    createPaymentIntent();
  }, [items, total, setLocation, toast]);

  return (
    <div className="container max-w-6xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Finalizar Compra</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Resumo do carrinho (esquerda) */}
        <div className="order-2 md:order-1">
          <CartSummary />
        </div>
        
        {/* Formulário de pagamento (direita) */}
        <div className="order-1 md:order-2">
          {clientSecret ? (
            <Elements stripe={stripePromise} options={{ clientSecret, locale: 'pt-BR' }}>
              <CheckoutForm />
            </Elements>
          ) : (
            <div className="h-96 flex items-center justify-center bg-white rounded-lg shadow">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Carregando"/>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;