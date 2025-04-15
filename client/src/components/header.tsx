import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Avatar, 
  AvatarFallback, 
  AvatarImage 
} from "@/components/ui/avatar";
import {
  Menu,
  Search,
  ShoppingCart,
  User,
  LogOut,
  Settings,
  MessageSquare,
  Bell,
  ChevronDown,
  Package,
  LayoutDashboard
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { UserRole } from "@/types";
import { useCart } from "@/hooks/use-cart";
import { cn } from "@/lib/utils";

export function Header() {
  const { user, logoutMutation } = useAuth();
  const [location, navigate] = useLocation();
  const { cartItems } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Determinar o tipo de usuário para mostrar links relevantes
  const isAdmin = user?.role === UserRole.ADMIN;
  const isSupplier = user?.role === UserRole.SUPPLIER;
  const isCustomer = user?.role === UserRole.USER || !user?.role;

  // Iniciais para o avatar do usuário
  const userInitials = user?.name 
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
    : user?.username?.substring(0, 2).toUpperCase() || 'U';

  // Manipulador de logout
  const handleLogout = () => {
    logoutMutation.mutate();
    navigate('/');
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 border-b bg-background/95 backdrop-blur z-40">
      <div className="h-full container mx-auto flex items-center justify-between px-4">
        {/* Logo e Menu Mobile */}
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Menu</span>
          </Button>
          
          <Link href="/">
            <a className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Gastro
              </span>
              <span className="text-sm font-medium text-muted-foreground hidden sm:inline-block">
                | Marketplace
              </span>
            </a>
          </Link>
        </div>

        {/* Links de navegação - Desktop */}
        <nav className="hidden lg:flex items-center space-x-1">
          <Button variant="ghost" asChild>
            <Link href="/">Início</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/categorias">Categorias</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/fornecedores">Fornecedores</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/kits">Kits</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/ofertas">Ofertas</Link>
          </Button>
        </nav>

        {/* Ações do Usuário */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Botão de busca */}
          <Button variant="ghost" size="icon" asChild>
            <Link href="/busca">
              <Search className="h-5 w-5" />
              <span className="sr-only">Buscar</span>
            </Link>
          </Button>
          
          {/* Carrinho de compras - apenas para clientes */}
          {isCustomer && (
            <Button variant="ghost" size="icon" className="relative" asChild>
              <Link href="/carrinho">
                <ShoppingCart className="h-5 w-5" />
                {cartItems.length > 0 && (
                  <Badge 
                    className="absolute -top-1 -right-1 min-w-[18px] min-h-[18px] flex items-center justify-center p-0 text-[10px]"
                    variant="destructive"
                  >
                    {cartItems.length}
                  </Badge>
                )}
                <span className="sr-only">Carrinho</span>
              </Link>
            </Button>
          )}
          
          {/* Ações específicas de perfil logado */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="flex items-center gap-2 pl-2 pr-1.5 h-9"
                >
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={user.avatarUrl} />
                    <AvatarFallback className="text-xs">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline-block text-sm font-medium max-w-[100px] truncate">
                    {user.name || user.username}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex flex-col">
                  <span>{user.name || user.username}</span>
                  {user.email && (
                    <span className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </span>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {/* Links para administradores */}
                {isAdmin && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/admin">
                        <a className="flex w-full cursor-pointer">
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          Dashboard Admin
                        </a>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/admin/fornecedores">
                        <a className="flex w-full cursor-pointer">
                          <Package className="mr-2 h-4 w-4" />
                          Gerenciar Fornecedores
                        </a>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/admin/chat">
                        <a className="flex w-full cursor-pointer">
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Chat de Suporte
                        </a>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                
                {/* Links para fornecedores */}
                {isSupplier && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/fornecedor/dashboard">
                        <a className="flex w-full cursor-pointer">
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          Dashboard Fornecedor
                        </a>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/fornecedor/produtos">
                        <a className="flex w-full cursor-pointer">
                          <Package className="mr-2 h-4 w-4" />
                          Meus Produtos
                        </a>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/fornecedor/inventario">
                        <a className="flex w-full cursor-pointer">
                          <Package className="mr-2 h-4 w-4" />
                          Inventário
                        </a>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                
                {/* Links comuns para todos os tipos de usuário */}
                <DropdownMenuItem asChild>
                  <Link href="/perfil">
                    <a className="flex w-full cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Meu Perfil
                    </a>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/notificacoes">
                    <a className="flex w-full cursor-pointer">
                      <Bell className="mr-2 h-4 w-4" />
                      Notificações
                    </a>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/configuracoes">
                    <a className="flex w-full cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Configurações
                    </a>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-red-600 focus:text-red-600"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild>
              <Link href="/auth">Entrar</Link>
            </Button>
          )}
        </div>
      </div>
      
      {/* Menu Mobile */}
      <div
        className={cn(
          "fixed inset-0 top-16 z-30 bg-background/80 backdrop-blur-sm lg:hidden transition-opacity duration-200",
          isMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsMenuOpen(false)}
      >
        <nav className="border-r bg-background w-[240px] h-full p-4 shadow-lg">
          <div className="space-y-1">
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link href="/">Início</Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link href="/categorias">Categorias</Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link href="/fornecedores">Fornecedores</Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link href="/kits">Kits</Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link href="/ofertas">Ofertas</Link>
            </Button>
          </div>
          
          {/* Links adicionais baseados no tipo de usuário */}
          {user && (
            <>
              <div className="mt-4 pt-4 border-t">
                <h3 className="text-sm font-medium mb-2">Minha Conta</h3>
                <div className="space-y-1">
                  {isAdmin && (
                    <>
                      <Button variant="ghost" className="w-full justify-start" asChild>
                        <Link href="/admin">Dashboard Admin</Link>
                      </Button>
                    </>
                  )}
                  {isSupplier && (
                    <>
                      <Button variant="ghost" className="w-full justify-start" asChild>
                        <Link href="/fornecedor/dashboard">Dashboard Fornecedor</Link>
                      </Button>
                      <Button variant="ghost" className="w-full justify-start" asChild>
                        <Link href="/fornecedor/produtos">Meus Produtos</Link>
                      </Button>
                    </>
                  )}
                  <Button variant="ghost" className="w-full justify-start" asChild>
                    <Link href="/perfil">Meu Perfil</Link>
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-red-600" 
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </Button>
                </div>
              </div>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}