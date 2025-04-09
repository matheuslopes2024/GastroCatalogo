import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import SearchResults from "@/pages/search-results";
import ProductDetails from "@/pages/product-details";
import { ProtectedRoute } from "./lib/protected-route";
import { UserRole } from "@shared/schema";
import { AuthProvider } from "./hooks/use-auth";

// Admin pages
import AdminDashboard from "@/pages/admin/dashboard";
import AdminSuppliers from "@/pages/admin/suppliers";
import AdminCommissions from "@/pages/admin/commissions";
import AdminCategories from "@/pages/admin/categories";

// Supplier pages
import SupplierDashboard from "@/pages/supplier/dashboard";
import SupplierProductManagement from "@/pages/supplier/product-management";
import SupplierSales from "@/pages/supplier/sales";

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/busca" component={SearchResults} />
      <Route path="/produto/:slug" component={ProductDetails} />
      
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
      <Router />
      <Toaster />
    </AuthProvider>
  );
}

export default App;
