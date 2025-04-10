import { Link } from "wouter";
import { Check, Star, Store } from "lucide-react";
import { Product } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";

interface ComparisonResultProps {
  product: Product;
  isBestPrice?: boolean;
}

export function ComparisonResult({ product, isBestPrice = false }: ComparisonResultProps) {
  // Buscar informações do fornecedor
  const { data: supplier, isLoading: isLoadingSupplier } = useQuery({
    queryKey: ["/api/suppliers-info", product.supplierId],
    queryFn: async () => {
      const response = await fetch(`/api/suppliers-info?ids=${product.supplierId}`);
      if (!response.ok) {
        throw new Error("Erro ao carregar informações do fornecedor");
      }
      const suppliers = await response.json();
      return suppliers?.length > 0 ? suppliers[0] : null;
    }
  });

  // Extrair recursos do produto (se disponíveis)
  const features = product.features || [];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Product Image */}
        <div className="md:w-1/5">
          <img
            src={product.imageUrl || "https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?auto=format&fit=crop&w=300&h=200"}
            alt={product.name}
            className="w-full h-40 md:h-auto object-cover rounded"
          />
        </div>

        {/* Product Details */}
        <div className="md:w-2/5">
          <h3 className="text-lg font-bold mb-1">{product.name}</h3>
          <div className="flex items-center mb-2">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => {
                const rating = product.rating ? parseFloat(product.rating.toString()) : 0;
                return (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.floor(rating)
                        ? "fill-current"
                        : i < Math.ceil(rating)
                        ? "fill-current"
                        : ""
                    }`}
                  />
                );
              })}
            </div>
            <span className="ml-1 text-sm text-gray-500">
              ({product.ratingsCount} avaliações)
            </span>
          </div>

          <ul className="text-sm space-y-1 text-gray-500 mb-3">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center">
                <Check className="h-4 w-4 text-green-500 mr-2" />
                {feature}
              </li>
            ))}
          </ul>

          <div className="flex items-center mt-3">
            {isLoadingSupplier ? (
              <Skeleton className="h-6 w-24" />
            ) : supplier ? (
              <>
                <Store className="w-5 h-5 mr-2 text-gray-500" />
                <span className="text-sm font-medium">{supplier.companyName || supplier.name}</span>
              </>
            ) : (
              <span className="text-sm text-gray-500">Fornecedor não encontrado</span>
            )}
          </div>
        </div>

        {/* Price and Action */}
        <div className="md:w-2/5 flex flex-col items-start md:items-end justify-between">
          <div className="flex flex-col items-start md:items-end mb-4">
            {isBestPrice && (
              <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 mb-2">
                Melhor Preço
              </Badge>
            )}
            {product.originalPrice && (
              <div className="line-through text-gray-500 text-sm">
                {formatCurrency(Number(product.originalPrice))}
              </div>
            )}
            <div className="text-2xl font-bold text-gray-900 relative inline-block">
              {formatCurrency(Number(product.price))}
              <span className="absolute bottom-1 left-0 w-full h-1 bg-[#FF5A60] bg-opacity-40 -z-10"></span>
            </div>
            <div className="text-sm text-gray-500 mt-1">
              à vista ou em até 12x
            </div>
          </div>

          <div className="space-y-2 w-full md:w-auto">
            <Link href={`/produto/${product.slug}`}>
              <Button className="w-full md:w-auto bg-[#FF5A60] hover:bg-opacity-90 text-white font-bold py-3 px-6 rounded">
                Ver oferta
              </Button>
            </Link>
            <Button
              variant="outline"
              className="w-full md:w-auto bg-white border border-primary text-primary hover:bg-primary hover:text-white font-medium py-2 px-4 rounded"
            >
              Comparar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
