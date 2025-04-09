import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CategoryNav } from "@/components/layout/category-nav";
import { HeroSearch } from "@/components/home/hero-search";
import { FeaturedDeals } from "@/components/home/featured-deals";
import { ComparisonSection } from "@/components/home/comparison-section";
import { WhyUseSection } from "@/components/home/why-use-section";
import { PopularCategories } from "@/components/home/popular-categories";
import { SupplierCTA } from "@/components/home/supplier-cta";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { LockIcon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { UserRole } from "@shared/schema";

export default function HomePage() {
  const { user } = useAuth();

  // Helper to determine admin button destination
  const getAdminLink = () => {
    if (user?.role === UserRole.ADMIN) {
      return "/admin";
    } else if (user?.role === UserRole.SUPPLIER) {
      return "/fornecedor";
    } else {
      return "/auth";
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        <HeroSearch />
        <CategoryNav />
        <FeaturedDeals />
        <ComparisonSection />
        <WhyUseSection />
        <PopularCategories />
        <SupplierCTA />
      </main>
      
      <Footer />
      
      {/* Admin/Supplier Quick Access */}
      <div className="fixed bottom-4 right-4 z-50">
        <Link href={getAdminLink()}>
          <Button className="bg-gray-900 hover:bg-opacity-90 text-white font-bold py-2 px-4 rounded-lg shadow-lg flex items-center">
            <LockIcon className="mr-2 h-4 w-4" />
            {user?.role === UserRole.ADMIN 
              ? "Acessar Admin" 
              : user?.role === UserRole.SUPPLIER 
                ? "Painel do Fornecedor" 
                : "Acessar Painel"}
          </Button>
        </Link>
      </div>
    </div>
  );
}
