import { createContext, ReactNode, useContext, useEffect, useState, useMemo } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser, UserRole } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Definição dos tipos
type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  isLoggedIn: boolean;
};

type LoginData = Pick<InsertUser, "username" | "password">;

// Criando o contexto com um valor inicial mais seguro
export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  error: null,
  // Estes serão substituídos pelos valores reais no provider
  loginMutation: {} as UseMutationResult<SelectUser, Error, LoginData>,
  logoutMutation: {} as UseMutationResult<void, Error, void>,
  registerMutation: {} as UseMutationResult<SelectUser, Error, InsertUser>,
  hasRole: () => false,
  isLoggedIn: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [initializationComplete, setInitializationComplete] = useState(false);
  
  // Query para obter os dados do usuário
  const {
    data: user,
    error,
    isLoading: isUserLoading,
    refetch,
  } = useQuery<SelectUser | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: 1, // Limita o número de tentativas para evitar loops
    staleTime: 5 * 60 * 1000, // 5 minutos até considerar os dados obsoletos
  });

  // Mutation para login
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      console.log("Tentando login com:", credentials.username);
      try {
        const res = await apiRequest("POST", "/api/login", credentials);
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || "Falha na autenticação");
        }
        return await res.json();
      } catch (err) {
        console.error("Erro no login:", err);
        throw err;
      }
    },
    onSuccess: (userData: SelectUser) => {
      console.log("Login bem-sucedido para:", userData.username);
      queryClient.setQueryData(["/api/user"], userData);
      toast({
        title: "Login realizado com sucesso",
        description: `Bem-vindo, ${userData.name || userData.username}!`,
      });
    },
    onError: (error: Error) => {
      console.error("Erro durante o login:", error);
      toast({
        title: "Falha no login",
        description: error.message || "Usuário ou senha incorretos",
        variant: "destructive",
      });
    },
  });

  // Mutation para registro
  const registerMutation = useMutation({
    mutationFn: async (userData: InsertUser) => {
      console.log("Tentando registrar usuário:", userData.username);
      try {
        const res = await apiRequest("POST", "/api/register", userData);
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || "Falha no registro");
        }
        return await res.json();
      } catch (err) {
        console.error("Erro no registro:", err);
        throw err;
      }
    },
    onSuccess: (userData: SelectUser) => {
      console.log("Registro bem-sucedido para:", userData.username);
      queryClient.setQueryData(["/api/user"], userData);
      toast({
        title: "Registro realizado com sucesso",
        description: "Sua conta foi criada com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Falha no registro",
        description: error.message || "Não foi possível criar sua conta",
        variant: "destructive",
      });
    },
  });

  // Mutation para logout
  const logoutMutation = useMutation({
    mutationFn: async () => {
      console.log("Tentando logout");
      try {
        const res = await apiRequest("POST", "/api/logout");
        if (!res.ok) {
          throw new Error("Falha ao realizar logout");
        }
      } catch (err) {
        console.error("Erro no logout:", err);
        throw err;
      }
    },
    onSuccess: () => {
      console.log("Logout bem-sucedido");
      queryClient.setQueryData(["/api/user"], null);
      // Invalida todas as queries que dependem de autenticação
      queryClient.invalidateQueries();
      toast({
        title: "Logout realizado com sucesso",
        description: "Você foi desconectado",
      });
    },
    onError: (error: Error) => {
      console.error("Erro durante o logout:", error);
      toast({
        title: "Falha no logout",
        description: error.message || "Não foi possível desconectar",
        variant: "destructive",
      });
    },
  });

  // Função auxiliar para verificar os papéis do usuário
  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    
    if (Array.isArray(roles)) {
      return roles.includes(user.role as UserRole);
    }
    
    return user.role === roles;
  };

  // Status de carregamento combinado
  const isLoading = isUserLoading || !initializationComplete;
  const isLoggedIn = !!user;

  // Efeito para marcar a inicialização como completa
  useEffect(() => {
    if (!isUserLoading) {
      setInitializationComplete(true);
    }
  }, [isUserLoading]);

  // Memoize o valor do contexto para evitar re-renderizações desnecessárias
  const contextValue = useMemo(() => ({
    user: user ?? null,
    isLoading,
    error,
    loginMutation,
    logoutMutation,
    registerMutation,
    hasRole,
    isLoggedIn,
  }), [user, isLoading, error, loginMutation, logoutMutation, registerMutation, hasRole, isLoggedIn]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    console.error("useAuth deve ser usado dentro de um AuthProvider");
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}
