import { useCart } from "@/hooks/use-cart";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Trash2, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

// Etapas do checkout
enum CheckoutStep {
  CART_REVIEW = 0,
  SHIPPING_INFO = 1,
  PAYMENT = 2,
  CONFIRMATION = 3,
}

// Inicialização do Stripe
const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

// Componente de formulário de pagamento Stripe
function StripePaymentForm({ amount, onSuccess, onCancel }: {
  amount: number;
  onSuccess: (paymentId: string) => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + "/checkout/success",
      },
      redirect: "if_required",
    });

    setIsProcessing(false);

    if (error) {
      toast({
        title: "Erro no pagamento",
        description: error.message || "Ocorreu um erro ao processar o pagamento.",
        variant: "destructive",
      });
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      toast({
        title: "Pagamento processado com sucesso!",
        description: "Seu pagamento foi confirmado.",
      });
      onSuccess(paymentIntent.id);
    } else {
      toast({
        title: "Status de pagamento desconhecido",
        description: "Por favor, entre em contato com o suporte.",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <div className="flex justify-between pt-4">
        <Button variant="outline" type="button" onClick={onCancel} disabled={isProcessing}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <Button type="submit" disabled={!stripe || isProcessing}>
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processando...
            </>
          ) : (
            "Finalizar compra"
          )}
        </Button>
      </div>
    </form>
  );
}

export default function Checkout() {
  const { items, updateQuantity, removeItem, getTotalPrice, clearCart } = useCart();
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const [step, setStep] = useState<CheckoutStep>(CheckoutStep.CART_REVIEW);
  const [orderId, setOrderId] = useState<string>("");
  const [clientSecret, setClientSecret] = useState<string>("");
  const { toast } = useToast();

  // Redirecionar para home se o carrinho estiver vazio
  useEffect(() => {
    if (items.length === 0 && step !== CheckoutStep.CONFIRMATION) {
      navigate("/");
      toast({
        title: "Carrinho vazio",
        description: "Adicione produtos ao carrinho para finalizar a compra",
        variant: "destructive",
      });
    }
  }, [items, navigate, step, toast]);

  // Obter fornecedores para os produtos no carrinho
  const { data: suppliers } = useQuery({
    queryKey: ["/api/suppliers-info", items.map(item => item.product.supplierId)],
    queryFn: async () => {
      if (!items.length) return [];
      const supplierIdSet = new Set<number>();
      items.forEach(item => supplierIdSet.add(item.product.supplierId));
      const supplierIds = Array.from(supplierIdSet);
      const res = await apiRequest("GET", `/api/suppliers-info?ids=${supplierIds.join(",")}`);
      return await res.json();
    },
    enabled: items.length > 0,
  });

  // Forçar login antes de prosseguir com o checkout
  useEffect(() => {
    if (!isLoading && !user && step > CheckoutStep.CART_REVIEW) {
      setStep(CheckoutStep.CART_REVIEW);
      toast({
        title: "Login necessário",
        description: "Faça login para continuar com a compra",
        variant: "destructive",
      });
    }
  }, [user, isLoading, step, toast]);

  const [shippingInfo, setShippingInfo] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setShippingInfo(prev => ({ ...prev, [name]: value }));
  };

  // Preencher informações de envio com dados do usuário logado
  useEffect(() => {
    if (user) {
      setShippingInfo(prev => ({
        ...prev,
        name: user.name,
        phone: user.phone || "",
      }));
    }
  }, [user]);

  // Agrupar produtos por fornecedor
  const productsBySupplier = items.reduce((acc, item) => {
    const supplierId = item.product.supplierId;
    if (!acc[supplierId]) {
      acc[supplierId] = [];
    }
    acc[supplierId].push(item);
    return acc;
  }, {} as Record<number, typeof items>);

  const handleNextStep = () => {
    if (step === CheckoutStep.SHIPPING_INFO) {
      // Validar informações de envio
      const { name, address, city, state, zipCode, phone } = shippingInfo;
      if (!name || !address || !city || !state || !zipCode || !phone) {
        toast({
          title: "Informações incompletas",
          description: "Preencha todos os campos para continuar",
          variant: "destructive",
        });
        return;
      }
    }

    setStep(prev => (prev + 1) as CheckoutStep);
  };

  const handlePreviousStep = () => {
    setStep(prev => (prev - 1) as CheckoutStep);
  };

  const getSupplierName = (supplierId: number) => {
    if (!suppliers) return "Fornecedor";
    const supplier = suppliers.find((s: any) => s.id === supplierId);
    return supplier?.companyName || "Fornecedor";
  };

  const renderCartReview = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Revisar Pedido</h2>

      <div className="space-y-4">
        {Object.entries(productsBySupplier).map(([supplierId, supplierItems]) => (
          <Card key={supplierId} className="overflow-hidden">
            <div className="bg-muted p-3 font-medium">
              {getSupplierName(Number(supplierId))}
            </div>
            <CardContent className="p-0">
              {supplierItems.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-center p-4 border-b last:border-b-0"
                >
                  <div className="w-16 h-16 rounded-md overflow-hidden mr-4 flex-shrink-0">
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium line-clamp-1">{item.product.name}</h4>
                    <div className="flex items-center mt-1 text-sm text-muted-foreground">
                      <span>
                        {formatCurrency(Number(item.product.price))} × {item.quantity}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right font-medium">
                      {formatCurrency(Number(item.product.price) * item.quantity)}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => removeItem(item.product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-muted p-4 rounded-lg">
        <div className="flex justify-between font-medium">
          <span>Total</span>
          <span>{formatCurrency(getTotalPrice())}</span>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={() => navigate("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Continuar comprando
        </Button>
        <div className="space-x-2">
          <Button onClick={handleNextStep} disabled={items.length === 0}>
            Continuar
          </Button>
        </div>
      </div>
    </div>
  );

  const renderShippingInfo = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Informações de Entrega</h2>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <Label htmlFor="name">Nome completo</Label>
          <Input
            id="name"
            name="name"
            value={shippingInfo.name}
            onChange={handleInputChange}
            placeholder="Nome completo"
            className="mt-1"
            required
          />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="address">Endereço</Label>
          <Input
            id="address"
            name="address"
            value={shippingInfo.address}
            onChange={handleInputChange}
            placeholder="Endereço completo"
            className="mt-1"
            required
          />
        </div>
        <div>
          <Label htmlFor="city">Cidade</Label>
          <Input
            id="city"
            name="city"
            value={shippingInfo.city}
            onChange={handleInputChange}
            placeholder="Cidade"
            className="mt-1"
            required
          />
        </div>
        <div>
          <Label htmlFor="state">Estado</Label>
          <Input
            id="state"
            name="state"
            value={shippingInfo.state}
            onChange={handleInputChange}
            placeholder="Estado"
            className="mt-1"
            required
          />
        </div>
        <div>
          <Label htmlFor="zipCode">CEP</Label>
          <Input
            id="zipCode"
            name="zipCode"
            value={shippingInfo.zipCode}
            onChange={handleInputChange}
            placeholder="CEP"
            className="mt-1"
            required
          />
        </div>
        <div>
          <Label htmlFor="phone">Telefone</Label>
          <Input
            id="phone"
            name="phone"
            value={shippingInfo.phone}
            onChange={handleInputChange}
            placeholder="Telefone"
            className="mt-1"
            required
          />
        </div>
      </div>

      <div className="bg-muted p-4 rounded-lg">
        <div className="flex justify-between font-medium">
          <span>Total</span>
          <span>{formatCurrency(getTotalPrice())}</span>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={handlePreviousStep}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <Button onClick={handleNextStep}>Continuar para pagamento</Button>
      </div>
    </div>
  );

  // Criar PaymentIntent quando o usuário avança para o passo de pagamento
  useEffect(() => {
    if (step === CheckoutStep.PAYMENT && !clientSecret && items.length > 0) {
      const createPaymentIntent = async () => {
        try {
          const response = await apiRequest("POST", "/api/create-payment-intent", {
            amount: getTotalPrice(),
          });
          
          if (!response.ok) {
            throw new Error("Falha ao criar intenção de pagamento");
          }
          
          const data = await response.json();
          setClientSecret(data.clientSecret);
        } catch (error) {
          console.error("Erro ao criar payment intent:", error);
          toast({
            title: "Erro ao processar pagamento",
            description: "Não foi possível iniciar o processo de pagamento. Tente novamente mais tarde.",
            variant: "destructive",
          });
        }
      };
      
      createPaymentIntent();
    }
  }, [step, clientSecret, items, getTotalPrice, toast]);
  
  const handlePaymentSuccess = (paymentId: string) => {
    const orderNumber = `PED${Date.now().toString().substring(5)}`;
    setOrderId(orderNumber);
    clearCart();
    setStep(CheckoutStep.CONFIRMATION);
  };

  const renderPayment = () => {
    const options = {
      clientSecret,
      appearance: {
        theme: 'stripe' as const,
        variables: {
          colorPrimary: '#10b981',
          colorBackground: '#ffffff',
          colorText: '#1f2937',
        },
      },
    };

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Pagamento</h2>

        <div className="space-y-4">
          {!clientSecret ? (
            <div className="flex justify-center p-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <Elements stripe={stripePromise} options={options}>
                  <StripePaymentForm 
                    amount={getTotalPrice()} 
                    onSuccess={handlePaymentSuccess}
                    onCancel={handlePreviousStep}
                  />
                </Elements>
              </CardContent>
            </Card>
          )}

          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>{formatCurrency(getTotalPrice())}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Frete</span>
              <span>Grátis</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between font-medium">
              <span>Total</span>
              <span>{formatCurrency(getTotalPrice())}</span>
            </div>
          </div>
        </div>

        {!clientSecret && (
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={handlePreviousStep}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <Button disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Carregando...
            </Button>
          </div>
        )}
      </div>
    );
  };

  const renderConfirmation = () => (
    <div className="text-center space-y-6 py-8">
      <div className="flex justify-center">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-primary" />
        </div>
      </div>
      <div>
        <h2 className="text-2xl font-bold">Pedido confirmado!</h2>
        <p className="text-muted-foreground mt-2">
          Seu pedido #{orderId} foi registrado com sucesso.
        </p>
      </div>
      <div className="max-w-md mx-auto bg-muted p-4 rounded-lg text-left">
        <h3 className="font-medium mb-2">Resumo do pedido</h3>
        <div className="text-sm space-y-2">
          <div className="flex justify-between">
            <span>Data</span>
            <span>{new Date().toLocaleDateString('pt-BR')}</span>
          </div>
          <div className="flex justify-between">
            <span>Método de pagamento</span>
            <span>Cartão de crédito</span>
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between font-medium">
            <span>Total</span>
            <span>{formatCurrency(getTotalPrice())}</span>
          </div>
        </div>
      </div>
      <Button onClick={() => navigate("/")} className="mt-4">
        Voltar para a página inicial
      </Button>
    </div>
  );

  const renderCurrentStep = () => {
    switch (step) {
      case CheckoutStep.CART_REVIEW:
        return renderCartReview();
      case CheckoutStep.SHIPPING_INFO:
        return renderShippingInfo();
      case CheckoutStep.PAYMENT:
        return renderPayment();
      case CheckoutStep.CONFIRMATION:
        return renderConfirmation();
      default:
        return renderCartReview();
    }
  };

  return (
    <div className="container max-w-4xl py-8">
      {/* Progresso do checkout */}
      {step !== CheckoutStep.CONFIRMATION && (
        <div className="mb-8">
          <div className="flex justify-between">
            {["Carrinho", "Endereço", "Pagamento"].map((label, index) => (
              <div
                key={index}
                className={`flex-1 text-center ${
                  index < step
                    ? "text-primary"
                    : index === step
                    ? "font-medium"
                    : "text-muted-foreground"
                }`}
              >
                {label}
              </div>
            ))}
          </div>
          <div className="flex mt-2">
            {[0, 1, 2].map((index) => (
              <div key={index} className="flex-1 px-2">
                <div
                  className={`h-1 rounded-full ${
                    index <= step ? "bg-primary" : "bg-muted"
                  }`}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {renderCurrentStep()}
    </div>
  );
}