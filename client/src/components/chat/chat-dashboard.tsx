import { useChat } from "@/hooks/use-chat";
import { useAuth } from "@/hooks/use-auth";
import ChatWidget from "./chat-widget";
import ChatConversationsList from "./chat-conversations-list";
import { cn } from "@/lib/utils";

type ChatDashboardProps = {
  className?: string;
  sidebarClassName?: string;
  contentClassName?: string;
};

export default function ChatDashboard({
  className,
  sidebarClassName,
  contentClassName
}: ChatDashboardProps) {
  const { activeConversationId } = useChat();
  const { user } = useAuth();
  
  if (!user) return null;
  
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-3 h-full overflow-hidden", className)}>
      <div className={cn("md:col-span-1 border-r h-full", sidebarClassName)}>
        <ChatConversationsList />
      </div>
      
      <div className={cn("md:col-span-2 h-full flex items-center justify-center", contentClassName)}>
        {activeConversationId ? (
          <ChatWidget 
            hideToggle 
            fullHeight 
            className="static inset-auto shadow-none w-full h-full rounded-none max-h-full" 
          />
        ) : (
          <div className="text-center p-8">
            <h3 className="text-lg font-medium mb-2">Selecione uma conversa</h3>
            <p className="text-muted-foreground text-sm">
              Escolha uma conversa da lista para começar a interagir.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}