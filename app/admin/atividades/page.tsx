import { AdminPageHeader, AdminSection } from "@/components/admin/admin-shell";
import { getAdminAuditLogs } from "@/features/admin/queries";

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

export default async function AdminActivitiesPage() {
  const logs = await getAdminAuditLogs();
  return (
    <>
      <AdminPageHeader eyebrow="Auditoria" title="Atividades administrativas" description="Logs imutaveis das acoes sensiveis executadas na plataforma." />
      <main className="p-5 pb-24 lg:p-8">
        <AdminSection title="Logs recentes">
          <div className="grid gap-3">
            {logs.map((log) => {
              const organization = Array.isArray(log.organization) ? log.organization[0] : log.organization;
              const actor = Array.isArray(log.actor) ? log.actor[0] : log.actor;
              return (
                <article key={log.id} className="rounded-2xl border border-zinc-200 p-4">
                  <strong>{log.action}</strong>
                  <p className="text-sm text-zinc-500">{organization?.name ?? "Sem empresa"} - {actor?.full_name ?? log.actor_id ?? "Sistema"} - {formatDate(log.created_at)}</p>
                  {log.reason ? <p className="mt-2 rounded-xl bg-zinc-50 p-3 text-sm">{log.reason}</p> : null}
                </article>
              );
            })}
            {logs.length === 0 ? <p className="text-sm text-zinc-500">Nenhum log encontrado.</p> : null}
          </div>
        </AdminSection>
      </main>
    </>
  );
}
