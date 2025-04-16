import React, { lazy, Suspense, useEffect, useState, memo } from "react";
import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import SearchResults from "@/pages/search-results";
import ProductDetails from "@/pages/product-details";
import ProductDetail from "@/pages/product-detail";
import Checkout from "@/pages/checkout";
import CartPage from "@/pages/cart-page";
import ProductComparisonPage from "@/pages/product-comparison";
import { ProtectedRoute } from "./lib/protected-route";
import { UserRole } from "@shared/schema";
import { AuthProvider } from "./hooks/use-auth";
import { CartProvider } from "./hooks/use-cart";
import { ChatProvider } from "./hooks/use-chat";
import { WebSocketProvider } from "./hooks/use-websocket";
import ChatWidget from "./components/chat/chat-widget";
import { AdminChatProvider } from "./hooks/use-admin-chat";
import { AdminStatusProvider } from "./hooks/use-admin-status";
import { AdminLayout } from "@/components/admin/admin-layout";
import './lib/storage-patch'; // Garante carregamento correto do patch

// Admin pages
import AdminDashboard from "@/pages/admin/dashboard";
import AdminSuppliers from "@/pages/admin/suppliers";
import AdminCommissions from "@/pages/admin/commissions";
import AdminCategories from "@/pages/admin/categories";
import ChatAdminPage from "@/pages/admin/chat-admin";

// Supplier pages
import SupplierDashboard from "@/pages/supplier/dashboard";
import SupplierProductManagement from "@/pages/supplier/product-management";
import SupplierSales from "@/pages/supplier/sales";
import EstoquePage from "@/pages/supplier/estoque/index";
import AlertasEstoquePage from "@/pages/supplier/estoque/alertas";
import BulkUpdatePage from "@/pages/supplier/produtos/bulk-update";

// Existing pages
import CategoriesPage from "@/pages/categories-page";
import ProfilePage from "@/pages/profile-page";

// New pages
import HowItWorksPage from "@/pages/how-it-works";
import SuppliersListPage from "@/pages/suppliers-list";
import BlogPage from "@/pages/blog";
import BlogPostPage from "@/pages/blog-post";
import ContactPage from "@/pages/contact";
import FAQPage from "@/pages/faq";
import TermsPage from "@/pages/terms";
import PrivacyPage from "@/pages/privacy";
import HelpPage from "@/pages/help";

// Loader component para reuso
const Loader = memo(({ message = "Carregando..." }: { message?: string }) => (
  <div className="flex flex-col items-center justify-center min-h-screen">
    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    <span className="mt-4 font-medium text-gray-700">{message}</span>
  </div>
));

// Layout principal para as páginas de cliente
const MainRoutes = memo(function MainRoutes() {
  // Estado para registrar erros de rota
  const [routeErrors, setRouteErrors] = useState<Record<string, boolean>>({});
  
  // Registrar erros para análise
  const logRouteError = (path: string) => {
    console.error(`Erro ao carregar rota: ${path}`);
    setRouteErrors(prev => ({ ...prev, [path]: true }));
  };

  return (
    <>
      <ErrorBoundary
        fallback={
          <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <div className="text-red-500 text-lg font-semibold mb-2">Erro na navegação</div>
            <p className="text-gray-600 mb-4">Ocorreu um erro ao carregar esta página.</p>
            <Button onClick={() => window.location.reload()}>Tentar Novamente</Button>
          </div>
        }
      >
        <Switch>
          {/* Public Routes */}
          <Route path="/" component={HomePage} />
          <Route path="/auth" component={AuthPage} />
          <Route path="/busca" component={SearchResults} />
          <Route path="/produto/:slug" component={ProductDetails} />
          <Route path="/produtos/:slug" component={ProductDetail} />
          <Route path="/produtos/:productId/fornecedor/:supplierId">
            <Suspense fallback={<Loader message="Carregando detalhes do produto..." />}>
              {React.createElement(lazy(() => import("@/pages/supplier-product-detail").catch(err => {
                logRouteError('/produtos/:productId/fornecedor/:supplierId');
                throw err;
              })))}
            </Suspense>
          </Route>
          <Route path="/comparar/:slug" component={ProductComparisonPage} />
          <Route path="/product-groups/:slug" component={ProductComparisonPage} />
          <Route path="/grupo-produtos/:slug" component={ProductComparisonPage} />
          <Route path="/checkout" component={Checkout} />
          <Route path="/carrinho" component={CartPage} />
          <Route path="/categorias" component={CategoriesPage} />
          <Route path="/perfil" component={ProfilePage} />
          
          {/* New Public Routes */}
          <Route path="/como-funciona" component={HowItWorksPage} />
          <Route path="/fornecedores" component={SuppliersListPage} />
          <Route path="/fornecedores/:supplierId">
            <Suspense fallback={<Loader message="Carregando detalhes do fornecedor..." />}>
              {React.createElement(lazy(() => import("@/pages/supplier-detail").catch(err => {
                logRouteError('/fornecedores/:supplierId');
                throw err;
              })))}
            </Suspense>
          </Route>
          <Route path="/blog" component={BlogPage} />
          <Route path="/blog/:slug" component={BlogPostPage} />
          <Route path="/contato" component={ContactPage} />
          <Route path="/faq" component={FAQPage} />
          <Route path="/termos" component={TermsPage} />
          <Route path="/privacidade" component={PrivacyPage} />
          <Route path="/ajuda" component={HelpPage} />
          
          {/* Supplier Routes */}
          <ProtectedRoute 
            path="/fornecedor" 
            component={SupplierDashboard} 
            allowedRoles={[UserRole.SUPPLIER, UserRole.ADMIN]}
          />
          <ProtectedRoute 
            path="/fornecedor/dashboard" 
            component={SupplierDashboard} 
            allowedRoles={[UserRole.SUPPLIER, UserRole.ADMIN]}
          />
          <ProtectedRoute 
            path="/fornecedor/produtos" 
            component={SupplierProductManagement} 
            allowedRoles={[UserRole.SUPPLIER, UserRole.ADMIN]}
          />
          {/* English route aliases - redirects to Portuguese equivalents */}
          <Route path="/supplier/products">
            {() => {
              window.location.href = '/fornecedor/produtos';
              return <Loader message="Redirecionando..." />;
            }}
          </Route>
          <Route path="/supplier/dashboard">
            {() => {
              window.location.href = '/fornecedor/dashboard';
              return <Loader message="Redirecionando..." />;
            }}
          </Route>
          <Route path="/supplier/stock">
            {() => {
              window.location.href = '/fornecedor/estoque';
              return <Loader message="Redirecionando..." />;
            }}
          </Route>
          <Route path="/supplier">
            {() => {
              window.location.href = '/fornecedor';
              return <Loader message="Redirecionando..." />;
            }}
          </Route>
          <ProtectedRoute 
            path="/fornecedor/vendas" 
            component={SupplierSales} 
            allowedRoles={[UserRole.SUPPLIER, UserRole.ADMIN]}
          />
          <ProtectedRoute 
            path="/fornecedor/comissoes" 
            component={() => (
              <ErrorBoundary
                fallback={
                  <div className="flex flex-col items-center justify-center min-h-screen p-4">
                    <div className="text-red-500 text-lg font-semibold mb-2">Erro ao carregar a página de comissões</div>
                    <p className="text-gray-600 mb-4">Houve um problema ao carregar os dados de comissões.</p>
                    <Button onClick={() => window.location.reload()}>Tentar Novamente</Button>
                  </div>
                }
              >
                <Suspense fallback={<Loader message="Carregando comissões..." />}>
                  {React.createElement(lazy(() => import("@/pages/supplier/commissions").catch(err => {
                    logRouteError('/fornecedor/comissoes');
                    throw err;
                  })))}
                </Suspense>
              </ErrorBoundary>
            )}
            allowedRoles={[UserRole.SUPPLIER, UserRole.ADMIN]}
          />
          <ProtectedRoute 
            path="/fornecedor/chat" 
            component={() => (
              <Suspense fallback={<Loader message="Carregando chat de suporte..." />}>
                {React.createElement(lazy(() => import("@/pages/supplier/chat/index").catch(err => {
                  logRouteError('/fornecedor/chat');
                  throw err;
                })))}
              </Suspense>
            )}
            allowedRoles={[UserRole.SUPPLIER, UserRole.ADMIN]}
          />
          
          {/* Rotas de Estoque */}
          <ProtectedRoute 
            path="/fornecedor/estoque" 
            component={EstoquePage} 
            allowedRoles={[UserRole.SUPPLIER, UserRole.ADMIN]}
          />
          <ProtectedRoute 
            path="/fornecedor/estoque/alertas" 
            component={AlertasEstoquePage} 
            allowedRoles={[UserRole.SUPPLIER, UserRole.ADMIN]}
          />
          <ProtectedRoute 
            path="/fornecedor/produtos/bulk-update" 
            component={BulkUpdatePage} 
            allowedRoles={[UserRole.SUPPLIER, UserRole.ADMIN]}
          />
          
          {/* Fallback to 404 */}
          <Route component={NotFound} />
        </Switch>
        <ChatWidget />
      </ErrorBoundary>
    </>
  );
});

// Rotas de administração com layout de Admin
const AdminRoutes = memo(function AdminRoutes() {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <div className="text-red-500 text-lg font-semibold mb-2">Erro no painel administrativo</div>
          <p className="text-gray-600 mb-4">Ocorreu um erro ao carregar o painel administrativo.</p>
          <Button onClick={() => window.location.reload()}>Tentar Novamente</Button>
        </div>
      }
    >
      <AdminChatProvider>
        <AdminLayout>
          <Switch>
            <ProtectedRoute 
              path="/admin" 
              component={AdminDashboard} 
              allowedRoles={[UserRole.ADMIN]} 
            />
            <ProtectedRoute 
              path="/admin/fornecedores" 
              component={AdminSuppliers} 
              allowedRoles={[UserRole.ADMIN]}
            />
            <ProtectedRoute 
              path="/admin/comissoes" 
              component={AdminCommissions} 
              allowedRoles={[UserRole.ADMIN]}
            />
            <ProtectedRoute 
              path="/admin/chat" 
              component={ChatAdminPage} 
              allowedRoles={[UserRole.ADMIN]}
            />
            <ProtectedRoute 
              path="/admin/categorias" 
              component={AdminCategories} 
              allowedRoles={[UserRole.ADMIN]}
            />
            {/* Fallback para rota de admin não encontrada */}
            <Route path="/admin/*">
              <div className="p-8 text-center">
                <h2 className="text-2xl font-bold mb-4">Página de Administração não encontrada</h2>
                <p className="text-gray-600 mb-4">A página de administração que você está procurando não existe.</p>
                <Button onClick={() => window.location.href = '/admin'}>Voltar ao Dashboard</Button>
              </div>
            </Route>
          </Switch>
        </AdminLayout>
      </AdminChatProvider>
    </ErrorBoundary>
  );
});

// Componente de inicialização da aplicação
const AppInitializer = memo(function AppInitializer({ children }: { children: React.ReactNode }) {
  const [initialized, setInitialized] = useState(false);
  
  useEffect(() => {
    // Lógica de inicialização da aplicação
    try {
      // Aplicar patch de storage
      import('./lib/storage-patch').then(module => {
        module.ensureSafeStorage();
        console.log("[Inicialização] Storage patch aplicado com sucesso");
        
        // Finalizar inicialização
        setInitialized(true);
      }).catch(error => {
        console.error("[Inicialização] Erro ao aplicar Storage patch:", error);
        // Mesmo com erro, tentamos continuar
        setInitialized(true);
      });
    } catch (error) {
      console.error("[Inicialização] Erro crítico:", error);
      setInitialized(true);
    }
  }, []);
  
  if (!initialized) {
    return <Loader message="Inicializando aplicação..." />;
  }
  
  return <>{children}</>;
});

// Componente principal da aplicação
function App() {
  // Hook para detectar se estamos em uma página de admin
  const [location] = useLocation();
  const isAdminPage = location.startsWith('/admin');

  return (
    <ErrorBoundary
      fallback={
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <div className="text-red-500 text-xl font-semibold mb-4">Ops! Algo deu errado</div>
          <p className="text-gray-600 mb-6 text-center">Encontramos um problema inesperado na aplicação.</p>
          <Button onClick={() => window.location.reload()}>Recarregar Aplicação</Button>
        </div>
      }
    >
      <AppInitializer>
        <AuthProvider>
          <WebSocketProvider>
            <AdminStatusProvider>
              <CartProvider>
                <ChatProvider>
                  <Suspense 
                    fallback={<Loader message="Carregando interface..." />}
                  >
                    <Toaster />
                    {isAdminPage ? <AdminRoutes /> : <MainRoutes />}
                  </Suspense>
                </ChatProvider>
              </CartProvider>
            </AdminStatusProvider>
          </WebSocketProvider>
        </AuthProvider>
      </AppInitializer>
    </ErrorBoundary>
  );
}

export default App;
