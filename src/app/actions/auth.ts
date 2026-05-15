"use server";

import { cookies } from "next/headers";

export async function login(email: string, password: string) {
  // Simulação de login com as credenciais fornecidas pelo usuário
  const ADMIN_EMAIL = "adm@bellatrix.com";
  const ADMIN_PASS = "123456";

  if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
    const cookieStore = await cookies();
    
    // Define o cookie de sessão por 7 dias
    cookieStore.set("bellatrix_session", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 semana
      path: "/",
    });

    return { success: true };
  }

  return { success: false, error: "E-mail ou senha incorretos." };
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("bellatrix_session");
}

export async function isAuthenticated() {
  const cookieStore = await cookies();
  return cookieStore.has("bellatrix_session");
}
