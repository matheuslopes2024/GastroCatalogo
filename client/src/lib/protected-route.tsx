import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

export function ProtectedRoute({
  path,
  component: Component,
  allowedRoles = [],
}: {
  path: string;
  component: () => React.JSX.Element;
  allowedRoles?: string[];
}) {
  const { user, isLoading } = useAuth();
  
  console.log(`ProtectedRoute (${path}) - Usuário:`, user, "Roles permitidas:", allowedRoles);

  if (isLoading) {
    console.log(`ProtectedRoute (${path}) - Carregando usuário...`);
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  // Check if user is authenticated
  if (!user) {
    console.log(`ProtectedRoute (${path}) - Usuário não autenticado, redirecionando para /auth`);
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // Check if user has required role, if allowedRoles is provided
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    console.log(`ProtectedRoute (${path}) - Usuário não tem permissão. Role do usuário: ${user.role}, Roles permitidas:`, allowedRoles);
    return (
      <Route path={path}>
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
          <h1 className="text-2xl font-bold mb-4">Acesso Negado</h1>
          <p className="text-gray-600 mb-6">Você não tem permissão para acessar esta página.</p>
          <p className="text-red-500 mb-4">Seu perfil: {user.role}. Perfis permitidos: {allowedRoles.join(', ')}</p>
          <a href="/" className="text-primary hover:underline">Voltar para a página inicial</a>
        </div>
      </Route>
    );
  }

  console.log(`ProtectedRoute (${path}) - Acesso permitido para o usuário ${user.username} (${user.role})`);
  return <Route path={path} component={Component} />;
}
