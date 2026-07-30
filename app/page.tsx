import { getClients } from "@/lib/store";
import { Dashboard } from "@/components/dashboard/dashboard";

export default async function Page() {
  let clients = null;
  let error: Error | null = null;

  try {
    [clients] = await Promise.all([getClients()]);
  } catch (err) {
    error = err as Error;
  }

  if (error || !clients) {
    return (
      <main className="mx-auto flex max-w-2xl flex-col gap-2 px-6 py-16 text-center">
        <h1 className="text-lg font-semibold text-foreground">
          No se pudo conectar a la base de datos
        </h1>
        <p className="text-sm text-muted-foreground">
          Revisa que <code>SUPABASE_URL</code> y <code>SUPABASE_SERVICE_ROLE_KEY</code> estén configuradas en{" "}
          <code>.env.local</code> y que el schema de <code>supabase/schema.sql</code> esté aplicado.
        </p>
        <p className="text-xs text-tertiary">{error?.message}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-screen-2xl px-6 py-8">
      <Dashboard initialClients={clients} />
    </main>
  );
}