import { useState, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CategoryNav } from "@/components/layout/category-nav";

interface SearchLayoutProps {
  children: ReactNode;
  sidebar: ReactNode;
  header: ReactNode;
}

export function SearchLayout({ children, sidebar, header }: SearchLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  
  // Em desktop sempre mostra a sidebar
  const showSidebar = isDesktop || sidebarOpen;
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow bg-gray-50">
        <CategoryNav />
        
        {/* Cabeçalho da busca (formulário, breadcrumbs, etc) */}
        <div className="bg-white border-b py-6">
          <div className="container mx-auto px-4">
            {header}
          </div>
        </div>
        
        {/* Botão de toggle da sidebar (mobile) */}
        {!isDesktop && (
          <div className="container mx-auto px-4 my-4">
            <Button
              variant="outline"
              className="flex items-center gap-2 w-full md:w-auto shadow-sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <SlidersHorizontal className="h-4 w-4" />
              {sidebarOpen ? 'Esconder filtros' : 'Mostrar filtros'}
              {sidebarOpen ? 
                <ChevronLeft className="h-4 w-4" /> : 
                <ChevronRight className="h-4 w-4" />
              }
            </Button>
          </div>
        )}
        
        {/* Container de conteúdo flexível */}
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar com filtros */}
            <div 
              className={cn(
                "lg:w-1/4 transition-all",
                showSidebar ? "block" : "hidden"
              )}
            >
              {sidebar}
            </div>
            
            {/* Conteúdo principal */}
            <div className={cn(
              "transition-all",
              showSidebar ? "lg:w-3/4" : "w-full"
            )}>
              {children}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}