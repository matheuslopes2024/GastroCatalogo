import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAdminChat } from '@/hooks/use-admin-chat';
import { useQuery } from '@tanstack/react-query';
import { ChatConversation, UserRole } from '@shared/schema';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Search, Users, Building2, UserRound } from 'lucide-react';

// Componente para exibir um item de conversa
function AdminConversationItem({ 
  conversation, 
  isActive, 
  onClick 
}: { 
  conversation: ChatConversation; 
  isActive: boolean; 
  onClick: () => void; 
}) {
  const { usersOnline, deleteConversation } = useAdminChat();
  const isOnline = conversation.participantId ? usersOnline.has(conversation.participantId) : false;
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Formatação da data da última mensagem
  const formattedLastMessageTime = (() => {
    if (!conversation.lastMessageDate) return '';
    
    const date = new Date(conversation.lastMessageDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 60) {
      return diffMins <= 1 ? 'Agora mesmo' : `${diffMins} min atrás`;
    } else if (diffHours < 24) {
      return `${diffHours}h atrás`;
    } else if (diffDays < 7) {
      return `${diffDays}d atrás`;
    } else {
      return format(date, 'dd/MM', { locale: ptBR });
    }
  })();
  
  // Determinar o texto de status do papel do usuário
  const roleLabel = conversation.participantRole === UserRole.CLIENT 
    ? 'Cliente' 
    : conversation.participantRole === UserRole.SUPPLIER 
      ? 'Fornecedor' 
      : 'Usuário';
  
  // Renderizar o ícone com base no papel
  const roleIcon = conversation.participantRole === UserRole.CLIENT 
    ? <UserRound className="h-3 w-3" />
    : conversation.participantRole === UserRole.SUPPLIER 
      ? <Building2 className="h-3 w-3" />
      : <Users className="h-3 w-3" />;

  // Handler para excluir uma conversa
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Impedir que o clique propague para o botão de selecionar conversa
    
    // Confirmar exclusão
    if (!window.confirm(`Tem certeza que deseja excluir a conversa com ${conversation.participantName || 'este usuário'}? Esta ação não pode ser desfeita.`)) {
      return;
    }
    
    setIsDeleting(true);
    try {
      await deleteConversation(conversation.id);
    } catch (error) {
      console.error("Erro ao excluir conversa:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={cn(
      'w-full flex items-start p-3 gap-3 transition-colors hover:bg-muted/50 relative group',
      isActive && 'bg-primary/5',
      conversation.unreadCount && conversation.unreadCount > 0 && 'bg-primary/5 hover:bg-primary/10'
    )}>
      <button
        className="flex items-start gap-3 flex-1 text-left"
        onClick={onClick}
        disabled={isDeleting}
      >
        <div className="relative">
          <Avatar className="h-10 w-10">
            <AvatarFallback className={cn(
              conversation.participantRole === UserRole.SUPPLIER 
                ? 'bg-orange-100 text-orange-800' 
                : 'bg-primary/10 text-primary'
            )}>
              {conversation.participantName?.substring(0, 2).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          {isOnline && (
            <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
          )}
        </div>
        
        <div className="flex-1 flex flex-col items-start overflow-hidden">
          <div className="flex justify-between w-full mb-1">
            <span className="font-medium truncate">
              {conversation.participantName || 'Usuário'}
            </span>
            <span className="text-xs text-muted-foreground whitespace-nowrap pl-2">
              {formattedLastMessageTime}
            </span>
          </div>
          
          <div className="flex items-center gap-1 mb-1">
            <div className={cn(
              "flex items-center py-0.5 px-1.5 rounded-full text-[10px] font-medium",
              conversation.participantRole === UserRole.SUPPLIER 
                ? "bg-orange-100 text-orange-800" 
                : "bg-primary/10 text-primary"
            )}>
              {roleIcon}
              <span className="ml-1">{roleLabel}</span>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground truncate w-full text-left">
            {conversation.lastMessageText || 'Nenhuma mensagem'}
          </p>
        </div>
        
        {conversation.unreadCount && conversation.unreadCount > 0 && (
          <Badge variant="default" className="ml-auto mt-1">
            {conversation.unreadCount}
          </Badge>
        )}
      </button>
      
      {/* Botão de excluir conversa - visível apenas no hover */}
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "px-2 h-8 shrink-0 text-destructive opacity-0 group-hover:opacity-100 transition-opacity",
          isDeleting && "opacity-100"
        )}
        onClick={handleDelete}
        disabled={isDeleting}
      >
        {isDeleting ? (
          <div className="h-4 w-4 border-2 border-destructive border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M3 6h18"></path>
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
        )}
        <span className="sr-only">Excluir conversa</span>
      </Button>
    </div>
  );
}

// Componente principal de lista de conversas
export function AdminChatConversationsList() {
  const { 
    conversations, 
    activeConversation, 
    setActiveConversation, 
    isLoadingConversations, 
    filterMode, 
    setFilterMode 
  } = useAdminChat();
  const [searchTerm, setSearchTerm] = useState('');
  const [displayedConversations, setDisplayedConversations] = useState<ChatConversation[]>([]);

  // Consulta para obter todos os usuários para iniciar novas conversas
  const { data: users } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/admin/users');
        if (!response.ok) {
          throw new Error('Falha ao buscar usuários');
        }
        return await response.json();
      } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        return [];
      }
    },
    staleTime: 60000 // Dados válidos por 1 minuto
  });
  
  // Atualizar a lista filtrada quando as conversas mudarem ou o termo de pesquisa mudar
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setDisplayedConversations(conversations);
      return;
    }
    
    const normalized = searchTerm.toLowerCase();
    const filtered = conversations.filter(conversation => 
      conversation.participantName?.toLowerCase().includes(normalized)
    );
    
    setDisplayedConversations(filtered);
  }, [conversations, searchTerm]);
  
  // Lidar com a pesquisa
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  // Renderizar item de carregamento
  const renderLoadingItems = () => {
    return Array.from({ length: 5 }).map((_, index) => (
      <div key={index} className="flex items-start p-3 gap-3">
        <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
        <div className="flex-1">
          <div className="w-24 h-4 bg-muted animate-pulse mb-2 rounded" />
          <div className="w-full h-3 bg-muted animate-pulse rounded" />
        </div>
      </div>
    ));
  };
  
  // Renderizar o estado vazio
  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center p-6 text-center">
      <Users className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="font-medium text-lg mb-1">Nenhuma conversa</h3>
      <p className="text-muted-foreground text-sm mb-4">
        {searchTerm 
          ? `Nenhuma conversa encontrada para "${searchTerm}"`
          : 'Você ainda não possui conversas. Inicie uma nova conversa com um usuário ou fornecedor.'}
      </p>
      <Button>Iniciar conversa</Button>
    </div>
  );

  return (
    <div className="flex flex-col h-full border overflow-hidden rounded-md">
      {/* Cabeçalho */}
      <div className="p-3 border-b">
        <h2 className="font-semibold mb-3">Conversas</h2>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar conversas..."
            className="pl-9"
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
      </div>
      
      {/* Abas de filtro */}
      <Tabs 
        defaultValue="all" 
        value={filterMode}
        onValueChange={(value) => setFilterMode(value as any)}
        className="w-full"
      >
        <div className="px-3 pt-2">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="clients">Clientes</TabsTrigger>
            <TabsTrigger value="suppliers">Fornecedores</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="all" className="mt-0 flex-1 flex overflow-hidden">
          <ConversationsList
            conversations={displayedConversations}
            isLoading={isLoadingConversations}
            activeConversationId={activeConversation?.id}
            onSelectConversation={setActiveConversation}
            renderEmptyState={renderEmptyState}
            renderLoadingItems={renderLoadingItems}
          />
        </TabsContent>
        
        <TabsContent value="clients" className="mt-0 flex-1 flex overflow-hidden">
          <ConversationsList
            conversations={displayedConversations.filter(c => c.participantRole === UserRole.CLIENT)}
            isLoading={isLoadingConversations}
            activeConversationId={activeConversation?.id}
            onSelectConversation={setActiveConversation}
            renderEmptyState={renderEmptyState}
            renderLoadingItems={renderLoadingItems}
          />
        </TabsContent>
        
        <TabsContent value="suppliers" className="mt-0 flex-1 flex overflow-hidden">
          <ConversationsList
            conversations={displayedConversations.filter(c => c.participantRole === UserRole.SUPPLIER)}
            isLoading={isLoadingConversations}
            activeConversationId={activeConversation?.id}
            onSelectConversation={setActiveConversation}
            renderEmptyState={renderEmptyState}
            renderLoadingItems={renderLoadingItems}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Componente auxiliar para a lista de conversas
function ConversationsList({
  conversations,
  isLoading,
  activeConversationId,
  onSelectConversation,
  renderEmptyState,
  renderLoadingItems
}: {
  conversations: ChatConversation[];
  isLoading: boolean;
  activeConversationId?: number;
  onSelectConversation: (conversation: ChatConversation) => void;
  renderEmptyState: () => React.ReactNode;
  renderLoadingItems: () => React.ReactNode;
}) {
  if (isLoading) {
    return (
      <ScrollArea className="flex-1">
        {renderLoadingItems()}
      </ScrollArea>
    );
  }
  
  if (conversations.length === 0) {
    return renderEmptyState();
  }
  
  return (
    <ScrollArea className="flex-1">
      <div className="divide-y">
        {conversations.map((conversation) => (
          <AdminConversationItem
            key={conversation.id}
            conversation={conversation}
            isActive={conversation.id === activeConversationId}
            onClick={() => onSelectConversation(conversation)}
          />
        ))}
      </div>
    </ScrollArea>
  );
}

export default AdminChatConversationsList;