import { useChat } from "@/hooks/use-chat";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { 
  Search, 
  UserCircle, 
  Building2, 
  Plus,
  Check,
  Clock,
  MessageSquare,
  Filter,
  Users
} from "lucide-react";
import { UserRole } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ChatConversation } from "@shared/schema";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

// Definindo tipos
type ConversationType = "user" | "supplier" | "all";

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

// Componente de item da conversa
const ConversationItem = ({
  conversation,
  activeId,
  onSelect,
  userId
}: {
  conversation: ChatConversation;
  activeId: number | null;
  onSelect: (id: number) => void;
  userId: number;
}) => {
  // Simulação de dados - na implementação real estes dados viriam da API
  const otherParticipantId = conversation.participantIds.find(id => id !== userId) || 0;
  const lastMessageTime = conversation.lastActivityAt 
    ? format(new Date(conversation.lastActivityAt), "dd/MM/yy HH:mm", { locale: ptBR })
    : "-";
  
  // Simplificação - em um sistema real você buscaria dados dos usuários
  const isSupplier = conversation.subject?.includes("Fornecedor") || false;
  
  return (
    <div 
      className={cn(
        "flex items-center p-3 hover:bg-muted/40 cursor-pointer rounded-md transition-colors",
        activeId === conversation.id && "bg-muted"
      )}
      onClick={() => onSelect(conversation.id)}
    >
      <Avatar className="h-10 w-10 mr-3">
        {isSupplier ? (
          <AvatarFallback className="bg-amber-100 text-amber-700">
            F{otherParticipantId.toString().slice(-1)}
          </AvatarFallback>
        ) : (
          <AvatarFallback className="bg-blue-100 text-blue-700">
            U{otherParticipantId.toString().slice(-1)}
          </AvatarFallback>
        )}
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-1">
          <h4 className="font-medium text-sm truncate">
            {conversation.subject || `Conversa #${conversation.id}`}
          </h4>
          <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
            {lastMessageTime}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground truncate max-w-[180px]">
            {isSupplier ? "Fornecedor" : "Usuário"} #{otherParticipantId}
          </p>
          
          {/* Status de leitura ou contagem de não lidas */}
          <div className="flex items-center">
            {conversation.lastMessageId && (
              <Badge variant="outline" className="h-5 px-1 text-xs">
                <Check className="h-3 w-3 mr-1" />
                <span>Lido</span>
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente principal
export default function ChatConversationsList() {
  const { conversations, activeConversationId, setActiveConversation } = useChat();
  const { user } = useAuth();
  const [filter, setFilter] = useState<ConversationType>("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  if (!user) return null;
  
  // Filtrar conversas por tipo e termo de busca
  const filteredConversations = conversations.filter(conversation => {
    // Verificar por tipo (simplificado - idealmente você usaria dados reais)
    const isSupplierConversation = conversation.subject?.includes("Fornecedor") || false;
    
    if (filter === "supplier" && !isSupplierConversation) return false;
    if (filter === "user" && isSupplierConversation) return false;
    
    // Verificar por termo de busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const subjectMatch = conversation.subject?.toLowerCase().includes(term) || false;
      
      // Em uma implementação real, também buscaria por nome do usuário
      return subjectMatch;
    }
    
    return true;
  });
  
  const userConversations = conversations.filter(conversation => {
    // Simplificação - idealmente você usaria dados reais
    return !conversation.subject?.includes("Fornecedor");
  });
  
  const supplierConversations = conversations.filter(conversation => {
    // Simplificação - idealmente você usaria dados reais
    return conversation.subject?.includes("Fornecedor");
  });
  
  return (
    <div className="h-full flex flex-col border-r">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold mb-4">Conversas</h2>
        
        <div className="relative mb-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar conversas..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <Filter className="h-3.5 w-3.5 mr-2" />
                Filtrar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => setFilter("all")}>
                  <Users className="h-4 w-4 mr-2" />
                  <span>Todos</span>
                  {filter === "all" && <Check className="h-4 w-4 ml-auto" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter("user")}>
                  <UserCircle className="h-4 w-4 mr-2" />
                  <span>Usuários</span>
                  {filter === "user" && <Check className="h-4 w-4 ml-auto" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter("supplier")}>
                  <Building2 className="h-4 w-4 mr-2" />
                  <span>Fornecedores</span>
                  {filter === "supplier" && <Check className="h-4 w-4 ml-auto" />}
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button size="sm" className="h-8">
            <Plus className="h-3.5 w-3.5 mr-2" />
            Novo
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="all" className="flex-1 flex flex-col">
        <TabsList className="mx-4 my-2 grid w-auto grid-cols-3">
          <TabsTrigger value="all" className="text-xs">
            Todos
            <Badge variant="secondary" className="ml-1">
              {conversations.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="users" className="text-xs">
            Usuários
            <Badge variant="secondary" className="ml-1">
              {userConversations.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="suppliers" className="text-xs">
            Fornecedores
            <Badge variant="secondary" className="ml-1">
              {supplierConversations.length}
            </Badge>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="flex-1 pt-0 m-0">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <MessageSquare className="h-10 w-10 mb-2 opacity-20" />
              <p className="text-sm text-muted-foreground">
                Nenhuma conversa encontrada
              </p>
              {searchTerm && (
                <Button 
                  variant="link" 
                  className="mt-2 h-auto p-0" 
                  onClick={() => setSearchTerm("")}
                >
                  Limpar busca
                </Button>
              )}
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className="p-3 space-y-1">
                {filteredConversations.map(conversation => (
                  <ConversationItem
                    key={conversation.id}
                    conversation={conversation}
                    activeId={activeConversationId}
                    onSelect={setActiveConversation}
                    userId={user.id}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
        
        <TabsContent value="users" className="flex-1 pt-0 m-0">
          {userConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <UserCircle className="h-10 w-10 mb-2 opacity-20" />
              <p className="text-sm text-muted-foreground">
                Nenhuma conversa com usuários
              </p>
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className="p-3 space-y-1">
                {userConversations.map(conversation => (
                  <ConversationItem
                    key={conversation.id}
                    conversation={conversation}
                    activeId={activeConversationId}
                    onSelect={setActiveConversation}
                    userId={user.id}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
        
        <TabsContent value="suppliers" className="flex-1 pt-0 m-0">
          {supplierConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <Building2 className="h-10 w-10 mb-2 opacity-20" />
              <p className="text-sm text-muted-foreground">
                Nenhuma conversa com fornecedores
              </p>
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className="p-3 space-y-1">
                {supplierConversations.map(conversation => (
                  <ConversationItem
                    key={conversation.id}
                    conversation={conversation}
                    activeId={activeConversationId}
                    onSelect={setActiveConversation}
                    userId={user.id}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}