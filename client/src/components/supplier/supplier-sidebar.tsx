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
  AlertTriangle,
  Database,
  Boxes,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useChat } from "@/hooks/use-chat";

// Componente para o sidebar do fornecedor com navegação completa
export function SupplierSidebar({ activeItem = "dashboard" }: { activeItem?: string }) {
  const [location] = useLocation();
  const { unreadCount } = useChat();
  
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
      id: "estoque",
      label: "Gerenciar Estoque",
      href: "/fornecedor/estoque",
      icon: Boxes,
      submenu: [
        {
          id: "estoque-alertas",
          label: "Alertas de Estoque",
          href: "/fornecedor/estoque/alertas",
          icon: AlertTriangle,
        },
        {
          id: "estoque-atualizacao",
          label: "Atualização em Massa",
          href: "/fornecedor/produtos/bulk-update",
          icon: Database,
        }
      ]
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
      badge: unreadCount > 0 ? unreadCount : undefined,
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
          const hasSubmenu = item.submenu && item.submenu.length > 0;
          
          return (
            <div key={item.id} className="menu-item">
              <Link href={item.href}>
                <a 
                  className={cn(
                    "flex items-center py-2 px-3 rounded-md font-medium transition-colors",
                    isActive 
                      ? "bg-primary/10 text-primary" 
                      : "text-gray-700 hover:text-primary hover:bg-gray-50"
                  )}
                >
                  <item.icon className="mr-2 h-5 w-5" />
                  <span className="flex-grow">{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                  {hasSubmenu && (
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className={cn("h-4 w-4 transition-transform", isActive ? "rotate-180" : "")}
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  )}
                </a>
              </Link>
              
              {/* Submenu */}
              {hasSubmenu && (
                <div className={cn(
                  "pl-5 mt-1 space-y-1", 
                  (isActive ? "block" : "hidden")
                )}>
                  {item.submenu!.map((subItem) => {
                    const isSubItemActive = activeItem === subItem.id || location === subItem.href;
                    return (
                      <Link href={subItem.href} key={subItem.id}>
                        <a 
                          className={cn(
                            "flex items-center py-1.5 px-3 rounded-md text-sm font-medium transition-colors",
                            isSubItemActive 
                              ? "bg-primary/5 text-primary" 
                              : "text-gray-600 hover:text-primary hover:bg-gray-50"
                          )}
                        >
                          <subItem.icon className="mr-2 h-4 w-4" />
                          <span>{subItem.label}</span>
                        </a>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
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

// Exportar como default para compatibilidade com código existente
export default SupplierSidebar;