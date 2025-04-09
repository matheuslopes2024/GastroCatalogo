import { Search, Award, DollarSign } from "lucide-react";

export function WhyUseSection() {
  return (
    <section className="py-12 bg-gray-100">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold font-sans mb-3">Por que usar o Gastro?</h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            A melhor plataforma para encontrar equipamentos para seu restaurante com o melhor custo-benefício.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="w-16 h-16 bg-primary bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="text-primary text-2xl" />
            </div>
            <h3 className="text-xl font-bold mb-3">Compare preços</h3>
            <p className="text-gray-500">
              Encontre as melhores ofertas comparando os preços de diversos fornecedores em um só lugar.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="w-16 h-16 bg-primary bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="text-primary text-2xl" />
            </div>
            <h3 className="text-xl font-bold mb-3">Fornecedores confiáveis</h3>
            <p className="text-gray-500">
              Trabalhamos apenas com fornecedores confiáveis e verificados para garantir a qualidade dos produtos.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="w-16 h-16 bg-primary bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="text-primary text-2xl" />
            </div>
            <h3 className="text-xl font-bold mb-3">Economize tempo e dinheiro</h3>
            <p className="text-gray-500">
              Encontre rapidamente o melhor preço sem precisar visitar diversos sites ou fazer inúmeras ligações.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
