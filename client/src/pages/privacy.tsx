import { motion } from "framer-motion";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Link } from "wouter";
import { ArrowLeft, ChevronRight, LockIcon, Shield, Eye, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// Componente de card informativo
const InfoCard = ({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
}) => {
  return (
    <Card className="h-full border-none shadow-sm">
      <CardContent className="p-6 flex flex-col h-full">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
          {icon}
        </div>
        <h3 className="text-lg font-semibold mb-2 text-gray-900">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </CardContent>
    </Card>
  );
};

// Componente principal
export default function PrivacyPage() {
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
              Política de Privacidade
            </h1>
            <p className="text-xl text-gray-600 mb-0 max-w-3xl mx-auto">
              Valorizamos sua privacidade e estamos comprometidos com a proteção de seus dados pessoais.
              Conheça como coletamos, utilizamos e protegemos suas informações.
            </p>
          </motion.div>
        </div>
        
        {/* Cards informativos */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <InfoCard
                  icon={<LockIcon className="h-5 w-5" />}
                  title="Segurança Garantida"
                  description="Utilizamos medidas técnicas e organizacionais avançadas para proteger seus dados pessoais contra acesso não autorizado."
                />
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <InfoCard
                  icon={<Eye className="h-5 w-5" />}
                  title="Transparência"
                  description="Somos transparentes sobre quais informações coletamos e como as utilizamos, garantindo que você tenha controle sobre seus dados."
                />
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <InfoCard
                  icon={<Shield className="h-5 w-5" />}
                  title="Conformidade com a LGPD"
                  description="Nossa política de privacidade está em conformidade com a Lei Geral de Proteção de Dados (LGPD) e outras regulamentações aplicáveis."
                />
              </motion.div>
            </div>
            
            {/* Conteúdo da Política */}
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
                    A Gastro Compare ("nós", "nosso" ou "nossa") está comprometida em proteger a privacidade e os dados pessoais dos usuários de nossa plataforma. Esta Política de Privacidade descreve como coletamos, usamos, compartilhamos e protegemos informações relacionadas à sua utilização do site gastrocompare.com.br, seus subdomínios e todos os serviços relacionados (coletivamente, a "Plataforma").
                  </p>
                  <p>
                    Ao utilizar nossa Plataforma, você concorda com as práticas descritas nesta Política de Privacidade. Se você não concordar com esta Política, por favor, não utilize nossa Plataforma.
                  </p>
                  
                  <h2>2. Informações que Coletamos</h2>
                  
                  <h3>2.1 Informações Fornecidas por Você</h3>
                  <p>
                    Coletamos informações que você nos fornece diretamente, incluindo:
                  </p>
                  <ul>
                    <li>Informações de cadastro (nome, e-mail, telefone, endereço, CNPJ, etc.);</li>
                    <li>Informações de perfil (nome da empresa, descrição, logo, etc.);</li>
                    <li>Dados de pagamento (informações de cartão de crédito, dados bancários, etc.);</li>
                    <li>Comunicações (mensagens enviadas através de nossa plataforma, e-mails, etc.);</li>
                    <li>Conteúdo gerado pelo usuário (avaliações, comentários, uploads de imagens, etc.).</li>
                  </ul>
                  
                  <h3>2.2 Informações Coletadas Automaticamente</h3>
                  <p>
                    Quando você utiliza nossa Plataforma, coletamos automaticamente:
                  </p>
                  <ul>
                    <li>Dados de uso (páginas visitadas, produtos visualizados, tempo gasto na plataforma, etc.);</li>
                    <li>Informações do dispositivo (tipo de dispositivo, sistema operacional, navegador, etc.);</li>
                    <li>Dados de localização (com base no IP ou permissões concedidas);</li>
                    <li>Cookies e tecnologias similares (conforme detalhado em nossa Política de Cookies).</li>
                  </ul>
                  
                  <h2>3. Como Utilizamos suas Informações</h2>
                  <p>
                    Utilizamos as informações coletadas para:
                  </p>
                  <ul>
                    <li>Fornecer, manter e melhorar nossa Plataforma;</li>
                    <li>Processar transações e gerenciar contas de usuários;</li>
                    <li>Conectar compradores e fornecedores;</li>
                    <li>Personalizar a experiência do usuário;</li>
                    <li>Enviar comunicações relacionadas ao serviço, atualizações e mensagens promocionais;</li>
                    <li>Analisar tendências e comportamentos dos usuários;</li>
                    <li>Detectar, prevenir e resolver problemas técnicos, fraudes e atividades ilegais;</li>
                    <li>Cumprir obrigações legais e regulatórias.</li>
                  </ul>
                  
                  <h2>4. Compartilhamento de Informações</h2>
                  <p>
                    Podemos compartilhar suas informações com:
                  </p>
                  <ul>
                    <li><strong>Fornecedores e compradores</strong>: Para facilitar transações e comunicações entre as partes;</li>
                    <li><strong>Prestadores de serviço</strong>: Empresas que nos auxiliam na operação de nossa Plataforma (processamento de pagamentos, hospedagem, análise de dados, etc.);</li>
                    <li><strong>Parceiros comerciais</strong>: Para oferecer produtos e serviços complementares;</li>
                    <li><strong>Autoridades legais</strong>: Quando exigido por lei, decisão judicial ou para proteger direitos;</li>
                    <li><strong>Entidades corporativas</strong>: No caso de fusão, aquisição ou venda de ativos.</li>
                  </ul>
                  <p>
                    Não vendemos suas informações pessoais a terceiros.
                  </p>
                  
                  <h2>5. Armazenamento e Segurança</h2>
                  <p>
                    Implementamos medidas de segurança técnicas e organizacionais apropriadas para proteger suas informações contra perda, uso indevido e acesso não autorizado, incluindo:
                  </p>
                  <ul>
                    <li>Criptografia de dados sensíveis;</li>
                    <li>Firewalls e sistemas de detecção de intrusão;</li>
                    <li>Controles de acesso rigorosos;</li>
                    <li>Monitoramento regular de sistemas;</li>
                    <li>Treinamento de segurança para funcionários.</li>
                  </ul>
                  <p>
                    Mantemos suas informações pelo tempo necessário para cumprir as finalidades descritas nesta Política, a menos que um período de retenção mais longo seja exigido ou permitido por lei.
                  </p>
                  
                  <h2>6. Seus Direitos</h2>
                  <p>
                    De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem os seguintes direitos relacionados a seus dados pessoais:
                  </p>
                  <ul>
                    <li>Confirmação da existência de tratamento;</li>
                    <li>Acesso aos dados;</li>
                    <li>Correção de dados incompletos, inexatos ou desatualizados;</li>
                    <li>Anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou tratados em desconformidade;</li>
                    <li>Portabilidade dos dados;</li>
                    <li>Eliminação dos dados tratados com consentimento;</li>
                    <li>Informação sobre entidades públicas e privadas com as quais compartilhamos seus dados;</li>
                    <li>Informação sobre a possibilidade de não fornecer consentimento e suas consequências;</li>
                    <li>Revogação do consentimento.</li>
                  </ul>
                  <p>
                    Para exercer seus direitos, entre em contato conosco pelo e-mail: <a href="mailto:privacidade@gastrocompare.com.br">privacidade@gastrocompare.com.br</a>
                  </p>
                  
                  <h2>7. Cookies e Tecnologias Similares</h2>
                  <p>
                    Utilizamos cookies e tecnologias similares para melhorar sua experiência, entender como nossa Plataforma é utilizada e personalizar nosso conteúdo e publicidade. Para mais informações, consulte nossa <Link href="/cookies" className="text-primary hover:underline">Política de Cookies</Link>.
                  </p>
                  
                  <h2>8. Transferência Internacional de Dados</h2>
                  <p>
                    Suas informações podem ser transferidas e processadas em servidores localizados fora do Brasil. Garantimos que qualquer transferência internacional de dados seja realizada em conformidade com as leis de proteção de dados aplicáveis e que níveis adequados de proteção sejam implementados.
                  </p>
                  
                  <h2>9. Crianças</h2>
                  <p>
                    Nossa Plataforma não é destinada a menores de 18 anos. Não coletamos intencionalmente informações pessoais de crianças. Se tomarmos conhecimento de que coletamos informações pessoais de uma criança, tomaremos medidas para remover essas informações.
                  </p>
                  
                  <h2>10. Alterações a Esta Política</h2>
                  <p>
                    Podemos atualizar esta Política de Privacidade periodicamente. A versão mais recente estará sempre disponível em nossa Plataforma, com a data da última atualização. Recomendamos que você revise esta Política regularmente para estar ciente de quaisquer alterações.
                  </p>
                  
                  <h2>11. Contato</h2>
                  <p>
                    Se você tiver dúvidas ou preocupações sobre esta Política de Privacidade ou sobre como tratamos seus dados pessoais, entre em contato conosco pelo e-mail: <a href="mailto:privacidade@gastrocompare.com.br">privacidade@gastrocompare.com.br</a>
                  </p>
                  <p>
                    Nosso Encarregado de Proteção de Dados (DPO) pode ser contatado pelo e-mail: <a href="mailto:dpo@gastrocompare.com.br">dpo@gastrocompare.com.br</a>
                  </p>
                </div>
                
                {/* Links relacionados */}
                <div className="mt-10 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-bold mb-4 text-gray-900">
                    Documentos Relacionados
                  </h3>
                  <ul className="space-y-2">
                    <li>
                      <Link href="/termos" className="text-primary hover:underline flex items-center group">
                        <span>Termos de Uso</span>
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