import Link from "next/link";
import { MessageCircle, Phone, Search, SlidersHorizontal, Star, Users } from "lucide-react";
import { getCrmData } from "@/features/crm/queries";
import { requireOrganizationAccess } from "@/features/organizations/guards";

function initials(name: string | null) {
  return (name ?? "Cliente")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatDate(value: string | null) {
  if (!value) return "Sem historico";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(value));
}

function onlyDigits(value: string | null) {
  return (value ?? "").replace(/\D/g, "");
}

export default async function ClientesPage() {
  const { organization } = await requireOrganizationAccess(["OWNER", "ADMIN", "MANAGER", "SALES", "ATTENDANT"]);
  const { contacts } = await getCrmData(organization.id);
  const clients = contacts.filter((contact) => ["CLIENT", "CUSTOMER"].includes(String(contact.type ?? "").toUpperCase()));
  const visibleClients = clients.length ? clients : contacts;

  return (
    <section className="mx-auto grid max-w-5xl gap-5 px-4 py-5 sm:px-6 lg:px-8">
      <div>
        <p className="text-sm font-black uppercase tracking-wide text-[var(--hp-accent)]">{organization.name}</p>
        <h1 className="mt-1 text-4xl font-black tracking-tight">Clientes</h1>
        <p className="mt-2 text-zinc-400">Uma lista simples para chamar, filtrar e acompanhar retornos.</p>
      </div>

      <div className="hp-card rounded-[2rem] p-4">
        <div className="flex gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl bg-white/10 px-4 py-3">
            <Search className="h-5 w-5 shrink-0 text-zinc-500" />
            <input
              className="min-w-0 flex-1 bg-transparent text-base font-semibold outline-none placeholder:text-zinc-500"
              placeholder="Buscar cliente"
              type="search"
            />
          </div>
          <button type="button" className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
            <SlidersHorizontal className="h-5 w-5 text-zinc-300" />
          </button>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {["Todos", "Recentes", "VIP", "Retorno", "Sem contato"].map((filter) => (
            <button
              key={filter}
              type="button"
              className="shrink-0 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-zinc-300 first:bg-[var(--hp-accent)] first:text-[#04100a]"
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3">
        {visibleClients.length === 0 ? (
          <div className="hp-card rounded-[2rem] p-8 text-center">
            <Users className="mx-auto h-10 w-10 text-[var(--hp-accent)]" />
            <h2 className="mt-4 text-2xl font-black">Nenhum cliente ainda</h2>
            <p className="mt-2 text-zinc-400">Quando contatos entrarem pelo CRM ou vitrine, eles aparecem aqui.</p>
            <Link href="/crm" className="mt-5 inline-flex rounded-full bg-[var(--hp-accent)] px-5 py-3 font-black text-[#04100a]">
              Abrir CRM
            </Link>
          </div>
        ) : (
          visibleClients.map((client) => {
            const phone = onlyDigits(client.phone);
            const whatsapp = phone ? `https://wa.me/55${phone.replace(/^55/, "")}` : "#";
            return (
              <article key={client.id} className="hp-card rounded-[1.75rem] p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-400/30 to-sky-400/20 text-xl font-black text-white">
                    {initials(client.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="truncate text-xl font-black">{client.name ?? "Cliente sem nome"}</h2>
                      {client.status === "ACTIVE" ? <Star className="h-4 w-4 fill-amber-300 text-amber-300" /> : null}
                    </div>
                    <p className="truncate text-sm text-zinc-400">{client.company_name ?? client.email ?? client.phone ?? "Sem contato salvo"}</p>
                    <p className="mt-1 text-xs font-bold text-zinc-500">Ultimo registro: {formatDate(client.created_at)}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <a
                      href={whatsapp}
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-[var(--hp-accent)]"
                      aria-label="Chamar no WhatsApp"
                    >
                      <MessageCircle className="h-5 w-5" />
                    </a>
                    <a
                      href={phone ? `tel:+55${phone.replace(/^55/, "")}` : "#"}
                      className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-zinc-200"
                      aria-label="Ligar"
                    >
                      <Phone className="h-5 w-5" />
                    </a>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
