import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Link, useRoute, useLocation } from "wouter";
import {
  Calendar,
  User,
  Tag,
  BookOpen,
  ArrowLeft,
  Share2,
  FacebookIcon,
  TwitterIcon,
  LinkedinIcon,
  Clock,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardFooter
} from "@/components/ui/card";

// Interface de post do blog
interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  imageUrl: string;
  author: {
    name: string;
    avatar?: string;
    bio?: string;
  };
  publishedAt: string;
  readingTime: number;
  categories: string[];
  featured?: boolean;
  relatedPosts?: BlogPost[];
}

// Card de post relacionado
const RelatedPostCard = ({ post }: { post: BlogPost }) => {
  // Formatar data
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };
  
  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="h-full"
    >
      <Card className="h-full overflow-hidden hover:shadow-md transition-shadow duration-300">
        <div className="relative h-40 overflow-hidden">
          <motion.img
            src={post.imageUrl}
            alt={post.title}
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.5 }}
          />
        </div>
        
        <CardContent className="p-4">
          <div className="flex items-center mb-2 text-xs text-gray-500">
            <Calendar className="h-3.5 w-3.5 mr-1" />
            <span>{formatDate(post.publishedAt)}</span>
          </div>
          
          <h3 className="text-base font-bold text-gray-900 mb-2 line-clamp-2">
            {post.title}
          </h3>
          
          <p className="text-sm text-gray-600 line-clamp-2">
            {post.excerpt}
          </p>
        </CardContent>
        
        <CardFooter className="pt-0 pb-4 px-4">
          <Link href={`/blog/${post.slug}`} className="w-full">
            <Button variant="ghost" size="sm" className="w-full group p-0 h-auto hover:bg-transparent">
              <span className="text-primary">Ler artigo</span>
              <ChevronRight className="ml-1 h-3.5 w-3.5 text-primary group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

// Componente principal
export default function BlogPostPage() {
  const [match, params] = useRoute("/blog/:slug");
  const [, setLocation] = useLocation();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Dados simulados de posts para demonstração
  const dummyPosts: BlogPost[] = [
    {
      id: 1,
      title: "10 Tendências Gastronômicas para 2025",
      slug: "tendencias-gastronomicas-2025",
      excerpt: "Descubra as principais tendências que vão moldar o mercado gastronômico nos próximos anos e como se preparar para aproveitá-las.",
      content: `
      <h2>As novas tendências da gastronomia</h2>
      <p>O mundo gastronômico está em constante evolução, e acompanhar as novas tendências é essencial para quem deseja se destacar neste mercado tão competitivo. Com o avanço da tecnologia e as mudanças nos hábitos de consumo, novas práticas e conceitos emergem, reformulando a maneira como restaurantes e hotéis operam.</p>
      
      <p>Neste artigo, vamos explorar as dez principais tendências que prometem moldar o setor gastronômico nos próximos anos, com foco especial em como elas afetarão a demanda por equipamentos e utensílios.</p>
      
      <h3>1. Cozinhas Inteligentes e Conectadas</h3>
      <p>A Internet das Coisas (IoT) está transformando as cozinhas profissionais. Equipamentos conectados que podem ser monitorados e controlados remotamente estão se tornando cada vez mais comuns. Fornos que podem ser programados via aplicativo, refrigeradores que alertam sobre variações de temperatura e sistemas integrados que otimizam o consumo de energia são apenas alguns exemplos.</p>
      
      <p>Essa tendência demandará uma nova geração de equipamentos com conectividade Wi-Fi e Bluetooth, interfaces digitais e compatibilidade com assistentes virtuais. Restaurantes que adotarem essa tecnologia poderão aumentar sua eficiência operacional e reduzir custos a longo prazo.</p>
      
      <h3>2. Sustentabilidade como Prioridade</h3>
      <p>A preocupação com o meio ambiente deixou de ser apenas uma tendência para se tornar uma necessidade. Consumidores estão cada vez mais conscientes e exigem práticas sustentáveis dos estabelecimentos que frequentam.</p>
      
      <p>Isso se reflete na busca por equipamentos energeticamente eficientes, sistemas de compostagem, dispositivos para redução de desperdício de água e soluções para gerenciamento de resíduos. Fornos de alta eficiência energética, lava-louças com consumo reduzido de água e sistemas de refrigeração eco-friendly serão altamente valorizados.</p>
      
      <h3>3. Automação e Robótica</h3>
      <p>Com os desafios de mão de obra enfrentados pelo setor, a automação surge como uma solução prática. Robôs que auxiliam no preparo de alimentos, sistemas automatizados de montagem de pratos e até mesmo atendentes robóticos estão ganhando espaço.</p>
      
      <p>Esta tendência impulsionará a demanda por equipamentos como fritadeiras automáticas, máquinas de preparo de massas e sistemas robotizados para tarefas repetitivas. A combinação perfeita será entre a criatividade humana e a precisão das máquinas.</p>
      
      <h3>4. Cozinhas Flexíveis e Modulares</h3>
      <p>A era das cozinhas fixas e imutáveis está chegando ao fim. Com o crescimento dos delivery e das dark kitchens, a flexibilidade se tornou essencial. Equipamentos modulares que podem ser reorganizados conforme a demanda ou mesmo transportados para eventos externos estão em alta.</p>
      
      <p>Fogões de indução portáteis, bancadas modulares e sistemas de refrigeração compactos e versáteis serão cada vez mais procurados, especialmente por negócios que precisam se adaptar rapidamente às mudanças de mercado.</p>
      
      <h3>5. Saúde e Bem-estar</h3>
      <p>A preocupação com a saúde se reflete também na demanda por métodos de preparo mais saudáveis. Equipamentos para cocção a vapor, air fryers industriais e ferramentas para preparo de alimentos plant-based ganham destaque.</p>
      
      <p>Estabelecimentos que investirem em equipamentos que preservam nutrientes e permitem preparos com menos gordura estarão alinhados com essa tendência crescente de valorização da alimentação saudável.</p>
      `,
      imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1974&q=80",
      author: {
        name: "Ana Oliveira",
        avatar: "https://randomuser.me/api/portraits/women/44.jpg",
        bio: "Chef e consultora gastronômica com mais de 15 anos de experiência no setor. Especialista em tendências culinárias e novas tecnologias para cozinhas profissionais."
      },
      publishedAt: "2023-12-15",
      readingTime: 8,
      categories: ["Tendências", "Gastronomia"],
      featured: true,
      relatedPosts: [
        {
          id: 4,
          title: "A revolução da tecnologia na cozinha profissional",
          slug: "tecnologia-cozinha-profissional",
          excerpt: "Como os avanços tecnológicos estão transformando a eficiência e a criatividade nas cozinhas de restaurantes modernos.",
          content: "",
          imageUrl: "https://images.unsplash.com/photo-1631193816258-28b78ee4dfb6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
          author: {
            name: "Camila Rocha",
            avatar: "https://randomuser.me/api/portraits/women/63.jpg"
          },
          publishedAt: "2023-10-22",
          readingTime: 9,
          categories: ["Tecnologia", "Inovação"]
        },
        {
          id: 6,
          title: "Sustentabilidade na gastronomia: mais que uma tendência",
          slug: "sustentabilidade-gastronomia",
          excerpt: "Como implementar práticas sustentáveis em seu restaurante e contribuir para um futuro mais verde do setor gastronômico.",
          content: "",
          imageUrl: "https://images.unsplash.com/photo-1611048268330-53de574cae3b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1172&q=80",
          author: {
            name: "Juliana Costa",
            avatar: "https://randomuser.me/api/portraits/women/26.jpg"
          },
          publishedAt: "2023-09-28",
          readingTime: 10,
          categories: ["Sustentabilidade", "Tendências"]
        },
        {
          id: 2,
          title: "Como escolher o forno ideal para seu restaurante",
          slug: "escolher-forno-ideal-restaurante",
          excerpt: "Um guia completo para ajudar você a escolher o equipamento certo para as necessidades específicas do seu estabelecimento.",
          content: "",
          imageUrl: "https://images.unsplash.com/photo-1590598016593-994181519c68?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1932&q=80",
          author: {
            name: "Carlos Mendes",
            avatar: "https://randomuser.me/api/portraits/men/32.jpg"
          },
          publishedAt: "2023-11-28",
          readingTime: 12,
          categories: ["Equipamentos", "Cozinha"]
        }
      ]
    }
  ];
  
  // Efeito para carregar post com base no slug
  useEffect(() => {
    if (!match || !params?.slug) {
      setLocation("/blog");
      return;
    }
    
    const fetchPost = async () => {
      setLoading(true);
      
      // Em uma implementação real, aqui faria uma chamada à API
      // Aqui estamos usando dados dummy para demonstração
      setTimeout(() => {
        const foundPost = dummyPosts.find(p => p.slug === params.slug);
        if (foundPost) {
          setPost(foundPost);
        } else {
          setLocation("/blog");
        }
        setLoading(false);
      }, 800);
      
      // Na implementação real:
      // try {
      //   const response = await apiRequest('GET', `/api/blog/posts/${params.slug}`);
      //   const data = await response.json();
      //   setPost(data);
      // } catch (error) {
      //   console.error('Erro ao buscar post:', error);
      //   setLocation("/blog");
      // } finally {
      //   setLoading(false);
      // }
    };
    
    fetchPost();
  }, [match, params?.slug, setLocation]);
  
  // Formatar data
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };
  
  // Compartilhar post
  const sharePost = (platform: string) => {
    const url = window.location.href;
    const title = post?.title || 'Blog GastroCompare';
    
    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, '_blank');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
        break;
      default:
        navigator.clipboard.writeText(url);
        alert('Link copiado para a área de transferência!');
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-grow">
        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : post ? (
          <>
            {/* Imagem de capa */}
            <div className="relative w-full h-[400px] md:h-[500px] overflow-hidden">
              <div className="absolute inset-0 bg-black/40 z-10" />
              <img
                src={post.imageUrl}
                alt={post.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 z-20 flex flex-col justify-end p-6 md:p-16 text-white">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7 }}
                >
                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.categories.map((category, index) => (
                      <Badge key={index} className="bg-white/20 hover:bg-white/30 text-white border-none">
                        {category}
                      </Badge>
                    ))}
                  </div>
                  
                  <h1 className="text-3xl md:text-5xl font-bold mb-4 max-w-4xl">
                    {post.title}
                  </h1>
                  
                  <div className="flex flex-wrap items-center gap-6 text-sm md:text-base">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                        {post.author.avatar ? (
                          <img src={post.author.avatar} alt={post.author.name} className="w-full h-full object-cover" />
                        ) : (
                          <User className="h-4 w-4 text-gray-500" />
                        )}
                      </div>
                      <span>{post.author.name}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(post.publishedAt)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{post.readingTime} min de leitura</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
            
            {/* Conteúdo do artigo */}
            <div className="container mx-auto px-4 py-12">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Artigo */}
                <div className="lg:col-span-8">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.7 }}
                  >
                    <div className="bg-white rounded-xl shadow-sm p-6 md:p-10">
                      {/* Botão voltar */}
                      <Link href="/blog">
                        <Button variant="ghost" className="group mb-6 -ml-2 text-gray-600">
                          <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                          Voltar para o Blog
                        </Button>
                      </Link>
                      
                      {/* Conteúdo formatado */}
                      <div 
                        className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-600 prose-a:text-primary prose-img:rounded-xl"
                        dangerouslySetInnerHTML={{ __html: post.content }}
                      />
                      
                      {/* Botões de compartilhamento */}
                      <div className="mt-12 pt-6 border-t border-gray-200">
                        <h3 className="text-lg font-semibold mb-4 text-gray-900">
                          Compartilhar este artigo:
                        </h3>
                        <div className="flex gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            className="rounded-full"
                            onClick={() => sharePost('facebook')}
                          >
                            <FacebookIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            className="rounded-full"
                            onClick={() => sharePost('twitter')}
                          >
                            <TwitterIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            className="rounded-full"
                            onClick={() => sharePost('linkedin')}
                          >
                            <LinkedinIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            className="rounded-full"
                            onClick={() => sharePost('copy')}
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Informações do autor */}
                      <div className="mt-10 flex items-start gap-4 p-6 bg-gray-50 rounded-xl">
                        <div className="flex-shrink-0">
                          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-sm">
                            {post.author.avatar ? (
                              <img src={post.author.avatar} alt={post.author.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                <User className="h-8 w-8 text-gray-500" />
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{post.author.name}</h3>
                          <p className="text-gray-600 mt-1">{post.author.bio || 'Especialista em gastronomia e equipamentos para restaurantes.'}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
                
                {/* Sidebar */}
                <div className="lg:col-span-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.2 }}
                  >
                    {/* Posts relacionados */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                      <h3 className="text-xl font-bold mb-4 text-gray-900 border-b pb-4">
                        Artigos Relacionados
                      </h3>
                      
                      <div className="space-y-4">
                        {post.relatedPosts?.map((relatedPost) => (
                          <RelatedPostCard key={relatedPost.id} post={relatedPost} />
                        ))}
                      </div>
                    </div>
                    
                    {/* Tags */}
                    <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
                      <h3 className="text-xl font-bold mb-4 text-gray-900 border-b pb-4">
                        Categorias
                      </h3>
                      
                      <div className="flex flex-wrap gap-2 mt-4">
                        {post.categories.map((category, index) => (
                          <Link key={index} href={`/blog?categoria=${category}`}>
                            <Badge variant="outline" className="py-1.5 px-3 cursor-pointer hover:bg-gray-100">
                              {category}
                            </Badge>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </>
        ) : null}
        
        {/* CTA Newsletter */}
        <section className="py-16 bg-gradient-to-r from-primary to-primary/80 text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Fique por Dentro das Novidades
              </h2>
              <p className="text-xl mb-8 text-white/90">
                Assine nossa newsletter e receba dicas, tendências e novidades do setor gastronômico diretamente em seu email.
              </p>
              <form className="flex flex-col sm:flex-row gap-2 max-w-lg mx-auto">
                <input
                  type="email"
                  placeholder="Seu melhor email"
                  className="px-4 py-2 rounded-md flex-1 bg-white/10 border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
                <Button variant="secondary">
                  Assinar
                </Button>
              </form>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}