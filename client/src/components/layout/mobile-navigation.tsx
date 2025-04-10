import { Link, useLocation } from "wouter";
import { 
  Home,
  Search,
  ShoppingCart,
  User,
  ListFilter
} from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export function MobileNavigation() {
  const [location] = useLocation();
  const { getTotalItems } = useCart();
  const { user } = useAuth();
  
  const cartItemsCount = getTotalItems();
  
  const navItems = [
    {
      name: 'Início',
      href: '/',
      icon: <Home className="w-6 h-6" />
    },
    {
      name: 'Buscar',
      href: '/busca',
      icon: <Search className="w-6 h-6" />
    },
    {
      name: 'Categorias',
      href: '/categorias',
      icon: <ListFilter className="w-6 h-6" />
    },
    {
      name: 'Carrinho',
      href: '/carrinho',
      icon: (
        <div className="relative">
          <ShoppingCart className="w-6 h-6" />
          {cartItemsCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {cartItemsCount > 9 ? '9+' : cartItemsCount}
            </span>
          )}
        </div>
      )
    },
    {
      name: user ? 'Perfil' : 'Entrar',
      href: user ? '/perfil' : '/auth',
      icon: <User className="w-6 h-6" />
    }
  ];

  return (
    <div className="mobile-bottom-nav">
      {navItems.map((item) => (
        <Link 
          key={item.name} 
          href={item.href}
          className={cn(
            "mobile-nav-item press-effect touch-target",
            location === item.href && "active"
          )}
        >
          <span className="mobile-nav-icon">{item.icon}</span>
          <span className="text-xs">{item.name}</span>
        </Link>
      ))}
    </div>
  );
}