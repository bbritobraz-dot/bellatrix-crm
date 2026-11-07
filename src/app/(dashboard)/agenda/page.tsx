import { createAuthedClient } from "@/lib/supabase/server";
import { AgendaClientView } from "@/components/agenda/AgendaClientView";

export const dynamic = 'force-dynamic';

export default async function AgendaPage() {
  const supabase = await createAuthedClient();

  const { data: visits, error } = await supabase
    .from("visits")
    .select(`
      *,
      clients (
        name,
        phone,
        address,
        neighborhood
      )
    `)
    .order("date", { ascending: true })
    .order("time", { ascending: true });

  if (error) {
    return <div className="p-4 text-red-500">Erro ao carregar agenda: {error.message}</div>;
  }

  const { data: installations } = await supabase
    .from("quotes")
    .select(`
      id,
      status,
      installation_date,
      client:clients (
        name,
        phone,
        address,
        neighborhood
      )
    `)
    .eq('status', 'pronto_para_instalacao')
    .order("installation_date", { ascending: true });

  return <AgendaClientView initialVisits={visits || []} initialInstallations={installations || []} />;
}
