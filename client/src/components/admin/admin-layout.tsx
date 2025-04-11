import React, { useState, ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { 
  Layout, 
  LayoutHeader, 
  LayoutBody, 
  LayoutAside, 
  LayoutContent 
} from '@/components/ui/layout';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { 
  Bell, 
  MessageSquare, 
  Search, 
  Menu, 
  ChevronDown, 
  LayoutDashboard, 
  Users, 
  ShoppingBag, 
  Folder, 
  Settings, 
  Layers, 
  FileText, 
  Tag, 
  HelpCircle, 
  LogOut,
  Building2,
  BarChart3
} from 'lucide-react';

// Define o tipo para o item de menu
interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  count?: number;
  divider?: boolean;
  submenu?: {
    title: string;
    href: string;
  }[];
}

// Define os itens de navegação
const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    title: 'Clientes',
    href: '/admin/clientes',
    icon: <Users className="h-5 w-5" />,
  },
  {
    title: 'Fornecedores',
    href: '/admin/fornecedores',
    icon: <Building2 className="h-5 w-5" />,
  },
  {
    title: 'Produtos',
    href: '/admin/produtos',
    icon: <ShoppingBag className="h-5 w-5" />,
  },
  {
    title: 'Categorias',
    href: '/admin/categorias',
    icon: <Folder className="h-5 w-5" />,
  },
  {
    title: 'Comissões',
    href: '/admin/comissoes',
    icon: <Tag className="h-5 w-5" />,
  },
  {
    title: 'Pedidos',
    href: '/admin/pedidos',
    icon: <FileText className="h-5 w-5" />,
    count: 18,
  },
  {
    title: 'Chat Suporte',
    href: '/admin/chat',
    icon: <MessageSquare className="h-5 w-5" />,
    count: 5,
  },
  {
    title: 'Relatórios',
    href: '/admin/relatorios',
    icon: <BarChart3 className="h-5 w-5" />,
    divider: true,
    submenu: [
      { title: 'Vendas', href: '/admin/relatorios/vendas' },
      { title: 'Comissões', href: '/admin/relatorios/comissoes' },
      { title: 'Usuários', href: '/admin/relatorios/usuarios' },
    ],
  },
  {
    title: 'Configurações',
    href: '/admin/configuracoes',
    icon: <Settings className="h-5 w-5" />,
  },
];

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
  breadcrumbs?: Array<{ title: string; href: string }>;
}

export function AdminLayout({ children, title = 'Painel do Administrador', breadcrumbs }: AdminLayoutProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);

  const { data: notifications } = useQuery({
    queryKey: ['/api/admin/notifications'],
    queryFn: () => Promise.resolve([
      { id: 1, message: 'Novo pedido: #12345', read: false, time: '2 min atrás' },
      { id: 2, message: 'Novo fornecedor cadastrado', read: false, time: '1 hora atrás' },
      { id: 3, message: 'Estoque baixo: Produto XYZ', read: true, time: '3 horas atrás' },
    ]),
    enabled: !!user,
  });

  const { data: messages } = useQuery({
    queryKey: ['/api/admin/unread-messages'],
    queryFn: () => Promise.resolve([
      { id: 1, from: 'João Silva', content: 'Preciso de ajuda com meu pedido', time: '5 min atrás' },
      { id: 2, from: 'Maria Oliveira', content: 'Quando meu produto será enviado?', time: '30 min atrás' },
    ]),
    enabled: !!user,
  });

  const unreadNotifications = notifications?.filter(n => !n.read).length || 0;

  // Função auxiliar para verificar se um item está ativo
  const isActive = (href: string) => {
    if (href === '/admin' && location === '/admin') return true;
    return location.startsWith(href) && href !== '/admin';
  };

  // Manipulador de logout
  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
  };

  // Renderizar os links de navegação
  const renderNavLinks = (items: NavItem[], isMobile = false) => {
    return items.map((item, index) => {
      const active = isActive(item.href);
      
      return (
        <React.Fragment key={index}>
          {item.divider && <div className="mx-3 my-3 h-px bg-muted/30" />}
          
          <div className={cn(
            "group relative",
            isMobile && "py-1"
          )}>
            {item.submenu ? (
              <button
                className={cn(
                  "flex items-center w-full p-2 text-left rounded-md hover:bg-muted/50 transition-colors",
                  active && "bg-primary/10 text-primary font-medium",
                  isMobile && "py-3"
                )}
                onClick={() => setActiveAccordion(activeAccordion === item.title ? null : item.title)}
              >
                <span className="inline-flex items-center gap-2.5 flex-1">
                  <span className={cn(
                    "text-muted-foreground group-hover:text-foreground transition-colors",
                    active && "text-primary"
                  )}>
                    {item.icon}
                  </span>
                  <span className={isSidebarOpen || isMobile ? "block" : "hidden"}>
                    {item.title}
                  </span>
                </span>
                <ChevronDown className={cn(
                  "h-4 w-4 transition-transform",
                  activeAccordion === item.title && "transform rotate-180",
                  (!isSidebarOpen && !isMobile) && "hidden"
                )} />
              </button>
            ) : (
              <Link href={item.href}>
                <a className={cn(
                  "flex items-center p-2 rounded-md hover:bg-muted/50 transition-colors",
                  active && "bg-primary/10 text-primary font-medium",
                  isMobile && "py-3"
                )}>
                  <span className={cn(
                    "text-muted-foreground group-hover:text-foreground transition-colors",
                    active && "text-primary"
                  )}>
                    {item.icon}
                  </span>
                  <span className={cn(
                    "ml-2.5 flex-1",
                    (!isSidebarOpen && !isMobile) && "hidden"
                  )}>
                    {item.title}
                  </span>
                  
                  {item.count && (isSidebarOpen || isMobile) && (
                    <Badge className="ml-auto" variant={active ? "default" : "secondary"}>
                      {item.count}
                    </Badge>
                  )}
                </a>
              </Link>
            )}
            
            {/* Submenu */}
            {item.submenu && activeAccordion === item.title && (isSidebarOpen || isMobile) && (
              <div className="mt-1 ml-8 space-y-1">
                {item.submenu.map((subitem, subindex) => (
                  <Link key={subindex} href={subitem.href}>
                    <a className={cn(
                      "block p-2 text-sm rounded-md hover:bg-muted/50 transition-colors",
                      isActive(subitem.href) && "bg-primary/5 text-primary"
                    )}>
                      {subitem.title}
                    </a>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </React.Fragment>
      );
    });
  };

  return (
    <Layout className="min-h-screen bg-muted/10">
      {/* Header */}
      <LayoutHeader className="border-b bg-white shadow-sm z-30">
        <div className="flex items-center justify-between h-16 px-4">
          {/* Menu toggle for mobile and logo */}
          <div className="flex items-center">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72">
                <div className="px-3 py-4 border-b">
                  <div className="flex items-center">
                    <Link href="/admin">
                      <a className="flex items-center gap-2 font-bold text-xl">
                        <Layers className="h-6 w-6 text-primary" />
                        <span>Gastro Admin</span>
                      </a>
                    </Link>
                  </div>
                </div>
                <ScrollArea className="h-[calc(100vh-73px)]">
                  <nav className="py-2 px-2">
                    {renderNavLinks(navItems, true)}
                  </nav>
                </ScrollArea>
              </SheetContent>
            </Sheet>
            
            <Link href="/admin">
              <a className="flex items-center gap-2 font-bold text-xl">
                <Layers className="h-6 w-6 text-primary hidden md:block" />
                <span>Gastro Admin</span>
              </a>
            </Link>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="hidden md:flex ml-6"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Right side of header */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="hidden md:flex items-center bg-muted/30 rounded-md px-3 h-9 md:w-64 lg:w-80">
              <Search className="h-4 w-4 text-muted-foreground mr-2" />
              <input 
                type="text" 
                placeholder="Buscar..." 
                className="bg-transparent border-none h-9 focus:outline-none flex-1 text-sm"
              />
            </div>
            
            {/* Notification bell */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadNotifications > 0 && (
                    <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span>Notificações</span>
                  <Link href="/admin/notificacoes">
                    <a className="text-xs text-primary hover:underline">
                      Ver todas
                    </a>
                  </Link>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications && notifications.length > 0 ? (
                  <div className="max-h-80 overflow-auto">
                    {notifications.map((notification) => (
                      <DropdownMenuItem key={notification.id} className="cursor-pointer py-2">
                        <div className="flex items-start gap-2">
                          {!notification.read && (
                            <span className="h-2 w-2 mt-1.5 rounded-full bg-primary/80 flex-shrink-0" />
                          )}
                          <div className="flex-1">
                            <p className="text-sm">{notification.message}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{notification.time}</p>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </div>
                ) : (
                  <div className="py-4 text-center text-muted-foreground">
                    <p>Nenhuma notificação</p>
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Messages */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <MessageSquare className="h-5 w-5" />
                  {messages && messages.length > 0 && (
                    <span className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span>Mensagens</span>
                  <Link href="/admin/chat">
                    <a className="text-xs text-primary hover:underline">
                      Ver todas
                    </a>
                  </Link>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {messages && messages.length > 0 ? (
                  <div className="max-h-80 overflow-auto">
                    {messages.map((message) => (
                      <DropdownMenuItem key={message.id} className="cursor-pointer py-2">
                        <div className="flex items-start gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {message.from.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{message.from}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">{message.content}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{message.time}</p>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </div>
                ) : (
                  <div className="py-4 text-center text-muted-foreground">
                    <p>Nenhuma mensagem</p>
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* User dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 flex items-center gap-2 pl-2 pr-1">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {user?.username?.slice(0, 2).toUpperCase() || 'AD'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline-block text-sm font-medium">
                    {user?.username || 'Administrador'}
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Link href="/admin/perfil">
                    <a className="flex w-full">Perfil</a>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/admin/configuracoes">
                    <a className="flex w-full">Configurações</a>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/admin/ajuda">
                    <a className="flex w-full">Ajuda & Suporte</a>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-500 focus:text-red-500" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </LayoutHeader>
      
      {/* Body */}
      <LayoutBody>
        {/* Sidebar */}
        <LayoutAside className={cn(
          "hidden md:block fixed top-16 left-0 z-20 h-[calc(100vh-64px)] border-r transition-all bg-white",
          isSidebarOpen ? "w-64" : "w-16"
        )}>
          <ScrollArea className="h-full py-2">
            <nav className={cn("px-2", isSidebarOpen ? "pr-3" : "px-2")}>
              {renderNavLinks(navItems)}
            </nav>
          </ScrollArea>
        </LayoutAside>
        
        {/* Content */}
        <LayoutContent className={cn(
          "flex-1 pt-16 transition-all duration-200 ease-in-out",
          isSidebarOpen ? "md:ml-64" : "md:ml-16"
        )}>
          {/* Page header with breadcrumbs */}
          <div className="border-b bg-white">
            <div className="px-4 py-4 md:px-6">
              <h1 className="text-2xl font-bold">{title}</h1>
              
              {breadcrumbs && breadcrumbs.length > 0 && (
                <nav className="flex mt-1 text-sm">
                  <Link href="/admin">
                    <a className="text-muted-foreground hover:text-foreground">
                      Dashboard
                    </a>
                  </Link>
                  
                  {breadcrumbs.map((crumb, index) => (
                    <React.Fragment key={index}>
                      <span className="mx-2 text-muted-foreground">/</span>
                      {index === breadcrumbs.length - 1 ? (
                        <span className="font-medium">{crumb.title}</span>
                      ) : (
                        <Link href={crumb.href}>
                          <a className="text-muted-foreground hover:text-foreground">
                            {crumb.title}
                          </a>
                        </Link>
                      )}
                    </React.Fragment>
                  ))}
                </nav>
              )}
            </div>
          </div>
          
          {/* Main content */}
          <div className="p-4 md:p-6 bg-muted/10 min-h-[calc(100vh-137px)]">
            {children}
          </div>
        </LayoutContent>
      </LayoutBody>
    </Layout>
  );
}

export default AdminLayout;