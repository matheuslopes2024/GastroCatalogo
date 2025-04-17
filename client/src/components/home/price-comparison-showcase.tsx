import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronRight, TrendingUp, Shield, Star } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

// Tipos
interface ComparedProduct {
  id: number;
  name: string;
  slug: string;
  imageUrl: string;
  offers: {
    id: number;
    supplierName: string;
    price: string;
    originalPrice?: string;
    features?: string[];
  }[];
}

// Dados padrão para comparação de exemplo
const defaultComparedProduct: ComparedProduct = {
  id: 1,
  name: "Refrigerador Comercial 4 Portas",
  slug: "refrigerador-comercial-4-portas",
  imageUrl: "https://i.imgur.com/mYC9xCx.jpg",
  offers: [
    {
      id: 1,
      supplierName: "RefriSul",
      price: "9890.00",
      features: ["Inox 304", "Garantia 2 anos"]
    },
    {
      id: 2,
      supplierName: "Protel",
      price: "10290.00",
      features: ["Inox 430", "Garantia 1 ano"]
    },
    {
      id: 3,
      supplierName: "ColdMax",
      price: "11590.00",
      features: ["Inox 304", "Garantia 2 anos"]
    }
  ]
};

// Componente de indicador de economia
const SavingsIndicator = ({ bestPrice, highestPrice }: { bestPrice: number, highestPrice: number }) => {
  const saving = highestPrice - bestPrice;
  const savingPercentage = Math.round((saving / highestPrice) * 100);
  
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="text-xs text-gray-500">Economia de até</div>
      <div className="text-xl font-bold text-green-600">
        {savingPercentage}%
      </div>
      <div className="text-xs text-green-600">
        (R$ {saving.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
      </div>
    </div>
  );
};

export function PriceComparisonShowcase() {
  const [comparedProduct, setComparedProduct] = useState<ComparedProduct>(defaultComparedProduct);
  const [isLoading, setIsLoading] = useState(true);
  
  // Buscar dados de comparação da API
  useEffect(() => {
    async function fetchComparisonData() {
      try {
        const res = await apiRequest('GET', '/api/featured-comparison');
        const data = await res.json();
        if (data) {
          setComparedProduct(data);
        }
        setIsLoading(false);
      } catch (error) {
        console.log('Usando dados de comparação padrão');
        setIsLoading(false);
      }
    }
    
    fetchComparisonData();
  }, []);
  
  // Variantes de animação
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0
    }
  };
  
  // Calcular as métricas de preço
  const prices = comparedProduct.offers.map(offer => parseFloat(offer.price));
  const bestPrice = Math.min(...prices);
  const highestPrice = Math.max(...prices);
  
  if (isLoading) {
    return (
      <div className="py-16 flex justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }
  
  return (
    <div className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <motion.div 
          className="max-w-7xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Lado esquerdo - Informativo */}
            <motion.div 
              className="lg:col-span-2"
              variants={itemVariants}
            >
              <h2 className="text-3xl font-bold mb-4">Compare e economize em seus equipamentos</h2>
              <p className="text-gray-600 mb-6">
                Assim como você compara preços de hotéis no Trivago, no Gastro você encontra 
                o melhor preço para equipamentos de restaurantes entre diversos fornecedores.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-green-100 p-1.5 text-green-600 mt-0.5">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-medium">Economize até 30% comparando ofertas</div>
                    <div className="text-sm text-gray-500">Encontre o melhor preço em segundos</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-amber-100 p-1.5 text-amber-600 mt-0.5">
                    <Star className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-medium">Veja avaliações de outros compradores</div>
                    <div className="text-sm text-gray-500">Escolha com base em experiências reais</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-blue-100 p-1.5 text-blue-600 mt-0.5">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-medium">Compare especificações técnicas</div>
                    <div className="text-sm text-gray-500">Analise detalhes importantes antes de decidir</div>
                  </div>
                </div>
              </div>
              
              <a 
                href="/como-funciona" 
                className="inline-flex items-center text-primary font-medium hover:underline"
              >
                Saiba como funciona
                <ChevronRight className="w-4 h-4 ml-1" />
              </a>
            </motion.div>
            
            {/* Lado direito - Exemplo de comparação */}
            <motion.div 
              className="lg:col-span-3 rounded-xl shadow-lg overflow-hidden border border-gray-100"
              variants={itemVariants}
            >
              <div className="bg-gray-50 border-b p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img 
                      src={comparedProduct.imageUrl} 
                      alt={comparedProduct.name} 
                      className="w-14 h-14 object-cover rounded-lg border border-gray-200"
                    />
                    <div>
                      <h3 className="text-lg font-bold">{comparedProduct.name}</h3>
                      <div className="flex items-center text-yellow-400 text-sm">
                        ★★★★<span className="text-yellow-300">★</span>
                        <span className="text-gray-500 ml-1">(28 avaliações)</span>
                      </div>
                    </div>
                  </div>
                  
                  <SavingsIndicator bestPrice={bestPrice} highestPrice={highestPrice} />
                </div>
              </div>
              
              <div className="divide-y">
                {comparedProduct.offers.map((offer, index) => {
                  const price = parseFloat(offer.price);
                  const isBestPrice = price === bestPrice;
                  const difference = price - bestPrice;
                  
                  return (
                    <div 
                      key={offer.id} 
                      className={`p-4 hover:bg-gray-50 transition-colors flex items-center justify-between ${isBestPrice ? 'bg-green-50/50' : ''}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-lg text-gray-500 font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{offer.supplierName}</div>
                          <div className="text-sm text-gray-500">
                            {offer.features?.join(' • ') || 'Padrão'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-xl font-bold ${isBestPrice ? 'text-primary' : ''}`}>
                          R$ {price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        {isBestPrice ? (
                          <div className="text-sm text-green-600">Melhor preço</div>
                        ) : (
                          <div className="text-sm text-gray-500">
                            +R$ {difference.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="bg-gray-50 border-t p-4">
                <a 
                  href={`/comparar/${comparedProduct.slug}`} 
                  className="flex items-center justify-center w-full py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <span>Ver comparação completa</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </a>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}