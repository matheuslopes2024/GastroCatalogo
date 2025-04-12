import React, { useState, useEffect } from "react";
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
  Coffee,
  ChevronDown,
  Store,
  Home,
  Info,
  Star,
  Truck,
  DollarSign,
  PercentCircle,
  List
} from "lucide-react";
import { UserRole } from "@shared/schema";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { motion } from "framer-motion";

// Efeitos das animações
const logoVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

const menuItemVariants = {
  hidden: { opacity: 0, y: -5 },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: custom * 0.1,
      duration: 0.3,
      ease: "easeOut"
    }
  })
};

const searchBarVariants = {
  hidden: { opacity: 0, width: "80%" },
  visible: { 
    opacity: 1, 
    width: "100%",
    transition: { 
      delay: 0.3,
      duration: 0.4,
      ease: "easeInOut"
    }
  }
};

const mobileMenuVariants = {
  hidden: { opacity: 0, height: 0 },
  visible: { 
    opacity: 1, 
    height: "auto",
    transition: { 
      duration: 0.3,
      ease: "easeInOut"
    }
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: { 
      duration: 0.2,
      ease: "easeInOut"
    }
  }
};

// Componente customizado para os itens do menu com hover effect sofisticado
const MenuNavItem = ({ 
  href, 
  icon: Icon, 
  children, 
  customDelay = 0 
}: { 
  href: string; 
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  customDelay?: number;
}) => {
  const [location] = useLocation();
  const isActive = location === href;
  
  return (
    <motion.div
      variants={menuItemVariants}
      initial="hidden"
      animate="visible"
      custom={customDelay}
      className="relative"
    >
      <Link 
        href={href}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-300
          ${isActive 
            ? "text-primary font-medium bg-primary/5" 
            : "text-gray-700 hover:text-primary hover:bg-primary/5"
          }
        `}
      >
        {Icon && <Icon className={`h-5 w-5 ${isActive ? "text-primary" : "text-gray-500"}`} />}
        <span className="font-medium">{children}</span>
        {isActive && (
          <motion.div 
            className="absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-primary rounded-full"
            layoutId="activeIndicator"
            style={{ width: '30%' }}
          />
        )}
      </Link>
    </motion.div>
  );
};

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  // Efeito para detectar scroll e mudar o estilo do header
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    <header 
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled 
          ? "bg-white/90 backdrop-blur-md shadow-lg" 
          : "bg-white shadow-md"
      }`}
    >
      {/* Barra superior com informações extras */}
      <div className="hidden md:block bg-gradient-to-r from-primary/90 to-primary text-white py-1">
        <div className="container mx-auto px-4 flex justify-between items-center text-xs">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              <span>(11) 9999-9999</span>
            </div>
            <div className="flex items-center gap-1">
              <Info className="h-3 w-3" />
              <span>Suporte 24h</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/como-funciona" className="hover:underline">Como funciona</Link>
            <Link href="/para-fornecedores" className="hover:underline">Para fornecedores</Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-3">
          {/* Logo animado */}
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={logoVariants}
          >
            <Link href="/" className="flex items-center group">
              <div className="relative">
                <span className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent font-sans group-hover:from-primary/70 group-hover:to-primary transition-all duration-300">
                  Gastro
                </span>
                <motion.span 
                  className="absolute top-0 left-0 text-3xl font-bold text-transparent font-sans"
                  style={{ 
                    WebkitTextStroke: '1px rgba(var(--primary)/0.3)',
                    clipPath: 'polygon(0 0, 100% 0, 100% 0, 0 0)',
                    transform: 'translateX(-7px) translateY(-3px)'
                  }}
                  animate={{ 
                    clipPath: ['polygon(0 0, 100% 0, 100% 0, 0 0)', 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'],
                    transition: { 
                      duration: 1.5, 
                      ease: "easeInOut",
                      repeat: Infinity,
                      repeatType: "reverse",
                      repeatDelay: 2
                    }
                  }}
                >
                  Gastro
                </motion.span>
              </div>
              <div className="flex flex-col ml-1">
                <span className="text-xs text-gray-500 font-semibold tracking-widest uppercase">
                  Compare
                </span>
                <span className="text-[8px] text-primary/70">Marketplace Profissional</span>
              </div>
            </Link>
          </motion.div>

          {/* Desktop Search Bar animado */}
          <motion.div 
            className="hidden lg:flex max-w-md w-full mx-6 relative"
            variants={searchBarVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Pesquisar equipamentos, utensílios, produtos..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 shadow-sm hover:shadow-md"
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-7 px-2 bg-primary/10 hover:bg-primary/20 text-primary"
              >
                Buscar
              </Button>
            </div>
          </motion.div>

          {/* Main Navigation - Desktop - Com design elegante e animações */}
          <div className="hidden md:block">
            <NavigationMenu>
              <NavigationMenuList className="gap-1">
                <NavigationMenuItem>
                  <NavigationMenuLink asChild className={cn(
                    navigationMenuTriggerStyle(),
                    "bg-transparent hover:bg-primary/5",
                    isActive("/") && "text-primary font-medium"
                  )}>
                    <Link href="/">
                      <Home className="h-4 w-4 mr-1" />
                      Início
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>

                {/* Categorias com Submenu - Redesenhado com visual premium */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent hover:bg-primary/5">
                    <List className="h-4 w-4 mr-1" />
                    Categorias
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4 md:w-[600px] md:grid-cols-2 lg:w-[750px]">
                      <li className="col-span-2">
                        <Link 
                          href="/busca"
                          className="flex w-full select-none flex-col justify-end rounded-md bg-gradient-to-r from-primary/80 to-primary p-6 no-underline outline-none focus:shadow-md overflow-hidden relative group cursor-pointer"
                        >
                          <motion.div 
                            className="absolute top-0 left-0 w-full h-full bg-white/10"
                            initial={{ x: '-100%' }}
                            animate={{ 
                              x: ['100%', '-100%'],
                              transition: { 
                                repeat: Infinity, 
                                duration: 1.5,
                                ease: "linear",
                                repeatDelay: 0.5
                              } 
                            }}
                          />
                          <div className="mt-4 mb-2 text-lg font-medium text-white flex items-center gap-2">
                            <Search className="h-5 w-5" />
                            <span>Ver Todas as Categorias</span>
                          </div>
                          <p className="text-sm leading-tight text-white/90">
                            Explore todas as categorias disponíveis em nosso marketplace profissional
                          </p>
                        </Link>
                      </li>
                      
                      <li>
                        <Link 
                          href="/busca?categoria=1"
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground group overflow-hidden relative cursor-pointer"
                        >
                          <div className="absolute bottom-0 left-0 h-1 bg-primary/20 w-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                          <div className="flex items-center gap-2 font-medium leading-none">
                            <Utensils className="h-5 w-5 text-primary" />
                            <span>Utensílios</span>
                          </div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Talheres, pratos, copos e utensílios diversos para seu restaurante
                          </p>
                        </Link>
                      </li>
                      
                      <li>
                        <Link 
                          href="/busca?categoria=2"
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground group overflow-hidden relative cursor-pointer"
                        >
                          <div className="absolute bottom-0 left-0 h-1 bg-primary/20 w-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                          <div className="flex items-center gap-2 font-medium leading-none">
                            <ChefHat className="h-5 w-5 text-primary" />
                            <span>Equipamentos</span>
                          </div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Fornos, fogões, chapas e equipamentos profissionais de alta performance
                          </p>
                        </Link>
                      </li>
                      
                      <li>
                        <Link 
                          href="/busca?categoria=3"
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground group overflow-hidden relative cursor-pointer"
                        >
                          <div className="absolute bottom-0 left-0 h-1 bg-primary/20 w-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                          <div className="flex items-center gap-2 font-medium leading-none">
                            <Refrigerator className="h-5 w-5 text-primary" />
                            <span>Refrigeração</span>
                          </div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Geladeiras, freezers e equipamentos de refrigeração de alta qualidade
                          </p>
                        </Link>
                      </li>
                      
                      <li>
                        <Link 
                          href="/busca?categoria=4"
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground group overflow-hidden relative cursor-pointer"
                        >
                          <div className="absolute bottom-0 left-0 h-1 bg-primary/20 w-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                          <div className="flex items-center gap-2 font-medium leading-none">
                            <Coffee className="h-5 w-5 text-primary" />
                            <span>Cafeteria</span>
                          </div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Máquinas de café, moedores e acessórios para cafeterias profissionais
                          </p>
                        </Link>
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuLink asChild className={cn(
                    navigationMenuTriggerStyle(),
                    "bg-transparent hover:bg-primary/5",
                    isActive("/fornecedores") && "text-primary font-medium"
                  )}>
                    <Link href="/fornecedores">
                      <Store className="h-4 w-4 mr-1" />
                      Fornecedores
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent hover:bg-primary/5">
                    <Info className="h-4 w-4 mr-1" />
                    Informações
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[320px] gap-3 p-4">
                      <li>
                        <Link 
                          href="/como-funciona"
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground group overflow-hidden relative cursor-pointer"
                        >
                          <div className="absolute bottom-0 left-0 h-1 bg-primary/20 w-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                          <div className="flex items-center gap-2 font-medium leading-none">
                            <Info className="h-5 w-5 text-primary" />
                            <span>Como Funciona</span>
                          </div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Entenda como nossa plataforma funciona e os benefícios para seu negócio
                          </p>
                        </Link>
                      </li>
                      <li>
                        <Link 
                          href="/para-fornecedores"
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground group overflow-hidden relative cursor-pointer"
                        >
                          <div className="absolute bottom-0 left-0 h-1 bg-primary/20 w-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                          <div className="flex items-center gap-2 font-medium leading-none">
                            <Truck className="h-5 w-5 text-primary" />
                            <span>Para Fornecedores</span>
                          </div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Venda seus produtos e aumente o alcance do seu negócio na nossa plataforma
                          </p>
                        </Link>
                      </li>
                      <li>
                        <Link 
                          href="/contato"
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground group overflow-hidden relative cursor-pointer"
                        >
                          <div className="absolute bottom-0 left-0 h-1 bg-primary/20 w-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                          <div className="flex items-center gap-2 font-medium leading-none">
                            <Phone className="h-5 w-5 text-primary" />
                            <span>Contato</span>
                          </div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Entre em contato com nossa equipe especializada
                          </p>
                        </Link>
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* User Controls - Redesenhados com estilo premium */}
          <div className="flex items-center space-x-2 md:space-x-4">
            <Link
              href="/favoritos"
              className="hidden md:inline-flex items-center text-gray-700 hover:text-primary transition-colors duration-200 bg-transparent hover:bg-primary/5 p-2 rounded-full"
            >
              <Heart className="h-5 w-5" />
              <span className="ml-1 hidden lg:inline">Favoritos</span>
            </Link>
            
            <CartDrawer />

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 text-gray-700 hover:text-primary hover:bg-primary/5 rounded-full p-2 h-auto"
                  >
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary">
                      <User className="h-4 w-4" />
                    </div>
                    <span className="hidden md:inline-block">{user.name}</span>
                    <ChevronDown className="h-4 w-4 opacity-50 hidden md:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 mt-1 p-2">
                  <DropdownMenuLabel className="font-medium">Minha Conta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="py-2 cursor-pointer hover:bg-primary/5">
                    <Link href={getDashboardLink()} className="w-full">
                      <Clipboard className="h-4 w-4 mr-2 text-primary" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  
                  {user.role === UserRole.SUPPLIER && (
                    <>
                      <DropdownMenuItem asChild className="py-2 cursor-pointer hover:bg-primary/5">
                        <Link href="/fornecedor/produtos" className="w-full">
                          <ShoppingCart className="h-4 w-4 mr-2 text-primary" />
                          <span>Meus Produtos</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="py-2 cursor-pointer hover:bg-primary/5">
                        <Link href="/fornecedor/vendas" className="w-full">
                          <DollarSign className="h-4 w-4 mr-2 text-primary" />
                          <span>Minhas Vendas</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  
                  {user.role === UserRole.ADMIN && (
                    <>
                      <DropdownMenuItem asChild className="py-2 cursor-pointer hover:bg-primary/5">
                        <Link href="/admin/fornecedores" className="w-full">
                          <Store className="h-4 w-4 mr-2 text-primary" />
                          <span>Fornecedores</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="py-2 cursor-pointer hover:bg-primary/5">
                        <Link href="/admin/comissoes" className="w-full">
                          <PercentCircle className="h-4 w-4 mr-2 text-primary" />
                          <span>Comissões</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="py-2 cursor-pointer hover:bg-primary/5">
                    <LogOut className="h-4 w-4 mr-2 text-primary" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/auth">
                <Button variant="default" size="sm" className="rounded-full shadow-sm hover:shadow-md">
                  <User className="h-4 w-4 mr-1" />
                  <span>Entrar</span>
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Barra de pesquisa mobile */}
        <div className="lg:hidden flex w-full pb-3">
          <div className="relative w-full">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Pesquisar produtos..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
            />
          </div>
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden flex justify-end py-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-gray-500 hover:text-primary rounded-full p-2 h-auto"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>

        {/* Mobile menu aprimorado com animações e estilo avançado */}
        {mobileMenuOpen && (
          <motion.div 
            className="md:hidden py-4 border-t" 
            variants={mobileMenuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <nav className="flex flex-col space-y-1">
              <MenuNavItem href="/" icon={Home} customDelay={0}>Início</MenuNavItem>
              <MenuNavItem href="/busca" icon={Search} customDelay={0.1}>Categorias</MenuNavItem>
              <MenuNavItem href="/fornecedores" icon={Store} customDelay={0.2}>Fornecedores</MenuNavItem>
              <MenuNavItem href="/como-funciona" icon={Info} customDelay={0.3}>Como Funciona</MenuNavItem>
              <MenuNavItem href="/para-fornecedores" icon={Truck} customDelay={0.4}>Para Fornecedores</MenuNavItem>
              <MenuNavItem href="/favoritos" icon={Heart} customDelay={0.5}>Favoritos</MenuNavItem>
            </nav>
          </motion.div>
        )}
      </div>
    </header>
  );
}
