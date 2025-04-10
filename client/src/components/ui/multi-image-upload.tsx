import { useState, useRef, useEffect } from "react";
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  RotateCw, 
  Camera,
  Check, 
  Trash2,
  ArrowLeft,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface MultiImageUploadProps {
  productId: number;
  initialImages?: Array<{id?: number, url?: string, data?: string, type?: string}>;
  maxImages?: number;
  onImagesUpdated?: (newImages: Array<{id?: number, url?: string, data?: string, type?: string}>) => void;
}

export function MultiImageUpload({ 
  productId, 
  initialImages = [], 
  maxImages = 8,
  onImagesUpdated 
}: MultiImageUploadProps) {
  const [images, setImages] = useState<Array<{id?: number, url?: string, data?: string, type?: string}>>(initialImages);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Atualizar o estado quando as imagens iniciais mudarem
    setImages(initialImages);
  }, [JSON.stringify(initialImages)]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = async (files: FileList) => {
    if (images.length + files.length > maxImages) {
      toast({
        title: "Limite de imagens excedido",
        description: `Você pode enviar no máximo ${maxImages} imagens. Selecione menos arquivos.`,
        variant: "destructive",
      });
      return;
    }

    // Verificar tipos de arquivo permitidos
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    const validFiles = Array.from(files).filter(file => allowedTypes.includes(file.type));
    
    if (validFiles.length !== files.length) {
      toast({
        title: "Formato de arquivo inválido",
        description: "Apenas imagens nos formatos JPEG, JPG, PNG, GIF e WEBP são permitidas.",
        variant: "destructive",
      });
    }

    if (validFiles.length === 0) return;

    setIsUploading(true);
    
    try {
      const newImages = [...images];
      
      for (const file of validFiles) {
        const base64Data = await convertToBase64(file);
        newImages.push({
          data: base64Data,
          type: file.type,
        });
      }

      setImages(newImages);
      
      if (onImagesUpdated) {
        onImagesUpdated(newImages);
      }

      // Enviar para o servidor
      try {
        for (let i = images.length; i < newImages.length; i++) {
          const image = newImages[i];
          const response = await fetch(`/api/products/${productId}/images`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageData: image.data,
              imageType: image.type,
              isPrimary: i === 0 && images.length === 0, // Primeira imagem é principal se for a primeira
              sortOrder: i
            }),
          });

          if (!response.ok) {
            throw new Error('Falha ao salvar imagem');
          }

          const savedImage = await response.json();
          newImages[i] = {
            ...newImages[i],
            id: savedImage.id
          };
        }

        setImages(newImages);
        
        if (onImagesUpdated) {
          onImagesUpdated(newImages);
        }

        toast({
          title: "Imagens enviadas com sucesso",
          description: `${validFiles.length} ${validFiles.length === 1 ? 'imagem' : 'imagens'} foram enviadas com sucesso.`,
        });
      } catch (error) {
        console.error("Erro ao salvar imagens:", error);
        toast({
          title: "Erro ao salvar imagens",
          description: "Ocorreu um erro ao salvar as imagens no servidor.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao processar arquivos:", error);
      toast({
        title: "Erro ao processar imagens",
        description: "Ocorreu um erro ao processar as imagens selecionadas.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Limpar o input de arquivo para permitir selecionar o mesmo arquivo novamente
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleDeleteImage = async (index: number) => {
    const imageToDelete = images[index];
    
    if (!imageToDelete) return;
    
    try {
      // Se a imagem tem ID, excluí-la do servidor
      if (imageToDelete.id) {
        const response = await fetch(`/api/products/images/${imageToDelete.id}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error('Falha ao excluir imagem do servidor');
        }
      }
      
      // Remover do estado local
      const newImages = [...images];
      newImages.splice(index, 1);
      setImages(newImages);
      
      if (onImagesUpdated) {
        onImagesUpdated(newImages);
      }
      
      toast({
        title: "Imagem excluída",
        description: "A imagem foi excluída com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao excluir imagem:", error);
      toast({
        title: "Erro ao excluir imagem",
        description: "Ocorreu um erro ao excluir a imagem.",
        variant: "destructive",
      });
    }
  };

  const handleSetPrimary = async (index: number) => {
    try {
      // Definir como imagem principal no servidor
      const imageToSetPrimary = images[index];
      
      if (!imageToSetPrimary || !imageToSetPrimary.id) {
        throw new Error('Imagem inválida');
      }
      
      const response = await fetch(`/api/products/images/${imageToSetPrimary.id}`, {
        method: 'PUT',
      });
      
      if (!response.ok) {
        throw new Error('Falha ao definir imagem principal');
      }
      
      toast({
        title: "Imagem principal atualizada",
        description: "A imagem principal do produto foi atualizada com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao definir imagem principal:", error);
      toast({
        title: "Erro ao definir imagem principal",
        description: "Ocorreu um erro ao definir a imagem principal.",
        variant: "destructive",
      });
    }
  };

  const handleMoveImage = async (index: number, direction: 'left' | 'right') => {
    if ((direction === 'left' && index === 0) || 
        (direction === 'right' && index === images.length - 1)) {
      return;
    }
    
    const newIndex = direction === 'left' ? index - 1 : index + 1;
    
    // Reordenar no array local
    const newImages = [...images];
    const temp = newImages[index];
    newImages[index] = newImages[newIndex];
    newImages[newIndex] = temp;
    
    setImages(newImages);
    
    if (onImagesUpdated) {
      onImagesUpdated(newImages);
    }
    
    try {
      // Atualizar ordem no servidor
      const imagesToUpdate = [
        { id: newImages[index].id, sortOrder: index },
        { id: newImages[newIndex].id, sortOrder: newIndex }
      ];
      
      for (const img of imagesToUpdate) {
        if (img.id) {
          await fetch(`/api/products/images/${img.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sortOrder: img.sortOrder }),
          });
        }
      }
    } catch (error) {
      console.error("Erro ao reordenar imagens:", error);
      toast({
        title: "Erro ao reordenar imagens",
        description: "As imagens foram reordenadas localmente, mas houve um erro ao salvar a ordem no servidor.",
        variant: "destructive",
      });
    }
  };

  const getImageUrl = (image: {id?: number, url?: string, data?: string, type?: string}) => {
    // Prioridade: URL externa > Dados em base64 > Endpoint da API
    if (image.url) return image.url;
    if (image.data) return image.data;
    if (image.id) return `/api/products/images/${image.id}`;
    return "";
  };

  return (
    <div className="w-full space-y-4">
      {/* Área de Upload */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 
          flex flex-col items-center justify-center 
          transition-colors 
          ${isDragging ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary/50'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{ cursor: 'pointer' }}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          multiple
          disabled={isUploading || images.length >= maxImages}
        />
        
        {isUploading ? (
          <div className="flex flex-col items-center text-gray-500">
            <RotateCw className="h-10 w-10 animate-spin mb-2" />
            <p className="text-sm font-medium">Enviando imagens...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center text-gray-500">
            <Upload className="h-10 w-10 mb-2" />
            <p className="text-sm font-medium">
              {images.length >= maxImages 
                ? `Limite máximo de ${maxImages} imagens atingido` 
                : 'Clique ou arraste imagens para fazer upload'}
            </p>
            <p className="text-xs mt-1">
              {images.length < maxImages 
                ? `Formatos aceitos: JPEG, PNG, GIF, WEBP (máx. ${maxImages} imagens)` 
                : 'Remova imagens para adicionar novas'}
            </p>
            <p className="text-xs mt-1">
              {images.length < maxImages 
                ? `${images.length} de ${maxImages} imagens` 
                : ''}
            </p>
          </div>
        )}
      </div>

      {/* Galeria de Miniaturas */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
          {images.map((image, index) => (
            <div 
              key={index} 
              className="relative group border rounded-lg overflow-hidden aspect-square"
            >
              <img
                src={getImageUrl(image)}
                alt={`Imagem ${index + 1}`}
                className="w-full h-full object-cover"
                onClick={() => {
                  setPreviewIndex(index);
                  setShowPreview(true);
                }}
              />
              
              {/* Overlay com ações */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="secondary" 
                    className="w-8 h-8 p-0 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewIndex(index);
                      setShowPreview(true);
                    }}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="secondary" 
                    className="w-8 h-8 p-0 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetPrimary(index);
                    }}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    className="w-8 h-8 p-0 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteImage(index);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex gap-2 mt-2">
                  <Button 
                    size="sm" 
                    variant="secondary" 
                    className="w-8 h-8 p-0 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMoveImage(index, 'left');
                    }}
                    disabled={index === 0}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="secondary" 
                    className="w-8 h-8 p-0 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMoveImage(index, 'right');
                    }}
                    disabled={index === images.length - 1}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
                
                {index === 0 && (
                  <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                    Principal
                  </div>
                )}
              </div>
              
              {/* Indicador de imagem principal (visível sempre) */}
              {index === 0 && (
                <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                  Principal
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Diálogo de Visualização */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Visualização da Imagem</DialogTitle>
            <DialogDescription>
              Imagem {previewIndex + 1} de {images.length}
            </DialogDescription>
          </DialogHeader>
          
          <div className="relative w-full aspect-video mx-auto overflow-hidden border rounded-lg">
            {images[previewIndex] && (
              <img
                src={getImageUrl(images[previewIndex])}
                alt={`Visualização da imagem ${previewIndex + 1}`}
                className="w-full h-full object-contain"
              />
            )}
          </div>
          
          <DialogFooter className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setPreviewIndex(prev => (prev > 0 ? prev - 1 : images.length - 1))}
                disabled={images.length <= 1}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Anterior
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setPreviewIndex(prev => (prev < images.length - 1 ? prev + 1 : 0))}
                disabled={images.length <= 1}
              >
                Próxima
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => handleSetPrimary(previewIndex)}
              >
                <Check className="h-4 w-4 mr-2" />
                Definir como Principal
              </Button>
              
              <Button
                variant="destructive"
                onClick={() => {
                  handleDeleteImage(previewIndex);
                  if (images.length <= 1) {
                    setShowPreview(false);
                  } else if (previewIndex === images.length - 1) {
                    setPreviewIndex(previewIndex - 1);
                  }
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}