import React from "react";
import { Link } from "wouter";
import { 
  FacebookIcon, 
  InstagramIcon, 
  LinkedinIcon, 
  YoutubeIcon,
  Phone,
  Mail,
  MapPin
} from "lucide-react";

const footerLinks = [
  {
    title: "Sobre Nós",
    links: [
      { name: "Nossa História", href: "/sobre/historia" },
      { name: "Equipe", href: "/sobre/equipe" },
      { name: "Política de Privacidade", href: "/politicas/privacidade" },
      { name: "Termos de Uso", href: "/politicas/termos" },
    ],
  },
  {
    title: "Para Compradores",
    links: [
      { name: "Como Comprar", href: "/ajuda/como-comprar" },
      { name: "Perguntas Frequentes", href: "/ajuda/faq" },
      { name: "Formas de Pagamento", href: "/ajuda/pagamento" },
      { name: "Prazo de Entrega", href: "/ajuda/entrega" },
    ],
  },
  {
    title: "Para Fornecedores",
    links: [
      { name: "Venda na Gastro", href: "/fornecedores/cadastro" },
      { name: "Portal do Fornecedor", href: "/fornecedor" },
      { name: "Comissões", href: "/fornecedor/comissoes" },
      { name: "Suporte ao Fornecedor", href: "/fornecedores/suporte" },
    ],
  },
  {
    title: "Atendimento",
    links: [
      { name: "Central de Ajuda", href: "/ajuda" },
      { name: "Fale Conosco", href: "/contato" },
      { name: "Reclamações", href: "/ajuda/reclamacoes" },
      { name: "Ouvidoria", href: "/ajuda/ouvidoria" },
    ],
  },
];

const socialLinks = [
  { name: "Facebook", icon: FacebookIcon, href: "https://facebook.com" },
  { name: "Instagram", icon: InstagramIcon, href: "https://instagram.com" },
  { name: "LinkedIn", icon: LinkedinIcon, href: "https://linkedin.com" },
  { name: "YouTube", icon: YoutubeIcon, href: "https://youtube.com" },
];

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:py-16">
        <div className="xl:grid xl:grid-cols-5 xl:gap-8">
          {/* Company Info */}
          <div className="xl:col-span-1 mb-8 xl:mb-0">
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Gastro
              </span>
            </div>
            <p className="mt-4 text-sm text-gray-300 max-w-xs">
              A plataforma #1 para equipamentos de restaurantes e hotéis no Brasil.
              Conectando fornecedores e compradores desde 2022.
            </p>
            <div className="mt-6 space-y-3">
              <div className="flex items-center text-sm text-gray-300">
                <Phone className="h-4 w-4 mr-2" />
                <span>(11) 3456-7890</span>
              </div>
              <div className="flex items-center text-sm text-gray-300">
                <Mail className="h-4 w-4 mr-2" />
                <span>contato@gastromarket.com.br</span>
              </div>
              <div className="flex items-start text-sm text-gray-300">
                <MapPin className="h-4 w-4 mr-2 mt-0.5" />
                <span>Av. Paulista, 1000 - São Paulo, SP - Brasil</span>
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 xl:col-span-4">
            {footerLinks.map((section) => (
              <div key={section.title} className="mt-12 md:mt-0">
                <h3 className="text-sm font-bold text-white tracking-wider uppercase mb-4">
                  {section.title}
                </h3>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link.name}>
                      <Link href={link.href}>
                        <a className="text-sm text-gray-300 hover:text-white transition">
                          {link.name}
                        </a>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-gray-700">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="flex space-x-6 mb-4 md:mb-0">
              {socialLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition"
                >
                  <span className="sr-only">{link.name}</span>
                  <link.icon className="h-6 w-6" />
                </a>
              ))}
            </div>
            <div className="flex flex-col md:flex-row md:items-center md:space-x-6 text-sm text-gray-400">
              <div className="mb-2 md:mb-0">
                &copy; {new Date().getFullYear()} Gastro Marketplace. Todos os direitos reservados.
              </div>
              <div className="flex space-x-4">
                <Link href="/politicas/privacidade">
                  <a className="hover:text-white transition">Privacidade</a>
                </Link>
                <Link href="/politicas/termos">
                  <a className="hover:text-white transition">Termos</a>
                </Link>
                <Link href="/politicas/cookies">
                  <a className="hover:text-white transition">Cookies</a>
                </Link>
              </div>
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500 text-center md:text-left">
            CNPJ: 00.000.000/0001-00 • Gastro Marketplace Ltda • São Paulo/SP
          </div>
        </div>
      </div>
    </footer>
  );
}