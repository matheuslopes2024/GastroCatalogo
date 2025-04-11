import { useEffect, useRef, useState } from "react";
import { useChat } from "@/hooks/use-chat";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { 
  Send, Paperclip, Download, ImageIcon as Image, 
  VideoIcon as Video, FileTextIcon as FileText, 
  FileIcon as File, Smile, X 
} from "lucide-react";

export interface Attachment {
  name: string;
  type: string;
  size: number;
  data: string;
  createdAt: Date;
}

export interface ExtendedChatMessage {
  id: number;
  content: string;
  createdAt: Date;
  senderId: number;
  receiverId: number;
  conversationId: number;
  isRead: boolean;
  attachments?: Attachment[];
  senderName?: string;
}

// Componente para exibir ícones de anexos 
export function GetAttachmentIcon({ type }: { type: string }) {
  if (type.startsWith('image/')) {
    return <Image className="h-3 w-3" />;
  } else if (type.startsWith('video/')) {
    return <Video className="h-3 w-3" />;
  } else if (type.includes('pdf')) {
    return <FileText className="h-3 w-3" />;
  } else {
    return <File className="h-3 w-3" />;
  }
}

// Componente para cada mensagem de chat individual
export function ChatMessageItem({ 
  message, 
  isOwnMessage, 
  showAttachmentPreview = true,
  isAdmin = false
}: { 
  message: ExtendedChatMessage;
  isOwnMessage: boolean;
  showAttachmentPreview?: boolean;
  isAdmin?: boolean;
}) {
  const formattedTime = formatDistanceToNow(new Date(message.createdAt), { 
    addSuffix: true,
    locale: ptBR
  });
  
  // Debug
  console.log(`Renderizando mensagem ${message.id} - isOwnMessage: ${isOwnMessage}`);
  
  return (
    <div className={cn(
      "flex gap-2 max-w-[85%] my-2", 
      isOwnMessage ? "ml-auto" : "mr-auto",
      isOwnMessage ? "flex-row-reverse" : "flex-row"
    )}>
      <Avatar className="h-8 w-8 mt-1">
        <AvatarFallback className={cn(
          isOwnMessage ? "bg-primary text-primary-foreground" : "bg-muted",
        )}>
          {isOwnMessage ? "EU" : (message.senderName?.[0]?.toUpperCase() || "U")}
        </AvatarFallback>
      </Avatar>
      
      <div className={cn(
        "rounded-lg p-3 flex flex-col gap-2",
        isOwnMessage 
          ? "bg-primary text-primary-foreground rounded-tr-none" 
          : "bg-muted rounded-tl-none"
      )}>
        {!isOwnMessage && isAdmin && (
          <div className="text-xs opacity-80 font-medium">
            {message.senderName || "Usuário"}
          </div>
        )}
        
        <div className="break-words whitespace-pre-wrap">{message.message || message.content}</div>
        
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-col gap-2">
            {message.attachments.map((attachment, index) => (
              <div key={index} className="flex flex-col gap-1">
                {showAttachmentPreview && attachment.type.startsWith('image/') ? (
                  <div className="relative rounded-md overflow-hidden">
                    <img 
                      src={attachment.data} 
                      alt={attachment.name}
                      className="max-w-full h-auto max-h-48 object-contain bg-black/5"
                    />
                  </div>
                ) : (
                  <div className={cn(
                    "rounded p-2 flex items-center gap-2 text-sm",
                    isOwnMessage ? "bg-primary-foreground/20" : "bg-background"
                  )}>
                    <GetAttachmentIcon type={attachment.type} />
                    <div className="flex-1 truncate">
                      {attachment.name}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = attachment.data;
                        link.download = attachment.name;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className={cn(
                        "p-1 rounded-full",
                        isOwnMessage ? "hover:bg-primary-foreground/20" : "hover:bg-muted"
                      )}
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        <div className={cn(
          "text-right text-[10px] opacity-70",
          isOwnMessage ? "text-primary-foreground" : "text-muted-foreground"
        )}>
          {formattedTime}
        </div>
      </div>
    </div>
  );
}

// Componente para o histórico de mensagens
export function MessageHistory({ 
  isAdmin = false, 
  showAttachmentPreview = true,
  adminEnhanced = false
}: {
  isAdmin?: boolean;
  showAttachmentPreview?: boolean;
  adminEnhanced?: boolean;
}) {
  const { activeConversation } = useChat();
  const { user } = useAuth();
  const messagesRef = useRef<HTMLDivElement>(null);
  
  // Rolar para a última mensagem quando a conversa ativa muda ou quando novas mensagens são adicionadas
  useEffect(() => {
    setTimeout(() => {
      if (messagesRef.current) {
        messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
      }
    }, 100);
  }, [activeConversation]);
  
  // Verifica se há mensagens na conversa atual
  if (!activeConversation || !activeConversation.id) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p>Nenhuma mensagem ainda.</p>
          <p className="text-sm">Comece uma conversa!</p>
        </div>
      </div>
    );
  }
  
  // Obtém as mensagens da conversa atual
  const { data: messagesData, isLoading: messagesLoading } = useQuery<ExtendedChatMessage[]>({
    queryKey: ['/api/chat/messages', activeConversation.id],
    queryFn: async () => {
      const res = await fetch(`/api/chat/messages?conversationId=${activeConversation.id}`);
      if (!res.ok) {
        throw new Error('Falha ao carregar mensagens');
      }
      return res.json();
    },
    enabled: !!activeConversation?.id
  });
  
  if (messagesLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  if (!messagesData || messagesData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p>Nenhuma mensagem ainda.</p>
          <p className="text-sm">Comece uma conversa!</p>
        </div>
      </div>
    );
  }
  
  // A referência a messagesRef é usada para rolar para baixo automaticamente
  return (
    <div className="space-y-1 p-2" ref={messagesRef}>
      {messagesData && messagesData.map((msg: ExtendedChatMessage) => {
        console.log('Verificando mensagem:', msg.id, 'senderId:', msg.senderId, 'userId:', user?.id, 'admin?:', isAdmin);
        return (
          <ChatMessageItem 
            key={msg.id} 
            message={msg} 
            isOwnMessage={msg.senderId === user?.id}
            showAttachmentPreview={showAttachmentPreview}
            isAdmin={isAdmin}
          />
        );
      })}
    </div>
  );
}

// Componente para entrada de mensagens
export function MessageInput({ 
  isAdmin = false, 
  showEmojis = false,
  allowLargeAttachments = false,
  adminEnhanced = false
}: {
  isAdmin?: boolean;
  showEmojis?: boolean;
  allowLargeAttachments?: boolean;
  adminEnhanced?: boolean;
}) {
  const { activeConversation, sendMessage } = useChat();
  const { user } = useAuth();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() && attachments.length === 0) return;
    
    if (!activeConversation || !user) return;
    
    try {
      setIsSending(true);
      
      // Obter o ID do destinatário (o outro participante da conversa)
      const receiverId = activeConversation.participantIds.find(id => id !== user.id) || 0;
      
      // Usar o hook sendMessage do useChat para enviar a mensagem
      // Este é o ponto chave da correção - usamos o hook em vez de fazer fetch diretamente
      await sendMessage({
        message: message,
        conversationId: activeConversation.id,
        receiverId,
        attachment: attachments.length > 0 ? attachments[0] : undefined,
      });
      
      // Limpar os campos após o envio bem-sucedido
      setMessage("");
      setAttachments([]);
      
      // Focar no input novamente
      inputRef.current?.focus();
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
    } finally {
      setIsSending(false);
    }
  };
  
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    
    setIsUploading(true);
    
    try {
      const files = Array.from(e.target.files);
      const maxSize = allowLargeAttachments ? 1024 * 1024 * 1024 : 5 * 1024 * 1024; // 1GB ou 5MB
      
      for (const file of files) {
        if (file.size > maxSize) {
          alert(`Arquivo ${file.name} excede o tamanho máximo permitido de ${allowLargeAttachments ? '1GB' : '5MB'}`);
          continue;
        }
        
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          setAttachments(prev => [
            ...prev, 
            { 
              name: file.name, 
              type: file.type, 
              size: file.size, 
              data: base64data,
              createdAt: new Date()
            }
          ]);
        };
        reader.readAsDataURL(file);
      }
    } catch (error) {
      console.error("Erro ao fazer upload de arquivo:", error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };
  
  return (
    <div className={cn(adminEnhanced ? "bg-white rounded-lg shadow-sm border" : "")}>
      {attachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2 p-2">
          {attachments.map((attachment, index) => (
            <div key={index} className="relative bg-muted rounded p-1 group">
              <div className="flex items-center gap-1 text-xs max-w-48 truncate">
                <GetAttachmentIcon type={attachment.type} />
                <span className="truncate">{attachment.name}</span>
              </div>
              <button 
                onClick={() => removeAttachment(index)}
                className="absolute -top-1 -right-1 rounded-full bg-destructive text-white w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    
      <form onSubmit={handleSubmit} className="flex items-end gap-2 p-2">
        <div className="relative flex-1">
          <Textarea
            ref={inputRef}
            placeholder="Digite sua mensagem..."
            className={cn(
              "resize-none pr-10",
              adminEnhanced ? "min-h-[60px] max-h-32 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none pl-3" : "min-h-[50px] max-h-32"
            )}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            autoFocus={adminEnhanced}
          />
          
          <div className="absolute bottom-2 right-2 flex gap-1">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleUpload}
              className="hidden"
              multiple
            />
            
            {showEmojis && (
              <Button 
                type="button" 
                variant="ghost" 
                size="icon"
                className="h-7 w-7 rounded-full"
                onClick={() => {
                  console.log("Seletor de emojis");
                }}
              >
                <Smile className="h-4 w-4" />
              </Button>
            )}
            
            <Button 
              type="button" 
              variant="ghost" 
              size="icon"
              className="h-7 w-7 rounded-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <Paperclip className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        
        <Button 
          type="submit" 
          size="icon" 
          className={cn(
            "rounded-full text-white",
            adminEnhanced ? "h-11 w-11 bg-gradient-to-r from-primary to-primary/90 hover:opacity-90" : "h-10 w-10"
          )}
          disabled={(!message.trim() && attachments.length === 0) || isUploading || isSending}
        >
          {isSending ? (
            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  );
}