import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Heart, User, Menu, LogOut, Clipboard, ShoppingCart, Settings } from "lucide-react";
import { UserRole } from "@shared/schema";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  const isActive = (path: string) => {
    return location === path;
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getDashboardLink = () => {
    if (user?.role === UserRole.ADMIN) {
      return "/admin";
    } else if (user?.role === UserRole.SUPPLIER) {
      return "/fornecedor";
    }
    return "/";
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="text-2xl font-bold text-primary font-sans">Gastro</span>
            <span className="ml-1 text-xs text-gray-500 font-semibold tracking-widest uppercase">
              Compare
            </span>
          </Link>

          {/* Main Navigation - Desktop */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="/"
              className={`${
                isActive("/") ? "text-primary" : "text-gray-700"
              } hover:text-primary font-medium`}
            >
              Início
            </Link>
            <Link
              href="/busca"
              className={`${
                isActive("/busca") ? "text-primary" : "text-gray-700"
              } hover:text-primary font-medium`}
            >
              Categorias
            </Link>
            <Link
              href="/fornecedores"
              className={`${
                isActive("/fornecedores") ? "text-primary" : "text-gray-700"
              } hover:text-primary font-medium`}
            >
              Fornecedores
            </Link>
            <Link
              href="/como-funciona"
              className={`${
                isActive("/como-funciona") ? "text-primary" : "text-gray-700"
              } hover:text-primary font-medium`}
            >
              Como Funciona
            </Link>
            <Link
              href="/para-fornecedores"
              className={`${
                isActive("/para-fornecedores") ? "text-primary" : "text-gray-700"
              } hover:text-primary font-medium`}
            >
              Para Fornecedores
            </Link>
          </nav>

          {/* User Controls */}
          <div className="flex items-center space-x-4">
            <Link
              href="/favoritos"
              className="hidden md:inline-flex items-center text-gray-700 hover:text-primary"
            >
              <Heart className="h-5 w-5 mr-1" />
              <span>Favoritos</span>
            </Link>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center text-gray-700 hover:text-primary"
                  >
                    <User className="h-5 w-5 mr-1" />
                    <span className="hidden md:inline-block">{user.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={getDashboardLink()} className="w-full cursor-pointer">
                      <Clipboard className="h-4 w-4 mr-2" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  
                  {user.role === UserRole.SUPPLIER && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/fornecedor/produtos" className="w-full cursor-pointer">
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          <span>Meus Produtos</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/fornecedor/vendas" className="w-full cursor-pointer">
                          <Settings className="h-4 w-4 mr-2" />
                          <span>Minhas Vendas</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  
                  {user.role === UserRole.ADMIN && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/fornecedores" className="w-full cursor-pointer">
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          <span>Fornecedores</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/comissoes" className="w-full cursor-pointer">
                          <Settings className="h-4 w-4 mr-2" />
                          <span>Comissões</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    <LogOut className="h-4 w-4 mr-2" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/auth">
                <Button variant="outline" size="sm">
                  <User className="h-4 w-4 mr-1" />
                  <span>Entrar</span>
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden flex justify-end py-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-gray-500 hover:text-primary"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <nav className="flex flex-col space-y-3">
              <Link
                href="/"
                className={`${
                  isActive("/") ? "text-primary" : "text-gray-700"
                } hover:text-primary font-medium`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Início
              </Link>
              <Link
                href="/busca"
                className={`${
                  isActive("/busca") ? "text-primary" : "text-gray-700"
                } hover:text-primary font-medium`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Categorias
              </Link>
              <Link
                href="/fornecedores"
                className={`${
                  isActive("/fornecedores") ? "text-primary" : "text-gray-700"
                } hover:text-primary font-medium`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Fornecedores
              </Link>
              <Link
                href="/como-funciona"
                className={`${
                  isActive("/como-funciona") ? "text-primary" : "text-gray-700"
                } hover:text-primary font-medium`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Como Funciona
              </Link>
              <Link
                href="/para-fornecedores"
                className={`${
                  isActive("/para-fornecedores") ? "text-primary" : "text-gray-700"
                } hover:text-primary font-medium`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Para Fornecedores
              </Link>
              <Link
                href="/favoritos"
                className="text-gray-700 hover:text-primary font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Favoritos
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
