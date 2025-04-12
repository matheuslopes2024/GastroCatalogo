import React, { lazy, Suspense } from "react";
import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
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

// Layout principal para as páginas de cliente
function MainRoutes() {
  return (
    <>
      <Switch>
        {/* Public Routes */}
        <Route path="/" component={HomePage} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/busca" component={SearchResults} />
        <Route path="/produto/:slug" component={ProductDetails} />
        <Route path="/produtos/:slug" component={ProductDetail} />
        <Route path="/produtos/:productId/fornecedor/:supplierId">
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>}>
            {React.createElement(lazy(() => import("@/pages/supplier-product-detail")))}
          </Suspense>
        </Route>
        <Route path="/comparar/:slug" component={ProductComparisonPage} />
        <Route path="/checkout" component={Checkout} />
        <Route path="/carrinho" component={CartPage} />
        <Route path="/categorias" component={CategoriesPage} />
        <Route path="/perfil" component={ProfilePage} />
        
        {/* New Public Routes */}
        <Route path="/como-funciona" component={HowItWorksPage} />
        <Route path="/fornecedores" component={SuppliersListPage} />
        <Route path="/fornecedores/:supplierId">
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>}>
            {React.createElement(lazy(() => import("@/pages/supplier-detail")))}
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
        <ProtectedRoute 
          path="/fornecedor/vendas" 
          component={SupplierSales} 
          allowedRoles={[UserRole.SUPPLIER, UserRole.ADMIN]}
        />
        <ProtectedRoute 
          path="/fornecedor/comissoes" 
          component={() => (
            <Suspense fallback={
              <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-2 font-medium text-gray-700">Carregando comissões...</span>
              </div>
            }>
              {React.createElement(lazy(() => import("@/pages/supplier/commissions")))}
            </Suspense>
          )}
          allowedRoles={[UserRole.SUPPLIER, UserRole.ADMIN]}
        />
        <ProtectedRoute 
          path="/fornecedor/chat" 
          component={() => (
            <Suspense fallback={
              <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-2 font-medium text-gray-700">Carregando chat de suporte...</span>
              </div>
            }>
              {React.createElement(lazy(() => import("@/pages/supplier/chat/index")))}
            </Suspense>
          )}
          allowedRoles={[UserRole.SUPPLIER, UserRole.ADMIN]}
        />
        
        {/* Fallback to 404 */}
        <Route component={NotFound} />
      </Switch>
      <ChatWidget />
    </>
  );
}

// Rotas de administração com layout de Admin
function AdminRoutes() {
  return (
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
              <p>A página de administração que você está procurando não existe.</p>
            </div>
          </Route>
        </Switch>
      </AdminLayout>
    </AdminChatProvider>
  );
}

function App() {
  // Hook para detectar se estamos em uma página de admin
  const [location] = useLocation();
  const isAdminPage = location.startsWith('/admin');

  return (
    <AuthProvider>
      <CartProvider>
        <WebSocketProvider>
          <AdminStatusProvider>
            <ChatProvider>
              <Toaster />
              {isAdminPage ? <AdminRoutes /> : <MainRoutes />}
            </ChatProvider>
          </AdminStatusProvider>
        </WebSocketProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
