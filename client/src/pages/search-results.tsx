import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CategoryNav } from "@/components/layout/category-nav";
import { useLocation } from "wouter";
import { Loading } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ComparisonResult } from "@/components/product/comparison-result";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { 
  Category, 
  Product 
} from "@shared/schema";
import { Search, ChevronDown } from "lucide-react";

export default function SearchResults() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split('?')[1] || '');
  
  const query = searchParams.get('q') || '';
  const categoryParam = searchParams.get('categoria') || '';
  
  const [searchTerm, setSearchTerm] = useState(query);
  const [orderBy, setOrderBy] = useState("price-asc");
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  
  // Get all categories
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });
  
  // Get current category if one is selected
  const { data: currentCategory } = useQuery<Category>({
    queryKey: ["/api/categories", selectedCategory],
    enabled: !!selectedCategory,
  });
  
  // Get products based on search or category
  const {
    data: products,
    isLoading,
    refetch
  } = useQuery<Product[]>({
    queryKey: ["/api/products", { search: query, categoryId: currentCategory?.id }],
  });
  
  // Search form handling
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    window.history.pushState(
      {}, 
      '', 
      `/busca?q=${encodeURIComponent(searchTerm)}${selectedCategory ? `&categoria=${selectedCategory}` : ''}`
    );
    refetch();
  };
  
  // Filter options
  const filters = [
    { label: "Tipo de produto", value: "tipo" },
    { label: "Preço", value: "preco" },
    { label: "Fornecedores", value: "fornecedores" },
    { label: "Avaliações", value: "avaliacoes" }
  ];
  
  // Update search term when URL changes
  useEffect(() => {
    setSearchTerm(query);
    setSelectedCategory(categoryParam);
  }, [query, categoryParam]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow bg-gray-50">
        <CategoryNav />
        
        {/* Search Header */}
        <div className="bg-white border-b py-6">
          <div className="container mx-auto px-4">
            <form onSubmit={handleSearch} className="flex gap-4 max-w-2xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Buscar produtos..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button type="submit">Buscar</Button>
            </form>
          </div>
        </div>
        
        {/* Results Section */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            {/* Results Header */}
            <div className="flex justify-between items-end mb-6">
              <h1 className="text-2xl font-bold">
                {currentCategory ? 
                  `${currentCategory.name}` : 
                  query ? 
                    `Resultados para "${query}"` : 
                    "Todos os produtos"}
              </h1>
              <div className="hidden md:block">
                <Select value={orderBy} onValueChange={setOrderBy}>
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="price-asc">Ordenar por: Preço (menor)</SelectItem>
                    <SelectItem value="price-desc">Ordenar por: Preço (maior)</SelectItem>
                    <SelectItem value="relevance">Ordenar por: Relevância</SelectItem>
                    <SelectItem value="rating">Ordenar por: Avaliações</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Filter bar */}
            <div className="mb-6 bg-gray-100 p-4 rounded-lg">
              <div className="flex flex-wrap gap-3">
                <span className="font-medium text-gray-900">Filtros:</span>
                {filters.map((filter) => (
                  <Button
                    key={filter.value}
                    variant="outline"
                    className="bg-white px-3 py-1 rounded border border-gray-200 text-sm flex items-center hover:bg-gray-50"
                  >
                    {filter.label}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                ))}
                
                {/* Category filter */}
                {categories && categories.length > 0 && (
                  <Select 
                    value={selectedCategory} 
                    onValueChange={(value) => {
                      setSelectedCategory(value);
                      window.history.pushState(
                        {}, 
                        '', 
                        `/busca?${query ? `q=${encodeURIComponent(query)}&` : ''}categoria=${value}`
                      );
                      refetch();
                    }}
                  >
                    <SelectTrigger className="bg-white px-3 py-1 h-9 rounded border border-gray-200 text-sm">
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas as categorias</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.slug}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
            
            {/* Products List */}
            {isLoading ? (
              <Loading />
            ) : (
              <div className="space-y-4">
                {products && products.length > 0 ? (
                  products.map((product, index) => (
                    <ComparisonResult 
                      key={product.id} 
                      product={product} 
                      isBestPrice={index === 0} 
                    />
                  ))
                ) : (
                  <div className="text-center py-12 bg-white rounded-lg shadow">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum produto encontrado</h3>
                    <p className="text-gray-500">
                      Não encontramos produtos correspondentes aos seus critérios de busca.
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {/* Load more button - would implement pagination in a real app */}
            {products && products.length > 0 && (
              <div className="mt-8 text-center">
                <Button
                  variant="outline"
                  className="bg-white border border-primary text-primary hover:bg-primary hover:text-white font-medium py-2 px-6 rounded"
                >
                  Carregar mais resultados
                </Button>
              </div>
            )}
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
