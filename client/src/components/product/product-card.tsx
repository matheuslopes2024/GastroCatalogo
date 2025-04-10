import { Link } from "wouter";
import { Star } from "lucide-react";
import { Product } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

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
  const rating = product.rating || 0;
  
  // Estado para armazenar informações do fornecedor
  const [supplierName, setSupplierName] = useState("Fornecedor");
  const [supplierId, setSupplierId] = useState<number | null>(null);
  const [hasSupplierLogo, setHasSupplierLogo] = useState(false);
  
  // Buscar informações do fornecedor
  useEffect(() => {
    if (product.supplierId) {
      fetch(`/api/users/${product.supplierId}`)
        .then(res => {
          // Se for 401 Unauthorized, manter os dados padrão
          if (res.status === 401) {
            return { companyName: "Fornecedor", id: null, logoData: null };
          }
          return res.json();
        })
        .then(data => {
          // Verificar se os dados vieram corretamente
          if (data && (data.companyName || data.username)) {
            setSupplierName(data.companyName || data.username);
            setSupplierId(data.id);
            setHasSupplierLogo(!!data.logoData);
          }
        })
        .catch(err => {
          console.error('Erro ao carregar fornecedor:', err);
        });
    }
  }, [product.supplierId]);

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
      <div className="relative">
        <img
          src={
            product.imageData 
              ? `/api/product-image/${product.id}` 
              : (product.imageUrl || "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=500&h=300")
          }
          alt={product.name}
          className="w-full h-48 object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            // Se houver erro ao carregar a imagem do banco, tenta a URL externa
            if (target.src.includes('/api/product-image/') && product.imageUrl) {
              target.src = product.imageUrl;
            } else {
              // Caso também falhe, mostra imagem padrão
              target.src = "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=500&h=300";
            }
          }}
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
              {parseFloat(rating.toString()).toFixed(1)}
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
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
              {hasSupplierLogo && supplierId ? (
                <img 
                  src={`/api/supplier-logo/${supplierId}`} 
                  alt={`Logo ${supplierName}`} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    (target.parentElement as HTMLElement).textContent = supplierName.charAt(0);
                  }}
                />
              ) : (
                <span>{supplierName.charAt(0)}</span>
              )}
            </div>
            <span className="ml-2 text-sm font-medium">{supplierName}</span>
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
