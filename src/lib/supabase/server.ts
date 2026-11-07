import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Chamado a partir de um Server Component: pode ser ignorado,
            // o proxy.ts renova a sessão a cada requisição.
          }
        },
      },
    }
  )
}

/**
 * Cliente Supabase que exige um usuário logado.
 * Use em todas as Server Actions: elas podem ser chamadas diretamente
 * por POST, sem passar pelas páginas, então o proxy não basta.
 */
export async function createAuthedClient() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims?.sub) {
    throw new Error('Não autorizado. Faça login novamente.')
  }
  return supabase
}
