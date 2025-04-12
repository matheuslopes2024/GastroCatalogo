import React from "react";
import { Link, useLocation } from "wouter";
import { 
  BarChart,
  Package, 
  DollarSign, 
  Users, 
  MessageSquare,
  Percent,
  Settings,
  ShoppingCart,
  LifeBuoy,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Componente para o sidebar do fornecedor com navegação completa
export default function SupplierSidebar({ activeItem = "dashboard" }: { activeItem?: string }) {
  const [location] = useLocation();
  
  // Array de itens do menu para facilitar manutenção
  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      href: "/fornecedor",
      icon: BarChart,
    },
    {
      id: "produtos",
      label: "Meus Produtos",
      href: "/fornecedor/produtos",
      icon: Package,
    },
    {
      id: "vendas",
      label: "Vendas",
      href: "/fornecedor/vendas",
      icon: ShoppingCart,
    },
    {
      id: "comissoes",
      label: "Comissões",
      href: "/fornecedor/comissoes",
      icon: Percent,
    },
    {
      id: "financeiro",
      label: "Financeiro",
      href: "/fornecedor/financeiro",
      icon: DollarSign,
    },
    {
      id: "chat",
      label: "Mensagens",
      href: "/fornecedor/chat",
      icon: MessageSquare,
    },
    {
      id: "clientes",
      label: "Clientes",
      href: "/fornecedor/clientes",
      icon: Users,
    },
    {
      id: "configuracoes",
      label: "Configurações",
      href: "/fornecedor/configuracoes",
      icon: Settings,
    },
  ];

  // Itens de suporte e ajuda
  const supportItems = [
    {
      id: "suporte",
      label: "Suporte",
      href: "/suporte",
      icon: LifeBuoy,
    },
    {
      id: "ajuda",
      label: "Central de Ajuda",
      href: "/ajuda",
      icon: HelpCircle,
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold mb-4">Painel do Fornecedor</h2>
      
      {/* Menu Principal */}
      <nav className="space-y-1.5">
        {menuItems.map((item) => {
          const isActive = activeItem === item.id || location === item.href;
          return (
            <Link href={item.href} key={item.id}>
              <a 
                className={cn(
                  "flex items-center py-2 px-3 rounded-md font-medium transition-colors",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-gray-700 hover:text-primary hover:bg-gray-50"
                )}
              >
                <item.icon className="mr-2 h-5 w-5" />
                {item.label}
              </a>
            </Link>
          );
        })}
      </nav>
      
      {/* Separador */}
      <div className="border-t border-gray-200 my-4"></div>
      
      {/* Itens de Suporte */}
      <nav className="space-y-1.5">
        {supportItems.map((item) => (
          <Link href={item.href} key={item.id}>
            <a className="flex items-center py-2 px-3 rounded-md text-gray-600 hover:text-primary hover:bg-gray-50 font-medium transition-colors">
              <item.icon className="mr-2 h-5 w-5" />
              {item.label}
            </a>
          </Link>
        ))}
      </nav>
      
      {/* Elemento decorativo */}
      <div className="mt-6 bg-gradient-to-r from-primary/10 to-primary/5 p-4 rounded-md">
        <p className="text-sm text-gray-600">
          Precisa de ajuda com sua loja? Nossa equipe está à disposição para auxiliar.
        </p>
        <Link href="/contato">
          <a className="text-sm font-medium text-primary hover:underline mt-2 inline-block">
            Fale conosco
          </a>
        </Link>
      </div>
    </div>
  );
}