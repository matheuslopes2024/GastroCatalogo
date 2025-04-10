import { useState, useRef, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { 
  Upload, 
  Trash2, 
  Check,
  Image as ImageIcon, 
  X, 
  Star,
  RefreshCcw
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { FormControl, FormDescription, FormLabel, FormMessage } from "./form";
import { Card, CardContent } from "./card";
import { FormItem } from "./form";
import { useToast } from "@/hooks/use-toast";

export type ProductImage = {
  id?: number;
  productId?: number;
  imageUrl?: string | null;
  imageData?: string | null;
  imageType?: string | null;
  isPrimary?: boolean;
  sortOrder?: number;
  file?: File; // Para novos uploads
  previewUrl?: string; // Para visualização local
  isNew?: boolean; // Para indicar que é uma nova imagem
  isUploading?: boolean; // Para indicar que está em processo de upload
  uploadProgress?: number; // Progresso de upload
};

interface MultiImageUploadProps {
  productId?: number;
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
  maxImages?: number;
  showLabels?: boolean;
  disabled?: boolean;
  storeDataInDatabase?: boolean;
}

export function MultiImageUpload({
  productId,
  images = [],
  onChange,
  maxImages = 8,
  showLabels = true,
  disabled = false,
  storeDataInDatabase = true
}: MultiImageUploadProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Upload de uma imagem
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const files = Array.from(e.target.files);
    if (images.length + files.length > maxImages) {
      toast({
        title: "Limite excedido",
        description: `Você pode adicionar no máximo ${maxImages} imagens.`,
        variant: "destructive",
      });
      return;
    }

    // Para cada arquivo selecionado
    for (const file of files) {
      // Verifica se é uma imagem válida
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Formato inválido",
          description: "Por favor, selecione apenas arquivos de imagem.",
          variant: "destructive",
        });
        continue;
      }

      // Cria objeto de imagem temporário com preview local
      const previewUrl = URL.createObjectURL(file);
      const newImage: ProductImage = {
        imageData: null,
        imageType: file.type,
        file,
        previewUrl,
        isNew: true,
        isPrimary: images.length === 0, // Primeira imagem é a principal
        sortOrder: images.length,
        isUploading: false
      };

      // Se for para armazenar direto no banco
      if (storeDataInDatabase) {
        // Se já temos um productId, fazemos upload direto
        if (productId) {
          await uploadImageToServer(newImage, productId);
        } else {
          // Senão, apenas adicionamos à lista para upload posterior
          onChange([...images, newImage]);
        }
      } else {
        // Apenas convertemos para base64 e adicionamos
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            const base64 = event.target.result.toString();
            newImage.imageData = base64;
            onChange([...images, newImage]);
          }
        };
        reader.readAsDataURL(file);
      }
    }
    
    // Limpa input para permitir selecionar os mesmos arquivos novamente
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Upload da imagem para o servidor
  const uploadImageToServer = async (image: ProductImage, prodId: number) => {
    if (!image.file) return;
    
    setIsLoading(true);
    try {
      // Marca imagem como em upload
      const updatedImages = [...images];
      const imageIndex = updatedImages.findIndex(img => img.previewUrl === image.previewUrl);
      if (imageIndex >= 0) {
        updatedImages[imageIndex] = { ...updatedImages[imageIndex], isUploading: true };
        onChange(updatedImages);
      } else {
        const newImage = { ...image, isUploading: true };
        onChange([...images, newImage]);
      }

      // Prepara FormData para upload
      const formData = new FormData();
      formData.append("image", image.file);
      formData.append("productId", prodId.toString());
      formData.append("isPrimary", image.isPrimary ? "true" : "false");
      formData.append("sortOrder", (image.sortOrder || 0).toString());
      
      console.log("Enviando upload de imagem:", {
        productId: prodId,
        isPrimary: image.isPrimary,
        hasFile: !!image.file,
        fileName: image.file.name,
        fileType: image.file.type,
        fileSize: image.file.size,
        sortOrder: image.sortOrder || 0
      });
      
      // Envia para API
      const response = await apiRequest("POST", "/api/upload-product-image", formData);
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Erro ao fazer upload da imagem");
      }
      
      // Atualiza a lista com a imagem salva vinda do servidor
      if (data.image) {
        const updatedImages = [...images];
        // Se foi encontrada a imagem temporária, substitui pela salva
        const imageIndex = updatedImages.findIndex(img => img.previewUrl === image.previewUrl);
        if (imageIndex >= 0) {
          updatedImages[imageIndex] = { 
            ...data.image, 
            previewUrl: image.previewUrl, 
            isUploading: false 
          };
        } else {
          updatedImages.push({ ...data.image, isUploading: false });
        }
        onChange(updatedImages);
      }

      toast({
        title: "Upload concluído",
        description: "A imagem foi salva com sucesso",
      });
    } catch (error: any) {
      console.error("Erro ao fazer upload da imagem:", error);
      toast({
        title: "Erro no upload",
        description: error.message || "Não foi possível fazer o upload da imagem",
        variant: "destructive",
      });
      
      // Atualiza a imagem como falha
      const updatedImages = [...images];
      const imageIndex = updatedImages.findIndex(img => img.previewUrl === image.previewUrl);
      if (imageIndex >= 0) {
        updatedImages[imageIndex] = { ...updatedImages[imageIndex], isUploading: false };
        onChange(updatedImages);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Remover uma imagem
  const handleRemoveImage = (index: number) => {
    // Se a imagem for a primária, define a próxima como primária
    const updatedImages = [...images];
    const removedImage = updatedImages[index];
    
    // Remove a imagem
    updatedImages.splice(index, 1);
    
    // Se a imagem removida era a primária, define a primeira como primária
    if (removedImage.isPrimary && updatedImages.length > 0) {
      updatedImages[0] = { ...updatedImages[0], isPrimary: true };
    }
    
    // Atualiza ordenação
    updatedImages.forEach((img, i) => {
      updatedImages[i] = { ...img, sortOrder: i };
    });
    
    onChange(updatedImages);

    // Se a imagem já tinha ID (salva no servidor), faríamos a requisição de DELETE
    if (removedImage.id && productId) {
      apiRequest("DELETE", `/api/product-images/${removedImage.id}`)
        .catch(err => {
          console.error("Erro ao excluir imagem:", err);
          toast({
            title: "Erro ao excluir",
            description: "Não foi possível excluir a imagem do servidor",
            variant: "destructive",
          });
        });
    }
  };

  // Definir uma imagem como principal
  const handleSetPrimary = (index: number) => {
    const updatedImages = [...images];
    
    // Desmarca todas como não primárias
    updatedImages.forEach(img => {
      img.isPrimary = false;
    });
    
    // Define a selecionada como primária
    updatedImages[index] = { ...updatedImages[index], isPrimary: true };
    
    onChange(updatedImages);

    // Se o produto já existe, atualiza no servidor
    if (productId && updatedImages[index].id) {
      apiRequest("PATCH", `/api/product-images/${updatedImages[index].id}/set-primary`, {
        productId,
      }).catch(err => {
        console.error("Erro ao definir imagem principal:", err);
        toast({
          title: "Erro",
          description: "Não foi possível definir a imagem como principal",
          variant: "destructive",
        });
      });
    }
  };

  return (
    <FormItem>
      {showLabels && (
        <FormLabel>Imagens do produto</FormLabel>
      )}
      <FormControl>
        <div className="space-y-3">
          {/* Previews */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map((image, index) => (
              <Card key={index} className="relative overflow-hidden group">
                <CardContent className="p-0">
                  <div 
                    className="w-full aspect-square relative"
                    style={{ backgroundColor: '#f3f4f6' }}
                  >
                    <img
                      src={image.previewUrl || image.imageUrl || ""}
                      alt={`Imagem ${index + 1}`}
                      className="w-full h-full object-contain" // object-contain para não cortar
                      style={{ maxHeight: "200px" }}
                    />
                    
                    {/* Indicador de imagem principal */}
                    {image.isPrimary && (
                      <div className="absolute top-1 left-1 bg-yellow-500 text-white p-1 rounded-full">
                        <Star className="h-3 w-3" />
                      </div>
                    )}
                    
                    {/* Indicador de upload em andamento */}
                    {image.isUploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60">
                        <RefreshCcw className="h-8 w-8 text-white animate-spin" />
                      </div>
                    )}
                    
                    {/* Botões de ação somente visíveis no hover */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-40">
                      <div className="flex space-x-1">
                        {/* Botão para definir como primária */}
                        {!image.isPrimary && (
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 bg-white hover:bg-yellow-500 hover:text-white"
                            onClick={() => handleSetPrimary(index)}
                            disabled={disabled || image.isUploading}
                          >
                            <Star className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {/* Botão para remover */}
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 bg-white hover:bg-red-500 hover:text-white"
                          onClick={() => handleRemoveImage(index)}
                          disabled={disabled || image.isUploading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {/* Botão para adicionar mais imagens */}
            {images.length < maxImages && (
              <Card className="border-dashed cursor-pointer hover:border-primary hover:bg-gray-50 transition-colors">
                <CardContent className="p-0">
                  <div 
                    className="w-full aspect-square flex flex-col items-center justify-center text-gray-400 hover:text-primary"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-8 w-8 mb-2" />
                    <span className="text-sm font-medium">Adicionar</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Input para seleção de arquivo (oculto) */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
            multiple
            disabled={disabled || isLoading}
          />
          
          <FormDescription>
            Adicione até {maxImages} imagens do seu produto. A primeira imagem será usada como capa.
            Você pode definir qual imagem será a principal clicando no ícone de estrela.
          </FormDescription>
        </div>
      </FormControl>
      <FormMessage />
    </FormItem>
  );
}