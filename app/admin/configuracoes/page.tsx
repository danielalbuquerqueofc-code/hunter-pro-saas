import { AdminPageHeader, AdminSection } from "@/components/admin/admin-shell";

export default function AdminSettingsPage() {
  return (
    <>
      <AdminPageHeader eyebrow="Configuracoes" title="Configuracoes da plataforma" description="Area reservada para parametros globais do Hunter Pro." />
      <main className="p-5 pb-24 lg:p-8">
        <AdminSection title="Configuracoes globais">
          <p className="text-sm font-semibold text-zinc-500">
            As configuracoes criticas continuam protegidas por variaveis de ambiente e integrações externas. Esta tela fica pronta para receber parametros globais auditaveis sem expor credenciais.
          </p>
        </AdminSection>
      </main>
    </>
  );
}
