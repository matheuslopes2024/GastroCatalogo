import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Send,
  MessageCircle,
  HelpCircle,
  Building2,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Card, 
  CardContent 
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

// Informações de contato
const contactInfo = [
  {
    icon: <MapPin className="h-5 w-5" />,
    title: "Endereço",
    content: "Av. Paulista, 1000 - Bela Vista, São Paulo - SP, 01310-100"
  },
  {
    icon: <Phone className="h-5 w-5" />,
    title: "Telefone",
    content: "+55 (11) 3456-7890"
  },
  {
    icon: <Mail className="h-5 w-5" />,
    title: "Email",
    content: "contato@gastrocompare.com.br"
  },
  {
    icon: <Clock className="h-5 w-5" />,
    title: "Horário de Atendimento",
    content: "Segunda a Sexta: 9h às 18h"
  }
];

// Componente de card de informação
const InfoCard = ({ icon, title, content }: { icon: React.ReactNode, title: string, content: string }) => {
  return (
    <Card className="border-none shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardContent className="p-6 flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
          {icon}
        </div>
        <h3 className="text-lg font-semibold mb-2 text-gray-900">{title}</h3>
        <p className="text-gray-600">{content}</p>
      </CardContent>
    </Card>
  );
};

// Componente de FAQs
const FAQCard = ({ 
  icon, 
  title, 
  description, 
  buttonText,
  link
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  buttonText: string;
  link: string;
}) => {
  return (
    <Card className="border-none shadow-sm hover:shadow-md transition-shadow duration-300 h-full">
      <CardContent className="p-6 flex flex-col h-full">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
          {icon}
        </div>
        <h3 className="text-lg font-semibold mb-2 text-gray-900">{title}</h3>
        <p className="text-gray-600 mb-6 flex-grow">{description}</p>
        <Link href={link}>
          <Button variant="outline" className="w-full group">
            {buttonText}
            <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};

// Componente Principal
export default function ContactPage() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  });
  const [loading, setLoading] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação básica
    if (!formData.name || !formData.email || !formData.message) {
      toast({
        title: "Erro no formulário",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    // Simulação de envio
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Mensagem enviada",
        description: "Agradecemos seu contato! Responderemos em breve.",
      });
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: ""
      });
    }, 1500);
    
    // Na implementação real:
    // try {
    //   const response = await apiRequest('POST', '/api/contact', formData);
    //   if (response.ok) {
    //     toast({
    //       title: "Mensagem enviada",
    //       description: "Agradecemos seu contato! Responderemos em breve.",
    //     });
    //     setFormData({
    //       name: "",
    //       email: "",
    //       phone: "",
    //       subject: "",
    //       message: ""
    //     });
    //   }
    // } catch (error) {
    //   toast({
    //     title: "Erro ao enviar",
    //     description: "Ocorreu um erro ao enviar sua mensagem. Tente novamente mais tarde.",
    //     variant: "destructive"
    //   });
    // } finally {
    //   setLoading(false);
    // }
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <div className="relative py-20 bg-gradient-to-br from-primary/10 to-gray-50">
          <motion.div 
            className="container mx-auto px-4 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
              Entre em Contato
            </h1>
            <p className="text-xl text-gray-600 mb-0 max-w-3xl mx-auto">
              Estamos à disposição para ajudar com suas dúvidas, sugestões ou solicitações.
              Nossa equipe está pronta para atendê-lo.
            </p>
          </motion.div>
        </div>
        
        {/* Informações de Contato */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {contactInfo.map((info, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <InfoCard 
                    icon={info.icon} 
                    title={info.title} 
                    content={info.content} 
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
        
        {/* Formulário de Contato e Mapa */}
        <section className="py-8 pb-16">
          <div className="container mx-auto px-4">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                {/* Formulário */}
                <div className="p-6 md:p-10">
                  <h2 className="text-2xl font-bold mb-6 text-gray-900">
                    Envie sua mensagem
                  </h2>
                  <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome completo *</Label>
                        <Input
                          id="name"
                          name="name"
                          placeholder="Seu nome"
                          value={formData.name}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="seu.email@exemplo.com"
                          value={formData.email}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefone</Label>
                        <Input
                          id="phone"
                          name="phone"
                          placeholder="(00) 00000-0000"
                          value={formData.phone}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="subject">Assunto *</Label>
                        <Select
                          value={formData.subject}
                          onValueChange={(value) => handleSelectChange('subject', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o assunto" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectItem value="duvida">Dúvida</SelectItem>
                              <SelectItem value="suporte">Suporte</SelectItem>
                              <SelectItem value="parceria">Proposta de Parceria</SelectItem>
                              <SelectItem value="feedback">Feedback</SelectItem>
                              <SelectItem value="outros">Outros</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-6">
                      <Label htmlFor="message">Mensagem *</Label>
                      <Textarea
                        id="message"
                        name="message"
                        placeholder="Escreva sua mensagem aqui..."
                        value={formData.message}
                        onChange={handleChange}
                        className="min-h-[150px]"
                        required
                      />
                    </div>
                    
                    <Button type="submit" className="w-full sm:w-auto" disabled={loading}>
                      {loading ? (
                        <>
                          <span className="animate-spin mr-2">⏳</span>
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Enviar Mensagem
                        </>
                      )}
                    </Button>
                  </form>
                </div>
                
                {/* Mapa */}
                <div className="relative h-full min-h-[400px] lg:min-h-0">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3657.098089553069!2d-46.6585376!3d-23.5646162!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94ce59c8da0aa315%3A0xd59f9431f2c9776a!2sAv.%20Paulista%2C%20S%C3%A3o%20Paulo%20-%20SP!5e0!3m2!1spt-BR!2sbr!4v1681162312035!5m2!1spt-BR!2sbr"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen={false}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Mapa da Localização"
                    className="absolute inset-0"
                  ></iframe>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Outras Formas de Ajuda */}
        <section className="py-16 bg-gray-100">
          <div className="container mx-auto px-4">
            <motion.div 
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7 }}
            >
              <h2 className="text-3xl font-bold mb-4 text-gray-900">
                Outras Formas de Obter Ajuda
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Explore nossas outras opções de suporte para encontrar as respostas que você precisa.
              </p>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <FAQCard
                  icon={<HelpCircle className="h-5 w-5" />}
                  title="Perguntas Frequentes"
                  description="Encontre respostas para as dúvidas mais comuns sobre nossa plataforma e como ela funciona."
                  buttonText="Ver FAQ"
                  link="/faq"
                />
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <FAQCard
                  icon={<MessageCircle className="h-5 w-5" />}
                  title="Chat ao Vivo"
                  description="Converse em tempo real com nossa equipe de suporte para obter ajuda imediata com suas dúvidas."
                  buttonText="Iniciar Chat"
                  link="#" // Será substituído quando implementarmos o chat
                />
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <FAQCard
                  icon={<Building2 className="h-5 w-5" />}
                  title="Suporte para Empresas"
                  description="Atendimento dedicado para fornecedores e parceiros comerciais interessados em nossa plataforma."
                  buttonText="Contato Comercial"
                  link="/contato?tipo=comercial"
                />
              </motion.div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}