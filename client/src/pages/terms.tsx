import { motion } from "framer-motion";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Link } from "wouter";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

// Componente principal
export default function TermsPage() {
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
              Termos de Uso
            </h1>
            <p className="text-xl text-gray-600 mb-0 max-w-3xl mx-auto">
              Ao utilizar a plataforma Gastro Compare, você concorda com os termos e condições descritos nesta página.
            </p>
          </motion.div>
        </div>
        
        {/* Conteúdo dos Termos */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-xl shadow-sm p-6 md:p-10">
                {/* Botão voltar */}
                <Link href="/">
                  <Button variant="ghost" className="group mb-6 -ml-2 text-gray-600">
                    <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    Voltar para a Página Inicial
                  </Button>
                </Link>
                
                {/* Última atualização */}
                <div className="text-sm text-gray-500 mb-8">
                  Última atualização: 10 de abril de 2025
                </div>
                
                <div className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-600 prose-a:text-primary">
                  <h2>1. Introdução</h2>
                  <p>
                    Bem-vindo à plataforma Gastro Compare! Estes Termos de Uso ("Termos") regem o acesso e uso do site gastrocompare.com.br, seus subdomínios e todos os serviços relacionados (coletivamente, a "Plataforma"). A Plataforma é operada pela Gastro Compare Ltda. ("nós", "nosso", "Gastro Compare").
                  </p>
                  <p>
                    Ao acessar ou utilizar nossa Plataforma, você concorda em ficar vinculado a estes Termos. Se você não concordar com qualquer parte destes Termos, não poderá acessar ou utilizar nossa Plataforma.
                  </p>
                  
                  <h2>2. Definições</h2>
                  <p>
                    <strong>"Usuário"</strong>: refere-se a qualquer pessoa que acesse ou utilize a Plataforma, incluindo visitantes, compradores e fornecedores.
                  </p>
                  <p>
                    <strong>"Comprador"</strong>: refere-se a um Usuário que utiliza a Plataforma para pesquisar, comparar e adquirir produtos.
                  </p>
                  <p>
                    <strong>"Fornecedor"</strong>: refere-se a um Usuário que oferece seus produtos para venda através da Plataforma.
                  </p>
                  <p>
                    <strong>"Conteúdo"</strong>: refere-se a todo o material disponibilizado na Plataforma, incluindo textos, imagens, vídeos, descrições de produtos, comentários, avaliações e outros materiais.
                  </p>
                  
                  <h2>3. Cadastro e Contas</h2>
                  <p>
                    Para acessar determinadas funcionalidades da Plataforma, você precisará criar uma conta. Ao criar uma conta, você concorda em fornecer informações precisas, completas e atualizadas. Você é responsável por manter a confidencialidade de sua senha e por todas as atividades realizadas com sua conta.
                  </p>
                  <p>
                    Reservamo-nos o direito de recusar o registro, cancelar contas ou remover ou editar conteúdo a nosso critério exclusivo, sem aviso prévio.
                  </p>
                  
                  <h2>4. Uso da Plataforma</h2>
                  <h3>4.1 Compradores</h3>
                  <p>
                    Como Comprador, você pode utilizar a Plataforma para pesquisar, comparar e adquirir produtos. Você concorda em fornecer informações precisas ao realizar compras e em cumprir os termos de qualquer transação que você realizar.
                  </p>
                  
                  <h3>4.2 Fornecedores</h3>
                  <p>
                    Como Fornecedor, você pode cadastrar seus produtos na Plataforma para venda. Você é responsável pela precisão e integridade de todas as informações relacionadas aos seus produtos, incluindo descrições, preços, disponibilidade e imagens.
                  </p>
                  <p>
                    Você concorda em cumprir todas as obrigações decorrentes das vendas realizadas através da Plataforma, incluindo o processamento, embalagem e envio dos produtos, bem como o fornecimento de suporte pós-venda.
                  </p>
                  
                  <h3>4.3 Comissões</h3>
                  <p>
                    A Gastro Compare cobra uma comissão sobre as vendas realizadas através da Plataforma. As taxas de comissão são comunicadas aos Fornecedores durante o processo de cadastro e podem variar de acordo com a categoria do produto e o volume de vendas.
                  </p>
                  
                  <h2>5. Conteúdo e Propriedade Intelectual</h2>
                  <p>
                    A Plataforma e todo o seu Conteúdo, incluindo, mas não se limitando a, textos, gráficos, logotipos, ícones, imagens, clipes de áudio, downloads digitais e compilações de dados, são propriedade da Gastro Compare ou de seus licenciadores e são protegidos pelas leis de propriedade intelectual aplicáveis.
                  </p>
                  <p>
                    Você não pode modificar, reproduzir, duplicar, copiar, distribuir, vender, revender ou explorar de qualquer outra forma qualquer parte da Plataforma ou seu Conteúdo sem nossa expressa permissão por escrito.
                  </p>
                  
                  <h2>6. Conteúdo do Usuário</h2>
                  <p>
                    Ao enviar qualquer Conteúdo para a Plataforma, incluindo avaliações, comentários, imagens ou vídeos, você concede à Gastro Compare uma licença mundial, não exclusiva, perpétua, irrevogável, livre de royalties, sublicenciável e transferível para usar, reproduzir, distribuir, preparar trabalhos derivados, exibir e executar tal Conteúdo em conexão com a Plataforma e os negócios da Gastro Compare.
                  </p>
                  <p>
                    Você declara e garante que possui todos os direitos necessários para conceder a licença acima e que seu Conteúdo não viola os direitos de terceiros ou quaisquer leis aplicáveis.
                  </p>
                  
                  <h2>7. Limitação de Responsabilidade</h2>
                  <p>
                    A Gastro Compare não se responsabiliza pela qualidade, segurança, legalidade ou disponibilidade dos produtos oferecidos pelos Fornecedores através da Plataforma. Somos meramente uma plataforma que conecta Compradores e Fornecedores.
                  </p>
                  <p>
                    Em nenhuma circunstância a Gastro Compare, seus diretores, funcionários ou agentes serão responsáveis por quaisquer danos indiretos, incidentais, especiais, consequenciais ou punitivos decorrentes do uso ou incapacidade de uso da Plataforma.
                  </p>
                  
                  <h2>8. Indenização</h2>
                  <p>
                    Você concorda em indenizar, defender e isentar a Gastro Compare, seus diretores, funcionários e agentes de qualquer reclamação, responsabilidade, dano, perda e despesa, incluindo, sem limitação, honorários advocatícios razoáveis e custos, decorrentes de ou de qualquer forma relacionados a: (a) seu acesso ou uso da Plataforma; (b) sua violação destes Termos; (c) seu Conteúdo; ou (d) sua violação dos direitos de terceiros.
                  </p>
                  
                  <h2>9. Modificações dos Termos</h2>
                  <p>
                    Reservamo-nos o direito de modificar estes Termos a qualquer momento. As modificações entrarão em vigor imediatamente após sua publicação na Plataforma. É sua responsabilidade revisar periodicamente estes Termos. Seu uso continuado da Plataforma após a publicação de modificações constitui sua aceitação destas.
                  </p>
                  
                  <h2>10. Lei Aplicável e Foro</h2>
                  <p>
                    Estes Termos são regidos e interpretados de acordo com as leis do Brasil. Qualquer disputa decorrente ou relacionada a estes Termos será submetida exclusivamente aos tribunais da cidade de São Paulo, SP.
                  </p>
                  
                  <h2>11. Disposições Gerais</h2>
                  <p>
                    Se qualquer disposição destes Termos for considerada inválida ou inexequível, as demais disposições permanecerão em pleno vigor e efeito. A falha da Gastro Compare em exercer ou fazer cumprir qualquer direito ou disposição destes Termos não constituirá uma renúncia a tal direito ou disposição.
                  </p>
                  
                  <h2>12. Contato</h2>
                  <p>
                    Se você tiver dúvidas sobre estes Termos, entre em contato conosco pelo e-mail: <a href="mailto:juridico@gastrocompare.com.br">juridico@gastrocompare.com.br</a>.
                  </p>
                </div>
                
                {/* Links relacionados */}
                <div className="mt-10 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-bold mb-4 text-gray-900">
                    Documentos Relacionados
                  </h3>
                  <ul className="space-y-2">
                    <li>
                      <Link href="/privacidade" className="text-primary hover:underline flex items-center group">
                        <span>Política de Privacidade</span>
                        <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </li>
                    <li>
                      <Link href="/cookies" className="text-primary hover:underline flex items-center group">
                        <span>Política de Cookies</span>
                        <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </li>
                    <li>
                      <Link href="/ajuda" className="text-primary hover:underline flex items-center group">
                        <span>Central de Ajuda</span>
                        <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}