import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { ApiError, AuthError, ConfigError } from "@/lib/apiErrors";

let supabaseAdminInstance;

export function getSupabaseAdmin() {
  if (supabaseAdminInstance) return supabaseAdminInstance;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new ConfigError('Supabase not configured');
  supabaseAdminInstance = createClient(url, key);
  return supabaseAdminInstance;
}

export function getSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;
  try {
    const parsed = new URL(supabaseUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
  } catch {
    return null;
  }
  if (supabaseUrl.startsWith("http://localhost:")) {
    supabaseUrl = supabaseUrl.replace("http://localhost:", "http://127.0.0.1:");
  }
  return { supabaseUrl, supabaseAnonKey };
}

export async function getAuthenticatedUser() {
  const config = getSupabaseConfig();
  if (!config) {
    return { user: null, configured: false };
  }

  const cookieStore = await cookies();
  const client = createServerClient(config.supabaseUrl, config.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });

  const { data } = await client.auth.getUser();
  return { user: data?.user ?? null, configured: true };
}

export function jsonResponse(data, status = 200, extraHeaders = {}) {
  return Response.json(data, {
    status,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
  });
}

export function errorResponse(error) {
  const code = error.code || 'INTERNAL_ERROR';
  const status = error.status || 500;
  const message = error.message || 'Internal server error';
  return Response.json(
    { error: message, code },
    { status, headers: { 'Content-Type': 'application/json' } },
  );
}
