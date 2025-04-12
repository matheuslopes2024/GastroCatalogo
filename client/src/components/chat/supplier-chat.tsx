import { useChat } from "@/hooks/use-chat";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect, useRef } from "react";
import { Building2, MessageSquare, UserCircle, X, MessageCircle, Send, Paperclip, ArrowRight, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import ChatWidget from "./chat-widget";
import { apiRequest } from "@/lib/queryClient";
import { ChatConversation, ChatMessage } from "@shared/schema";
import { UserRole } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow, isToday, format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function SupplierChat() {
  const { user } = useAuth();
  const { 
    isOpen, 
    openChat, 
    unreadCount, 
    toggleChat, 
    activeConversationId,
    startConversationWithAdmin,
    openChatWithAdmin
  } = useChat();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // Iniciar conversa com administrador
  const startChatWithAdmin = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      // Se for fornecedor, incluir informação na mensagem inicial
      const initialMessage = `Fornecedor ${user.username} - Solicitação de Suporte`;
      
      // Usar a nova função para iniciar conversa diretamente com administrador
      await startConversationWithAdmin(initialMessage);
      
      // Abrir o chat
      openChat();
    } catch (error) {
      console.error("Erro ao iniciar conversa:", error);
      toast({
        title: "Erro ao conectar com o suporte",
        description: "Não foi possível iniciar uma conversa. Tente novamente mais tarde.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Se não houver usuário ou se não for fornecedor, não mostrar nada
  if (!user || (user.role !== UserRole.SUPPLIER && user.role !== UserRole.ADMIN)) {
    return null;
  }
  
  return (
    <>
      {/* Botão flutuante para fornecedor */}
      {!isOpen && (
        <motion.div 
          className="fixed bottom-6 right-6 z-50"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Button 
            onClick={activeConversationId ? toggleChat : startChatWithAdmin}
            size="lg"
            className="h-14 w-14 rounded-full shadow-lg"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="animate-spin">⌛</span>
            ) : (
              <>
                <Building2 className="h-6 w-6" />
                {unreadCount > 0 && (
                  <Badge 
                    className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full"
                    variant="destructive"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </>
            )}
          </Button>
        </motion.div>
      )}
      
      {/* Widget de chat */}
      <ChatWidget />
    </>
  );
}