import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Link } from "wouter";
import {
  Search,
  ArrowRight,
  Calendar,
  User,
  Tag,
  BookOpen,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";

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
  };
  publishedAt: string;
  readingTime: number;
  categories: string[];
  featured?: boolean;
}

// Componente Hero
const Hero = () => {
  return (
    <div className="relative py-20 bg-gradient-to-br from-primary/10 to-gray-50 overflow-hidden">
      {/* Elementos decorativos */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-primary/5 rounded-bl-full" />
      <div className="absolute bottom-0 left-0 w-1/4 h-1/4 bg-primary/5 rounded-tr-full" />
      
      <motion.div 
        className="container mx-auto px-4 text-center relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
          Blog da <span className="text-primary">Gastro</span>Compare
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto">
          Dicas, tendências e novidades do setor gastronômico para ajudar seu negócio a crescer.
        </p>
        <form className="max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Buscar artigos, dicas ou tendências..."
              className="pl-10 pr-20 py-6 rounded-full border-gray-200 shadow-md w-full"
            />
            <Button type="submit" className="absolute right-1.5 top-1.5 rounded-full">
              Buscar
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// Card de post para destaque principal
const FeaturedPostCard = ({ post }: { post: BlogPost }) => {
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
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.7 }}
      className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100"
    >
      {/* Imagem */}
      <div className="h-full w-full lg:order-2">
        <div className="h-80 lg:h-full w-full overflow-hidden">
          <motion.img
            src={post.imageUrl}
            alt={post.title}
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
      
      {/* Conteúdo */}
      <div className="px-6 py-8 lg:px-8 lg:order-1">
        <div className="flex flex-wrap gap-2 mb-4">
          {post.categories.map((category, index) => (
            <Badge key={index} variant="secondary">
              {category}
            </Badge>
          ))}
        </div>
        
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
          {post.title}
        </h2>
        
        <p className="text-gray-600 mb-6 line-clamp-3">
          {post.excerpt}
        </p>
        
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              {post.author.avatar ? (
                <img src={post.author.avatar} alt={post.author.name} className="w-full h-full object-cover" />
              ) : (
                <User className="h-4 w-4 text-gray-500" />
              )}
            </div>
            <span className="text-sm text-gray-600">{post.author.name}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">{formatDate(post.publishedAt)}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">{post.readingTime} min</span>
          </div>
        </div>
        
        <Link href={`/blog/${post.slug}`}>
          <Button className="gap-2">
            Ler Artigo
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </motion.div>
  );
};

// Card de post padrão
const PostCard = ({ post }: { post: BlogPost }) => {
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
    >
      <Card className="h-full overflow-hidden hover:shadow-md transition-shadow duration-300">
        <div className="relative h-48 overflow-hidden">
          <motion.img
            src={post.imageUrl}
            alt={post.title}
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.5 }}
          />
          {post.categories.length > 0 && (
            <div className="absolute top-3 left-3">
              <Badge variant="secondary" className="shadow-sm">
                {post.categories[0]}
              </Badge>
            </div>
          )}
        </div>
        
        <CardContent className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
            {post.title}
          </h3>
          
          <p className="text-gray-600 mb-4 line-clamp-3">
            {post.excerpt}
          </p>
          
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(post.publishedAt)}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span>{post.readingTime} min</span>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="pt-0 pb-6 px-6">
          <Link href={`/blog/${post.slug}`} className="w-full">
            <Button variant="outline" className="w-full group">
              <span>Ler Artigo</span>
              <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

// Lista de categorias
const CategoriesList = ({
  categories,
  activeCategory,
  onCategoryChange
}: {
  categories: string[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}) => {
  return (
    <div className="flex flex-wrap gap-2 mb-8">
      <Badge
        variant={activeCategory === "" ? "default" : "outline"}
        className="cursor-pointer py-1.5 px-3 text-sm"
        onClick={() => onCategoryChange("")}
      >
        Todos
      </Badge>
      
      {categories.map((category, index) => (
        <Badge
          key={index}
          variant={activeCategory === category ? "default" : "outline"}
          className="cursor-pointer py-1.5 px-3 text-sm"
          onClick={() => onCategoryChange(category)}
        >
          {category}
        </Badge>
      ))}
    </div>
  );
};

// Componente principal
export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("");
  
  // Dados simulados de posts para demonstração
  const dummyPosts: BlogPost[] = [
    {
      id: 1,
      title: "10 Tendências Gastronômicas para 2025",
      slug: "tendencias-gastronomicas-2025",
      excerpt: "Descubra as principais tendências que vão moldar o mercado gastronômico nos próximos anos e como se preparar para aproveitá-las.",
      content: "",
      imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1974&q=80",
      author: {
        name: "Ana Oliveira",
        avatar: "https://randomuser.me/api/portraits/women/44.jpg"
      },
      publishedAt: "2023-12-15",
      readingTime: 8,
      categories: ["Tendências", "Gastronomia"],
      featured: true
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
    },
    {
      id: 3,
      title: "5 Estratégias para Reduzir Custos sem Comprometer a Qualidade",
      slug: "reduzir-custos-sem-comprometer-qualidade",
      excerpt: "Aprenda como otimizar seus processos e economizar na compra de equipamentos e insumos mantendo a qualidade do seu serviço.",
      content: "",
      imageUrl: "https://images.unsplash.com/photo-1565895405127-481853366cf8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
      author: {
        name: "Rodrigo Santos",
        avatar: "https://randomuser.me/api/portraits/men/67.jpg"
      },
      publishedAt: "2023-11-15",
      readingTime: 6,
      categories: ["Gestão", "Economia"]
    },
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
      id: 5,
      title: "Guia para escolher utensílios de qualidade para restaurantes",
      slug: "utensílios-qualidade-restaurantes",
      excerpt: "Um guia completo sobre os materiais mais duráveis e seguros para equipar a cozinha do seu estabelecimento.",
      content: "",
      imageUrl: "https://images.unsplash.com/photo-1494964227851-d31bec6b1363?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
      author: {
        name: "Fernando Almeida",
        avatar: "https://randomuser.me/api/portraits/men/92.jpg"
      },
      publishedAt: "2023-10-10",
      readingTime: 7,
      categories: ["Utensílios", "Equipamentos"]
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
      id: 7,
      title: "Como organizar uma cozinha profissional eficiente",
      slug: "organizar-cozinha-profissional-eficiente",
      excerpt: "Dicas práticas para otimizar o espaço e melhorar o fluxo de trabalho na cozinha do seu restaurante.",
      content: "",
      imageUrl: "https://images.unsplash.com/photo-1605522469906-3fe226b356bc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1172&q=80",
      author: {
        name: "Marcelo Lima",
        avatar: "https://randomuser.me/api/portraits/men/59.jpg"
      },
      publishedAt: "2023-09-15",
      readingTime: 8,
      categories: ["Cozinha", "Organização"]
    }
  ];
  
  // Efeito para carregar posts
  useEffect(() => {
    const fetchPosts = async () => {
      // Em uma implementação real, aqui faria uma chamada à API
      // Aqui estamos usando dados dummy para demonstração
      setLoading(true);
      
      // Simular um atraso de carregamento
      setTimeout(() => {
        setPosts(dummyPosts);
        setLoading(false);
      }, 800);
      
      // Na implementação real:
      // try {
      //   const response = await apiRequest('GET', '/api/blog/posts');
      //   const data = await response.json();
      //   setPosts(data);
      // } catch (error) {
      //   console.error('Erro ao buscar posts:', error);
      // } finally {
      //   setLoading(false);
      // }
    };
    
    fetchPosts();
  }, []);
  
  // Obter todas as categorias únicas
  const getAllCategories = () => {
    const categories = new Set<string>();
    posts.forEach(post => {
      post.categories.forEach(category => {
        categories.add(category);
      });
    });
    return Array.from(categories);
  };
  
  // Filtrar posts por categoria
  const getFilteredPosts = () => {
    if (!activeCategory) return posts;
    return posts.filter(post => post.categories.includes(activeCategory));
  };
  
  // Obter post destacado
  const getFeaturedPost = () => {
    return posts.find(post => post.featured) || posts[0];
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-grow">
        {/* Hero com barra de pesquisa */}
        <Hero />
        
        {/* Conteúdo principal */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            {loading ? (
              <div className="py-20 flex items-center justify-center">
                <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : (
              <>
                {/* Post em destaque */}
                {posts.length > 0 && (
                  <div className="mb-16">
                    <FeaturedPostCard post={getFeaturedPost()} />
                  </div>
                )}
                
                {/* Filtro de categorias */}
                <CategoriesList
                  categories={getAllCategories()}
                  activeCategory={activeCategory}
                  onCategoryChange={setActiveCategory}
                />
                
                {/* Lista de posts */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {getFilteredPosts()
                    .filter(post => post.id !== getFeaturedPost().id)
                    .map(post => (
                      <PostCard key={post.id} post={post} />
                    ))}
                </div>
                
                {/* Botão de carregar mais */}
                {getFilteredPosts().length > 0 && (
                  <div className="mt-12 text-center">
                    <Button variant="outline" size="lg">
                      Carregar Mais Artigos
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
        
        {/* Newsletter */}
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
                <Input
                  type="email"
                  placeholder="Seu melhor email"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-white"
                />
                <Button type="submit" variant="secondary">
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