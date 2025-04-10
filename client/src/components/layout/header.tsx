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
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Heart, 
  User, 
  Menu, 
  LogOut, 
  Clipboard, 
  ShoppingCart, 
  Settings, 
  Search, 
  Phone,
  ChefHat,
  Utensils,
  Refrigerator,
  Coffee
} from "lucide-react";
import { UserRole } from "@shared/schema";
import { CartDrawer } from "@/components/cart/cart-drawer";

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
        <div className="flex justify-between items-center py-2">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent font-sans">Gastro</span>
            <span className="ml-1 text-xs text-gray-500 font-semibold tracking-widest uppercase">
              Compare
            </span>
          </Link>

          {/* Desktop Search Bar */}
          <div className="hidden lg:flex max-w-md w-full mx-6 relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Pesquisar equipamentos, utensílios, produtos..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Main Navigation - Desktop */}
          <div className="hidden md:block">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <Link href="/">
                    <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                      Início
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>

                {/* Categorias com Submenu */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Categorias</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                      <li className="col-span-2">
                        <NavigationMenuLink asChild>
                          <Link 
                            className="flex w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-primary/50 to-primary p-6 no-underline outline-none focus:shadow-md"
                            href="/busca"
                          >
                            <div className="mt-4 mb-2 text-lg font-medium text-white">
                              Ver Todas as Categorias
                            </div>
                            <p className="text-sm leading-tight text-white/90">
                              Explore todas as categorias disponíveis em nosso marketplace
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                      
                      <li>
                        <NavigationMenuLink asChild>
                          <Link 
                            href="/busca?categoria=1"
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          >
                            <div className="flex items-center gap-2 font-medium leading-none">
                              <Utensils className="h-5 w-5 text-primary" />
                              <span>Utensílios</span>
                            </div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              Talheres, pratos, copos e utensílios diversos
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                      
                      <li>
                        <NavigationMenuLink asChild>
                          <Link 
                            href="/busca?categoria=2"
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          >
                            <div className="flex items-center gap-2 font-medium leading-none">
                              <ChefHat className="h-5 w-5 text-primary" />
                              <span>Equipamentos</span>
                            </div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              Fornos, fogões, chapas e equipamentos profissionais
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                      
                      <li>
                        <NavigationMenuLink asChild>
                          <Link 
                            href="/busca?categoria=3"
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          >
                            <div className="flex items-center gap-2 font-medium leading-none">
                              <Refrigerator className="h-5 w-5 text-primary" />
                              <span>Refrigeração</span>
                            </div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              Geladeiras, freezers e equipamentos de refrigeração
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                      
                      <li>
                        <NavigationMenuLink asChild>
                          <Link 
                            href="/busca?categoria=4"
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          >
                            <div className="flex items-center gap-2 font-medium leading-none">
                              <Coffee className="h-5 w-5 text-primary" />
                              <span>Cafeteria</span>
                            </div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              Máquinas de café, moedores e acessórios
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <Link href="/fornecedores">
                    <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                      Fornecedores
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger>Informações</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[250px] gap-3 p-4">
                      <li>
                        <NavigationMenuLink asChild>
                          <Link 
                            href="/como-funciona"
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          >
                            <div className="flex items-center gap-2 font-medium leading-none">
                              <span>Como Funciona</span>
                            </div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              Entenda como nossa plataforma funciona
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                      <li>
                        <NavigationMenuLink asChild>
                          <Link 
                            href="/para-fornecedores"
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          >
                            <div className="flex items-center gap-2 font-medium leading-none">
                              <span>Para Fornecedores</span>
                            </div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              Informações para se tornar um fornecedor
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                      <li>
                        <NavigationMenuLink asChild>
                          <Link 
                            href="/contato"
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          >
                            <div className="flex items-center gap-2 font-medium leading-none">
                              <Phone className="h-5 w-5 text-primary" />
                              <span>Contato</span>
                            </div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              Entre em contato com nossa equipe
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* User Controls */}
          <div className="flex items-center space-x-4">
            <Link
              href="/favoritos"
              className="hidden md:inline-flex items-center text-gray-700 hover:text-primary"
            >
              <Heart className="h-5 w-5 mr-1" />
              <span>Favoritos</span>
            </Link>
            
            <CartDrawer />

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
