import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { InventoryStatus } from "@shared/schema";
import { AlertTriangle, CheckCircle, Package, Clock, Clock3 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";

interface InventoryInfo {
  quantity: number;
  status: string;
  lowStockThreshold: number;
  restockLevel: number;
  reserved: number;
  available: number;
  statusText: string;
  expirationDate?: Date;
  lastUpdated?: Date;
}

interface ProductInventoryInfoProps {
  productId: number;
  showDetailed?: boolean;
}

export const ProductInventoryInfo = ({ productId, showDetailed = false }: ProductInventoryInfoProps) => {
  const [animateProgress, setAnimateProgress] = useState(false);
  
  const { data: inventory, isLoading, error } = useQuery<InventoryInfo>({
    queryKey: [`/api/products/${productId}/inventory`],
    enabled: !!productId,
  });
  
  useEffect(() => {
    if (inventory) {
      // Inicia a animação da barra de progresso após o carregamento dos dados
      setTimeout(() => setAnimateProgress(true), 100);
    }
  }, [inventory]);
  
  if (isLoading) {
    return (
      <div className="py-2 flex items-center text-gray-500">
        <Package className="mr-2 h-4 w-4" />
        <span>Verificando disponibilidade...</span>
      </div>
    );
  }
  
  if (error || !inventory) {
    return (
      <div className="py-2 flex items-center text-gray-500">
        <Package className="mr-2 h-4 w-4" />
        <span>Informação de estoque indisponível</span>
      </div>
    );
  }
  
  // Calcular a porcentagem do estoque disponível
  const stockPercentage = Math.min(
    Math.round((inventory.available / inventory.restockLevel) * 100), 
    100
  );
  
  // Verificar se o estoque está baixo
  const isLowStock = inventory.status === InventoryStatus.LOW_STOCK || 
    (inventory.available > 0 && inventory.available <= inventory.lowStockThreshold);
    
  // Verificar se está esgotado
  const isOutOfStock = inventory.status === InventoryStatus.OUT_OF_STOCK || inventory.available <= 0;
  
  // Estilo condicional baseado no status do estoque
  const getStockStyle = () => {
    if (isOutOfStock) return "text-red-600";
    if (isLowStock) return "text-amber-600";
    return "text-green-600";
  };
  
  // Ícone condicional baseado no status do estoque
  const getStockIcon = () => {
    if (isOutOfStock) return <AlertTriangle className="mr-2 h-4 w-4 text-red-600" />;
    if (isLowStock) return <Clock className="mr-2 h-4 w-4 text-amber-600" />;
    return <CheckCircle className="mr-2 h-4 w-4 text-green-600" />;
  };

  // Mensagem condicional baseada no status do estoque
  const getStockMessage = () => {
    if (isOutOfStock) return "Esgotado";
    if (isLowStock) return `Estoque baixo: apenas ${inventory.available} ${inventory.available === 1 ? 'unidade' : 'unidades'} disponível${inventory.available === 1 ? '' : 's'}`;
    return `Em estoque: ${inventory.available} ${inventory.available === 1 ? 'unidade' : 'unidades'} disponível${inventory.available === 1 ? '' : 's'}`;
  };
  
  // Criar rótulo de urgência se aplicável
  const getUrgencyLabel = () => {
    if (isLowStock) {
      return (
        <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-700 border-amber-200">
          Restando poucas unidades
        </Badge>
      );
    }
    return null;
  };
  
  // Versão básica (compacta) para uso em cards e listagens
  if (!showDetailed) {
    return (
      <div className="flex items-center">
        {getStockIcon()}
        <span className={`text-sm font-medium ${getStockStyle()}`}>
          {getStockMessage()}
        </span>
        {getUrgencyLabel()}
      </div>
    );
  }
  
  // Versão detalhada para a página de detalhes do produto
  return (
    <div className="mt-4 space-y-3">
      {/* Informação principal de estoque */}
      <div className="flex items-center">
        {getStockIcon()}
        <span className={`text-sm font-medium ${getStockStyle()}`}>
          {getStockMessage()}
        </span>
        {getUrgencyLabel()}
      </div>
      
      {/* Barra de progresso do estoque */}
      {!isOutOfStock && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Nível de estoque</span>
            <span>{animateProgress ? stockPercentage : 0}%</span>
          </div>
          <Progress 
            value={animateProgress ? stockPercentage : 0} 
            className={`h-2 ${
              isLowStock 
                ? "bg-amber-100 [&>div]:bg-amber-500" 
                : "bg-green-100 [&>div]:bg-green-500"
            }`}
          />
        </div>
      )}
      
      {/* Alerta de estoque baixo */}
      {isLowStock && (
        <Alert variant="destructive" className="bg-amber-50 text-amber-800 border-amber-200">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Alerta de estoque</AlertTitle>
          <AlertDescription>
            Este produto está com estoque baixo e pode esgotar em breve. Recomendamos finalizar sua compra rapidamente.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Informações adicionais com tooltips */}
      <div className="flex items-center gap-4 text-sm text-gray-600 pt-1">
        <TooltipProvider>
          {inventory.lastUpdated && (
            <Tooltip>
              <TooltipTrigger className="flex items-center">
                <Clock3 className="mr-1 h-4 w-4" />
                <span>Atualizado recentemente</span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Última atualização de estoque: {new Date(inventory.lastUpdated).toLocaleDateString('pt-BR')}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </TooltipProvider>
      </div>
    </div>
  );
};