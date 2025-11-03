import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { HeartHandshake } from "lucide-react";
import { useEffect } from "react";

export const TotalCard = () => {
  const { data: total, refetch } = useQuery({
    queryKey: ["total-doacoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("doacoes")
        .select("valor");
      
      if (error) throw error;
      
      const sum = data.reduce((acc, curr) => acc + Number(curr.valor), 0);
      return sum;
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("doacoes-changes")
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

  return (
    <div className="card-gold animate-slide-up">
      <div className="flex items-center justify-center gap-3 mb-4">
        <HeartHandshake className="w-8 h-8 text-accent" />
        <h2 className="text-2xl font-bold text-foreground">Total Arrecadado</h2>
      </div>
      <div className="text-center">
        <p className="text-6xl font-extrabold text-gradient mb-2">
          {total !== undefined ? formatCurrency(total) : "Carregando..."}
        </p>
        <p className="text-muted-foreground text-lg">
          Cada real faz a diferença! 💛
        </p>
      </div>
    </div>
  );
};
