import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Product } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { ComparisonResult } from "@/components/product/comparison-result";
import { Loading, ComparisonSkeleton } from "@/components/ui/loading";
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
      return [...group].sort((a, b) => {
        const aRating = a.rating ? parseFloat(a.rating.toString()) : 0;
        const bRating = b.rating ? parseFloat(b.rating.toString()) : 0;
        return bRating - aRating;
      });
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

        {/* Barra de pesquisa */}
        <div className="mb-6 flex items-center gap-2">
          <div className="flex-1 relative">
            <Input
              type="text"
              placeholder="Buscar produtos (ex: lava-louças, forno, geladeira)"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
          <Button onClick={handleSearch} className="bg-primary text-white">
            Buscar
          </Button>
        </div>
        
        {/* Comparison results */}
        {isLoading ? (
          <ComparisonSkeleton />
        ) : (
          <div>
            {sortedProductGroups && sortedProductGroups.length > 0 ? (
              <div className="space-y-8">
                {sortedProductGroups.map((productGroup, groupIndex) => (
                  <div key={groupIndex} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 p-3 border-b border-gray-200">
                      <h3 className="text-lg font-bold">{productGroup[0].name}</h3>
                      <p className="text-sm text-gray-500">
                        Comparando {productGroup.length} ofertas de fornecedores diferentes
                      </p>
                    </div>
                    <div className="divide-y divide-gray-200">
                      {productGroup.map((product, index) => (
                        <ComparisonResult 
                          key={product.id} 
                          product={product} 
                          isBestPrice={index === 0} 
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-lg">
                <p className="text-gray-500">Nenhum resultado de comparação encontrado.</p>
                <p className="text-gray-400 text-sm mt-2">
                  Tente buscar por outro termo ou categoria de produto.
                </p>
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
