import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Clock, User } from "lucide-react";
import { useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export const DonationHistory = () => {
  const { data: doacoes, refetch } = useQuery({
    queryKey: ["doacoes-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("doacoes")
        .select("*")
        .order("data", { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("doacoes-history-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "doacoes",
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatTimeAgo = (date: string) => {
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: ptBR,
    });
  };

  return (
    <div className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
      <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Clock className="w-6 h-6 text-accent" />
        Últimas Doações
      </h3>
      <div className="space-y-3">
        {doacoes && doacoes.length > 0 ? (
          doacoes.map((doacao) => (
            <Card
              key={doacao.id}
              className="p-4 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-semibold">{doacao.nome_doador}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatTimeAgo(doacao.data)}
                    </p>
                  </div>
                </div>
                <p className="text-xl font-bold text-accent">
                  {formatCurrency(Number(doacao.valor))}
                </p>
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              Nenhuma doação registrada ainda. Seja o primeiro! 🌟
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};
