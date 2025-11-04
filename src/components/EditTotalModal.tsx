import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Minus } from "lucide-react";

interface EditTotalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTotal: number;
  onSuccess: () => void;
}

export const EditTotalModal = ({ open, onOpenChange, currentTotal, onSuccess }: EditTotalModalProps) => {
  const [valor, setValor] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdjustment = async (type: "add" | "subtract") => {
    const amount = parseFloat(valor);
    
    if (!amount || amount <= 0) {
      toast.error("Por favor, insira um valor válido");
      return;
    }

    setLoading(true);

    try {
      const adjustedAmount = type === "add" ? amount : -amount;
      const nome = type === "add" ? "Ajuste Manual (Adição)" : "Ajuste Manual (Subtração)";

      const { error } = await supabase.from("doacoes").insert({
        nome_doador: nome,
        valor: adjustedAmount,
        metodo: "pix",
      });

      if (error) throw error;

      toast.success(`Valor ${type === "add" ? "adicionado" : "subtraído"} com sucesso!`);
      setValor("");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error("Erro ao ajustar o total. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Ajustar Total Arrecadado
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Total Atual</Label>
            <div className="text-2xl font-bold text-primary">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(currentTotal)}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="valor">Valor do Ajuste (R$)</Label>
            <Input
              id="valor"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button
            onClick={() => handleAdjustment("add")}
            disabled={loading}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar
          </Button>
          <Button
            onClick={() => handleAdjustment("subtract")}
            disabled={loading}
            variant="destructive"
            className="flex-1"
          >
            <Minus className="w-4 h-4 mr-2" />
            Subtrair
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};