import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useChat } from "@/hooks/use-chat";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import {
  Package,
  DollarSign,
  BarChart,
  MessageCircle,
  Send,
  Paperclip,
  ArrowLeft,
  Phone,
  Video,
  MoreVertical,
  Image as ImageIcon,
  Smile
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Sidebar para navegação do fornecedor
function SupplierSidebar() {
  // Usar o hook para obter o contador de mensagens não lidas
  const { unreadCount } = useChat();
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold mb-4">Painel do Fornecedor</h2>
      <nav className="space-y-2">
        <Link href="/fornecedor/dashboard" className="flex items-center text-gray-700 hover:text-primary p-2 rounded-md hover:bg-gray-50 font-medium">
          <BarChart className="mr-2 h-5 w-5" />
          Dashboard
        </Link>
        <Link href="/fornecedor/produtos" className="flex items-center text-gray-700 hover:text-primary p-2 rounded-md hover:bg-gray-50 font-medium">
          <Package className="mr-2 h-5 w-5" />
          Meus Produtos
        </Link>
        <Link href="/fornecedor/vendas" className="flex items-center text-gray-700 hover:text-primary p-2 rounded-md hover:bg-gray-50 font-medium">
          <DollarSign className="mr-2 h-5 w-5" />
          Vendas e Comissões
        </Link>
        <Link href="/fornecedor/chat" className="flex items-center text-primary p-2 rounded-md bg-primary/10 font-medium relative">
          <MessageCircle className="mr-2 h-5 w-5" />
          Suporte/Chat
          {unreadCount > 0 && (
            <span className="ml-auto bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </Link>
      </nav>
    </div>
  );
}

// Usando a interface ChatMessage do hook para compatibilidade
import { ChatMessage } from "@/hooks/use-chat";

// Interface local para exibição de mensagens
interface Message extends Partial<ChatMessage> {
  id: number;
  text?: string;        // Para manter compatibilidade com o código existente
  message?: string;     // Do ChatMessage
  content?: string;     // Do ChatMessage
  senderId: number;
  receiverId: number;
  isRead: boolean;
  createdAt: string | Date;
  sender?: {
    id: number;
    name: string;
    username: string;
    role?: string;
  };
}

function formatMessageTime(createdAt: string) {
  try {
    return formatDistanceToNow(new Date(createdAt), {
      addSuffix: true,
      locale: ptBR,
    });
  } catch (e) {
    return "agora";
  }
}

// Componente de mensagem
function ChatMessage({ message, currentUserId }: { message: Message; currentUserId: number }) {
  const isOutgoing = message.senderId === currentUserId;
  const hasAttachment = !!message.attachmentUrl;
  
  const isImage = message.attachmentType?.startsWith('image/');
  
  return (
    <div className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex items-end gap-2 ${isOutgoing ? 'flex-row' : 'flex-row-reverse'}`}>
        {!isOutgoing && (
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-primary/20 text-primary text-xs">
              {message.sender?.name?.charAt(0).toUpperCase() || 'A'}
            </AvatarFallback>
          </Avatar>
        )}
        
        <div className={`max-w-[80%] ${isOutgoing ? 'bg-primary text-white' : 'bg-gray-100 text-gray-800'} px-4 py-2 rounded-2xl`}>
          {hasAttachment && isImage && (
            <div className="mb-2">
              <img 
                src={message.attachmentUrl!} 
                alt="Anexo" 
                className="rounded-lg max-h-40 object-cover"
              />
            </div>
          )}
          
          {hasAttachment && !isImage && (
            <div className="flex items-center gap-2 mb-2 p-2 bg-white/10 rounded-lg">
              <div className="bg-white/20 p-1 rounded">
                <Paperclip className="h-4 w-4" />
              </div>
              <div className="text-sm truncate flex-1">
                <a 
                  href={message.attachmentUrl!} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  Anexo
                </a>
              </div>
            </div>
          )}
          
          <div>
            <p className="break-words">{message.text || message.message || message.content}</p>
            <div className={`text-xs mt-1 ${isOutgoing ? 'text-white/70' : 'text-gray-500'} text-right`}>
              {formatMessageTime(message.createdAt.toString())}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading do chat
function ChatLoading() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-start gap-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
      
      <div className="flex items-start justify-end gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-4 w-[180px]" />
        </div>
      </div>
      
      <div className="flex items-start gap-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[220px]" />
          <Skeleton className="h-4 w-[180px]" />
        </div>
      </div>
    </div>
  );
}

// Componente principal do chat
export default function SupplierChat() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { 
    conversations, 
    activeConversation, 
    messages, 
    sendMessage,
    selectConversation,
    markMessagesAsRead,
    startConversationWithAdmin,
    isLoadingMessages,
    isLoadingConversations
  } = useChat();
  
  const [messageText, setMessageText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isStartingConversation, setIsStartingConversation] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Rolar para a última mensagem quando mensagens são carregadas ou adicionadas
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Marcar mensagens como lidas quando abrir a conversa
  useEffect(() => {
    if (activeConversation && messages.length > 0) {
      // Obter IDs de mensagens não lidas que não foram enviadas pelo usuário atual
      const unreadMessageIds = messages
        .filter(msg => !msg.isRead && msg.senderId !== user?.id)
        .map(msg => msg.id);
      
      if (unreadMessageIds.length > 0) {
        markMessagesAsRead(unreadMessageIds);
      }
    }
  }, [activeConversation, messages, markMessagesAsRead, user?.id]);
  
  // Iniciar nova conversa com o admin
  const handleStartAdminConversation = async () => {
    if (!user) return;
    
    setIsStartingConversation(true);
    try {
      await startConversationWithAdmin(`Fornecedor ${user.username} - Solicitação de Suporte`);
      toast({
        title: "Conversa iniciada",
        description: "Sua conversa com o suporte foi iniciada com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao iniciar conversa",
        description: "Não foi possível iniciar a conversa com o suporte.",
        variant: "destructive",
      });
    } finally {
      setIsStartingConversation(false);
    }
  };
  
  // Enviar mensagem
  const handleSendMessage = async () => {
    if (!messageText.trim() && !selectedFile) return;
    
    if (!activeConversation) {
      toast({
        title: "Sem conversa ativa",
        description: "Selecione uma conversa ou inicie uma nova para enviar mensagens.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      let attachmentData = null;
      let attachmentType = null;
      
      if (selectedFile) {
        // Converter arquivo para base64
        const reader = new FileReader();
        attachmentData = await new Promise<string>((resolve) => {
          reader.onloadend = () => {
            if (typeof reader.result === 'string') {
              resolve(reader.result.split(',')[1]); // Remover o prefixo data:...;base64,
            }
          };
          reader.readAsDataURL(selectedFile);
        });
        attachmentType = selectedFile.type;
      }
      
      await sendMessage({
        message: messageText,
        conversationId: activeConversation.id,
        attachment: selectedFile ? {
          data: attachmentData,
          type: attachmentType,
          name: selectedFile.name,
          size: selectedFile.size
        } : undefined
      });
      
      // Limpar campos após envio
      setMessageText("");
      setSelectedFile(null);
      
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      toast({
        title: "Erro ao enviar mensagem",
        description: "Não foi possível enviar sua mensagem. Tente novamente.",
        variant: "destructive",
      });
    }
  };
  
  // Manipular tecla Enter para enviar mensagem
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Selecionar arquivo
  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };
  
  // Quando um arquivo é selecionado
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Verificar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O arquivo não pode ser maior que 5MB.",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
      toast({
        title: "Arquivo selecionado",
        description: `${file.name} será enviado com sua mensagem.`,
      });
    }
  };
  
  // Remover arquivo selecionado
  const handleRemoveFile = () => {
    setSelectedFile(null);
  };
  
  // Verificar se a conversa é com suporte/admin
  const activeConversationIsAdmin = activeConversation?.participantRole === 'admin';
  
  // Nome do participante da conversa
  const conversationPartnerName = activeConversation?.participantName || 'Suporte Técnico';
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow bg-gray-100 py-8">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 text-transparent bg-clip-text">
                  Chat de Suporte
                </h1>
                <p className="text-gray-600">
                  Converse com o suporte técnico para tirar dúvidas ou reportar problemas.
                </p>
              </div>
              <Link href="/fornecedor/dashboard">
                <Button variant="outline" className="flex items-center">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar ao Dashboard
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="md:col-span-1">
              <SupplierSidebar />
              
              {/* Lista de conversas */}
              <div className="bg-white rounded-lg shadow-md mt-6 overflow-hidden">
                <div className="p-4 bg-gray-50 border-b flex items-center justify-between">
                  <h3 className="font-medium">Conversas</h3>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    disabled={isStartingConversation}
                    onClick={handleStartAdminConversation}
                    className="text-xs"
                  >
                    Novo ticket
                  </Button>
                </div>
                
                <ScrollArea className="h-[300px]">
                  {isLoadingConversations ? (
                    <div className="p-4 space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex gap-3 items-center">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="space-y-1.5 flex-1">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-3 w-40" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-400 opacity-50" />
                      <p>Nenhuma conversa encontrada.</p>
                      <p className="text-sm mt-1">Inicie uma nova conversa com o suporte.</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {conversations.map((conversation) => (
                        <div 
                          key={conversation.id}
                          className={`p-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors
                            ${activeConversation?.id === conversation.id ? 'bg-gray-100' : ''}
                          `}
                          onClick={() => selectConversation(conversation)}
                        >
                          <Avatar className="h-10 w-10">
                            {conversation.participantRole === 'admin' ? (
                              <AvatarFallback className="bg-primary/20 text-primary">
                                S
                              </AvatarFallback>
                            ) : (
                              <AvatarFallback className="bg-gray-200 text-gray-700">
                                {conversation.participantName?.charAt(0).toUpperCase() || 'U'}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium truncate">
                                {conversation.participantRole === 'admin' 
                                  ? 'Suporte Técnico' 
                                  : conversation.participantName
                                }
                              </p>
                              {conversation.unreadCount > 0 && (
                                <Badge variant="destructive" className="ml-2">{conversation.unreadCount}</Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 truncate">
                              {new Date(conversation.lastActivityAt).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>
            
            {/* Chat */}
            <div className="md:col-span-3">
              <div className="bg-white rounded-lg shadow-md overflow-hidden h-[600px] flex flex-col">
                {/* Cabeçalho do chat */}
                {activeConversation ? (
                  <div className="p-4 border-b flex items-center justify-between bg-gray-50">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        {activeConversationIsAdmin ? (
                          <AvatarFallback className="bg-primary/20 text-primary">S</AvatarFallback>
                        ) : (
                          <>
                            <AvatarImage src="" />
                            <AvatarFallback className="bg-gray-200 text-gray-700">
                              {conversationPartnerName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </>
                        )}
                      </Avatar>
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{conversationPartnerName}</h3>
                          {activeConversationIsAdmin && (
                            <Badge variant="outline" className="text-xs bg-primary/10 text-primary">Suporte</Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {activeConversationIsAdmin ? 'Online' : 'Última atividade: recentemente'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 text-gray-500">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 border-b bg-gray-50">
                    <h3 className="font-medium">Chat de Suporte</h3>
                  </div>
                )}
                
                {/* Área de mensagens */}
                <ScrollArea className="flex-1 p-4">
                  {!activeConversation ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <MessageCircle className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">Nenhuma conversa selecionada</h3>
                      <p className="text-gray-500 max-w-md mb-4">
                        Selecione uma conversa existente ou inicie uma nova conversa para começar a enviar mensagens.
                      </p>
                      <Button 
                        onClick={handleStartAdminConversation}
                        disabled={isStartingConversation}
                      >
                        {isStartingConversation ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            Iniciando...
                          </>
                        ) : (
                          <>
                            <MessageCircle className="mr-2 h-4 w-4" />
                            Iniciar conversa com suporte
                          </>
                        )}
                      </Button>
                    </div>
                  ) : isLoadingMessages ? (
                    <ChatLoading />
                  ) : messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <MessageCircle className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">Nenhuma mensagem ainda</h3>
                      <p className="text-gray-500 max-w-md">
                        Envie uma mensagem para iniciar a conversa. A nossa equipe de suporte responderá o mais brevemente possível.
                      </p>
                    </div>
                  ) : (
                    <div className="pb-2">
                      {messages.map((message) => (
                        <ChatMessage 
                          key={message.id} 
                          message={message}
                          currentUserId={user?.id || 0}
                        />
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>
                
                {/* Input de mensagem */}
                {activeConversation && (
                  <>
                    {selectedFile && (
                      <div className="px-4 py-2 bg-gray-50 border-t">
                        <div className="flex items-center justify-between bg-white rounded-md px-3 py-2 border">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <Paperclip className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <span className="text-sm truncate">{selectedFile.name}</span>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 p-0 text-gray-500" 
                            onClick={handleRemoveFile}
                          >
                            &times;
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    <div className="p-4 border-t flex items-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="rounded-full flex-shrink-0"
                        onClick={handleFileSelect}
                      >
                        <Paperclip className="h-5 w-5 text-gray-500" />
                      </Button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileChange}
                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                      />
                      
                      <Textarea
                        placeholder="Digite sua mensagem..."
                        className="min-h-[42px] max-h-32 resize-none"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyDown={handleKeyPress}
                      />
                      
                      <Button 
                        variant="default" 
                        size="icon"
                        className="rounded-full flex-shrink-0 bg-primary/90 hover:bg-primary"
                        onClick={handleSendMessage}
                        disabled={!messageText.trim() && !selectedFile}
                      >
                        <Send className="h-5 w-5" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}