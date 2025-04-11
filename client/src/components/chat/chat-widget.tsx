import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useChat } from "@/hooks/use-chat";
import { ChatMessage } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MessageSquare,
  X,
  Send,
  Paperclip,
  Image as ImageIcon,
  File,
  Smile,
  ChevronDown,
  Loader2,
  Check,
  Clock
} from "lucide-react";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from "@/components/ui/badge";
import { UserRole } from "@shared/schema";
import { cn } from "@/lib/utils";

// Tipos
type ChatWidgetProps = {
  fixedRecipientId?: number;
  fixedRecipientName?: string;
  hideToggle?: boolean;
  fullHeight?: boolean;
  className?: string;
};

// Componente para cada mensagem individual
const MessageBubble = ({ message, isCurrentUser }: { message: ChatMessage; isCurrentUser: boolean }) => {
  // Formatar a data da mensagem
  const formattedDate = format(new Date(message.createdAt), "dd 'de' MMMM, HH:mm", { locale: ptBR });
  
  // Verificar se tem anexo e determinar o tipo
  const hasAttachment = message.attachmentUrl || message.attachmentData;
  const isImage = hasAttachment && (message.attachmentType?.startsWith('image/') || false);
  const isDocument = hasAttachment && !isImage;
  
  return (
    <div className={cn(
      "flex mb-4 w-full max-w-[85%]",
      isCurrentUser ? "self-end ml-auto" : "self-start mr-auto"
    )}>
      {!isCurrentUser && (
        <Avatar className="h-8 w-8 mr-2 mt-1">
          <AvatarFallback>{message.senderId.toString()[0]}</AvatarFallback>
        </Avatar>
      )}
      
      <div className={cn(
        "flex flex-col rounded-2xl p-3",
        isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted"
      )}>
        <div className="text-sm break-words">
          {message.message}
          
          {/* Renderização de anexos */}
          {isImage && (
            <div className="mt-2 max-w-[200px]">
              <img 
                src={message.attachmentUrl || message.attachmentData || ''} 
                alt="Imagem anexada" 
                className="rounded-md max-w-full max-h-[250px] object-contain"
              />
            </div>
          )}
          
          {isDocument && (
            <div className="mt-2 flex items-center bg-background/20 rounded-md p-2">
              <File className="h-4 w-4 mr-2" />
              <span className="text-xs truncate flex-1">
                {message.attachmentType?.split('/')[1] || 'Arquivo'}
              </span>
              <span className="text-xs">
                {message.attachmentSize && `${Math.round(message.attachmentSize / 1024)} KB`}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-end mt-1 gap-1 text-xs opacity-70">
          <span>{formattedDate}</span>
          {isCurrentUser && (
            message.isRead 
              ? <Check className="h-3 w-3" /> 
              : <Clock className="h-3 w-3" />
          )}
        </div>
      </div>
      
      {isCurrentUser && (
        <Avatar className="h-8 w-8 ml-2 mt-1">
          <AvatarFallback>{message.senderId.toString()[0]}</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};

// Componente principal do widget de chat
export default function ChatWidget({
  fixedRecipientId,
  fixedRecipientName,
  hideToggle = false,
  fullHeight = false,
  className
}: ChatWidgetProps) {
  const {
    isOpen,
    messages,
    openChat,
    closeChat,
    toggleChat,
    sendMessage,
    unreadCount,
    isLoading,
    loadMoreMessages,
    createConversation,
    activeConversationId
  } = useChat();
  
  const { user } = useAuth();
  const [messageText, setMessageText] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Efeito para rolar para o fim quando novas mensagens chegarem
  useEffect(() => {
    if (messagesRef.current && messages.length > 0) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);
  
  // Efeito para carregar mais mensagens quando o usuário rolar para cima
  useEffect(() => {
    const handleScroll = () => {
      if (messagesRef.current && messagesRef.current.scrollTop === 0 && !isLoading) {
        loadMoreMessages();
      }
    };
    
    const messagesElement = messagesRef.current;
    if (messagesElement) {
      messagesElement.addEventListener('scroll', handleScroll);
      return () => messagesElement.removeEventListener('scroll', handleScroll);
    }
  }, [loadMoreMessages, isLoading]);
  
  // Criar conversa com o destinatário fixo, se necessário
  useEffect(() => {
    const initializeConversation = async () => {
      if (fixedRecipientId && user && isOpen && !activeConversationId) {
        try {
          await createConversation(fixedRecipientId);
        } catch (error) {
          console.error('Erro ao inicializar conversa:', error);
        }
      }
    };
    
    initializeConversation();
  }, [fixedRecipientId, user, isOpen, activeConversationId, createConversation]);
  
  // Manipuladores de eventos
  const handleSendMessage = async () => {
    if (!messageText.trim() && !attachment) return;
    
    setIsSending(true);
    
    try {
      await sendMessage(messageText.trim() || 'Enviou um anexo', attachment);
      setMessageText("");
      setAttachment(null);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    } finally {
      setIsSending(false);
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      // Verificar tamanho do arquivo (máximo 1GB)
      if (file.size > 1024 * 1024 * 1024) {
        alert('O arquivo é muito grande. O tamanho máximo é 1GB.');
        return;
      }
      setAttachment(file);
    }
  };
  
  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };
  
  const removeAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Renderização condicional do botão de abrir chat
  if (!isOpen && hideToggle) {
    return null;
  }
  
  return (
    <>
      {/* Botão flutuante para abrir o chat (apenas se não for escondido) */}
      {!isOpen && !hideToggle && (
        <motion.div 
          className="fixed bottom-6 right-6 z-50"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Button 
            onClick={toggleChat}
            size="lg"
            className="h-14 w-14 rounded-full shadow-lg"
          >
            <MessageSquare className="h-6 w-6" />
            {unreadCount > 0 && (
              <Badge 
                className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full"
                variant="destructive"
              >
                {unreadCount}
              </Badge>
            )}
          </Button>
        </motion.div>
      )}
      
      {/* Widget de chat */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className={cn(
              "fixed bottom-6 right-6 w-80 sm:w-96 bg-background rounded-lg shadow-xl flex flex-col z-50 overflow-hidden",
              fullHeight ? "h-[calc(100vh-6rem)] top-24 bottom-6" : "h-[30rem] max-h-[calc(100vh-6rem)]",
              className
            )}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Cabeçalho */}
            <div className="bg-primary text-primary-foreground p-3 flex items-center justify-between">
              <div className="flex items-center">
                <Avatar className="h-8 w-8 mr-2">
                  <AvatarFallback>
                    {user?.role === UserRole.ADMIN ? 'A' : 'S'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">
                    {fixedRecipientName || "Atendimento"}
                  </h3>
                  <p className="text-xs opacity-80">
                    {user?.role === UserRole.ADMIN 
                      ? "Administrador" 
                      : (user?.role === UserRole.SUPPLIER 
                        ? "Fornecedor" 
                        : "Suporte ao Cliente")}
                  </p>
                </div>
              </div>
              {!hideToggle && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closeChat}
                  className="h-8 w-8 rounded-full hover:bg-primary-foreground/20"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            {/* Corpo de mensagens */}
            <div 
              ref={messagesRef}
              className="flex-1 overflow-y-auto p-4 flex flex-col-reverse space-y-reverse space-y-2"
            >
              {isLoading && (
                <div className="flex justify-center items-center py-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              )}
              
              {messages.length === 0 && !isLoading ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mb-2 opacity-20" />
                  <p className="text-sm">
                    Envie uma mensagem para iniciar a conversa
                  </p>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <MessageBubble 
                      key={message.id}
                      message={message}
                      isCurrentUser={message.senderId === user?.id}
                    />
                  ))}
                </>
              )}
            </div>
            
            {/* Área de anexo */}
            {attachment && (
              <div className="px-4 pt-2">
                <div className="bg-muted rounded-md p-2 flex items-center justify-between">
                  <div className="flex items-center text-sm truncate">
                    {attachment.type.startsWith('image/') ? (
                      <ImageIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                    ) : (
                      <File className="h-4 w-4 mr-2 flex-shrink-0" />
                    )}
                    <span className="truncate">{attachment.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({Math.round(attachment.size / 1024)} KB)
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={removeAttachment}
                    className="h-6 w-6"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
            
            {/* Área de input */}
            <div className="p-3 border-t">
              <div className="flex items-center space-x-2">
                <Textarea
                  placeholder="Digite sua mensagem..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="min-h-[60px] max-h-[120px] resize-none"
                  disabled={isSending}
                />
                <div className="flex flex-col space-y-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleAttachmentClick}
                    className="h-8 w-8 rounded-full"
                    disabled={isSending}
                    title="Anexar arquivo"
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={handleSendMessage}
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    disabled={isSending || (!messageText.trim() && !attachment)}
                    title="Enviar mensagem"
                  >
                    {isSending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              />
              <div className="text-xs text-muted-foreground mt-1">
                <span>Anexos: máx. 1GB (imagens, PDF, DOCX)</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}