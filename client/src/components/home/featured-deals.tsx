import { useQuery } from "@tanstack/react-query";
import { Product } from "@shared/schema";
import { ProductCard } from "@/components/product/product-card";
import { Loading } from "@/components/ui/loading";

export function FeaturedDeals() {
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products", { limit: 3 }],
  });

  return (
    <section className="py-10 bg-gray-100">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold font-sans mb-6">Ofertas em destaque</h2>

        {isLoading ? (
          <Loading />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products && products.length > 0 ? (
              products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <div className="col-span-3 text-center py-10">
                <p className="text-gray-500">Nenhuma oferta em destaque disponível no momento.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
