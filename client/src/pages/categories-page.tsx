import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Category } from "@shared/schema";

export default function CategoriesPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const res = await apiRequest("GET", "/api/categories");
        const data = await res.json();
        setCategories(data);
      } catch (error) {
        toast({
          title: "Erro",
          description: "Não foi possível carregar as categorias",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [toast]);

  const filteredCategories = searchQuery
    ? categories.filter((category) =>
        category.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : categories;

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
        <h1 className="text-xl font-bold">Categorias</h1>
      </div>

      <div className="px-4 py-3 bg-white shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Buscar categoria..."
            className="pl-10 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <main className="flex-grow mobile-container p-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredCategories.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma categoria encontrada
              </div>
            ) : (
              filteredCategories.map((category) => (
                <button
                  key={category.id}
                  className="app-like-card p-4 w-full text-left flex items-center justify-between press-effect"
                  onClick={() => navigate(`/busca?categoria=${category.id}`)}
                >
                  <div className="flex items-center">
                    {category.icon ? (
                      <div className="w-10 h-10 flex items-center justify-center rounded-full bg-primary/10 mr-3">
                        <span className="text-primary text-xl">{category.icon}</span>
                      </div>
                    ) : (
                      <div className="w-10 h-10 flex items-center justify-center rounded-full bg-primary/10 mr-3">
                        <span className="text-primary">
                          {category.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <h3 className="font-medium">{category.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {category.productsCount} produto{category.productsCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>
              ))
            )}
          </div>
        )}
      </main>

      <MobileNavigation />
    </div>
  );
}