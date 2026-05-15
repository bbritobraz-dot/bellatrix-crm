import { getDashboardStats } from "@/app/actions/dashboard";
import { DashboardClientView } from "@/components/dashboard/DashboardClientView";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  if (!stats) return <div>Erro ao carregar estatísticas.</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <DashboardClientView initialStats={stats} />
    </div>
  );
}
