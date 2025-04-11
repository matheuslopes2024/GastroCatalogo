import { useRef, useEffect } from 'react';
import { useAdminChat } from '@/hooks/use-admin-chat';
import { cn } from '@/lib/utils';
import { AdminChatMessage, AdminChatMessageDateDisplay, AdminChatMessageInput } from './admin-chat-message-components';
import AdminChatConversationsList from './admin-chat-conversations-list';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { 
  MessageSquare, 
  UserRound, 
  Phone, 
  Video, 
  Info, 
  Search, 
  MoreVertical, 
  ArrowLeft,
  Building2,
  Crown
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { UserRole } from '@shared/schema';

// Componente principal do dashboard de chat
export function AdminChatDashboard() {
  const { 
    activeConversation, 
    messages, 
    sendMessage, 
    isLoadingMessages, 
    usersOnline 
  } = useAdminChat();
  
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  
  // Rolar para o final quando as mensagens mudarem
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Verificar se o usuário ativo está online
  const isParticipantOnline = activeConversation
    ? usersOnline.has(activeConversation.participantId)
    : false;
  
  // Função para agrupar mensagens por data
  const getMessageGroups = () => {
    const groups = [];
    let currentDate = '';
    let currentGroup = [];
    
    for (const message of messages) {
      const messageDate = format(new Date(message.createdAt), 'yyyy-MM-dd');
      
      if (messageDate !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({ date: currentDate, messages: currentGroup });
        }
        currentDate = messageDate;
        currentGroup = [message];
      } else {
        currentGroup.push(message);
      }
    }
    
    if (currentGroup.length > 0) {
      groups.push({ date: currentDate, messages: currentGroup });
    }
    
    return groups;
  };
  
  // Função para determinar se deve mostrar o avatar em mensagens consecutivas
  const shouldShowAvatar = (index: number, senderId: number, messages: any[]) => {
    if (index === messages.length - 1) return true;
    
    const nextMessage = messages[index + 1];
    return nextMessage.senderId !== senderId;
  };

  // Renderizar a parte vazia (quando nenhuma conversa está selecionada)
  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <div className="bg-primary/5 p-6 rounded-full mb-4">
        <MessageSquare className="h-12 w-12 text-primary" />
      </div>
      <h2 className="text-xl font-bold mb-2">Atendimento ao cliente</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        Selecione uma conversa na lista à esquerda para visualizar e responder às mensagens de clientes e fornecedores.
      </p>
      <Button variant="outline">Iniciar nova conversa</Button>
    </div>
  );
  
  // Renderizar o cabeçalho da conversa
  const renderConversationHeader = () => {
    if (!activeConversation) return null;
    
    const isSupplier = activeConversation.participantRole === UserRole.SUPPLIER;
    
    return (
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="md:hidden">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-9 w-9">
                <AvatarFallback className={cn(
                  isSupplier ? 'bg-orange-100 text-orange-800' : 'bg-primary/10 text-primary'
                )}>
                  {activeConversation.participantName?.substring(0, 2).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              {isParticipantOnline && (
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-[1.5px] border-white" />
              )}
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium">
                  {activeConversation.participantName || 'Usuário'}
                </h3>
                
                <div className={cn(
                  "flex items-center py-0.5 px-1.5 rounded-full text-[10px]",
                  isSupplier ? "bg-orange-100 text-orange-800" : "bg-primary/10 text-primary"
                )}>
                  {isSupplier ? (
                    <>
                      <Building2 className="h-3 w-3 mr-1" />
                      <span>Fornecedor</span>
                    </>
                  ) : (
                    <>
                      <UserRound className="h-3 w-3 mr-1" />
                      <span>Cliente</span>
                    </>
                  )}
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground">
                {isParticipantOnline ? 'Online agora' : 'Offline'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon">
            <Phone className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Video className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Info className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Search className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };
  
  // Renderizar o conteúdo da conversa
  const renderConversationContent = () => {
    if (!activeConversation) return null;
    
    if (isLoadingMessages) {
      return (
        <div className="flex items-center justify-center h-full p-4">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      );
    }
    
    const messageGroups = getMessageGroups();
    
    return (
      <ScrollArea className="flex-1 p-4" ref={messagesContainerRef}>
        <div className="space-y-1 min-h-full flex flex-col justify-end">
          {messageGroups.map((group, groupIndex) => (
            <div key={groupIndex}>
              <AdminChatMessageDateDisplay date={new Date(group.date)} />
              
              {group.messages.map((message, messageIndex) => {
                // Determinar se a mensagem foi enviada por um administrador
                const isAdminSender = message.senderId === 1; // Assumindo que o ID 1 é o admin
                const showAvatar = shouldShowAvatar(messageIndex, message.senderId, group.messages);
                
                // Determinar o nome do remetente
                let senderName = message.senderId === activeConversation.participantId
                  ? activeConversation.participantName || 'Usuário'
                  : 'Administrador';
                
                return (
                  <AdminChatMessage
                    key={message.id}
                    message={message}
                    showAvatar={showAvatar}
                    senderName={senderName}
                    isAdmin={isAdminSender}
                  />
                );
              })}
            </div>
          ))}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
    );
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 h-full gap-4">
      {/* Lista de conversas (escondida em mobile quando uma conversa está ativa) */}
      <div className={cn(
        "md:col-span-1 lg:col-span-1 xl:col-span-1 h-full",
        activeConversation ? "hidden md:block" : "block"
      )}>
        <AdminChatConversationsList />
      </div>
      
      {/* Área de chat */}
      <div className={cn(
        "md:col-span-2 lg:col-span-3 xl:col-span-3 flex flex-col border rounded-md overflow-hidden h-full",
        !activeConversation ? "hidden md:flex" : "flex"
      )}>
        {activeConversation ? (
          <>
            {renderConversationHeader()}
            {renderConversationContent()}
            <AdminChatMessageInput onSend={sendMessage} />
          </>
        ) : (
          renderEmptyState()
        )}
      </div>
      
      {/* Informações detalhadas (apenas visível em telas grandes) */}
      <div className="hidden xl:block xl:col-span-1 border rounded-md overflow-hidden h-full">
        {activeConversation ? (
          <div className="flex flex-col h-full">
            <div className="p-4 border-b text-center">
              <Avatar className="h-20 w-20 mx-auto mb-3">
                <AvatarFallback className={cn(
                  activeConversation.participantRole === UserRole.SUPPLIER 
                    ? 'bg-orange-100 text-orange-800' 
                    : 'bg-primary/10 text-primary',
                  "text-xl"
                )}>
                  {activeConversation.participantName?.substring(0, 2).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              
              <h3 className="font-bold text-lg mb-1">
                {activeConversation.participantName || 'Usuário'}
              </h3>
              
              <div className="flex items-center justify-center gap-1 mb-2">
                {activeConversation.participantRole === UserRole.ADMIN && (
                  <div className="flex items-center text-xs py-1 px-2 rounded-full bg-purple-100 text-purple-800">
                    <Crown className="h-3 w-3 mr-1" />
                    <span>Administrador</span>
                  </div>
                )}
                
                {activeConversation.participantRole === UserRole.SUPPLIER && (
                  <div className="flex items-center text-xs py-1 px-2 rounded-full bg-orange-100 text-orange-800">
                    <Building2 className="h-3 w-3 mr-1" />
                    <span>Fornecedor</span>
                  </div>
                )}
                
                {activeConversation.participantRole === UserRole.CLIENT && (
                  <div className="flex items-center text-xs py-1 px-2 rounded-full bg-primary/10 text-primary">
                    <UserRound className="h-3 w-3 mr-1" />
                    <span>Cliente</span>
                  </div>
                )}
              </div>
              
              <p className="text-sm text-muted-foreground">
                {isParticipantOnline ? 'Online agora' : 'Offline'}
              </p>
            </div>
            
            <div className="p-4 flex-1 overflow-auto">
              <h4 className="font-medium mb-2">Informações</h4>
              
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Email</p>
                  <p className="text-sm">usuario@exemplo.com</p>
                </div>
                
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Telefone</p>
                  <p className="text-sm">(11) 98765-4321</p>
                </div>
                
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Localização</p>
                  <p className="text-sm">São Paulo, SP</p>
                </div>
                
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Membro desde</p>
                  <p className="text-sm">Jan 2023</p>
                </div>
                
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Última atividade</p>
                  <p className="text-sm">Hoje às 14:35</p>
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className="font-medium mb-2">Notas</h4>
                <textarea 
                  className="w-full h-24 text-sm rounded-md border resize-none p-2" 
                  placeholder="Adicionar notas sobre este contato..."
                />
              </div>
            </div>
            
            <div className="p-4 border-t">
              <Button variant="default" className="w-full">
                Ver perfil completo
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <Info className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Informações do contato</h3>
            <p className="text-muted-foreground">
              Selecione uma conversa para ver mais informações sobre o contato.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminChatDashboard;