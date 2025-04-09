import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export function SupplierCTA() {
  return (
    <section className="py-16 bg-primary text-white">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold font-sans mb-4">
            É fornecedor de equipamentos para restaurantes?
          </h2>
          <p className="text-lg mb-8">
            Junte-se a nós e aumente suas vendas alcançando milhares de restaurantes e hotéis em todo o Brasil.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/auth?role=supplier">
              <Button className="bg-white text-primary hover:bg-gray-100 font-bold py-3 px-8 rounded-lg w-full sm:w-auto">
                Cadastre sua empresa
              </Button>
            </Link>
            <Link href="/para-fornecedores">
              <Button variant="outline" className="bg-transparent border-2 border-white hover:bg-white hover:text-primary font-bold py-3 px-8 rounded-lg w-full sm:w-auto">
                Saiba mais
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
