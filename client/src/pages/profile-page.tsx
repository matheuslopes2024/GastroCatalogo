import { useLocation } from "wouter";
import { 
  ArrowLeft, 
  User, 
  ShoppingBag, 
  Heart, 
  CreditCard, 
  LogOut,
  Bell,
  Settings,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { useToast } from "@/hooks/use-toast";
import { UserRole } from "@shared/schema";

export default function ProfilePage() {
  const [, navigate] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      navigate("/");
      toast({
        title: "Desconectado",
        description: "Você foi desconectado com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao tentar sair",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    navigate("/auth");
    return null;
  }

  const menuItems = [
    {
      name: "Meus Pedidos",
      icon: <ShoppingBag className="h-5 w-5" />,
      onClick: () => navigate("/pedidos"),
    },
    {
      name: "Favoritos",
      icon: <Heart className="h-5 w-5" />,
      onClick: () => navigate("/favoritos"),
    },
    {
      name: "Métodos de Pagamento",
      icon: <CreditCard className="h-5 w-5" />,
      onClick: () => navigate("/pagamentos"),
    },
    {
      name: "Notificações",
      icon: <Bell className="h-5 w-5" />,
      onClick: () => navigate("/notificacoes"),
    },
    {
      name: "Configurações",
      icon: <Settings className="h-5 w-5" />,
      onClick: () => navigate("/configuracoes"),
    },
    {
      name: "Sair",
      icon: <LogOut className="h-5 w-5" />,
      onClick: handleLogout,
      danger: true,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="mobile-header flex items-center px-4 py-3">
        <Button
          variant="ghost"
          size="icon"
          className="touch-target mr-2"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-bold">Perfil</h1>
      </div>

      <main className="flex-grow mobile-container p-4">
        <div className="app-like-card p-5 mb-6">
          <div className="flex items-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-bold">{user.name || user.username}</h2>
              <p className="text-muted-foreground">{user.email}</p>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => navigate("/editar-perfil")}
              >
                Editar Perfil
              </Button>
            </div>
          </div>
        </div>

        <div className="app-like-card overflow-hidden">
          {menuItems.map((item, index) => (
            <button
              key={item.name}
              className={`w-full text-left p-4 flex items-center justify-between press-effect ${
                index !== menuItems.length - 1 ? "border-b border-border" : ""
              } ${item.danger ? "text-red-500" : ""}`}
              onClick={item.onClick}
            >
              <div className="flex items-center">
                <span className={`mr-3 ${item.danger ? "text-red-500" : "text-primary"}`}>
                  {item.icon}
                </span>
                <span>{item.name}</span>
              </div>
              {!item.danger && <ChevronRight className="h-5 w-5 text-muted-foreground" />}
            </button>
          ))}
        </div>

        {user.role === UserRole.SUPPLIER && (
          <div className="mt-6">
            <Button
              className="w-full"
              onClick={() => navigate("/fornecedor")}
            >
              Acessar Painel do Fornecedor
            </Button>
          </div>
        )}

        {user.role === UserRole.ADMIN && (
          <div className="mt-6">
            <Button
              className="w-full"
              onClick={() => navigate("/admin")}
            >
              Acessar Painel de Administração
            </Button>
          </div>
        )}

        <div className="text-center text-xs text-muted-foreground mt-10">
          <p>Gastro Marketplace v1.0.0</p>
          <p className="mt-1">© 2025 Todos os direitos reservados</p>
        </div>
      </main>

      <MobileNavigation />
    </div>
  );
}