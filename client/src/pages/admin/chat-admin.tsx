import { useState } from "react";
import { UserRole } from "@shared/schema";
import ChatDashboard from "@/components/chat/chat-dashboard";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  Filter, 
  MessageCircle,
  Settings,
  Building2,
  UserCircle,
  Calendar,
  RefreshCw,
  Download,
  AlertCircle
} from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ChatAdminPage() {
  const { user } = useAuth();
  const [chatType, setChatType] = useState<"all" | "user" | "supplier">("all");
  const [dateRange, setDateRange] = useState<"all" | "today" | "week" | "month">("all");
  const [isLoading, setIsLoading] = useState(false);
  
  // Verificar se o usuário é administrador
  if (!user || user.role !== UserRole.ADMIN) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <AlertCircle className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Acesso Restrito</h1>
          <p className="text-muted-foreground mb-6 text-center">
            Esta página é destinada apenas a administradores do sistema.
          </p>
          <Link href="/">
            <Button variant="default">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Voltar para a Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard de Chat</h1>
          <p className="text-muted-foreground">
            Gerencie conversas com usuários e fornecedores
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select defaultValue="all" onValueChange={(value) => setDateRange(value as any)}>
            <SelectTrigger className="w-[160px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">Todos os períodos</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Esta semana</SelectItem>
                <SelectItem value="month">Este mês</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="icon" onClick={() => setIsLoading(true)}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Opções
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Download className="h-4 w-4 mr-2" />
                Exportar conversas
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="h-4 w-4 mr-2" />
                Configurações de chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-medium">Total de Conversas</h3>
              <MessageCircle className="h-5 w-5 text-primary" />
            </div>
            {isLoading ? (
              <Skeleton className="h-10 w-20 mt-2" />
            ) : (
              <div className="text-3xl font-bold">42</div>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              +12% em relação ao período anterior
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-medium">Conversas com Usuários</h3>
              <UserCircle className="h-5 w-5 text-blue-500" />
            </div>
            {isLoading ? (
              <Skeleton className="h-10 w-20 mt-2" />
            ) : (
              <div className="text-3xl font-bold">28</div>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              +8% em relação ao período anterior
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-medium">Conversas com Fornecedores</h3>
              <Building2 className="h-5 w-5 text-amber-500" />
            </div>
            {isLoading ? (
              <Skeleton className="h-10 w-20 mt-2" />
            ) : (
              <div className="text-3xl font-bold">14</div>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              +20% em relação ao período anterior
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
        <Tabs defaultValue="all" className="h-[calc(100vh-18rem)]" onValueChange={(v) => {
          setIsLoading(true);
          setChatType(v as any);
          // Simular carregamento
          setTimeout(() => setIsLoading(false), 500);
        }}>
          <div className="flex items-center justify-between border-b px-4 py-2">
            <TabsList>
              <TabsTrigger value="all" className="data-[state=active]:bg-primary/10">
                Todas
                <Badge variant="secondary" className="ml-2">
                  {isLoading ? "..." : "42"}
                  {chatType !== "all" && (
                    <span className="ml-1 text-xs text-red-500 font-bold">•</span>
                  )}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="user" className="data-[state=active]:bg-primary/10">
                Usuários
                <Badge variant="secondary" className="ml-2">
                  {isLoading ? "..." : "28"}
                  {chatType !== "user" && (
                    <span className="ml-1 text-xs text-red-500 font-bold">•</span>
                  )}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="supplier" className="data-[state=active]:bg-primary/10">
                Fornecedores
                <Badge variant="secondary" className="ml-2">
                  {isLoading ? "..." : "14"}
                  {chatType !== "supplier" && (
                    <span className="ml-1 text-xs text-red-500 font-bold">•</span>
                  )}
                </Badge>
              </TabsTrigger>
            </TabsList>
            
            <Button variant="ghost" size="sm" className="gap-1" onClick={() => setIsLoading(true)}>
              <RefreshCw className="h-4 w-4" />
              <span className="sr-only md:not-sr-only md:inline-block">Atualizar</span>
            </Button>
          </div>
          
          <TabsContent value="all" className="h-full p-0 m-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Carregando conversas...</p>
                </div>
              </div>
            ) : (
              <ChatDashboard 
                contentClassName="bg-white"
                sidebarClassName="bg-white/50"
              />
            )}
          </TabsContent>
          
          <TabsContent value="user" className="h-full p-0 m-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Carregando conversas com usuários...</p>
                </div>
              </div>
            ) : (
              <ChatDashboard 
                contentClassName="bg-white"
                sidebarClassName="bg-white/50"
              />
            )}
          </TabsContent>
          
          <TabsContent value="supplier" className="h-full p-0 m-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Carregando conversas com fornecedores...</p>
                </div>
              </div>
            ) : (
              <ChatDashboard 
                contentClassName="bg-white"
                sidebarClassName="bg-white/50"
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}