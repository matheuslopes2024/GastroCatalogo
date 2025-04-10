import { useState } from "react";
import { motion } from "framer-motion";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Link } from "wouter";
import { 
  Search, 
  ShoppingBag, 
  CreditCard, 
  Truck, 
  Users, 
  HelpCircle, 
  ChevronRight, 
  ChevronDown,
  MessageSquare,
  FileText,
  ExternalLink,
  Building2,
  User,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardFooter 
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// FAQ por categoria
interface FAQ {
  question: string;
  answer: string;
}

interface FAQCategory {
  id: string;
  title: string;
  icon: React.ReactNode;
  faqs: FAQ[];
}

// Componente de card de categoria
const CategoryCard = ({ 
  icon, 
  title, 
  description, 
  href,
  onClick
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  href?: string;
  onClick?: () => void;
}) => {
  const content = (
    <Card className="h-full border-none shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardContent className="p-6 flex flex-col h-full">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
          {icon}
        </div>
        <h3 className="text-lg font-semibold mb-2 text-gray-900">{title}</h3>
        <p className="text-gray-600 mb-6 flex-grow">{description}</p>
        
        <div className="flex items-center text-primary font-medium group">
          Ver mais
          <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </CardContent>
    </Card>
  );
  
  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  
  return <div onClick={onClick} className="cursor-pointer">{content}</div>;
};

// Componente Principal
export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  
  // Categorias de FAQ
  const faqCategories: FAQCategory[] = [
    {
      id: "account",
      title: "Contas e Perfis",
      icon: <User className="h-5 w-5" />,
      faqs: [
        {
          question: "Como criar uma conta na Gastro Compare?",
          answer: "Para criar uma conta, clique no botão 'Entrar' no canto superior direito da página e selecione 'Criar conta'. Preencha o formulário com suas informações e escolha se deseja se cadastrar como comprador ou fornecedor. Após preencher todos os campos obrigatórios, clique em 'Cadastrar' e confirme seu email através do link que enviaremos."
        },
        {
          question: "Como alterar minha senha?",
          answer: "Para alterar sua senha, faça login em sua conta, acesse 'Meu Perfil' no menu suspenso do canto superior direito, clique em 'Segurança' e depois em 'Alterar Senha'. Informe sua senha atual, a nova senha e confirme a nova senha. Clique em 'Salvar Alterações' para concluir."
        },
        {
          question: "Posso ter mais de um tipo de conta?",
          answer: "Sim, você pode ter uma conta de comprador e uma conta de fornecedor vinculadas ao mesmo email. Para isso, faça login na sua conta atual, acesse 'Meu Perfil', clique em 'Configurações' e escolha a opção 'Adicionar Perfil de Fornecedor' ou 'Adicionar Perfil de Comprador', dependendo do tipo de conta que você já possui."
        },
        {
          question: "Como excluir minha conta?",
          answer: "Para excluir sua conta, acesse 'Meu Perfil', clique em 'Configurações', role até o final da página e clique em 'Excluir Conta'. Você precisará informar sua senha e confirmar a exclusão. Note que esta ação é irreversível e todos os seus dados serão permanentemente removidos após o período de retenção legal."
        }
      ]
    },
    {
      id: "purchases",
      title: "Compras e Pedidos",
      icon: <ShoppingBag className="h-5 w-5" />,
      faqs: [
        {
          question: "Como funciona o processo de compra?",
          answer: "O processo de compra na Gastro Compare é simples: 1) Encontre o produto que deseja comprando utilizando a busca ou navegando pelas categorias; 2) Compare as diferentes ofertas de fornecedores; 3) Selecione a oferta desejada e clique em 'Adicionar ao Carrinho'; 4) Vá para o carrinho e clique em 'Finalizar Compra'; 5) Informe o endereço de entrega e escolha a forma de pagamento; 6) Revise seu pedido e clique em 'Confirmar Pedido'. Após a confirmação, você receberá um email com os detalhes do pedido."
        },
        {
          question: "Quais formas de pagamento são aceitas?",
          answer: "Aceitamos diversas formas de pagamento, incluindo cartões de crédito (Visa, Mastercard, American Express, Elo), boleto bancário, PIX e, para clientes corporativos cadastrados, oferecemos também a opção de pagamento a prazo via faturamento. As opções de parcelamento variam de acordo com o fornecedor."
        },
        {
          question: "Como acompanhar meus pedidos?",
          answer: "Para acompanhar seus pedidos, faça login em sua conta, acesse 'Meu Perfil' e clique em 'Meus Pedidos'. Lá você encontrará uma lista de todos os seus pedidos, organizados por data. Clique em 'Ver Detalhes' em qualquer pedido para verificar seu status atual, informações de rastreamento e detalhes da compra."
        },
        {
          question: "Como cancelar um pedido?",
          answer: "Para cancelar um pedido, acesse 'Meus Pedidos', localize o pedido que deseja cancelar e clique em 'Ver Detalhes'. Se o pedido ainda estiver no status 'Processando' ou 'Aguardando Pagamento', você verá a opção 'Cancelar Pedido'. Clique nela, selecione o motivo do cancelamento e confirme. Note que pedidos já em processo de envio ou entregues não podem ser cancelados desta forma e será necessário contatar o fornecedor para verificar a possibilidade de devolução."
        }
      ]
    },
    {
      id: "payments",
      title: "Pagamentos e Faturamento",
      icon: <CreditCard className="h-5 w-5" />,
      faqs: [
        {
          question: "Como solicitar uma nota fiscal?",
          answer: "As notas fiscais são emitidas diretamente pelos fornecedores após a confirmação do pagamento. Você receberá a nota fiscal por email, geralmente em até 24 horas após a confirmação do pagamento. Caso não receba, você pode solicitá-la diretamente ao fornecedor através da plataforma, acessando 'Meus Pedidos', selecionando o pedido em questão e clicando em 'Solicitar Nota Fiscal'."
        },
        {
          question: "O que fazer se o pagamento não for aprovado?",
          answer: "Se seu pagamento não for aprovado, verifique se os dados do cartão estão corretos, se há limite disponível e se o cartão está habilitado para compras online. Você pode tentar novamente com outro método de pagamento acessando 'Meus Pedidos', localizando o pedido com status 'Aguardando Pagamento' e clicando em 'Tentar Novamente'. Se o problema persistir, entre em contato com nosso suporte ou com sua instituição financeira."
        },
        {
          question: "Como funciona o pagamento a prazo para empresas?",
          answer: "O pagamento a prazo está disponível para empresas cadastradas e aprovadas em nossa análise de crédito. Para solicitar esta modalidade, acesse 'Meu Perfil', vá para 'Configurações Financeiras' e clique em 'Solicitar Crédito Empresarial'. Você precisará fornecer documentos da empresa e passar por uma análise. Após aprovação, a opção de pagamento a prazo aparecerá automaticamente no checkout para compras elegíveis."
        },
        {
          question: "Como atualizar minhas informações de pagamento?",
          answer: "Para atualizar informações de pagamento, acesse 'Meu Perfil', clique em 'Métodos de Pagamento' e selecione 'Gerenciar'. Lá você poderá adicionar novos cartões, remover cartões existentes ou atualizar informações como data de validade. Para dados de faturamento, acesse 'Informações Fiscais' na mesma seção e atualize conforme necessário."
        }
      ]
    },
    {
      id: "shipping",
      title: "Entrega e Logística",
      icon: <Truck className="h-5 w-5" />,
      faqs: [
        {
          question: "Quais são os prazos de entrega?",
          answer: "Os prazos de entrega variam de acordo com o fornecedor, o produto e sua localização. Ao visualizar um produto, você verá o prazo estimado de entrega antes de finalizar a compra. Após a confirmação do pedido, você receberá uma estimativa mais precisa. Para produtos de diferentes fornecedores, cada item pode ter um prazo diferente e será entregue separadamente."
        },
        {
          question: "Como funciona a entrega para regiões remotas?",
          answer: "Entregamos para todo o Brasil, incluindo regiões remotas. Para áreas de difícil acesso, pode haver um custo adicional de frete e o prazo de entrega pode ser maior. Durante o checkout, após informar seu CEP, o sistema calculará automaticamente as opções de frete disponíveis, custos e prazos estimados para sua localidade específica."
        },
        {
          question: "O que fazer se meu pedido não chegar no prazo?",
          answer: "Se seu pedido não chegar no prazo estimado, primeiro verifique o status de rastreamento em 'Meus Pedidos'. Se houver atraso sem justificativa no rastreamento, entre em contato com o fornecedor através da plataforma, clicando em 'Contatar Fornecedor' na página de detalhes do pedido. Se não receber resposta em 24 horas, nossa equipe de suporte está disponível para ajudar através do 'Chat de Suporte' ou pelo email suporte@gastrocompare.com.br."
        },
        {
          question: "Como agendar uma entrega?",
          answer: "Para produtos que requerem instalação ou são de grande porte, alguns fornecedores oferecem a opção de agendamento de entrega. Nesse caso, após a confirmação do pedido, você receberá um contato (email ou telefone) para agendar a data e o horário que melhor se adequam à sua disponibilidade. Certifique-se de fornecer um número de telefone válido durante o checkout para facilitar este processo."
        }
      ]
    },
    {
      id: "suppliers",
      title: "Para Fornecedores",
      icon: <Building2 className="h-5 w-5" />,
      faqs: [
        {
          question: "Como me cadastrar como fornecedor?",
          answer: "Para se cadastrar como fornecedor, acesse nossa página inicial, clique em 'Entrar' e selecione 'Cadastro de Fornecedor'. Preencha o formulário com os dados da empresa, incluindo CNPJ, documentação e informações de contato. Nossa equipe analisará as informações e entrará em contato em até 3 dias úteis para dar continuidade ao processo de cadastro e orientar sobre a integração de produtos."
        },
        {
          question: "Quais são as taxas e comissões cobradas?",
          answer: "Nossa plataforma opera com um modelo de comissionamento sobre as vendas realizadas. As taxas variam de 0,5% a 5%, dependendo da categoria do produto, volume de vendas e tempo de parceria. Não há taxas de adesão ou mensalidades fixas. Um detalhamento completo das comissões é fornecido durante o processo de cadastro e está sempre disponível na área do fornecedor em 'Financeiro' > 'Comissões e Taxas'."
        },
        {
          question: "Como cadastrar produtos na plataforma?",
          answer: "Após aprovação do cadastro, acesse sua conta de fornecedor, vá para 'Produtos' e clique em 'Adicionar Novo Produto'. Preencha todos os campos obrigatórios, incluindo título, descrição, especificações técnicas, preço, estoque e imagens de alta qualidade. É possível cadastrar produtos individualmente ou fazer upload em massa através de nossa planilha modelo. Todos os produtos passam por uma rápida revisão antes de serem publicados."
        },
        {
          question: "Como receber os pagamentos pelas vendas?",
          answer: "Os pagamentos são processados automaticamente pelo nosso sistema. Ao se cadastrar, você deve informar os dados bancários para recebimento. O valor das vendas, descontada a comissão da plataforma, é transferido em ciclos de 15 ou 30 dias, dependendo do seu plano de fornecedor. Você pode acompanhar todas as transações, vendas pendentes e pagamentos realizados no painel 'Financeiro' da sua área de fornecedor."
        }
      ]
    },
    {
      id: "security",
      title: "Segurança e Privacidade",
      icon: <ShieldCheck className="h-5 w-5" />,
      faqs: [
        {
          question: "Como meus dados pessoais são protegidos?",
          answer: "A proteção de seus dados é nossa prioridade. Utilizamos criptografia de ponta a ponta para todas as informações sensíveis, como dados de pagamento e senhas. Nossos servidores são protegidos com as mais avançadas tecnologias de segurança, e seguimos rigorosamente as diretrizes da LGPD (Lei Geral de Proteção de Dados) e outras regulamentações aplicáveis. Para mais detalhes, consulte nossa Política de Privacidade."
        },
        {
          question: "As transações na plataforma são seguras?",
          answer: "Sim, todas as transações são processadas por gateways de pagamento certificados e seguem os mais rigorosos padrões de segurança do setor, incluindo certificação PCI DSS. Não armazenamos dados completos de cartões de crédito em nossos servidores. Além disso, monitoramos continuamente atividades suspeitas e oferecemos proteção ao comprador para garantir uma experiência segura."
        },
        {
          question: "Como verificar se um fornecedor é confiável?",
          answer: "Todos os fornecedores da plataforma passam por um rigoroso processo de verificação antes de serem aceitos. Você pode identificar fornecedores verificados pelo selo azul de verificação em seu perfil. Além disso, recomendamos verificar as avaliações e comentários de outros compradores, o tempo de atividade na plataforma e o índice de satisfação exibido na página do fornecedor."
        },
        {
          question: "O que fazer se suspeitar de uma atividade fraudulenta?",
          answer: "Se você suspeitar de qualquer atividade fraudulenta, como tentativas de phishing ou mensagens suspeitas usando nosso nome, reporte imediatamente através do botão 'Denunciar' disponível em comunicações e páginas de produtos, ou entre em contato com nossa equipe de segurança pelo email seguranca@gastrocompare.com.br. Nunca compartilhamos links de pagamento por email ou solicitamos informações sensíveis fora da plataforma."
        }
      ]
    }
  ];
  
  // Filtrar FAQs por busca
  const filteredFAQs = () => {
    if (!searchQuery) return [];
    
    const results: { category: string; faq: FAQ }[] = [];
    
    faqCategories.forEach(category => {
      category.faqs.forEach(faq => {
        if (
          faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
        ) {
          results.push({ category: category.title, faq });
        }
      });
    });
    
    return results;
  };
  
  // Mostrar FAQs específicas de uma categoria
  const showCategory = (categoryId: string) => {
    setActiveCategory(categoryId);
    setSearchQuery(""); // Limpa a busca quando uma categoria é selecionada
  };
  
  // Encontrar categoria ativa
  const activeCategoryData = faqCategories.find(c => c.id === activeCategory);
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <div className="relative py-16 bg-gradient-to-br from-primary/10 to-gray-50">
          <motion.div 
            className="container mx-auto px-4 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
              Como Podemos Ajudar?
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Encontre respostas para suas dúvidas ou entre em contato com nosso suporte.
            </p>
            
            {/* Barra de busca */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Busque por palavra-chave, ex: 'senha', 'entrega', 'pagamento'..."
                  className="pl-10 py-6 rounded-full border-gray-200 shadow-md w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Conteúdo Principal */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            {/* Resultados de busca */}
            {searchQuery && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold mb-6 text-gray-900">
                  Resultados da Busca: {filteredFAQs().length} encontrados
                </h2>
                
                {filteredFAQs().length > 0 ? (
                  <Card className="border-none shadow-sm">
                    <CardContent className="p-6">
                      <Accordion type="single" collapsible className="w-full">
                        {filteredFAQs().map((item, index) => (
                          <AccordionItem value={`search-${index}`} key={index} className="border-b border-gray-200 py-2">
                            <AccordionTrigger className="hover:no-underline">
                              <div className="text-left">
                                <div className="font-medium text-gray-900">{item.faq.question}</div>
                                <div className="text-sm text-gray-500 mt-1">Categoria: {item.category}</div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="text-gray-600 pt-2">
                              {item.faq.answer}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="text-center py-8 bg-white rounded-xl shadow-sm">
                    <HelpCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-gray-700 mb-2">Nenhum resultado encontrado</h3>
                    <p className="text-gray-500 mb-6">
                      Não encontramos respostas para sua pergunta. Tente termos diferentes ou entre em contato conosco.
                    </p>
                    <Link href="/contato">
                      <Button>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Falar com Suporte
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
            
            {/* FAQs por categoria */}
            {activeCategory ? (
              // Mostrar FAQs da categoria selecionada
              <div className="mb-12">
                <div className="flex items-center mb-6">
                  <Button variant="ghost" onClick={() => setActiveCategory(null)} className="group -ml-2">
                    <ChevronLeft className="mr-1 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    Voltar
                  </Button>
                  <h2 className="text-2xl font-bold text-gray-900 ml-2">
                    {activeCategoryData?.title}
                  </h2>
                </div>
                
                <Card className="border-none shadow-sm">
                  <CardContent className="p-6">
                    <Accordion type="single" collapsible className="w-full">
                      {activeCategoryData?.faqs.map((faq, index) => (
                        <AccordionItem value={`faq-${index}`} key={index} className="border-b border-gray-200 py-2">
                          <AccordionTrigger className="hover:no-underline">
                            <div className="text-left font-medium text-gray-900">{faq.question}</div>
                          </AccordionTrigger>
                          <AccordionContent className="text-gray-600 pt-2">
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
                
                <div className="mt-8 text-center">
                  <p className="text-gray-600 mb-4">Não encontrou o que procurava?</p>
                  <Link href="/contato">
                    <Button>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Falar com Suporte
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              // Mostrar grid de categorias
              <>
                {!searchQuery && (
                  <>
                    <h2 className="text-2xl font-bold mb-8 text-gray-900 text-center">
                      Escolha uma Categoria
                    </h2>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                      {faqCategories.map((category, index) => (
                        <motion.div
                          key={category.id}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true, margin: "-100px" }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                        >
                          <CategoryCard
                            icon={category.icon}
                            title={category.title}
                            description={`Respostas para as principais dúvidas sobre ${category.title.toLowerCase()}.`}
                            onClick={() => showCategory(category.id)}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </>
                )}
                
                {/* Links rápidos */}
                <div className="bg-white rounded-xl shadow-sm p-6 md:p-8 mb-12">
                  <h2 className="text-xl font-bold mb-6 text-gray-900">
                    Links Rápidos
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Button variant="outline" className="justify-start gap-2 h-auto py-3">
                      <FileText className="h-5 w-5 text-primary" />
                      <div className="text-left">
                        <span className="block font-medium">Guias e Tutoriais</span>
                        <span className="text-xs text-gray-500">Aprenda a usar a plataforma</span>
                      </div>
                    </Button>
                    
                    <Link href="/contato" className="block">
                      <Button variant="outline" className="justify-start gap-2 h-auto py-3 w-full">
                        <MessageSquare className="h-5 w-5 text-primary" />
                        <div className="text-left">
                          <span className="block font-medium">Contato Direto</span>
                          <span className="text-xs text-gray-500">Fale com nossa equipe</span>
                        </div>
                      </Button>
                    </Link>
                    
                    <Link href="/termos" className="block">
                      <Button variant="outline" className="justify-start gap-2 h-auto py-3 w-full">
                        <FileText className="h-5 w-5 text-primary" />
                        <div className="text-left">
                          <span className="block font-medium">Termos de Uso</span>
                          <span className="text-xs text-gray-500">Políticas da plataforma</span>
                        </div>
                      </Button>
                    </Link>
                    
                    <Link href="/blog" className="block">
                      <Button variant="outline" className="justify-start gap-2 h-auto py-3 w-full">
                        <ExternalLink className="h-5 w-5 text-primary" />
                        <div className="text-left">
                          <span className="block font-medium">Blog Gastro</span>
                          <span className="text-xs text-gray-500">Artigos e novidades</span>
                        </div>
                      </Button>
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
        
        {/* CTA de contato */}
        <section className="py-12 bg-gradient-to-r from-primary to-primary/80 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6">
              Ainda precisa de ajuda?
            </h2>
            <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
              Nossa equipe de suporte está pronta para ajudar com qualquer dúvida ou problema que você possa ter.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/contato">
                <Button variant="secondary" size="lg" className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Contatar Suporte
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="bg-transparent text-white border-white hover:bg-white/10 gap-2">
                <Users className="h-4 w-4" />
                Chat ao Vivo
              </Button>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}