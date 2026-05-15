"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateCatalogItem(
  table: 'products' | 'accessories' | 'reforms',
  id: string,
  payload: any
) {
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from(table)
      .update(payload)
      .eq('id', id);

    if (error) throw new Error(error.message);

    revalidatePath('/produtos');
    return { success: true };
  } catch (error: any) {
    console.error("Erro no updateCatalogItem:", error);
    return { success: false, error: error.message };
  }
}

export async function createCatalogItem(
  table: 'products' | 'accessories' | 'reforms',
  payload: any
) {
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from(table)
      .insert([payload]);

    if (error) throw new Error(error.message);

    revalidatePath('/produtos');
    return { success: true };
  } catch (error: any) {
    console.error("Erro no createCatalogItem:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteCatalogItem(
  table: 'products' | 'accessories' | 'reforms',
  id: string
) {
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);

    revalidatePath('/produtos');
    return { success: true };
  } catch (error: any) {
    console.error("Erro no deleteCatalogItem:", error);
    return { success: false, error: error.message };
  }
}
