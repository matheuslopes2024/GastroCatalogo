import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageCircle, X, Send, Paperclip, User, ChevronLeft,
  Download, Image, Video, FileText, Smile
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { useChat, type ChatMessage, type Attachment } from "@/hooks/use-chat";
import { useAuth } from "@/hooks/use-auth";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

function ChatHeader() {
  const { closeChat, activeConversation, setActiveConversation, unreadCount } = useChat();
  
  return (
    <div className="bg-primary p-3 text-white flex items-center justify-between rounded-t-lg">
      <div className="flex items-center gap-2">
        {activeConversation ? (
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-primary/20 h-8 w-8"
            onClick={() => setActiveConversation(null)}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        ) : null}
        
        <h3 className="font-semibold flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Chat ao Vivo
          {!activeConversation && unreadCount > 0 && (
            <Badge variant="destructive" className="h-5 min-w-[20px] px-1">
              {unreadCount}
            </Badge>
          )}
        </h3>
      </div>
      
      <Button 
        variant="ghost" 
        size="icon" 
        className="text-white hover:bg-primary/20 h-8 w-8"
        onClick={closeChat}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

function ConversationItem({ conversation, onSelect }: { 
  conversation: any; 
  onSelect: () => void;
}) {
  const { user } = useAuth();
  
  // Encontrar o outro participante
  const otherParticipant = conversation._participants?.find(
    (p: any) => p.id !== user?.id
  );
  
  const unreadCount = otherParticipant?.unreadCount || 0;
  const lastMessage = conversation._lastMessage;
  
  return (
    <div 
      className="p-3 hover:bg-gray-100 cursor-pointer flex gap-3 items-center border-b"
      onClick={onSelect}
    >
      <Avatar>
        <AvatarFallback className="bg-primary/10 text-primary">
          {otherParticipant?.name?.[0] || "U"}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between">
          <p className="font-medium truncate">{otherParticipant?.name || "Usuário"}</p>
          {lastMessage && (
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(lastMessage.createdAt), { 
                addSuffix: true,
                locale: ptBR
              })}
            </span>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 truncate">
            {lastMessage ? (
              lastMessage.attachmentData 
                ? "📎 Arquivo anexado" 
                : lastMessage.message
            ) : "Iniciar conversa"}
          </p>
          
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-1 h-5 min-w-[20px] px-1">
              {unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

function ConversationsList({
  isAdmin = false,
  allowLargeAttachments = true
}: {
  isAdmin?: boolean;
  allowLargeAttachments?: boolean;
}) {
  const { 
    conversations, 
    setActiveConversation, 
    isLoadingConversations,
    startConversationWithAdmin
  } = useChat();
  const [contactingAdmin, setContactingAdmin] = useState(false);
  const [initialMessage, setInitialMessage] = useState("");
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Manipular o upload de arquivos
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Verificar tamanho (1GB max)
    if (file.size > 1024 * 1024 * 1024) {
      alert("Arquivo muito grande. O tamanho máximo é 1GB.");
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      if (!event.target?.result) return;
      
      setAttachment({
        data: event.target.result as string,
        type: file.type,
        name: file.name,
        size: file.size
      });
    };
    reader.readAsDataURL(file);
  };
  
  const handleStartConversation = async () => {
    if (!initialMessage.trim() && !attachment) return;
    
    try {
      await startConversationWithAdmin(initialMessage, attachment || undefined);
      setContactingAdmin(false);
      setInitialMessage("");
      setAttachment(null);
    } catch (error) {
      console.error("Erro ao iniciar conversa:", error);
    }
  };
  
  if (isLoadingConversations) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-2 text-sm text-gray-500">Carregando conversas...</p>
      </div>
    );
  }
  
  // Formulário para contatar o administrador
  if (contactingAdmin) {
    return (
      <div className="flex flex-col h-full p-4">
        <div className="mb-3">
          <h3 className="text-lg font-medium mb-2">Fale com um administrador</h3>
          <p className="text-sm text-gray-500 mb-4">
            Envie uma mensagem e em breve um administrador irá atendê-lo.
          </p>
          
          <div className="space-y-4">
            <Textarea
              placeholder="Digite sua mensagem..."
              value={initialMessage}
              onChange={(e) => setInitialMessage(e.target.value)}
              className="min-h-[120px]"
            />
            
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
              />
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1"
              >
                <Paperclip className="h-4 w-4" />
                Anexar
              </Button>
              
              {attachment && (
                <div className="text-xs text-gray-500 truncate flex-1">
                  {attachment.name} ({Math.round(attachment.size / 1024)} KB)
                </div>
              )}
            </div>
            
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  setContactingAdmin(false);
                  setInitialMessage("");
                  setAttachment(null);
                }}
              >
                Cancelar
              </Button>
              
              <Button onClick={handleStartConversation}>
                Enviar
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (conversations.length === 0) {
    return (
      <div className="p-6 text-center">
        <MessageCircle className="h-10 w-10 mx-auto text-gray-400 mb-2" />
        <h3 className="font-medium text-lg mb-1">Nenhuma conversa</h3>
        <p className="text-sm text-gray-500 mb-4">
          Você ainda não iniciou nenhuma conversa.
        </p>
        
        <Button 
          onClick={() => setContactingAdmin(true)}
          className="w-full"
        >
          Falar com Administrador
        </Button>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b">
        <Button 
          onClick={() => setContactingAdmin(true)}
          className="w-full"
          variant="outline"
        >
          Nova Conversa com Administrador
        </Button>
      </div>
      
      <div className="divide-y divide-gray-100 flex-1 overflow-auto">
        {conversations.map(conversation => (
          <ConversationItem
            key={conversation.id}
            conversation={conversation}
            onSelect={() => setActiveConversation(conversation)}
          />
        ))}
      </div>
    </div>
  );
}

function ChatMessage({ 
  message, 
  isMine,
  showAttachmentPreview = true 
}: { 
  message: ChatMessage; 
  isMine: boolean;
  showAttachmentPreview?: boolean;
}) {
  const { user } = useAuth();
  
  const formattedTime = formatDistanceToNow(new Date(message.createdAt), {
    addSuffix: true,
    locale: ptBR
  });
  
  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-4`}>
      {!isMine && (
        <Avatar className="h-8 w-8 mr-2">
          <AvatarFallback className="bg-primary/10 text-primary">
            U
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={`max-w-[70%] ${isMine ? 'bg-primary text-white' : 'bg-gray-100 text-gray-800'} p-3 rounded-lg`}>
        {message.attachmentData && (
          <div className="mb-2 p-2 bg-white/10 rounded border border-white/20 text-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center truncate mr-2">
                {message.attachmentType?.startsWith('image/') ? (
                  <MessageCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                ) : message.attachmentType?.startsWith('video/') ? (
                  <MessageCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                ) : message.attachmentType?.includes('pdf') ? (
                  <Paperclip className="h-4 w-4 mr-2 flex-shrink-0" />
                ) : (
                  <Paperclip className="h-4 w-4 mr-2 flex-shrink-0" />
                )}
                <span className="truncate">{"Arquivo anexado"}</span>
              </div>
              
              <a 
                href={message.attachmentData} 
                download="download" 
                className="text-primary-foreground/80 hover:text-primary-foreground"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Paperclip className="h-4 w-4" />
              </a>
            </div>
            
            {showAttachmentPreview && (
              <>
                {message.attachmentType?.startsWith('image/') && (
                  <div className="mt-2">
                    <a 
                      href={message.attachmentData} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <img 
                        src={message.attachmentData} 
                        alt="Anexo" 
                        className="max-h-60 rounded object-contain w-full"
                      />
                    </a>
                  </div>
                )}
                
                {message.attachmentType?.startsWith('video/') && (
                  <div className="mt-2">
                    <video 
                      src={message.attachmentData} 
                      controls 
                      className="max-h-60 rounded w-full"
                    />
                  </div>
                )}
                
                {message.attachmentType?.includes('pdf') && (
                  <div className="mt-2 p-2 bg-white/10 rounded border border-white/20 flex items-center justify-center">
                    <Paperclip className="h-8 w-8 opacity-50" />
                  </div>
                )}
              </>
            )}
          </div>
        )}
        
        {message.message && (
          <p className="whitespace-pre-wrap break-words">{message.message}</p>
        )}
        
        <div className={`text-xs ${isMine ? 'text-white/70' : 'text-gray-500'} mt-1 text-right`}>
          {formattedTime}
        </div>
      </div>
      
      {isMine && (
        <Avatar className="h-8 w-8 ml-2">
          <AvatarFallback className="bg-primary/10 text-primary">
            {user?.name?.[0] || 'U'}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}

function ChatConversation({ 
  isAdmin = false,
  showAttachmentPreview = true,
  allowLargeAttachments = true,
  showEmojis = false
}: {
  isAdmin?: boolean;
  showAttachmentPreview?: boolean;
  allowLargeAttachments?: boolean;
  showEmojis?: boolean;
}) {
  const { 
    activeConversation, 
    messages, 
    isLoadingMessages, 
    sendMessage 
  } = useChat();
  const { user } = useAuth();
  const [messageText, setMessageText] = useState("");
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Rolar para o final das mensagens quando elas mudam
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  // Manipular o upload de arquivos
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Verificar tamanho (1GB max)
    if (file.size > 1024 * 1024 * 1024) {
      alert("Arquivo muito grande. O tamanho máximo é 1GB.");
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const data = event.target?.result as string;
      setAttachment({
        data,
        type: file.type,
        name: file.name,
        size: file.size
      });
    };
    reader.readAsDataURL(file);
  };
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if ((!messageText.trim() && !attachment) || isSending) return;
    
    try {
      setIsSending(true);
      await sendMessage(messageText, attachment || undefined);
      setMessageText("");
      setAttachment(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
    } finally {
      setIsSending(false);
    }
  };
  
  if (!activeConversation) return null;
  
  const otherParticipant = activeConversation._participants?.find(
    p => p.id !== user?.id
  );
  
  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b flex items-center gap-2">
        <Avatar>
          <AvatarFallback className="bg-primary/10 text-primary">
            {otherParticipant?.name?.[0] || "U"}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-medium">{otherParticipant?.name || "Usuário"}</h3>
          <p className="text-xs text-gray-500">
            {otherParticipant?.role === "SUPPLIER" ? "Fornecedor" : "Usuário"}
          </p>
        </div>
      </div>
      
      <ScrollArea className="flex-1 p-3">
        {isLoadingMessages ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center p-6">
            <div>
              <MessageCircle className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <h3 className="font-medium">Inicie uma conversa</h3>
              <p className="text-sm text-gray-500 mt-1">
                Envie uma mensagem para começar a conversar.
              </p>
            </div>
          </div>
        ) : (
          <div className="py-2">
            {messages.map(message => (
              <ChatMessage 
                key={message.id} 
                message={message} 
                isMine={message.senderId === user?.id}
                showAttachmentPreview={showAttachmentPreview}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>
      
      <form onSubmit={handleSendMessage} className="p-3 border-t">
        {attachment && (
          <div className="mb-2 p-2 bg-gray-100 rounded text-sm flex justify-between items-center">
            <div className="flex items-center truncate">
              <Paperclip className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="truncate">{attachment.name}</span>
            </div>
            <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6" 
              onClick={() => setAttachment(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        <div className="flex gap-2">
          <Button 
            type="button" 
            variant="outline" 
            size="icon" 
            className="flex-shrink-0"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="h-4 w-4" />
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
            />
          </Button>
          
          {showEmojis && (
            <Button 
              type="button" 
              variant="outline" 
              size="icon" 
              className="flex-shrink-0"
              onClick={() => {
                // Lista de emojis comuns
                const emojis = ["😊", "👍", "🙏", "❤️", "👏", "🔥", "✅", "🎉", "👌", "🤝"];
                // Adicionar um emoji aleatório ao texto da mensagem
                const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                setMessageText(prev => prev + " " + randomEmoji);
              }}
            >
              <Smile className="h-4 w-4" />
            </Button>
          )}
          
          <Textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="min-h-[40px] resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
          />
          
          <Button 
            type="submit" 
            className="flex-shrink-0"
            disabled={(!messageText.trim() && !attachment) || isSending}
          >
            {isSending ? (
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

function ChatToggleButton() {
  const { openChat, openChatWithAdmin, unreadCount } = useChat();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {/* Menu de opções */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="bg-white rounded-lg shadow-lg overflow-hidden mb-2"
          >
            <Button
              variant="ghost"
              className="w-full justify-start px-4 py-2 hover:bg-gray-100"
              onClick={() => {
                openChatWithAdmin();
                setIsMenuOpen(false);
              }}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Falar com Administrador
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start px-4 py-2 hover:bg-gray-100"
              onClick={() => {
                openChat();
                setIsMenuOpen(false);
              }}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Ver todas as conversas
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Botão principal do chat */}
      <Button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        size="icon"
        className="h-12 w-12 rounded-full shadow-lg bg-primary hover:bg-primary/90"
      >
        <MessageCircle className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full min-w-[18px] h-[18px] text-xs flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </Button>
    </div>
  );
}

type ChatWidgetProps = {
  hideToggle?: boolean;
  fullHeight?: boolean;
  className?: string;
  isAdmin?: boolean;
  showAttachmentPreview?: boolean;
  allowLargeAttachments?: boolean;
  showEmojis?: boolean;
  adminEnhanced?: boolean;
};

export default function ChatWidget({ 
  hideToggle = false, 
  fullHeight = false,
  className = "",
  isAdmin = false,
  showAttachmentPreview = true,
  allowLargeAttachments = true,
  showEmojis = false,
  adminEnhanced = false
}: ChatWidgetProps) {
  const { isOpen, activeConversation, openChat } = useChat();
  
  // Log para debug
  useEffect(() => {
    console.log("ChatWidget renderizado com conversa ativa:", activeConversation?.id || "nenhuma");
  }, [activeConversation]);
  
  // Garantir que o widget apareça quando for chamado de outros componentes (como ChatDashboard)
  useEffect(() => {
    if (hideToggle && !isOpen) {
      openChat();
    }
  }, [hideToggle, isOpen, openChat]);

  return (
    <>
      <AnimatePresence>
        {(isOpen || hideToggle) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={cn(
              "fixed bottom-20 right-6 w-80 sm:w-96 h-[500px] bg-white rounded-lg shadow-xl z-50 flex flex-col overflow-hidden border",
              fullHeight && "h-full",
              className
            )}
          >
            <ChatHeader />
            
            <div className="flex-1 flex flex-col overflow-hidden">
              {activeConversation ? (
                <div className={cn("flex-1 flex flex-col", adminEnhanced && "rounded-lg shadow-inner")}>
                  {/* Componente de histórico de mensagens */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-3 pt-2">
                    <MessageHistory 
                      isAdmin={isAdmin} 
                      showAttachmentPreview={showAttachmentPreview}
                      adminEnhanced={adminEnhanced}
                    />
                  </div>
                  
                  {/* Componente de entrada de mensagem */}
                  <div className={cn("p-3 pt-0", adminEnhanced && "p-4 pt-0 pb-3")}>
                    <MessageInput 
                      isAdmin={isAdmin} 
                      showEmojis={showEmojis} 
                      allowLargeAttachments={allowLargeAttachments}
                      adminEnhanced={adminEnhanced}
                    />
                  </div>
                </div>
              ) : (
                <ConversationsList 
                  isAdmin={isAdmin}
                  allowLargeAttachments={allowLargeAttachments}
                />
              )}
              
              {/* Debug info - remover em produção */}
              {process.env.NODE_ENV === "development" && (
                <div className="absolute bottom-0 right-0 z-50 bg-black/70 text-white text-xs p-1 rounded m-1">
                  Conversa ID: {activeConversation?.id || "nenhuma"}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {!hideToggle && <ChatToggleButton />}
    </>
  );
}