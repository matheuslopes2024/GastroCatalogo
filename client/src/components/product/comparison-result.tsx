import { Link } from "wouter";
import { Check, Star } from "lucide-react";
import { Product } from "@shared/schema";
import { Button } from "@/components/ui/button";

interface ComparisonResultProps {
  product: Product;
  isBestPrice?: boolean;
}

export function ComparisonResult({ product, isBestPrice = false }: ComparisonResultProps) {
  const formatPrice = (price: string | number) => {
    return Number(price).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  // In a real app, we would fetch features from the product data
  // here we're creating sample features
  const features = product.features || [
    "Capacidade: 100 pratos/hora",
    "Consumo de água: 3,5L por ciclo",
    "Material: Aço inox AISI 304",
    "Potência: 6,7 kW",
    "Garantia: 12 meses"
  ];

  const supplier = { name: "Fornecedor", logo: "https://via.placeholder.com/30" }; // In a real app, we'd fetch this

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
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.floor(parseFloat(product.rating.toString()))
                      ? "fill-current"
                      : i < Math.ceil(parseFloat(product.rating.toString()))
                      ? "fill-current"
                      : ""
                  }`}
                />
              ))}
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

          <div className="flex items-center">
            <img src={supplier.logo} alt={`Logo ${supplier.name}`} className="w-6 h-6 rounded mr-2" />
            <span className="text-sm font-medium">{supplier.name}</span>
          </div>
        </div>

        {/* Price and Action */}
        <div className="md:w-2/5 flex flex-col items-start md:items-end justify-between">
          <div className="flex flex-col items-start md:items-end mb-4">
            {isBestPrice && (
              <div className="bg-green-500 bg-opacity-10 text-green-500 font-medium text-sm px-2 py-1 rounded mb-2">
                Melhor Preço
              </div>
            )}
            {product.originalPrice && (
              <div className="line-through text-gray-500 text-sm">
                {formatPrice(product.originalPrice)}
              </div>
            )}
            <div className="text-2xl font-bold text-gray-900 relative inline-block">
              {formatPrice(product.price)}
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
