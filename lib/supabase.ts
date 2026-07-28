import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client. Uses the service role key because every
 * write goes through our own route handlers (never directly from the
 * browser), so there's no need for row-level-security-scoped anon access
 * here. Do NOT import this file from a "use client" component.
 */
function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}. Revisa .env.local (ver .env.example).`);
  }
  return value;
}

export const supabase = createClient(
  getEnv("SUPABASE_URL"),
  getEnv("SUPABASE_SERVICE_ROLE_KEY"),
  { auth: { persistSession: false } }
);
