import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useStripe } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, ShoppingBag, ArrowRight, Truck, Home } from 'lucide-react';
import confetti from 'canvas-confetti';

const CheckoutSuccessPage = () => {
  const [paymentIntent, setPaymentIntent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();
  const stripe = useStripe();

  useEffect(() => {
    // Faz o efeito de confete na tela quando a página carrega
    const triggerConfetti = () => {
      const duration = 3 * 1000;
      const end = Date.now() + duration;

      const colors = ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff'];

      (function frame() {
        confetti({
          particleCount: 2,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors
        });
        
        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      }());
    };

    // Se o stripe estiver disponível, verificar o status do pagamento
    if (stripe) {
      const clientSecret = new URLSearchParams(window.location.search).get(
        'payment_intent_client_secret'
      );
      
      if (clientSecret) {
        stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
          setPaymentIntent(paymentIntent);
          setLoading(false);
          if (paymentIntent?.status === 'succeeded') {
            triggerConfetti();
          }
        });
      } else {
        // Se não houver client secret, talvez tenha sido redirecionado de outra parte
        setLoading(false);
      }
    }
  }, [stripe]);

  // Se ainda estiver carregando
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" aria-label="Carregando"/>
      </div>
    );
  }

  // Se o pagamento não foi bem-sucedido
  if (paymentIntent?.status !== 'succeeded' && paymentIntent !== null) {
    return (
      <div className="container max-w-lg mx-auto py-16 px-4">
        <Card className="shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-red-500 flex items-center gap-2">
              <div className="p-2 bg-red-100 rounded-full">
                <ShoppingBag className="h-6 w-6" />
              </div>
              Pagamento não concluído
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-6">
            <p className="text-gray-600 mb-4">
              Parece que houve um problema com o seu pagamento. O status atual é: 
              <span className="font-medium"> {paymentIntent?.status}</span>
            </p>
            <p className="text-gray-600">
              Você pode tentar novamente ou entre em contato com nosso suporte.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={() => setLocation('/checkout')}
              className="w-full sm:w-auto"
              variant="outline"
            >
              Tentar novamente
            </Button>
            <Button 
              onClick={() => setLocation('/suporte')}
              className="w-full sm:w-auto"
            >
              Contatar suporte
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Sucesso no pagamento ou redirecionado por outra rota
  return (
    <div className="container max-w-2xl mx-auto py-16 px-4">
      <Card className="shadow-lg border-green-100 overflow-hidden">
        <div className="bg-gradient-to-r from-green-400 to-emerald-500 h-2" />
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl text-center flex flex-col items-center gap-2">
            <div className="p-3 bg-green-100 rounded-full mb-2">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            Compra realizada com sucesso!
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          <div className="text-center mb-8">
            <p className="text-gray-600 text-lg">
              Obrigado por comprar na Gastro! Seu pedido foi confirmado.
            </p>
            {paymentIntent?.id && (
              <p className="text-sm text-gray-500 mt-2">
                Código da transação: {paymentIntent.id}
              </p>
            )}
          </div>

          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Próximos passos
            </h3>
            <ol className="space-y-2 text-gray-600">
              <li className="flex items-start gap-2">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100 text-green-600 text-xs font-medium flex-shrink-0">1</span>
                <span>Você receberá um e-mail com os detalhes do seu pedido</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100 text-green-600 text-xs font-medium flex-shrink-0">2</span>
                <span>Nosso time vai preparar seus produtos para envio</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100 text-green-600 text-xs font-medium flex-shrink-0">3</span>
                <span>Você será notificado quando o pedido for enviado</span>
              </li>
            </ol>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={() => setLocation('/meus-pedidos')}
            className="w-full sm:flex-1"
            variant="outline"
          >
            Ver meus pedidos
          </Button>
          <Button 
            onClick={() => setLocation('/')}
            className="w-full sm:flex-1 flex items-center justify-center gap-2"
          >
            <Home className="h-4 w-4" />
            Voltar para a loja
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CheckoutSuccessPage;