import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useChat } from "@/hooks/use-chat";
import { 
  Package, 
  DollarSign, 
  BarChart, 
  MessageCircle, 
  Bell
} from "lucide-react";

export function SupplierSidebar() {
  const [location] = useLocation();
  const { unreadCount } = useChat();
  
  // Hook para obter contador de alertas de estoque
  const { data: inventoryAlerts } = useQuery({
    queryKey: ["/api/supplier/inventory/alerts", { isRead: false }],
    enabled: true,
  });
  
  const alertsCount = inventoryAlerts?.length || 0;
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold mb-4">Painel do Fornecedor</h2>
      <nav className="space-y-2">
        <Link href="/fornecedor/dashboard">
          <a className={`flex items-center p-2 rounded-md font-medium ${
            location === "/fornecedor/dashboard" 
              ? "text-primary bg-primary/10" 
              : "text-gray-700 hover:text-primary hover:bg-gray-50"
          }`}>
            <BarChart className="mr-2 h-5 w-5" />
            Dashboard
          </a>
        </Link>
        
        <Link href="/fornecedor/produtos">
          <a className={`flex items-center p-2 rounded-md font-medium ${
            location === "/fornecedor/produtos" 
              ? "text-primary bg-primary/10" 
              : "text-gray-700 hover:text-primary hover:bg-gray-50"
          }`}>
            <Package className="mr-2 h-5 w-5" />
            Meus Produtos
          </a>
        </Link>
        
        <Link href="/fornecedor/inventario">
          <a className={`flex items-center p-2 rounded-md font-medium relative ${
            location === "/fornecedor/inventario" 
              ? "text-primary bg-primary/10" 
              : "text-gray-700 hover:text-primary hover:bg-gray-50"
          }`}>
            <Bell className="mr-2 h-5 w-5" />
            Gerenciar Estoque
            {alertsCount > 0 && (
              <span className="ml-auto bg-amber-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                {alertsCount}
              </span>
            )}
          </a>
        </Link>
        
        <Link href="/fornecedor/vendas">
          <a className={`flex items-center p-2 rounded-md font-medium ${
            location === "/fornecedor/vendas" 
              ? "text-primary bg-primary/10" 
              : "text-gray-700 hover:text-primary hover:bg-gray-50"
          }`}>
            <DollarSign className="mr-2 h-5 w-5" />
            Vendas e Comissões
          </a>
        </Link>
        
        <Link href="/fornecedor/chat">
          <a className={`flex items-center p-2 rounded-md font-medium relative ${
            location === "/fornecedor/chat" 
              ? "text-primary bg-primary/10" 
              : "text-gray-700 hover:text-primary hover:bg-gray-50"
          }`}>
            <MessageCircle className="mr-2 h-5 w-5" />
            Suporte/Chat
            {unreadCount > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </a>
        </Link>
      </nav>
    </div>
  );
}