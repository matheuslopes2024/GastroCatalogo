import { useState, useRef, useEffect } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { ChatMessage } from '@shared/schema';
import { Paperclip, Download, Image, FileText, FileArchive, FileVideo, FileAudio, File, X } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

// Componente para exibir data da mensagem
export function AdminChatMessageDateDisplay({ date }: { date: Date }) {
  const formattedDate = (() => {
    if (isToday(date)) {
      return `Hoje às ${format(date, 'HH:mm')}`;
    } else if (isYesterday(date)) {
      return `Ontem às ${format(date, 'HH:mm')}`;
    } else {
      return format(date, "d 'de' MMMM 'às' HH:mm", { locale: ptBR });
    }
  })();

  return (
    <div className="text-xs text-muted-foreground text-center my-2">
      {formattedDate}
    </div>
  );
}

// Interface para as propriedades da mensagem de chat
interface AdminChatMessageProps {
  message: ChatMessage;
  showAvatar?: boolean;
  senderName?: string;
  isAdmin?: boolean;
}

// Componente para visualizador de anexos
export function AdminChatAttachmentViewer({ attachments, onClose }: { attachments: string[], onClose: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Verificar se o anexo atual é uma imagem
  const isImage = (attachment: string) => {
    try {
      const base64Data = attachment.split(',')[0];
      return base64Data.includes('image/');
    } catch (error) {
      return false;
    }
  };

  const currentAttachment = attachments[currentIndex];
  const isCurrentImage = isImage(currentAttachment);

  // Navegar entre anexos
  const goToPrevious = () => setCurrentIndex(prev => (prev === 0 ? attachments.length - 1 : prev - 1));
  const goToNext = () => setCurrentIndex(prev => (prev === attachments.length - 1 ? 0 : prev + 1));

  // Baixar anexo atual
  const downloadAttachment = () => {
    try {
      if (!currentAttachment) return;
      
      // Extrair tipo MIME e nome do arquivo
      const base64Data = currentAttachment.split(',')[0];
      const [, mimeType] = base64Data.match(/data:(.*?);base64/) || [];
      let extension = mimeType ? mimeType.split('/')[1] : 'txt';
      
      // Converter base64 para blob
      const binaryString = atob(currentAttachment.split(',')[1]);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes.buffer], { type: mimeType });
      
      // Criar link de download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `anexo_${currentIndex + 1}.${extension}`;
      link.click();
      
      // Limpar
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao fazer download do anexo:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">
            Anexo {currentIndex + 1} de {attachments.length}
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center min-h-[300px]">
          {isCurrentImage ? (
            <img 
              src={currentAttachment} 
              alt={`Anexo ${currentIndex + 1}`} 
              className="max-w-full max-h-[60vh] object-contain"
            />
          ) : (
            <div className="flex flex-col items-center justify-center">
              <File className="h-24 w-24 text-muted-foreground/50 mb-4" />
              <p className="text-lg mb-2">Não é possível visualizar este tipo de arquivo</p>
              <Button onClick={downloadAttachment}>
                <Download className="h-4 w-4 mr-2" />
                Baixar arquivo
              </Button>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t flex items-center justify-between">
          <div className="flex space-x-2">
            <Button variant="outline" onClick={downloadAttachment}>
              <Download className="h-4 w-4 mr-2" />
              Baixar
            </Button>
          </div>
          
          {attachments.length > 1 && (
            <div className="flex space-x-2">
              <Button variant="outline" onClick={goToPrevious}>Anterior</Button>
              <Button variant="outline" onClick={goToNext}>Próximo</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Função auxiliar para obter o ícone de anexo com base no tipo MIME
export function getAttachmentIcon(attachment: string) {
  if (!attachment) return <File className="h-4 w-4" />;
  
  try {
    const base64Data = attachment.split(',')[0];
    const [, mimeType] = base64Data.match(/data:(.*?);base64/) || [];
    
    if (!mimeType) return <File className="h-4 w-4" />;
    
    if (mimeType.startsWith('image/')) {
      return <Image className="h-4 w-4" />;
    } else if (mimeType.startsWith('video/')) {
      return <FileVideo className="h-4 w-4" />;
    } else if (mimeType.startsWith('audio/')) {
      return <FileAudio className="h-4 w-4" />;
    } else if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('txt')) {
      return <FileText className="h-4 w-4" />;
    } else if (mimeType.includes('zip') || mimeType.includes('compressed') || mimeType.includes('archive')) {
      return <FileArchive className="h-4 w-4" />;
    }
    
    return <File className="h-4 w-4" />;
  } catch (error) {
    return <File className="h-4 w-4" />;
  }
}

// Componente de mensagem de chat
export function AdminChatMessage({ message, showAvatar = true, senderName = 'Usuário', isAdmin = false }: AdminChatMessageProps) {
  const { user } = useAuth();
  const [viewerOpen, setViewerOpen] = useState(false);
  const messageRef = useRef<HTMLDivElement>(null);
  const isOwnMessage = message.senderId === user?.id;
  const hasAttachments = message.attachments && message.attachments.length > 0;
  
  // Detectar se é uma mensagem vazia
  const hasContent = Boolean(message.text || message.message || message.content);
  
  // Rolagem suave quando a mensagem é adicionada
  useEffect(() => {
    if (messageRef.current) {
      messageRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [message.id]);

  // Abrir o visualizador de anexos
  const openAttachmentViewer = () => {
    if (message.attachments && message.attachments.length > 0) {
      setViewerOpen(true);
    }
  };

  // Formatar a hora da mensagem
  const formattedTime = format(new Date(message.createdAt), 'HH:mm');

  return (
    <div
      ref={messageRef}
      className={cn(
        "relative flex mb-2 gap-2 max-w-[80%] group",
        isOwnMessage ? "ml-auto" : "mr-auto"
      )}
    >
      {!isOwnMessage && showAvatar && (
        <Avatar className="h-8 w-8 flex-shrink-0 mt-1">
          <AvatarFallback className={cn(
            isAdmin ? "bg-indigo-100 text-indigo-800" : "bg-primary/10 text-primary"
          )}>
            {senderName.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={cn(
        "flex flex-col",
        isOwnMessage && "items-end"
      )}>
        {showAvatar && !isOwnMessage && (
          <span className="text-xs text-muted-foreground mb-1 ml-1">
            {senderName}
          </span>
        )}
        
        <div className={cn(
          "rounded-lg px-3 py-2 text-sm break-words",
          isOwnMessage 
            ? "bg-primary text-primary-foreground" 
            : isAdmin
              ? "bg-indigo-100 text-indigo-800"
              : "bg-muted",
          hasAttachments && "space-y-2"
        )}>
          {(message.text || message.message || message.content) && (
            <p className="whitespace-pre-wrap">{message.message || message.text || message.content}</p>
          )}
          
          {hasAttachments && (
            <div className={cn(
              "flex flex-wrap gap-2",
              !hasContent && "mt-0"
            )}>
              {(message.attachments || []).map((attachment, index) => {
                // Detectar se é uma imagem
                let isImage = false;
                try {
                  const base64Data = attachment.split(',')[0];
                  isImage = base64Data.includes('image/');
                } catch (error) {
                  isImage = false;
                }
                
                if (isImage) {
                  return (
                    <div 
                      key={index} 
                      className="relative cursor-pointer group overflow-hidden"
                      onClick={openAttachmentViewer}
                    >
                      <img
                        src={attachment}
                        alt="Anexo"
                        className="rounded max-w-[150px] max-h-[150px] min-w-[80px] min-h-[80px] object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Download className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <button
                      key={index}
                      className={cn(
                        "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium",
                        isOwnMessage 
                          ? "bg-primary-foreground/20 text-white hover:bg-primary-foreground/30" 
                          : "bg-background text-foreground hover:bg-muted/80"
                      )}
                      onClick={openAttachmentViewer}
                    >
                      {getAttachmentIcon(attachment)}
                      <span>Anexo {index + 1}</span>
                    </button>
                  );
                }
              })}
            </div>
          )}
        </div>
        
        <div className={cn(
          "flex items-center gap-1 text-xs text-muted-foreground mt-0.5",
          isOwnMessage ? "justify-end" : "justify-start"
        )}>
          <span>{formattedTime}</span>
          {isOwnMessage && message.read && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger className="cursor-default">
                  <span className="text-blue-500 text-[10px]">✓✓</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Lido</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
      
      {isOwnMessage && showAvatar && (
        <Avatar className="h-8 w-8 flex-shrink-0 mt-1">
          <AvatarFallback className="bg-primary/10 text-primary">
            {user?.username?.substring(0, 2).toUpperCase() || 'AD'}
          </AvatarFallback>
        </Avatar>
      )}
      
      {viewerOpen && message.attachments && message.attachments.length > 0 && (
        <AdminChatAttachmentViewer 
          attachments={message.attachments} 
          onClose={() => setViewerOpen(false)} 
        />
      )}
    </div>
  );
}

// Componente para entrada de mensagem
export function AdminChatMessageInput({ 
  onSend, 
  disabled = false 
}: { 
  onSend: (text: string, attachments: string[]) => void; 
  disabled?: boolean;
}) {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Redimensionar a textarea automaticamente
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
  }, [text]);
  
  // Lidar com entrada de texto
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };
  
  // Lidar com o envio da mensagem
  const handleSend = () => {
    if ((text.trim() === '' && attachments.length === 0) || disabled) return;
    
    onSend(text, attachments);
    setText('');
    setAttachments([]);
  };
  
  // Selecionar arquivo
  const handleSelectFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Processar arquivo selecionado
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    
    const newAttachments: string[] = [...attachments];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Verificar tamanho do arquivo (1GB máximo)
      if (file.size > 1024 * 1024 * 1024) {
        alert(`O arquivo ${file.name} excede o limite de 1GB.`);
        continue;
      }
      
      try {
        const base64 = await convertFileToBase64(file);
        newAttachments.push(base64);
      } catch (error) {
        console.error('Erro ao converter arquivo:', error);
      }
    }
    
    setAttachments(newAttachments);
    setIsUploading(false);
    
    // Limpar input para permitir selecionar o mesmo arquivo novamente
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Converter arquivo para base64
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };
  
  // Remover anexo
  const removeAttachment = (index: number) => {
    const newAttachments = [...attachments];
    newAttachments.splice(index, 1);
    setAttachments(newAttachments);
  };
  
  // Detectar Ctrl+Enter para enviar
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t p-3">
      {/* Área de anexos */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 max-h-28 overflow-y-auto p-1">
          {attachments.map((attachment, index) => {
            // Verificar se é uma imagem
            let isImage = false;
            try {
              const base64Data = attachment.split(',')[0];
              isImage = base64Data.includes('image/');
            } catch (error) {
              isImage = false;
            }
            
            return (
              <div key={index} className="relative group">
                {isImage ? (
                  <div className="relative h-16 w-16 rounded overflow-hidden border">
                    <img
                      src={attachment}
                      alt={`Anexo ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <button
                      className="absolute top-0 right-0 p-0.5 bg-red-500 text-white rounded-bl-md opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeAttachment(index)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="relative flex items-center gap-1 rounded-md border px-2 py-1 text-xs">
                    <File className="h-3 w-3" />
                    <span>Anexo {index + 1}</span>
                    <button
                      className="ml-1 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeAttachment(index)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      
      {/* Input container */}
      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            className="w-full p-3 pr-10 rounded-md border resize-none min-h-[42px] max-h-[150px] focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Digite sua mensagem..."
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            rows={1}
          />
          <button
            className="absolute bottom-3 right-3 text-muted-foreground hover:text-primary transition-colors"
            onClick={handleSelectFile}
            disabled={disabled || isUploading}
          >
            <Paperclip className="h-5 w-5" />
          </button>
        </div>
        
        <Button
          onClick={handleSend}
          disabled={disabled || (text.trim() === '' && attachments.length === 0) || isUploading}
        >
          Enviar
        </Button>
      </div>
      
      {/* Input file escondido */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
        multiple
        accept="image/*,application/pdf,text/*,audio/*,video/*,application/zip,application/x-rar-compressed,application/x-7z-compressed"
      />
      
      {/* Dica de uso */}
      <div className="text-xs text-muted-foreground mt-1 text-center">
        Pressione Ctrl+Enter para enviar
      </div>
    </div>
  );
}