import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DonationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DonationModal = ({ open, onOpenChange }: DonationModalProps) => {
  const [nome, setNome] = useState("");
  const [valor, setValor] = useState("");
  const [copied, setCopied] = useState(false);
  const pixKey = "62comissaolxii@gmail.com";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(pixKey);
    setCopied(true);
    toast.success("Chave PIX copiada!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirm = async () => {
    if (!valor || parseFloat(valor) <= 0) {
      toast.error("Por favor, insira um valor válido");
      return;
    }

    try {
      const { error } = await supabase.from("doacoes").insert({
        nome_doador: nome.trim() || "Anônimo",
        valor: parseFloat(valor),
        metodo: "pix",
      });

      if (error) throw error;

      toast.success("Doação registrada com sucesso! Muito obrigado! 🎉");
      setNome("");
      setValor("");
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao registrar doação:", error);
      toast.error("Erro ao registrar doação. Tente novamente.");
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
          </div>

          {/* Botão de Confirmar */}
          <Button
            onClick={handleConfirm}
            className="w-full btn-hero text-lg py-6"
          >
            Confirmar Doação
          </Button>

          <p className="text-sm text-muted-foreground text-center">
            Após fazer o PIX, confirme sua doação aqui para atualizar o painel! 🙏
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
