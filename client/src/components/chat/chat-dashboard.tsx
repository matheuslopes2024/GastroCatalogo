import React, { useEffect } from "react";
import { useChat } from "@/hooks/use-chat";
import { useAuth } from "@/hooks/use-auth";
import { UserRole } from "@shared/schema";
import ChatWidget from "./chat-widget";
import ChatConversationsList from "./chat-conversations-list";
import { MessageHistory as MessageHistoryComponent, MessageInput as MessageInputComponent } from "./chat-message-components";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, X, MessageCircle, UserCircle, Building2 } from "lucide-react";

type ChatDashboardProps = {
  className?: string;
  sidebarClassName?: string;
  contentClassName?: string;
  conversationType?: 'all' | 'user' | 'supplier';
  emptyMessage?: string;
  showEmojis?: boolean;
  showAttachmentPreview?: boolean;
  allowLargeAttachments?: boolean;
};

export default function ChatDashboard({
  className,
  sidebarClassName,
  contentClassName,
  conversationType = 'all',
  emptyMessage = 'Escolha uma conversa da lista para começar a interagir.',
  showEmojis = true,
  showAttachmentPreview = true,
  allowLargeAttachments = true
}: ChatDashboardProps) {
  const { 
    activeConversation, 
    setActiveConversation, 
    setConversationType,
    isOpen,
    openChat 
  } = useChat();
  const { user } = useAuth();
  
  // Definir o tipo de conversa com base na prop recebida ou parâmetros da URL
  useEffect(() => {
    if (conversationType) {
      setConversationType(conversationType);
    } else if (user?.role === UserRole.ADMIN) {
      // Verificar se estamos na página de chat-admin
      const pathname = window.location.pathname;
      if (pathname.includes("/admin/chat")) {
        // Obter o tipo de conversa da URL ou parâmetro, caso exista
        const params = new URLSearchParams(window.location.search);
        const type = params.get("type") as "all" | "user" | "supplier" || "all";
        setConversationType(type);
      }
    }
  }, [user?.role, setConversationType, conversationType]);

  // Log para debug quando a conversa ativa muda
  useEffect(() => {
    if (activeConversation) {
      console.log("ChatDashboard: Conversa ativa definida:", activeConversation.id);
      // Forçar a abertura do chat quando uma conversa é selecionada
      if (!isOpen) {
        openChat();
      }
    }
  }, [activeConversation, isOpen, openChat]);
  
  if (!user) return null;
  
  // Debug-only: Mostra informações da conversa ativa
  const debugInfo = activeConversation ? {
    id: activeConversation.id,
    participantIds: activeConversation.participantIds,
    subject: activeConversation.subject
  } : null;

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-3 h-full overflow-hidden", className)}>
      <div className={cn("md:col-span-1 border-r h-full", sidebarClassName)}>
        <ChatConversationsList />
      </div>
      
      <div className={cn("md:col-span-2 h-full flex items-center justify-center", contentClassName)}>
        {activeConversation ? (
          <>
            {/* Debug only - remover depois */}
            {process.env.NODE_ENV === "development" && (
              <div className="absolute top-1 right-1 z-50 bg-black/70 text-white text-xs p-1 rounded">
                <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
              </div>
            )}
            
            {/* Versão especial para administradores */}
            {user?.role === UserRole.ADMIN ? (
              <div className="w-full h-full rounded-lg border-0 overflow-hidden shadow-xl flex flex-col bg-gradient-to-br from-white to-gray-50">
                <div className="bg-gradient-to-r from-primary to-primary/90 text-white p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-white/30">
                      <AvatarFallback className="bg-primary-foreground text-primary font-semibold">
                        {activeConversation._participants?.find(p => p.id !== user.id)?.name?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-bold text-lg flex items-center gap-2">
                        {activeConversation._participants?.find(p => p.id !== user.id)?.name || 'Usuário'} 
                        <Badge variant="outline" className="ml-2 bg-white/10 text-white border-white/20 text-xs">
                          {activeConversation._participants?.find(p => p.id !== user.id)?.role === 'SUPPLIER' ? 'Fornecedor' : 'Cliente'}
                        </Badge>
                      </h3>
                      <p className="text-xs text-white/70">
                        Conversa #{activeConversation.id} · Iniciada em {new Date(activeConversation.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-white hover:bg-white/10 h-8 w-8 rounded-full p-0"
                      onClick={() => {
                        // Função para fazer anotações sobre o cliente (implementação futura)
                        console.log("Anotações sobre o cliente:", activeConversation.id);
                      }}
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-white hover:bg-white/10 h-8 w-8 rounded-full p-0"
                      onClick={() => setActiveConversation(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex-1 relative overflow-hidden flex flex-col">
                  {/* Usando diretamente os componentes do chat-message-components */}
                  <div className="flex-1 overflow-y-auto p-2">
                    <MessageHistoryComponent
                      isAdmin={true}
                      showAttachmentPreview={showAttachmentPreview}
                      adminEnhanced={true}
                    />
                  </div>
                  
                  <div className="p-4 pt-2">
                    <MessageInputComponent
                      isAdmin={true}
                      showEmojis={true}
                      allowLargeAttachments={allowLargeAttachments}
                      adminEnhanced={true}
                    />
                  </div>
                </div>
              </div>
            ) : (
              // Versão padrão para usuários normais
              <ChatWidget 
                hideToggle 
                fullHeight 
                isAdmin={true}
                className="static inset-auto shadow-none w-full h-full rounded-none max-h-full"
                showAttachmentPreview={showAttachmentPreview}
                allowLargeAttachments={allowLargeAttachments}
                showEmojis={showEmojis}
              />
            )}
          </>
        ) : (
          <div className="text-center p-8">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Selecione uma conversa</h3>
              <p className="text-muted-foreground text-sm mb-6">
                {emptyMessage}
              </p>
              {user?.role === UserRole.ADMIN && (
                <div className="grid grid-cols-2 gap-4 text-center mt-6">
                  <div className="border rounded-lg p-4 bg-blue-50 hover:bg-blue-100 transition-colors">
                    <UserCircle className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                    <p className="text-sm font-medium">Conversas com Clientes</p>
                    <p className="text-xs text-gray-500 mt-1">Selecione na aba Usuários</p>
                  </div>
                  <div className="border rounded-lg p-4 bg-amber-50 hover:bg-amber-100 transition-colors">
                    <Building2 className="h-6 w-6 mx-auto mb-2 text-amber-500" />
                    <p className="text-sm font-medium">Conversas com Fornecedores</p>
                    <p className="text-xs text-gray-500 mt-1">Selecione na aba Fornecedores</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}