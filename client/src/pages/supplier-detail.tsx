import React, { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useToast } from "@/hooks/use-toast";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  CheckCircle2, 
  Clock, 
  Star, 
  Shield, 
  Map, 
  Package, 
  Building, 
  Phone, 
  Mail,
  Info,
  Calendar,
  Store,
  ShieldCheck,
  Filter,
  FileText,
  ArrowRight
} from "lucide-react";
import { formatCurrency } from "@/lib/format";

export default function SupplierDetail() {
  const { supplierId } = useParams();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("sobre");
  
  // Buscar dados do fornecedor
  const { data: supplier, isLoading, error } = useQuery({
    queryKey: [`/api/suppliers/${supplierId}`],
    queryFn: async () => {
      const res = await fetch(`/api/suppliers/${supplierId}`);
      if (!res.ok) {
        throw new Error("Erro ao carregar dados do fornecedor");
      }
      return res.json();
    },
    enabled: !!supplierId
  });
  
  // Buscar produtos do fornecedor (top 8)
  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: [`/api/suppliers/${supplierId}/products`],
    queryFn: async () => {
      const res = await fetch(`/api/suppliers/${supplierId}/products?limit=8`);
      if (!res.ok) {
        throw new Error("Erro ao carregar produtos do fornecedor");
      }
      return res.json();
    },
    enabled: !!supplierId
  });
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 container mx-auto py-8 px-4">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-1/3">
              <Skeleton className="h-80 w-full rounded-lg mb-4" />
              <Skeleton className="h-10 w-full rounded-md mb-2" />
              <Skeleton className="h-6 w-3/4 rounded-md mb-6" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-full rounded-md" />
                <Skeleton className="h-8 w-full rounded-md" />
                <Skeleton className="h-8 w-full rounded-md" />
              </div>
            </div>
            <div className="w-full md:w-2/3">
              <Skeleton className="h-12 w-3/4 rounded-md mb-4" />
              <Skeleton className="h-6 w-full rounded-md mb-6" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <Skeleton className="h-24 rounded-md" />
                <Skeleton className="h-24 rounded-md" />
                <Skeleton className="h-24 rounded-md" />
                <Skeleton className="h-24 rounded-md" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  if (error || !supplier) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 container mx-auto py-16 px-4">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-red-600">Erro ao carregar fornecedor</CardTitle>
                <CardDescription>
                  Não foi possível encontrar as informações deste fornecedor.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <p className="text-center mb-6">
                  O fornecedor que você está procurando não existe ou ocorreu um erro ao buscar os dados.
                </p>
                <Button asChild>
                  <Link href="/fornecedores">Voltar para lista de fornecedores</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-1">
        {/* Cabeçalho do fornecedor */}
        <div className="bg-gradient-to-r from-primary to-primary/80 text-white py-12">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Logo/Avatar do fornecedor */}
              <div className="relative">
                <div className="h-32 w-32 rounded-full bg-white p-1 flex items-center justify-center overflow-hidden">
                  {supplier.imageUrl ? (
                    <img 
                      src={supplier.imageUrl} 
                      alt={supplier.name} 
                      className="h-full w-full object-cover rounded-full"
                    />
                  ) : (
                    <Store className="h-20 w-20 text-primary" />
                  )}
                </div>
                {supplier.verified && (
                  <div className="absolute bottom-0 right-0 bg-green-500 rounded-full p-2 border-2 border-white">
                    <CheckCircle2 className="h-6 w-6 text-white" />
                  </div>
                )}
              </div>
              
              {/* Informações principais */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row justify-between">
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold mb-2">
                      {supplier.companyName || supplier.name}
                    </h1>
                    <div className="flex items-center gap-2 justify-center md:justify-start mb-3">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star} 
                            size={18} 
                            className={`${parseFloat(supplier.rating || "0") >= star 
                              ? "text-yellow-300 fill-yellow-300" 
                              : "text-gray-300 fill-gray-200"}`}
                          />
                        ))}
                      </div>
                      <span className="text-white/90">
                        {supplier.rating || "4.8"} (241 avaliações)
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4 justify-center md:justify-start">
                      <Badge className="bg-white/20 hover:bg-white/30 text-white">
                        {supplier.role === "SUPPLIER" ? "Fornecedor" : "Administrador"}
                      </Badge>
                      <Badge className="bg-white/20 hover:bg-white/30 text-white">
                        {supplier.productsCount || "0"} produtos
                      </Badge>
                      {supplier.verified && (
                        <Badge className="bg-green-600 hover:bg-green-700 text-white">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Verificado
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 justify-center md:justify-end">
                    <Button className="bg-white text-primary hover:bg-white/90">
                      <Mail className="mr-2 h-4 w-4" />
                      Contato
                    </Button>
                    <Button variant="outline" className="border-white text-white hover:bg-white/20">
                      <Phone className="mr-2 h-4 w-4" />
                      Telefone
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Estatísticas */}
        <div className="border-b border-gray-200 bg-white">
          <div className="container mx-auto px-4 py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-xl md:text-2xl font-bold text-primary">{supplier.productsCount || 78}</div>
                <div className="text-gray-600 text-sm">Produtos</div>
              </div>
              <div>
                <div className="text-xl md:text-2xl font-bold text-primary">
                  {new Date(supplier.createdAt).getFullYear()}
                </div>
                <div className="text-gray-600 text-sm">Desde</div>
              </div>
              <div>
                <div className="text-xl md:text-2xl font-bold text-primary">
                  {supplier.rating || "4.8"}/5
                </div>
                <div className="text-gray-600 text-sm">Avaliação</div>
              </div>
              <div>
                <div className="text-xl md:text-2xl font-bold text-primary">
                  24h
                </div>
                <div className="text-gray-600 text-sm">Tempo de resposta</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Conteúdo principal com tabs */}
        <div className="container mx-auto px-4 py-8">
          <Tabs defaultValue="sobre" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-8 grid w-full grid-cols-4">
              <TabsTrigger value="sobre">Sobre</TabsTrigger>
              <TabsTrigger value="produtos">Produtos</TabsTrigger>
              <TabsTrigger value="avaliacoes">Avaliações</TabsTrigger>
              <TabsTrigger value="contato">Contato</TabsTrigger>
            </TabsList>
            
            <TabsContent value="sobre" className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Info className="mr-2 h-5 w-5 text-primary" />
                    Sobre {supplier.name}
                  </CardTitle>
                  <CardDescription>
                    Informações detalhadas sobre este fornecedor
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-3">Descrição</h3>
                    <p className="text-gray-600">
                      {supplier.description || `${supplier.companyName || supplier.name} é um fornecedor especializado em produtos e equipamentos para restaurantes e hotéis. Oferecemos produtos de alta qualidade com preços competitivos, suporte técnico especializado e entrega rápida para todo o Brasil.`}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-3">Especialidades</h3>
                    <div className="flex flex-wrap gap-2">
                      {(supplier.categories || ["Utensílios de Cozinha", "Equipamentos Comerciais", "Louças e Talheres", "Fornos e Fogões"]).map((category, index) => (
                        <Badge key={index} variant="outline" className="bg-primary/5 hover:bg-primary/10 text-primary border-primary/20">
                          {category}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="shadow-none border border-gray-100">
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="bg-primary/10 p-3 rounded-full">
                          <Building className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium mb-1">Informações da Empresa</h4>
                          <p className="text-sm text-gray-600">
                            {supplier.cnpj ? `CNPJ: ${supplier.cnpj}` : "Fornecedor verificado pela plataforma Gastro"}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="shadow-none border border-gray-100">
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="bg-green-50 p-3 rounded-full">
                          <Calendar className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-medium mb-1">Ativo desde</h4>
                          <p className="text-sm text-gray-600">
                            {new Date(supplier.createdAt).toLocaleDateString('pt-BR', { 
                              year: 'numeric', 
                              month: 'long'
                            })}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="shadow-none border border-gray-100">
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="bg-blue-50 p-3 rounded-full">
                          <ShieldCheck className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium mb-1">Garantia e Segurança</h4>
                          <p className="text-sm text-gray-600">
                            Pagamentos seguros e garantia em todos os produtos
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="shadow-none border border-gray-100">
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="bg-amber-50 p-3 rounded-full">
                          <Clock className="h-6 w-6 text-amber-600" />
                        </div>
                        <div>
                          <h4 className="font-medium mb-1">Tempo de Resposta</h4>
                          <p className="text-sm text-gray-600">
                            Média de 24 horas para responder mensagens
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="produtos" className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Produtos de {supplier.name}</h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    Filtrar
                  </Button>
                  <Link href={`/busca?fornecedor=${supplier.id}`}>
                    <Button size="sm">
                      Ver todos os produtos
                    </Button>
                  </Link>
                </div>
              </div>
              
              {isLoadingProducts ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[...Array(8)].map((_, index) => (
                    <Card key={index} className="overflow-hidden">
                      <Skeleton className="h-48 w-full rounded-none" />
                      <CardContent className="p-4">
                        <Skeleton className="h-6 w-3/4 rounded-md mb-2" />
                        <Skeleton className="h-5 w-1/2 rounded-md mb-4" />
                        <Skeleton className="h-8 w-full rounded-md" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : products && products.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {products.map((product) => (
                    <Card key={product.id} className="overflow-hidden hover:shadow-md transition-shadow">
                      <div className="h-48 bg-gray-100 relative overflow-hidden">
                        <img 
                          src={product.imageUrl || "/assets/produto-sem-imagem.png"} 
                          alt={product.name} 
                          className="w-full h-full object-cover"
                        />
                        {product.discount && product.discount > 0 && (
                          <Badge className="absolute top-2 right-2 bg-red-500 text-white">
                            {product.discount}% OFF
                          </Badge>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-medium mb-1 line-clamp-2 h-12">{product.name}</h3>
                        <div className="flex items-baseline gap-2 mb-3">
                          <span className="text-lg font-bold text-primary">
                            {formatCurrency(product.price)}
                          </span>
                          {product.originalPrice && parseFloat(product.originalPrice) > parseFloat(product.price) && (
                            <span className="text-sm line-through text-gray-400">
                              {formatCurrency(product.originalPrice)}
                            </span>
                          )}
                        </div>
                        <Button variant="outline" className="w-full" asChild>
                          <Link href={`/produtos/${product.id}/fornecedor/${supplier.id}`}>
                            Ver detalhes
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-xl font-medium mb-2">Nenhum produto encontrado</h3>
                    <p className="text-gray-500 mb-6">
                      Este fornecedor ainda não possui produtos cadastrados em nossa plataforma.
                    </p>
                    <Button asChild variant="outline">
                      <Link href="/fornecedores">Ver outros fornecedores</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
              
              {products && products.length > 0 && (
                <div className="mt-8 flex justify-center">
                  <Link href={`/busca?fornecedor=${supplier.id}`}>
                    <Button>
                      Ver todos os produtos
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="avaliacoes">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Star className="mr-2 h-5 w-5 text-primary fill-primary" />
                    Avaliações de Clientes
                  </CardTitle>
                  <CardDescription>
                    O que os clientes dizem sobre {supplier.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row gap-8 mb-8">
                    <div className="w-full md:w-1/3 flex flex-col items-center border-r border-gray-200 pr-8">
                      <div className="text-5xl font-bold text-primary mb-2">
                        {supplier.rating || "4.8"}
                      </div>
                      <div className="flex mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star} 
                            size={24} 
                            className={`${parseFloat(supplier.rating || "4.8") >= star 
                              ? "text-yellow-400 fill-yellow-400" 
                              : "text-gray-300"}`}
                          />
                        ))}
                      </div>
                      <p className="text-gray-600 text-center mb-4">
                        Baseado em 241 avaliações
                      </p>
                      <Button>Avaliar este fornecedor</Button>
                    </div>
                    
                    <div className="w-full md:w-2/3">
                      <div className="text-lg font-medium mb-4">Últimas avaliações</div>
                      <div className="space-y-6">
                        {['João Silva', 'Maria Santos', 'Carlos Oliveira'].map((name, index) => (
                          <div key={index} className="border-b border-gray-100 pb-6 last:border-none last:pb-0">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-primary font-bold">
                                  {name.charAt(0)}
                                </div>
                                <div>
                                  <div className="font-medium">{name}</div>
                                  <div className="text-sm text-gray-500">
                                    {new Date().toLocaleDateString('pt-BR', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </div>
                                </div>
                              </div>
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star 
                                    key={star} 
                                    size={16} 
                                    className={`${5 - index * 0.5 >= star 
                                      ? "text-yellow-400 fill-yellow-400" 
                                      : "text-gray-300"}`}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-gray-600">
                              {index === 0 
                                ? "Excelente fornecedor! Produtos de qualidade e entrega rápida. Recomendo a todos." 
                                : index === 1 
                                  ? "Bom atendimento e produtos conforme descritos. Apenas demorou um pouco mais do que o esperado na entrega."
                                  : "Produtos bons, mas o suporte poderia ser melhor. No geral, atendeu às expectativas."}
                            </p>
                          </div>
                        ))}
                      </div>
                      
                      <Button variant="outline" className="mt-6 w-full">
                        Ver todas as avaliações
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="contato">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Mail className="mr-2 h-5 w-5 text-primary" />
                    Informações de Contato
                  </CardTitle>
                  <CardDescription>
                    Entre em contato com {supplier.name} para tirar dúvidas ou solicitar orçamentos
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="shadow-none border border-gray-100">
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="bg-blue-50 p-3 rounded-full">
                          <Mail className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium mb-1">E-mail</h4>
                          <p className="text-sm text-gray-600">
                            {supplier.email || `contato@${supplier.name.toLowerCase().replace(/\s+/g, '')}.com.br`}
                          </p>
                          <Button variant="link" className="h-auto p-0 text-primary text-sm">
                            Enviar e-mail
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="shadow-none border border-gray-100">
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="bg-green-50 p-3 rounded-full">
                          <Phone className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-medium mb-1">Telefone</h4>
                          <p className="text-sm text-gray-600">
                            {supplier.phone || "(11) 99999-9999"}
                          </p>
                          <Button variant="link" className="h-auto p-0 text-primary text-sm">
                            Ligar agora
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="border-t border-gray-100 pt-6">
                    <h3 className="text-lg font-medium mb-4">Envie uma mensagem</h3>
                    <div className="bg-primary/5 rounded-md p-6 text-center">
                      <FileText className="h-12 w-12 text-primary/60 mx-auto mb-4" />
                      <h4 className="text-lg font-medium mb-2">Entre em contato pelo chat</h4>
                      <p className="text-gray-600 mb-4">
                        Para enviar mensagens para este fornecedor, utilize nosso sistema de chat integrado.
                      </p>
                      <Button onClick={() => {
                        toast({
                          title: "Chat iniciado!",
                          description: `Uma conversa com ${supplier.name} foi iniciada no chat.`,
                        });
                      }}>
                        Iniciar conversa
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}