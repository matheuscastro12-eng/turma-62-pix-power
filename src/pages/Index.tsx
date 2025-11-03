import { useState } from "react";
import { Button } from "@/components/ui/button";
import { HandHeart, Sparkles } from "lucide-react";
import { TotalCard } from "@/components/TotalCard";
import { DonationModal } from "@/components/DonationModal";
import { DonationHistory } from "@/components/DonationHistory";
import { ProgressBar } from "@/components/ProgressBar";

const Index = () => {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/95 via-background to-primary/80 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="text-center mb-12 animate-slide-up">
          <div className="flex items-center justify-center gap-3 mb-4">
            <HandHeart className="w-12 h-12 text-accent animate-pulse-soft" />
            <h1 className="text-4xl md:text-6xl font-extrabold text-white">
              Turma 62 Solidária
            </h1>
            <Sparkles className="w-12 h-12 text-accent animate-pulse-soft" />
          </div>
          <p className="text-xl md:text-2xl text-white/90 font-light">
            Juntos pela arrecadação de alimentos 🍎🥖
          </p>
        </header>

        {/* Main Content */}
        <div className="grid gap-8 mb-8">
          {/* Total Arrecadado */}
          <TotalCard />

          {/* Botão Principal */}
          <div className="flex justify-center animate-slide-up" style={{ animationDelay: "0.15s" }}>
            <Button
              onClick={() => setModalOpen(true)}
              className="btn-hero text-xl md:text-2xl py-8 px-12"
              size="lg"
            >
              <HandHeart className="w-6 h-6 mr-2" />
              Fazer uma Doação
            </Button>
          </div>

          {/* Barra de Progresso */}
          <ProgressBar />

          {/* Histórico de Doações */}
          <DonationHistory />
        </div>

        {/* Footer */}
        <footer className="text-center text-white/80 py-8 animate-slide-up" style={{ animationDelay: "0.3s" }}>
          <p className="text-lg">
            Feito com ❤️ pela <span className="font-bold text-accent">Turma 62</span>
          </p>
          <p className="text-sm mt-2">
            Cada doação transforma vidas e fortalece nossa comunidade 🌟
          </p>
        </footer>

        {/* Modal de Doação */}
        <DonationModal open={modalOpen} onOpenChange={setModalOpen} />
      </div>
    </div>
  );
};

export default Index;
