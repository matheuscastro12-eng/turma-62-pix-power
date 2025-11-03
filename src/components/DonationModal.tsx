import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Check, Upload, FileCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

interface DonationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const donationSchema = z.object({
  nome_doador: z.string()
    .trim()
    .max(100, "Nome deve ter no máximo 100 caracteres")
    .regex(/^[a-zA-ZÀ-ÿ\s]*$/, "Nome deve conter apenas letras")
    .optional()
    .default("Anônimo"),
  valor: z.number()
    .positive("Valor deve ser positivo")
    .min(0.01, "Valor mínimo é R$ 0,01")
    .max(100000, "Valor máximo é R$ 100.000,00"),
  metodo: z.literal("pix"),
  comprovante_url: z.string().url("URL inválida"),
});

export const DonationModal = ({ open, onOpenChange }: DonationModalProps) => {
  const [nome, setNome] = useState("");
  const [valor, setValor] = useState("");
  const [copied, setCopied] = useState(false);
  const [comprovante, setComprovante] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const pixKey = "62comissaolxii@gmail.com";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(pixKey);
    setCopied(true);
    toast.success("Chave PIX copiada!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de arquivo (apenas imagens)
      if (!file.type.startsWith("image/")) {
        toast.error("Por favor, envie apenas imagens (JPG, PNG, etc.)");
        return;
      }
      // Validar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("O arquivo deve ter no máximo 5MB");
        return;
      }
      setComprovante(file);
      toast.success("Comprovante selecionado!");
    }
  };

  const handleConfirm = async () => {
    if (!comprovante) {
      toast.error("Por favor, envie o comprovante de pagamento");
      return;
    }

    setUploading(true);

    try {
      // Validate input with zod
      const validatedData = donationSchema.parse({
        nome_doador: nome.trim() || "Anônimo",
        valor: parseFloat(valor),
        metodo: "pix",
        comprovante_url: "placeholder", // Will be replaced after upload
      });

      // 1. Upload do comprovante
      const fileExt = comprovante.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("comprovantes")
        .upload(filePath, comprovante);

      if (uploadError) throw uploadError;

      // 2. Obter URL pública do comprovante
      const { data: urlData } = supabase.storage
        .from("comprovantes")
        .getPublicUrl(filePath);

      // 3. Registrar doação com comprovante
      const { error: insertError } = await supabase.from("doacoes").insert({
        nome_doador: validatedData.nome_doador,
        valor: validatedData.valor,
        metodo: validatedData.metodo,
        comprovante_url: urlData.publicUrl,
      });

      if (insertError) throw insertError;

      toast.success("Doação registrada com sucesso! Muito obrigado! 🎉");
      setNome("");
      setValor("");
      setComprovante(null);
      onOpenChange(false);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else if (import.meta.env.DEV) {
        console.error("Erro ao registrar doação:", error);
        toast.error("Erro ao registrar doação. Tente novamente.");
      } else {
        toast.error("Erro ao registrar doação. Tente novamente.");
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-gradient">
            Faça sua Doação ❤️
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {/* QR Code */}
          <div className="flex justify-center">
            <div className="bg-white p-4 rounded-lg">
              <QRCodeSVG value={pixKey} size={200} />
            </div>
          </div>

          {/* Chave PIX */}
          <div className="space-y-2">
            <Label htmlFor="pix-key">Chave PIX</Label>
            <div className="flex gap-2">
              <Input
                id="pix-key"
                value={pixKey}
                readOnly
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopy}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Formulário */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Seu Nome (opcional)</Label>
              <Input
                id="nome"
                placeholder="Anônimo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor">Valor da Doação (R$)</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="10.00"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
              />
            </div>

            {/* Upload do Comprovante */}
            <div className="space-y-2">
              <Label htmlFor="comprovante">
                Comprovante de Pagamento <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="comprovante"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => document.getElementById("comprovante")?.click()}
                >
                  {comprovante ? (
                    <>
                      <FileCheck className="w-4 h-4 mr-2 text-green-500" />
                      {comprovante.name}
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Selecionar Comprovante
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Envie uma foto do comprovante do PIX (máximo 5MB)
              </p>
            </div>
          </div>

          {/* Botão de Confirmar */}
          <Button
            onClick={handleConfirm}
            className="w-full btn-hero text-lg py-6"
            disabled={uploading || !comprovante}
          >
            {uploading ? "Enviando..." : "Confirmar Doação"}
          </Button>

          <p className="text-sm text-muted-foreground text-center">
            ⚠️ É obrigatório enviar o comprovante do PIX para registrar a doação! 
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
