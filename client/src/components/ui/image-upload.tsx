import { useState, useRef, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, Image as ImageIcon, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ImageUploadProps {
  productId: number;
  imageUrl?: string | null;
  onImageUploaded?: (newImageUrl: string) => void;
}

export function ImageUpload({ productId, imageUrl, onImageUploaded }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(imageUrl || null);
  const [isHovering, setIsHovering] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erro no upload",
        description: "O arquivo selecionado não é uma imagem válida.",
        variant: "destructive"
      });
      return;
    }

    // Validar tamanho (limitar a 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erro no upload",
        description: "A imagem deve ter no máximo 5MB.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsUploading(true);

      // Criar preview
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Converter para base64 para envio
      const base64 = await convertToBase64(file);
      
      // Extrair os dados e o tipo
      const [prefix, imageData] = base64.split(',');
      const imageType = prefix.split(':')[1].split(';')[0];

      // Fazer upload para o servidor
      const response = await apiRequest("POST", "/api/upload-product-image", {
        productId,
        imageData,
        imageType
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Imagem enviada",
          description: "A imagem do produto foi atualizada com sucesso.",
        });

        // Criar URL para a imagem no servidor
        const serverImageUrl = `/api/product-image/${productId}`;
        
        // Notificar o componente pai
        if (onImageUploaded) {
          onImageUploaded(serverImageUrl);
        }
      } else {
        throw new Error(result.message || "Erro ao enviar imagem");
      }
    } catch (error: any) {
      toast({
        title: "Erro no upload",
        description: error.message || "Ocorreu um erro ao enviar a imagem.",
        variant: "destructive"
      });
      console.error("Erro ao fazer upload:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClearImage = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOpenFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Função para converter arquivo para base64
  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  return (
    <div className="flex flex-col items-center">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {preview ? (
        <div 
          className="relative w-full h-40 mb-2 rounded-md overflow-hidden border border-border"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <img
            src={preview}
            alt="Preview da imagem"
            className="w-full h-full object-cover"
          />
          {isHovering && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleOpenFileDialog}
                className="text-white mr-2"
              >
                <Upload className="h-5 w-5 mr-1" />
                Trocar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearImage}
                className="text-white"
              >
                <XCircle className="h-5 w-5 mr-1" />
                Remover
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={handleOpenFileDialog}
          className="w-full h-40 mb-2 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors"
        >
          <ImageIcon className="h-10 w-10 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500">
            Clique para adicionar uma imagem
          </p>
          <p className="text-xs text-gray-400 mt-1">
            JPG, PNG ou GIF (máx. 5MB)
          </p>
        </div>
      )}

      {isUploading && (
        <div className="flex items-center mt-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Enviando imagem...
        </div>
      )}

      {!preview && !isUploading && (
        <Button
          onClick={handleOpenFileDialog}
          variant="outline"
          size="sm"
          className="mt-2"
        >
          <Upload className="h-4 w-4 mr-2" />
          Selecionar imagem
        </Button>
      )}
    </div>
  );
}