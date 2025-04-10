import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Product } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { ComparisonResult } from "@/components/product/comparison-result";
import { Loading } from "@/components/ui/loading";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export function ComparisonSection() {
  const [orderBy, setOrderBy] = useState("price-asc");
  const [searchTerm, setSearchTerm] = useState("lava-louças");
  const [searchInput, setSearchInput] = useState("lava-louças");
  const [limit, setLimit] = useState(5);
  const { toast } = useToast();
  
  // Filtros reais baseados nas características dos produtos
  const filters = [
    { label: "Tipo de produto", value: "tipo" },
    { label: "Capacidade", value: "capacidade" },
    { label: "Fornecedores", value: "fornecedores" },
    { label: "Preço", value: "preco" },
    { label: "Avaliações", value: "avaliacoes" }
  ];

  const { data: productGroups, isLoading, refetch } = useQuery<Product[][]>({
    queryKey: ["/api/compare-products", { name: searchTerm, limit }],
    queryFn: async () => {
      try {
        const response = await apiRequest(
          "GET", 
          `/api/compare-products?name=${encodeURIComponent(searchTerm)}&limit=${limit}`
        );
        
        if (!response.ok) {
          throw new Error("Falha ao buscar comparações de produtos");
        }
        
        const data = await response.json();
        return data;
      } catch (error) {
        console.error("Erro ao buscar comparações:", error);
        toast({
          title: "Erro ao buscar comparações",
          description: "Não foi possível obter os dados de comparação de produtos",
          variant: "destructive",
        });
        return [];
      }
    },
    enabled: searchTerm.length > 0
  });

  // Aplicar ordenação aos resultados
  const sortedProductGroups = productGroups ? [...productGroups].map(group => {
    if (orderBy === "price-asc") {
      return [...group].sort((a, b) => parseFloat(a.price.toString()) - parseFloat(b.price.toString()));
    } else if (orderBy === "price-desc") {
      return [...group].sort((a, b) => parseFloat(b.price.toString()) - parseFloat(a.price.toString()));
    } else if (orderBy === "rating") {
      return [...group].sort((a, b) => parseFloat(b.rating.toString()) - parseFloat(a.rating.toString()));
    }
    return group;
  }) : [];

  const handleSearch = () => {
    setSearchTerm(searchInput);
  };

  const handleLoadMore = () => {
    setLimit(prev => prev + 5);
    refetch();
  };

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-end mb-6">
          <h2 className="text-2xl font-bold font-sans">
            Lava-louças de Capô: Compare as melhores ofertas
          </h2>
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
          </div>
        </div>

        {/* Comparison results */}
        {isLoading ? (
          <Loading />
        ) : (
          <div className="space-y-4">
            {products && products.length > 0 ? (
              products.map((product) => (
                <ComparisonResult 
                  key={product.id} 
                  product={product} 
                  isBestPrice={product.id === products[0].id} 
                />
              ))
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-500">Nenhum resultado encontrado.</p>
              </div>
            )}
          </div>
        )}

        {/* Load more */}
        <div className="mt-8 text-center">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            className="bg-white border border-primary text-primary hover:bg-primary hover:text-white font-medium py-2 px-6 rounded"
          >
            Carregar mais resultados
          </Button>
        </div>
      </div>
    </section>
  );
}
