"use server";

import { createAuthedClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function scheduleVisit(clientId: string, date: string, time: string, address: string) {
  const supabase = await createAuthedClient();

  try {
    // 1. Inserir a visita
    const { error: visitError } = await supabase
      .from('visits')
      .insert({
        client_id: clientId,
        date: date,
        time: time,
        address: address,
        status: 'agendada'
      });

    if (visitError) throw new Error("Erro ao agendar visita: " + visitError.message);

    // 2. Atualizar o status do cliente para 'visita_agendada'
    const { error: clientError } = await supabase
      .from('clients')
      .update({ status: 'visita_agendada' })
      .eq('id', clientId);

    if (clientError) throw new Error("Erro ao atualizar status do cliente: " + clientError.message);

    revalidatePath('/clientes');
    revalidatePath('/agenda');
    return { success: true };

  } catch (error: any) {
    console.error("Erro no scheduleVisit:", error);
    return { success: false, error: error.message };
  }
}

export async function updateVisitStatus(
  visitId: string, 
  newStatus: 'realizada' | 'cancelada' | 'reagendada' | 'confirmada', 
  clientId: string, 
  hasQuote?: boolean,
  newDate?: string,
  newTime?: string
) {
  const supabase = await createAuthedClient();

  try {
    // 1. Atualizar status da visita
    const updateData: any = { status: newStatus };
    if (newStatus === 'reagendada' && newDate && newTime) {
      updateData.date = newDate;
      updateData.time = newTime;
    }

    const { error: visitError } = await supabase
      .from('visits')
      .update(updateData)
      .eq('id', visitId);

    if (visitError) throw new Error("Erro ao atualizar visita: " + visitError.message);

    // 2. Automação do status do cliente
    let clientStatus = '';
    if (newStatus === 'realizada') {
      clientStatus = hasQuote ? 'orcamento_enviado' : 'visita_realizada';
    } else if (newStatus === 'cancelada') {
      clientStatus = 'novo_lead';
    } else if (newStatus === 'reagendada' || newStatus === 'confirmada') {
      clientStatus = 'visita_agendada';
    }

    if (clientStatus) {
      const { error: clientError } = await supabase
        .from('clients')
        .update({ status: clientStatus })
        .eq('id', clientId);
      if (clientError) throw new Error("Erro ao atualizar status do cliente: " + clientError.message);
    }

    revalidatePath('/clientes');
    revalidatePath('/agenda');
    return { success: true };

  } catch (error: any) {
    console.error("Erro no updateVisitStatus:", error);
    return { success: false, error: error.message };
  }
}
