"use server";

import { createAuthedClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveClient(data: any) {
  const supabase = await createAuthedClient();

  try {
    const { data: newClient, error } = await supabase
      .from('clients')
      .insert({
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        address: data.address || null,
        neighborhood: data.neighborhood || null,
        city: data.city || null,
        lead_source: data.lead_source || null,
        status: data.status || 'novo_lead',
        notes: data.notes || null
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    revalidatePath('/clientes');
    return { success: true, clientId: newClient.id };

  } catch (error: any) {
    console.error("Erro no saveClient:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteClient(id: string) {
  const supabase = await createAuthedClient();
  try {
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) throw new Error(error.message);
    revalidatePath('/clientes');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateClientStatus(id: string, newStatus: string) {
  const supabase = await createAuthedClient();
  try {
    const { error } = await supabase
      .from('clients')
      .update({ status: newStatus })
      .eq('id', id);
      
    if (error) throw new Error(error.message);
    
    revalidatePath('/clientes');
    return { success: true };
  } catch (error: any) {
    console.error("Erro no updateClientStatus:", error);
    return { success: false, error: error.message };
  }
}

export async function markClientLost(id: string, reason: string) {
  const supabase = await createAuthedClient();
  try {
    // 1. Busca notas atuais
    const { data: client } = await supabase.from('clients').select('notes').eq('id', id).single();
    
    const existingNotes = client?.notes ? client.notes + '\n\n' : '';
    const newNotes = existingNotes + `[MOTIVO PERDA - ${new Date().toLocaleDateString('pt-BR')}]: ${reason}`;

    const { error } = await supabase
      .from('clients')
      .update({ status: 'perdido', notes: newNotes })
      .eq('id', id);
      
    if (error) throw new Error(error.message);
    
    revalidatePath('/clientes');
    return { success: true };
  } catch (error: any) {
    console.error("Erro no markClientLost:", error);
    return { success: false, error: error.message };
  }
}

export async function updateClient(id: string, data: any) {
  const supabase = await createAuthedClient();
  try {
    const { error } = await supabase
      .from('clients')
      .update({
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        address: data.address || null,
        neighborhood: data.neighborhood || null,
        city: data.city || null,
        lead_source: data.lead_source || null,
        notes: data.notes || null
      })
      .eq('id', id);

    if (error) throw new Error(error.message);

    revalidatePath('/clientes');
    revalidatePath(`/clientes/${id}`);
    return { success: true };
  } catch (error: any) {
    console.error("Erro no updateClient:", error);
    return { success: false, error: error.message };
  }
}
