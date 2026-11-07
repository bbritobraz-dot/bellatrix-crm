import { createAuthedClient } from "@/lib/supabase/server";
import { ClientsView } from "@/components/clients/ClientsView";

export const dynamic = 'force-dynamic';

export default async function ClientesPage() {
  const supabase = await createAuthedClient();

  const { data: clients, error } = await supabase
    .from("clients")
    .select("*")
    .neq("status", "pos_venda")
    .order("created_at", { ascending: false });

  if (error) {
    return <div className="p-4 text-red-500">Erro ao carregar clientes: {error.message}</div>;
  }

  return <ClientsView initialClients={clients || []} />;
}
