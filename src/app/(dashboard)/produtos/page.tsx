import { createAuthedClient } from "@/lib/supabase/server";
import { CatalogView } from "@/components/products/CatalogView";

export const dynamic = 'force-dynamic';

export default async function CatalogPage() {
  const supabase = await createAuthedClient();

  // Buscar todos os catálogos
  const { data: products, error: e1 } = await supabase.from("products").select("*").order("line", { ascending: true });
  const { data: accessories, error: e2 } = await supabase.from("accessories").select("*").order("name", { ascending: true });
  const { data: reforms, error: e3 } = await supabase.from("reforms").select("*").order("name", { ascending: true });

  if (e1 || e2 || e3) {
    return <div className="p-4 text-red-500">Erro ao carregar catálogo.</div>;
  }

  return (
    <CatalogView 
      initialProducts={products || []} 
      initialAccessories={accessories || []} 
      initialReforms={reforms || []} 
    />
  );
}
