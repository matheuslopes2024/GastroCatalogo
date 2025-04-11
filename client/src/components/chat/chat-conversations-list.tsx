import { useChat } from "@/hooks/use-chat";
import { useAuth } from "@/hooks/use-auth";
import { useState, useMemo, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  UserCircle, 
  Building2, 
  Plus,
  Check,
  Clock,
  MessageSquare,
  Filter,
  Users,
  Paperclip,
  PencilLine,
  AlertCircle,
  Loader2
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
  DropdownMenuTrigger,
  DropdownMenuSeparator
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

// Interface para a conversa com campos adicionais opcionais
interface ExtendedChatConversation extends ChatConversation {
  _participants?: Array<{
    id: number;
    name?: string;
    username?: string;
    email?: string;
    role?: string;
    companyName?: string | null;
    unreadCount?: number;
  }>;
  _lastMessage?: {
    message: string;
    attachmentData?: string | null;
  };
}

// Componente de item da conversa
const ConversationItem = ({
  conversation,
  activeId,
  onSelect,
  userId
}: {
  conversation: ExtendedChatConversation;
  activeId: number | null | undefined;
  onSelect: (conversation: ExtendedChatConversation) => void;
  userId: number;
}) => {
  // Obter informações do outro participante
  const otherParticipant = conversation._participants?.find(p => p.id !== userId);
  const otherParticipantId = otherParticipant?.id || 
    conversation.participantIds.find(id => id !== userId) || 0;
  
  // Formatação de data/hora
  const lastMessageTime = conversation.lastActivityAt 
    ? format(new Date(conversation.lastActivityAt), "dd/MM/yy HH:mm", { locale: ptBR })
    : "-";
  
  // Determinar se é um fornecedor usando dados reais ou fallback para subject
  const isSupplier = otherParticipant?.role === "supplier" || 
    conversation.subject?.includes("Fornecedor") || false;
  
  // Verificar mensagens não lidas
  const unreadCount = otherParticipant?.unreadCount || 0;
  const hasUnreadMessages = unreadCount > 0;
  
  // Determinar a última mensagem (real ou simulada para a interface)
  const lastMessage = conversation._lastMessage || {
    message: conversation.subject || "Nova conversa",
    attachmentData: conversation.lastMessageId ? null : undefined
  };
  
  // Função de manipulação de clique com tratamento de erro
  const handleClick = useCallback(() => {
    try {
      console.log("Selecionando conversa:", conversation.id);
      onSelect(conversation);
    } catch (error) {
      console.error("Erro ao selecionar conversa:", error);
    }
  }, [conversation, onSelect]);
  
  return (
    <div 
      className={cn(
        "flex items-center p-3 hover:bg-primary/5 cursor-pointer rounded-md transition-colors mb-2 border border-transparent",
        activeId === conversation.id && "bg-primary/10 border-primary",
        hasUnreadMessages && "font-semibold bg-blue-50/50"
      )}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-selected={activeId === conversation.id}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      }}
    >
      <Avatar className="h-10 w-10 mr-3 ring-1 ring-muted/30">
        {isSupplier ? (
          <AvatarFallback className="bg-amber-100 text-amber-700">
            {`F${otherParticipantId.toString().slice(-1)}`}
          </AvatarFallback>
        ) : (
          <AvatarFallback className="bg-blue-100 text-blue-700">
            {`U${otherParticipantId.toString().slice(-1)}`}
          </AvatarFallback>
        )}
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-1">
          <h4 className={cn(
            "font-medium text-sm truncate", 
            activeId === conversation.id && "text-primary font-semibold"
          )}>
            {conversation.subject || `Conversa #${conversation.id}`}
            <span className="inline-flex ml-1.5 items-center text-xs font-normal">
              {isSupplier ? (
                <Badge variant="outline" className="bg-amber-50 h-5 px-1 border-amber-200">
                  <Building2 className="h-3 w-3 mr-1 text-amber-500" />
                  <span className="text-amber-700">Fornecedor</span>
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-blue-50 h-5 px-1 border-blue-200">
                  <UserCircle className="h-3 w-3 mr-1 text-blue-500" />
                  <span className="text-blue-700">Usuário</span>
                </Badge>
              )}
            </span>
          </h4>
          <span className="text-xs text-muted-foreground whitespace-nowrap ml-2 flex-shrink-0">
            {lastMessageTime}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground truncate max-w-[180px]">
            {lastMessage ? (
              lastMessage.attachmentData ? (
                <span className="flex items-center">
                  <Paperclip className="h-3 w-3 mr-1 inline" />
                  Arquivo anexado
                </span>
              ) : (
                lastMessage.message
              )
            ) : (
              "Iniciar conversa"
            )}
          </p>
          
          {/* Status de leitura ou contagem de não lidas */}
          <div className="flex items-center ml-1">
            {hasUnreadMessages ? (
              <Badge className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-primary">
                1
              </Badge>
            ) : conversation.lastMessageId && (
              <Badge variant="outline" className="h-5 px-1 text-xs bg-muted/30">
                <Check className="h-3 w-3 mr-1 text-green-500" />
                <span className="text-muted-foreground">Lido</span>
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
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const { toast } = useToast();
  
  if (!user) return null;
  
  // Função para criar conversa (extraída para reduzir código duplicado)
  const createConversation = useCallback((participantIds: number[], subject: string, initialMessage: string) => {
    if (isCreatingConversation) return;
    
    setIsCreatingConversation(true);
    
    fetch('/api/chat/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantIds, subject }),
    })
    .then(response => response.json())
    .then(conversation => {
      // Enviar mensagem inicial
      return fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: initialMessage,
          senderId: user.id,
          receiverId: participantIds.find(id => id !== user.id),
          conversationId: conversation.id,
        }),
      }).then(() => conversation);
    })
    .then(conversation => {
      setActiveConversation(conversation);
      toast({
        title: "Conversa criada",
        description: "Nova conversa iniciada com sucesso"
      });
    })
    .catch(error => {
      console.error("Erro ao criar conversa:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a conversa",
        variant: "destructive"
      });
    })
    .finally(() => {
      setIsCreatingConversation(false);
    });
  }, [user, setActiveConversation, toast, isCreatingConversation]);
  
  // Filtrar conversas por tipo e termo de busca
  const filteredConversations = useMemo(() => {
    return conversations.filter(conversation => {
      // Verificar por tipo (usando _participants quando disponível ou fallback para subject)
      let isSupplierConversation = false;
      
      if (conversation._participants?.some(p => p.role === "supplier")) {
        isSupplierConversation = true;
      } else if (conversation.subject?.includes("Fornecedor")) {
        isSupplierConversation = true;
      }
      
      if (filter === "supplier" && !isSupplierConversation) return false;
      if (filter === "user" && isSupplierConversation) return false;
      
      // Verificar por termo de busca
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const subjectMatch = conversation.subject?.toLowerCase().includes(term) || false;
        
        // Busca pelo nome de participantes também
        const participantMatch = conversation._participants?.some(p => 
          p.username?.toLowerCase().includes(term) || 
          p.name?.toLowerCase().includes(term) || 
          p.email?.toLowerCase().includes(term)
        ) || false;
        
        return subjectMatch || participantMatch;
      }
      
      return true;
    });
  }, [conversations, filter, searchTerm]);
  
  const userConversations = useMemo(() => {
    return conversations.filter(conversation => {
      // Verificar por usuários usando _participants ou fallback para subject
      if (conversation._participants?.every(p => p.role !== "supplier")) {
        return true;
      }
      return !conversation.subject?.includes("Fornecedor");
    });
  }, [conversations]);
  
  const supplierConversations = useMemo(() => {
    return conversations.filter(conversation => {
      // Verificar por fornecedores usando _participants ou fallback para subject
      if (conversation._participants?.some(p => p.role === "supplier")) {
        return true;
      }
      return conversation.subject?.includes("Fornecedor");
    });
  }, [conversations]);
  
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
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="h-8">
                <Plus className="h-3.5 w-3.5 mr-2" />
                Novo
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuItem 
                  onClick={() => {
                    // Cria uma nova conversa com um usuário
                    const targetUserId = 7; // ID padrão para um usuário comum
                    const initialMessage = "Olá, estou iniciando uma nova conversa!";
                    createConversation([user.id, targetUserId], "Nova conversa com usuário", initialMessage);
                  }}
                  disabled={isCreatingConversation}
                >
                  {isCreatingConversation ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <UserCircle className="h-4 w-4 mr-2 text-blue-500" />
                  )}
                  <span>Com Usuário</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    // Cria uma nova conversa com um fornecedor
                    const targetSupplierId = 3; // ID padrão para um fornecedor
                    const initialMessage = "Olá, preciso de informações sobre seus produtos.";
                    createConversation([user.id, targetSupplierId], "Nova conversa com Fornecedor", initialMessage);
                  }}
                  disabled={isCreatingConversation}
                >
                  {isCreatingConversation ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Building2 className="h-4 w-4 mr-2 text-amber-500" />
                  )}
                  <span>Com Fornecedor</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => {
                    // Cria uma nova conversa em grupo (usuário + fornecedor + admin)
                    const participants = [user.id, 3, 7, 1]; // Inclui o usuário atual, um fornecedor, um usuário comum e o admin
                    const initialMessage = "Olá a todos! Estou criando esta conversa em grupo para discutirmos o próximo pedido.";
                    createConversation(participants, "Conversa em grupo", initialMessage);
                  }}
                  disabled={isCreatingConversation}
                >
                  <Users className="h-4 w-4 mr-2 text-primary" />
                  <span>Conversa em Grupo</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
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
                {filteredConversations.map((conversation: ExtendedChatConversation) => (
                  <ConversationItem
                    key={conversation.id}
                    conversation={conversation}
                    activeId={activeConversationId}
                    onSelect={(conv) => {
                      console.log("Selecionando conversa:", conv.id);
                      setActiveConversation(conv as any);
                    }}
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
                {userConversations.map((conversation: ExtendedChatConversation) => (
                  <ConversationItem
                    key={conversation.id}
                    conversation={conversation}
                    activeId={activeConversationId}
                    onSelect={(conv) => {
                      console.log("Selecionando conversa:", conv.id);
                      setActiveConversation(conv as any);
                    }}
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
                {supplierConversations.map((conversation: ExtendedChatConversation) => (
                  <ConversationItem
                    key={conversation.id}
                    conversation={conversation}
                    activeId={activeConversationId}
                    onSelect={(conv) => {
                      console.log("Selecionando conversa fornecedor:", conv.id);
                      setActiveConversation(conv as any);
                    }}
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