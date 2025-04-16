import { ReactNode } from 'react';
import { Link } from 'wouter';
import { BarChart, Package, DollarSign, Boxes, MessageSquare, Settings, ShoppingCart } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';

// Tipos de navegação lateral do fornecedor
type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  id: string;
};

// Props do componente
interface SupplierLayoutProps {
  children: ReactNode;
  activeItem?: string;
}

export function SupplierLayout({ children, activeItem }: SupplierLayoutProps) {
  const { user } = useAuth();
  
  // Itens de navegação do fornecedor
  const navItems: NavItem[] = [
    {
      href: '/fornecedor',
      label: 'Dashboard',
      icon: <BarChart className="h-5 w-5" />,
      id: 'dashboard'
    },
    {
      href: '/fornecedor/produtos',
      label: 'Produtos',
      icon: <Package className="h-5 w-5" />,
      id: 'produtos'
    },
    {
      href: '/fornecedor/estoque',
      label: 'Estoque',
      icon: <Boxes className="h-5 w-5" />,
      id: 'estoque'
    },
    {
      href: '/fornecedor/vendas',
      label: 'Vendas',
      icon: <ShoppingCart className="h-5 w-5" />,
      id: 'vendas'
    },
    {
      href: '/fornecedor/comissoes',
      label: 'Comissões',
      icon: <DollarSign className="h-5 w-5" />,
      id: 'comissoes'
    },
    {
      href: '/fornecedor/chat',
      label: 'Suporte',
      icon: <MessageSquare className="h-5 w-5" />,
      id: 'chat'
    },
    {
      href: '/fornecedor/configuracoes',
      label: 'Configurações',
      icon: <Settings className="h-5 w-5" />,
      id: 'configuracoes'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar de navegação do fornecedor */}
        <aside className="md:w-64 bg-white border-r flex-shrink-0">
          <div className="p-4 border-b">
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarFallback>{user?.name?.charAt(0) || 'F'}</AvatarFallback>
              </Avatar>
              <div className="overflow-hidden">
                <h3 className="font-medium text-sm truncate">{user?.name || 'Fornecedor'}</h3>
                <p className="text-xs text-muted-foreground truncate">{user?.companyName || 'Empresa'}</p>
              </div>
            </div>
          </div>
          
          <nav className="p-2">
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.id}>
                  <Link href={item.href}>
                    <Button
                      variant={activeItem === item.id ? "default" : "ghost"}
                      className={`w-full justify-start ${activeItem === item.id ? 'bg-primary text-primary-foreground' : ''}`}
                    >
                      {item.icon}
                      <span className="ml-2">{item.label}</span>
                    </Button>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
        
        {/* Conteúdo principal */}
        <main className="flex-1 bg-gray-50 min-h-screen overflow-auto">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
}