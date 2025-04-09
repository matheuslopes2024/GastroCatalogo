import { Link } from "wouter";
import { Facebook, Instagram, Linkedin, Youtube, MapPin, Phone, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white pt-12 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center mb-4">
              <span className="text-xl font-bold text-white font-sans">Gastro</span>
              <span className="ml-1 text-xs text-gray-500 font-semibold tracking-widest uppercase">
                Compare
              </span>
            </div>
            <p className="text-gray-400 mb-4">
              A melhor plataforma para comparar e encontrar equipamentos para seu restaurante com o melhor custo-benefício.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-4">Links Rápidos</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-400 hover:text-white">
                  Início
                </Link>
              </li>
              <li>
                <Link href="/como-funciona" className="text-gray-400 hover:text-white">
                  Como funciona
                </Link>
              </li>
              <li>
                <Link href="/busca" className="text-gray-400 hover:text-white">
                  Categorias
                </Link>
              </li>
              <li>
                <Link href="/fornecedores" className="text-gray-400 hover:text-white">
                  Fornecedores
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-gray-400 hover:text-white">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/contato" className="text-gray-400 hover:text-white">
                  Contato
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-lg font-bold mb-4">Categorias</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/busca?categoria=coccao" className="text-gray-400 hover:text-white">
                  Fornos e Fogões
                </Link>
              </li>
              <li>
                <Link href="/busca?categoria=refrigeracao" className="text-gray-400 hover:text-white">
                  Refrigeração
                </Link>
              </li>
              <li>
                <Link href="/busca?categoria=lavagem" className="text-gray-400 hover:text-white">
                  Lavagem
                </Link>
              </li>
              <li>
                <Link href="/busca?categoria=utensilios" className="text-gray-400 hover:text-white">
                  Utensílios
                </Link>
              </li>
              <li>
                <Link href="/busca?categoria=mobiliario" className="text-gray-400 hover:text-white">
                  Mobiliário
                </Link>
              </li>
              <li>
                <Link href="/busca?categoria=bar" className="text-gray-400 hover:text-white">
                  Bar
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-bold mb-4">Contato</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <MapPin className="h-5 w-5 mt-1 mr-3 text-gray-400" />
                <span className="text-gray-400">
                  Av. Paulista, 1000 - Bela Vista, São Paulo - SP, 01310-100
                </span>
              </li>
              <li className="flex items-center">
                <Phone className="h-5 w-5 mr-3 text-gray-400" />
                <span className="text-gray-400">(11) 3456-7890</span>
              </li>
              <li className="flex items-center">
                <Mail className="h-5 w-5 mr-3 text-gray-400" />
                <span className="text-gray-400">contato@gastrocompare.com.br</span>
              </li>
            </ul>
          </div>
        </div>

        <hr className="border-gray-800 mb-6" />

        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} Gastro Compare. Todos os direitos reservados.
          </p>
          <div className="flex space-x-6">
            <Link href="/termos" className="text-gray-400 hover:text-white text-sm">
              Termos de Uso
            </Link>
            <Link href="/privacidade" className="text-gray-400 hover:text-white text-sm">
              Política de Privacidade
            </Link>
            <Link href="/ajuda" className="text-gray-400 hover:text-white text-sm">
              Ajuda
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
