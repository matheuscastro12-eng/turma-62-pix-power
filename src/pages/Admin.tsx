import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { LogOut, ExternalLink, HeartHandshake, Edit } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { EditTotalModal } from "@/components/EditTotalModal";

const Admin = () => {
  const navigate = useNavigate();
  const [adminName, setAdminName] = useState("");
  const [editModalOpen, setEditModalOpen] = useState(false);

  const { data: doacoes, refetch } = useQuery({
    queryKey: ["admin-doacoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("doacoes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: total, refetch: refetchTotal } = useQuery({
    queryKey: ["admin-total"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("doacoes")
        .select("valor");

      if (error) throw error;
      return data.reduce((acc, curr) => acc + Number(curr.valor), 0);
    },
  });

  useEffect(() => {
    const getAdminInfo = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: adminData } = await supabase
          .from("admin_users")
          .select("name")
          .eq("user_id", user.id)
          .single();

        if (adminData) {
          setAdminName(adminData.name);
        }
      }
    };
    getAdminInfo();

    // Real-time updates
    const channel = supabase
      .channel("admin-doacoes-changes")
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logout realizado com sucesso");
    navigate("/");
  };

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

  const viewReceipt = async (url: string) => {
    try {
      // Extract file path from URL
      const urlParts = url.split("/");
      const fileName = urlParts[urlParts.length - 1];
      
      // Generate signed URL for private bucket
      const { data, error } = await supabase.storage
        .from("comprovantes")
        .createSignedUrl(fileName, 3600); // 1 hour expiry

      if (error) throw error;

      window.open(data.signedUrl, "_blank");
    } catch (error) {
      toast.error("Erro ao abrir comprovante");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="container mx-auto p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gradient mb-2">
              Painel Administrativo
            </h1>
            <p className="text-muted-foreground">
              Bem-vindo, {adminName || "Administrador"}
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="gap-2">
            <LogOut className="w-4 h-4" />
            Sair
          </Button>
        </div>

        {/* Stats Card */}
        <Card className="mb-8 border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HeartHandshake className="w-6 h-6 text-primary" />
                Resumo da Campanha
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditModalOpen(true)}
                className="gap-2"
              >
                <Edit className="w-4 h-4" />
                Ajustar Total
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Arrecadado</p>
              <p className="text-3xl font-bold text-gradient">
                {total !== undefined ? formatCurrency(total) : "R$ 0,00"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total de Doações</p>
              <p className="text-3xl font-bold text-foreground">
                {doacoes?.length || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Doadores Únicos</p>
              <p className="text-3xl font-bold text-foreground">
                {doacoes ? new Set(doacoes.map(d => d.nome_doador)).size : 0}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Donations Table */}
        <Card className="border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle>Todas as Doações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Doador</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead className="text-right">Comprovante</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {doacoes?.map((doacao) => (
                    <TableRow key={doacao.id}>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatTimeAgo(doacao.created_at)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {doacao.nome_doador}
                      </TableCell>
                      <TableCell className="font-semibold text-primary">
                        {formatCurrency(doacao.valor)}
                      </TableCell>
                      <TableCell className="uppercase text-xs">
                        {doacao.metodo}
                      </TableCell>
                      <TableCell className="text-right">
                        {doacao.comprovante_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => viewReceipt(doacao.comprovante_url!)}
                            className="gap-2"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Ver
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {!doacoes?.length && (
                <div className="text-center py-12 text-muted-foreground">
                  Nenhuma doação registrada ainda
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Edit Total Modal */}
        <EditTotalModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          currentTotal={total || 0}
          onSuccess={() => {
            refetchTotal();
            refetch();
          }}
        />
      </div>
    </div>
  );
};

export default Admin;
