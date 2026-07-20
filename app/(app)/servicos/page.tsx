import { AppHeader } from "@/components/layout/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { updateServiceAction } from "@/features/services/actions";
import { getServicesData } from "@/features/services/queries";
import { ServiceForms } from "@/features/services/service-forms";
import { requireOrganizationAccess } from "@/features/organizations/guards";

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

export default async function ServicosPage() {
  const { organization } = await requireOrganizationAccess(["OWNER", "ADMIN", "MANAGER"]);

  const { categories, services } = await getServicesData(organization.id);

  return (
    <>
      <AppHeader title="Servicos" eyebrow={organization.name} />
      <section className="grid gap-6 p-4 sm:p-6 lg:p-8 xl:grid-cols-[420px_1fr]">
        <ServiceForms categories={categories} />

        <Card>
          <CardHeader><CardTitle>Servicos cadastrados</CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            {services.length === 0 ? (
              <p className="text-sm text-zinc-500">Nenhum servico cadastrado ainda.</p>
            ) : (
              services.map((service) => {
                const category = Array.isArray(service.category) ? service.category[0] : service.category;
                return (
                  <article key={service.id} className="rounded-2xl border border-zinc-200 bg-white p-4">
                    <div className="flex items-start gap-4">
                      {service.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={service.image_url} alt="" className="h-20 w-20 shrink-0 rounded-2xl object-cover" />
                      ) : (
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 text-xs font-bold text-zinc-400">
                          Sem imagem
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h2 className="font-bold text-zinc-950">{service.name}</h2>
                        <p className="text-sm text-zinc-500">{category?.name ?? "Sem categoria"}</p>
                        <p className="mt-3 text-sm text-zinc-600">{service.description}</p>
                        <div className="mt-3 flex flex-wrap gap-2 text-sm">
                          <span className="rounded-full bg-zinc-100 px-3 py-1 font-semibold text-zinc-700">
                            Tempo: {service.duration_minutes} min
                          </span>
                          <span className="rounded-full bg-zinc-100 px-3 py-1 font-semibold text-zinc-700">
                            Bloqueio total: {service.duration_minutes + (service.margin_before_minutes ?? 0) + (service.margin_after_minutes ?? 10)} min
                          </span>
                          <span className="rounded-full bg-zinc-100 px-3 py-1 font-semibold text-zinc-700">
                            Valor: {formatCurrency(service.price_cents)}
                          </span>
                          <span className="rounded-full bg-zinc-100 px-3 py-1 font-semibold text-zinc-700">
                            {service.is_online ? "Online" : "Presencial"}
                          </span>
                        </div>
                      </div>
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                        {service.is_active ? "Ativo" : "Inativo"}
                      </span>
                    </div>

                    <details className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                      <summary className="cursor-pointer text-sm font-black text-brand-orange">
                        Editar servico
                      </summary>
                      <form action={updateServiceAction} className="mt-4 grid gap-3">
                        <input type="hidden" name="serviceId" value={service.id} />
                        <div className="space-y-2">
                          <Label htmlFor={`category-${service.id}`}>Categoria</Label>
                          <Select id={`category-${service.id}`} name="categoryId" defaultValue={category?.id ?? ""}>
                            <option value="">Sem categoria</option>
                            {categories.map((item) => (
                              <option key={item.id} value={item.id}>{item.name}</option>
                            ))}
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`name-${service.id}`}>Nome do servico</Label>
                          <Input id={`name-${service.id}`} name="name" defaultValue={service.name} required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`description-${service.id}`}>Descricao</Label>
                          <Input id={`description-${service.id}`} name="description" defaultValue={service.description ?? ""} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`image-${service.id}`}>Imagem do servico</Label>
                          <Input
                            id={`image-${service.id}`}
                            name="imageUrl"
                            type="url"
                            defaultValue={service.image_url ?? ""}
                            placeholder="https://exemplo.com/foto-do-servico.jpg"
                          />
                          <p className="text-xs text-zinc-500">Cole o link da imagem que representa este servico.</p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor={`duration-${service.id}`}>Tempo de atendimento</Label>
                            <Input
                              id={`duration-${service.id}`}
                              name="durationMinutes"
                              type="number"
                              min={15}
                              defaultValue={service.duration_minutes}
                            />
                            <p className="text-xs text-zinc-500">Em minutos.</p>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`price-${service.id}`}>Valor do servico</Label>
                            <Input
                              id={`price-${service.id}`}
                              name="priceCents"
                              type="number"
                              min={0}
                              step="0.01"
                              defaultValue={(service.price_cents / 100).toFixed(2)}
                            />
                            <p className="text-xs text-zinc-500">Em reais.</p>
                          </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor={`margin-before-${service.id}`}>Margem antes</Label>
                            <Input
                              id={`margin-before-${service.id}`}
                              name="marginBeforeMinutes"
                              type="number"
                              min={0}
                              defaultValue={service.margin_before_minutes ?? 0}
                            />
                            <p className="text-xs text-zinc-500">Bloqueada internamente antes do atendimento.</p>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`margin-after-${service.id}`}>Margem depois</Label>
                            <Input
                              id={`margin-after-${service.id}`}
                              name="marginAfterMinutes"
                              type="number"
                              min={0}
                              defaultValue={service.margin_after_minutes ?? 10}
                            />
                            <p className="text-xs text-zinc-500">Padrao recomendado: 10 minutos.</p>
                          </div>
                        </div>
                        <label className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white p-3 text-sm font-semibold text-zinc-700">
                          <input name="isOnline" type="checkbox" defaultChecked={service.is_online} />
                          Atendimento online
                        </label>
                        <SubmitButton pendingText="Atualizando...">Salvar alteracoes</SubmitButton>
                      </form>
                    </details>
                  </article>
                );
              })
            )}
          </CardContent>
        </Card>
      </section>
    </>
  );
}
