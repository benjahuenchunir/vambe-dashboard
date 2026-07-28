import { getClients, getProcessingStatus } from "@/lib/store";
import { Dashboard } from "@/components/dashboard/dashboard";

// Server-rendered so the already-processed data is visible on first paint,
// with no client-side loading spinner for the initial dataset.
export default async function Page() {
  try {
    const [clients, status] = await Promise.all([getClients(), getProcessingStatus()]);
    return (
      <main className="mx-auto max-w-screen-2xl px-6 py-8">
        <Dashboard initialClients={clients} initialStatus={status} />
      </main>
    );
  } catch (error) {
    return (
      <main className="mx-auto flex max-w-2xl flex-col gap-2 px-6 py-16 text-center">
        <h1 className="text-lg font-semibold text-foreground">No se pudo conectar a la base de datos</h1>
        <p className="text-sm text-muted-foreground">
          Revisa que <code>SUPABASE_URL</code> y <code>SUPABASE_SERVICE_ROLE_KEY</code> estén configuradas en
          <code>.env.local</code> y que el schema de <code>supabase/schema.sql</code> esté aplicado.
        </p>
        <p className="text-xs text-tertiary">{(error as Error).message}</p>
      </main>
    );
  }
}
