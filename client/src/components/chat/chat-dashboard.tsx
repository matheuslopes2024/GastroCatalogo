import { useChat } from "@/hooks/use-chat";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import ChatWidget from "./chat-widget";
import ChatConversationsList from "./chat-conversations-list";
import { cn } from "@/lib/utils";
import { UserRole } from "@shared/schema";

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
  const { activeConversation, setConversationType } = useChat();
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
    }
  }, [activeConversation]);
  
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
            <ChatWidget 
              hideToggle 
              fullHeight 
              isAdmin={user?.role === UserRole.ADMIN}
              className="static inset-auto shadow-none w-full h-full rounded-none max-h-full"
              showAttachmentPreview={showAttachmentPreview}
              allowLargeAttachments={allowLargeAttachments}
              showEmojis={showEmojis}
            />
          </>
        ) : (
          <div className="text-center p-8">
            <h3 className="text-lg font-medium mb-2">Selecione uma conversa</h3>
            <p className="text-muted-foreground text-sm">
              {emptyMessage}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}