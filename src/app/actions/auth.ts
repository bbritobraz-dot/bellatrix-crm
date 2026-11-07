"use server";

import { createClient } from "@/lib/supabase/server";

export async function login(email: string, password: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    return { success: false, error: "E-mail ou senha incorretos." };
  }
  return { success: true };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

export async function isAuthenticated() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return Boolean(data?.claims?.sub);
}

export async function getCurrentUserEmail() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user?.email ?? null;
}

/** Troca a senha do usuário logado, conferindo a senha atual antes. */
export async function changePassword(currentPassword: string, newPassword: string) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const email = data.user?.email;
  if (!email) return { success: false, error: "Sessão expirada. Entre novamente." };

  if (!newPassword || newPassword.length < 8) {
    return { success: false, error: "A nova senha precisa ter pelo menos 8 caracteres." };
  }
  if (newPassword === currentPassword) {
    return { success: false, error: "A nova senha deve ser diferente da atual." };
  }

  const { error: checkError } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
  if (checkError) return { success: false, error: "Senha atual incorreta." };

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { success: false, error: "Não foi possível trocar a senha: " + error.message };
  return { success: true };
}
