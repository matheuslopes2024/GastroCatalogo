import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Product } from "@shared/schema";
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
import { ChevronDown } from "lucide-react";

export function ComparisonSection() {
  const [orderBy, setOrderBy] = useState("price-asc");
  
  // In a real app we would fetch and use these filters
  const filters = [
    { label: "Tipo de Lava-louças", value: "tipo" },
    { label: "Capacidade", value: "capacidade" },
    { label: "Fornecedores", value: "fornecedores" },
    { label: "Preço", value: "preco" },
    { label: "Avaliações", value: "avaliacoes" }
  ];

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products", { categoryId: 6, limit: 3 }], // Hard-coded to Lavagem category for demo
  });

  const handleLoadMore = () => {
    // In a real app, we would load more results
    console.log("Load more results");
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
