import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Target } from "lucide-react";
import { useEffect } from "react";

export const ProgressBar = () => {
  const meta = 5000; // Meta de R$ 5.000,00

  const { data: total, refetch } = useQuery({
    queryKey: ["total-progress"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("doacoes")
        .select("valor");
      
      if (error) throw error;
      
      const sum = data.reduce((acc, curr) => acc + Number(curr.valor), 0);
      return sum;
    },
  });

  const { data: totalDoacoes, refetch: refetchCount } = useQuery({
    queryKey: ["count-doacoes"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("doacoes")
        .select("*", { count: "exact", head: true });
      
      if (error) throw error;
      // Subtrair 1 para não contar a doação inicial
      return (count || 0) - 1;
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("progress-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "doacoes",
        },
        () => {
          refetch();
          refetchCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch, refetchCount]);

  const percentage = total ? Math.min((total / meta) * 100, 100) : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="card-gold animate-slide-up" style={{ animationDelay: "0.1s" }}>
      <div className="flex items-center gap-2 mb-3">
        <Target className="w-5 h-5 text-accent" />
        <h3 className="text-lg font-semibold">Meta da Campanha</h3>
      </div>
      
      <div className="space-y-3">
        <Progress value={percentage} className="h-3" />
        
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            {total !== undefined ? formatCurrency(total) : "R$ 0,00"}
          </span>
          <span className="font-semibold text-accent">
            {formatCurrency(meta)}
          </span>
        </div>
        
        <div className="text-center pt-2 border-t border-border">
          <p className="text-sm text-muted-foreground">
            <span className="font-bold text-accent">{totalDoacoes || 0}</span> pessoa(s) já contribuíram 🎉
          </p>
        </div>
      </div>
    </div>
  );
};
