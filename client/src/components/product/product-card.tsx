import { Link } from "wouter";
import { Star } from "lucide-react";
import { Product } from "@shared/schema";
import { Button } from "@/components/ui/button";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const formatPrice = (price: string | number) => {
    return Number(price).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const discount = product.discount || 0;
  const supplier = { name: "Fornecedor", logo: "https://via.placeholder.com/40" }; // In a real app, we'd fetch this

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
      <div className="relative">
        <img
          src={product.imageUrl || "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=500&h=300"}
          alt={product.name}
          className="w-full h-48 object-cover"
        />
        {discount > 0 && (
          <div className="absolute top-0 right-0 bg-[#FF5A60] text-white px-3 py-1 rounded-bl-lg font-bold">
            -{discount}%
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-lg font-bold mb-2">{product.name}</h3>
        <p className="text-gray-500 text-sm mb-3">{product.description.substring(0, 50)}...</p>

        <div className="flex items-center mb-4">
          <div className="flex items-center mr-3">
            <Star className="h-4 w-4 fill-current text-yellow-400" />
            <span className="ml-1 font-medium">
              {parseFloat(product.rating.toString()).toFixed(1)}
            </span>
          </div>
          <span className="text-sm text-gray-500">
            ({product.ratingsCount} avaliações)
          </span>
        </div>

        <div className="flex items-baseline mb-2">
          <span className="text-2xl font-bold text-gray-900 relative inline-block">
            {formatPrice(product.price)}
            <span className="absolute bottom-1 left-0 w-full h-1 bg-[#FF5A60] bg-opacity-40 -z-10"></span>
          </span>
          
          {product.originalPrice && (
            <span className="ml-2 text-sm text-gray-500 line-through">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center">
            <img src={supplier.logo} alt={`Logo ${supplier.name}`} className="w-8 h-8 rounded" />
            <span className="ml-2 text-sm font-medium">{supplier.name}</span>
          </div>
          <Link href={`/produto/${product.slug}`}>
            <Button className="bg-primary hover:bg-opacity-90 text-white font-medium py-2 px-4 rounded">
              Ver oferta
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
