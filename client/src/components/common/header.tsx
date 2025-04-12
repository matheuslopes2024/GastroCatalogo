import React from "react";
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
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart,
  User,
  Menu,
  Search,
  Package,
  LogOut,
  Settings,
  BarChart,
  ChevronDown,
  MessageSquare,
  Store,
  Headphones,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigationLinks = [
  {
    title: "Categorias",
    href: "/categorias",
    children: [
      {
        title: "Equipamentos de Cozinha",
        href: "/categorias/equipamentos-cozinha",
        description: "Fornos, fogões, refrigeradores e mais para sua cozinha profissional",
      },
      {
        title: "Utensílios",
        href: "/categorias/utensilios",
        description: "Facas, panelas, talheres e ferramentas para preparo de alimentos",
      },
      {
        title: "Móveis",
        href: "/categorias/moveis",
        description: "Mesas, cadeiras, armários e móveis para restaurantes e hotéis",
      },
      {
        title: "Rouparia e Têxteis",
        href: "/categorias/texteis",
        description: "Lençóis, toalhas, uniformes e itens têxteis profissionais",
      },
      {
        title: "Eletroportáteis",
        href: "/categorias/eletroportateis",
        description: "Liquidificadores, batedeiras, cafeteiras e pequenos equipamentos",
      },
      {
        title: "Descartáveis",
        href: "/categorias/descartaveis",
        description: "Embalagens, copos, guardanapos e itens para delivery",
      },
    ],
  },
  {
    title: "Ofertas",
    href: "/ofertas",
  },
  {
    title: "Fornecedores",
    href: "/fornecedores",
  },
  {
    title: "Comparar Produtos",
    href: "/comparar",
  },
  {
    title: "Fale Conosco",
    href: "/contato",
  },
];

// Role-based navigation
const roleBasedNavigation = {
  admin: [
    { title: "Dashboard", href: "/admin", icon: BarChart },
    { title: "Produtos", href: "/admin/produtos", icon: Package },
    { title: "Comissões", href: "/admin/comissoes", icon: ShoppingCart },
    { title: "Chat", href: "/admin/chat", icon: MessageSquare },
    { title: "Configurações", href: "/admin/configuracoes", icon: Settings },
  ],
  supplier: [
    { title: "Dashboard", href: "/fornecedor", icon: BarChart },
    { title: "Meus Produtos", href: "/fornecedor/produtos", icon: Package },
    { title: "Comissões", href: "/fornecedor/comissoes", icon: ShoppingCart },
    { title: "Chat", href: "/fornecedor/chat", icon: MessageSquare },
    { title: "Configurações", href: "/fornecedor/configuracoes", icon: Settings },
  ],
  user: [
    { title: "Meus Pedidos", href: "/pedidos", icon: Package },
    { title: "Favoritos", href: "/favoritos", icon: ShoppingCart },
    { title: "Mensagens", href: "/mensagens", icon: MessageSquare },
    { title: "Configurações", href: "/configuracoes", icon: Settings },
  ],
};

export default function Header() {
  const { user, logoutMutation } = useAuth();
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    setLocation("/auth");
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/">
              <a className="flex items-center">
                <Store className="h-8 w-8 text-primary mr-2" />
                <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                  Gastro
                </span>
              </a>
            </Link>
          </div>

          {/* Search */}
          <div className="hidden md:block flex-1 max-w-md mx-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Pesquisar produtos, fornecedores..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-primary focus:border-primary text-sm"
              />
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-4">
            <NavigationMenu>
              <NavigationMenuList>
                {navigationLinks.map((link) =>
                  link.children ? (
                    <NavigationMenuItem key={link.title}>
                      <NavigationMenuTrigger>{link.title}</NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <ul className="grid w-[500px] gap-3 p-4 md:w-[600px] lg:w-[700px] lg:grid-cols-2">
                          {link.children.map((child) => (
                            <li key={child.title} className="row-span-1">
                              <NavigationMenuLink asChild>
                                <Link href={child.href}>
                                  <a className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                                    <div className="text-sm font-medium leading-none">{child.title}</div>
                                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                      {child.description}
                                    </p>
                                  </a>
                                </Link>
                              </NavigationMenuLink>
                            </li>
                          ))}
                        </ul>
                      </NavigationMenuContent>
                    </NavigationMenuItem>
                  ) : (
                    <NavigationMenuItem key={link.title}>
                      <Link href={link.href}>
                        <a className="text-sm font-medium px-2 py-1.5 text-gray-700 hover:text-primary">
                          {link.title}
                        </a>
                      </Link>
                    </NavigationMenuItem>
                  )
                )}
              </NavigationMenuList>
            </NavigationMenu>

            {/* Cart Button */}
            <Link href="/carrinho">
              <a className="relative p-2">
                <ShoppingCart className="h-6 w-6 text-gray-700" />
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-primary rounded-full">
                  2
                </span>
              </a>
            </Link>

            {/* User Menu */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  {/* Role-based navigation items */}
                  {user.role && roleBasedNavigation[user.role.toLowerCase() as keyof typeof roleBasedNavigation]?.map(
                    (item) => (
                      <DropdownMenuItem key={item.href} asChild>
                        <Link href={item.href}>
                          <a className="flex items-center w-full cursor-pointer">
                            <item.icon className="mr-2 h-4 w-4" />
                            <span>{item.title}</span>
                          </a>
                        </Link>
                      </DropdownMenuItem>
                    )
                  )}
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/auth">
                <a>
                  <Button variant="outline" size="sm">
                    Entrar
                  </Button>
                </a>
              </Link>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="ml-1"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 px-4 py-2">
          <div className="mb-4 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Pesquisar produtos..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-primary focus:border-primary text-sm"
            />
          </div>
          
          <nav className="grid gap-y-2 py-2">
            {navigationLinks.map((link) => (
              <div key={link.title}>
                {link.children ? (
                  <div className="mb-2">
                    <div className="flex items-center justify-between py-2 text-base font-medium text-gray-900">
                      {link.title}
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    </div>
                    <div className="pl-4 space-y-1 border-l border-gray-200">
                      {link.children.map((child) => (
                        <Link key={child.title} href={child.href}>
                          <a className="block py-1 text-sm text-gray-600 hover:text-primary">
                            {child.title}
                          </a>
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Link href={link.href}>
                    <a className="block py-2 text-base font-medium text-gray-900 hover:text-primary">
                      {link.title}
                    </a>
                  </Link>
                )}
              </div>
            ))}
          </nav>
          
          {user ? (
            <div className="py-2 border-t border-gray-200">
              <div className="flex items-center py-2">
                <div className="flex-shrink-0 bg-gray-100 rounded-full p-2">
                  <User className="h-5 w-5 text-gray-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{user.name || user.username}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              </div>
              
              <div className="mt-2 space-y-1 pl-10">
                {user.role && roleBasedNavigation[user.role.toLowerCase() as keyof typeof roleBasedNavigation]?.map(
                  (item) => (
                    <Link key={item.href} href={item.href}>
                      <a className="flex items-center py-1 text-sm text-gray-600 hover:text-primary">
                        <item.icon className="mr-2 h-4 w-4" />
                        <span>{item.title}</span>
                      </a>
                    </Link>
                  )
                )}
                
                <button
                  onClick={handleLogout}
                  className="flex items-center py-1 text-sm text-red-600 hover:text-red-800 w-full text-left"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="py-4 flex justify-center">
              <Link href="/auth">
                <a>
                  <Button className="w-full">Entrar</Button>
                </a>
              </Link>
            </div>
          )}
          
          <div className="py-2 border-t border-gray-200">
            <Link href="/suporte">
              <a className="flex items-center py-2 text-sm text-gray-600 hover:text-primary">
                <Headphones className="mr-2 h-5 w-5" />
                <span>Suporte ao Cliente</span>
              </a>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}