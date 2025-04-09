import { useState } from "react";
import { useLocation } from "wouter";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function HeroSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [, navigate] = useLocation();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/busca?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  const popularSearches = [
    { name: "Fogão industrial", slug: "fogao-industrial" },
    { name: "Lava-louças", slug: "lava-loucas" },
    { name: "Refrigeradores", slug: "refrigeradores" },
    { name: "Forno combinado", slug: "forno-combinado" },
    { name: "Coifas", slug: "coifas" },
  ];

  return (
    <section className="bg-primary text-white py-12 md:py-20">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-sans mb-6">
          Compare e encontre os melhores<br className="hidden md:block" /> equipamentos para seu restaurante
        </h1>
        <p className="text-lg md:text-xl mb-8 max-w-3xl mx-auto">
          Economize tempo e dinheiro comparando preços e ofertas de diversos fornecedores de equipamentos para restaurantes em um só lugar.
        </p>

        {/* Search Form */}
        <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 max-w-4xl mx-auto">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Que equipamento você procura?"
                  className="w-full pl-10 pr-4 py-6 rounded-lg border border-gray-200"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="w-full md:w-auto">
              <Button 
                type="submit" 
                className="w-full md:w-auto bg-[#FF5A60] hover:bg-opacity-90 text-white font-bold py-6 px-8 rounded-lg"
              >
                Buscar
              </Button>
            </div>
          </form>

          {/* Popular Searches */}
          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            <span className="text-sm text-gray-500 mr-2">Buscas populares:</span>
            {popularSearches.map((search, index) => (
              <a 
                key={index}
                href={`/busca?q=${search.slug}`}
                className="text-sm text-primary hover:underline"
              >
                {search.name}
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
