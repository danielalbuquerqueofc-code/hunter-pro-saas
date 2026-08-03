import { AdminPageHeader, AdminSection } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { upsertPlanAction } from "@/features/admin/actions";
import { getAdminPlans } from "@/features/admin/queries";

function formatCurrency(value: number | null | undefined, alreadyDecimal = false) {
  const amount = alreadyDecimal ? Number(value ?? 0) : Number(value ?? 0) / 100;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amount);
}

export default async function AdminPlansPage() {
  const plans = await getAdminPlans();
  return (
    <>
      <AdminPageHeader eyebrow="Planos" title="Planos comerciais" description="Planos carregados do banco, com limites e status comerciais." />
      <main className="space-y-6 p-5 pb-24 lg:p-8">
        <AdminSection title="Criar novo plano">
          <form action={upsertPlanAction} className="grid gap-3 lg:grid-cols-4">
            <Input name="code" placeholder="codigo" required />
            <Input name="name" placeholder="Nome" required />
            <Input name="monthlyPrice" placeholder="Mensalidade" required />
            <Input name="displayOrder" type="number" placeholder="Ordem" />
            <Input name="minimumUsers" type="number" min="1" defaultValue="1" />
            <Input name="maximumUsers" type="number" min="1" defaultValue="1" />
            <Input name="professionalLimit" type="number" placeholder="Limite profissionais" />
            <Input name="serviceLimit" type="number" placeholder="Limite servicos" />
            <Input name="appointmentLimit" type="number" placeholder="Limite agendamentos" />
            <Input name="trialDays" type="number" min="0" defaultValue="7" />
            <Select name="status" defaultValue="active"><option value="active">Ativo</option><option value="inactive">Inativo</option></Select>
            <Input name="enabledModules" placeholder="modulos separados por virgula" />
            <Input name="description" placeholder="Descricao" className="lg:col-span-3" />
            <Input name="reason" placeholder="Motivo" required />
            <label className="flex items-center gap-2 text-sm font-bold"><input name="isFeatured" type="checkbox" /> Destaque</label>
            <Button type="submit" className="lg:col-span-4">Criar plano</Button>
          </form>
        </AdminSection>

        <AdminSection title="Planos existentes">
          <div className="grid gap-4 xl:grid-cols-3">
            {plans.map((plan) => (
              <article key={plan.id} className="rounded-3xl border border-zinc-200 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-black">{plan.name}</h2>
                    <p className="text-sm text-zinc-500">{plan.code} - {plan.status}</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                    {plan.subscriptionCount} assinatura(s)
                  </span>
                </div>
                <p className="mt-4 text-3xl font-black">{formatCurrency(plan.monthly_price ?? plan.price_cents, Boolean(plan.monthly_price))}</p>
                <p className="mt-2 text-sm text-zinc-500">{plan.minimum_users} a {plan.maximum_users} usuario(s)</p>
                <form action={upsertPlanAction} className="mt-5 grid gap-2">
                  <input type="hidden" name="planId" value={plan.id} />
                  <Input name="code" defaultValue={plan.code} required />
                  <Input name="name" defaultValue={plan.name} required />
                  <Input name="monthlyPrice" defaultValue={String(plan.monthly_price ?? Number(plan.price_cents ?? 0) / 100)} required />
                  <Input name="minimumUsers" type="number" defaultValue={plan.minimum_users} />
                  <Input name="maximumUsers" type="number" defaultValue={plan.maximum_users} />
                  <Input name="professionalLimit" type="number" defaultValue={plan.professional_limit ?? ""} />
                  <Input name="serviceLimit" type="number" defaultValue={plan.service_limit ?? ""} />
                  <Input name="appointmentLimit" type="number" defaultValue={plan.appointment_limit ?? ""} />
                  <Input name="trialDays" type="number" defaultValue={plan.trial_days ?? 7} />
                  <Select name="status" defaultValue={plan.status}><option value="active">Ativo</option><option value="inactive">Inativo</option></Select>
                  <Input name="displayOrder" type="number" defaultValue={plan.display_order ?? 0} />
                  <Input name="enabledModules" defaultValue={Array.isArray(plan.enabled_modules) ? plan.enabled_modules.join(",") : ""} />
                  <Input name="description" defaultValue={plan.description ?? ""} />
                  <Input name="reason" placeholder="Motivo da alteracao" required />
                  <Button type="submit" variant="secondary">Salvar plano</Button>
                </form>
              </article>
            ))}
          </div>
        </AdminSection>
      </main>
    </>
  );
}
