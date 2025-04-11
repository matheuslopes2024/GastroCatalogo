import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import SearchResults from "@/pages/search-results";
import ProductDetails from "@/pages/product-details";
import Checkout from "@/pages/checkout";
import CartPage from "@/pages/cart-page";
import { ProtectedRoute } from "./lib/protected-route";
import { UserRole } from "@shared/schema";
import { AuthProvider } from "./hooks/use-auth";
import { CartProvider } from "./hooks/use-cart";
import { ChatProvider } from "./hooks/use-chat";
import ChatWidget from "./components/chat/chat-widget";

// Admin pages
import AdminDashboard from "@/pages/admin/dashboard";
import AdminSuppliers from "@/pages/admin/suppliers";
import AdminCommissions from "@/pages/admin/commissions";
import AdminCategories from "@/pages/admin/categories";

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

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/busca" component={SearchResults} />
      <Route path="/produto/:slug" component={ProductDetails} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/carrinho" component={CartPage} />
      <Route path="/categorias" component={CategoriesPage} />
      <Route path="/perfil" component={ProfilePage} />
      
      {/* New Public Routes */}
      <Route path="/como-funciona" component={HowItWorksPage} />
      <Route path="/fornecedores" component={SuppliersListPage} />
      <Route path="/blog" component={BlogPage} />
      <Route path="/blog/:slug" component={BlogPostPage} />
      <Route path="/contato" component={ContactPage} />
      <Route path="/faq" component={FAQPage} />
      <Route path="/termos" component={TermsPage} />
      <Route path="/privacidade" component={PrivacyPage} />
      <Route path="/ajuda" component={HelpPage} />
      
      {/* Admin Routes */}
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
        path="/admin/categorias" 
        component={AdminCategories} 
        allowedRoles={[UserRole.ADMIN]}
      />
      
      {/* Supplier Routes */}
      <ProtectedRoute 
        path="/fornecedor" 
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
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <ChatProvider>
          <Router />
          <Toaster />
          {/* Adicionando o componente de chat em todas as páginas */}
          <ChatWidget />
        </ChatProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
