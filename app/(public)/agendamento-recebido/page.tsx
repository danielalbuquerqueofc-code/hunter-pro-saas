import Link from "next/link";
import { CalendarDays, CheckCircle2, Clock3, Hourglass, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

type SuccessPageProps = {
  searchParams: Promise<{ token?: string }>;
};

type AppointmentSummary = {
  status: string;
  customer_name: string;
  starts_at: string;
  ends_at: string;
  timezone: string;
  organization: {
    name: string;
    slug: string;
    address: string;
    city: string;
    state: string;
    whatsapp: string;
  };
  service: {
    name: string;
    duration_minutes: number;
  };
  professional: {
    name: string;
  };
};

function whatsappUrl(value?: string | null) {
  const digits = (value ?? "").replace(/\D/g, "");
  if (!digits) return "";
  const phone = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${phone}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export default async function AgendamentoRecebidoPage({ searchParams }: SuccessPageProps) {
  const { token } = await searchParams;
  let summary: AppointmentSummary | null = null;

  if (token) {
    const supabase = await createClient();
    const { data } = await supabase.rpc("get_public_appointment_summary", { p_public_token: token });
    summary = data as AppointmentSummary | null;
  }

  const confirmed = summary?.status === "confirmed";
  const whatsapp = whatsappUrl(summary?.organization.whatsapp);
  const title = confirmed ? "Obrigado por agendar!" : "Pedido de agendamento enviado";
  const message = confirmed
    ? "Seu horario esta reservado."
    : "Esse horario foi reservado temporariamente. A empresa confirmara seu atendimento e enviara uma mensagem para o seu WhatsApp.";

  return (
    <main className="min-h-screen bg-[#f8fafc] px-4 py-8 text-slate-950">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-xl items-center">
        <div className="w-full rounded-[2rem] border border-slate-200 bg-white p-6 text-center shadow-2xl shadow-slate-950/10 sm:p-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            {confirmed ? <CheckCircle2 className="h-9 w-9" /> : <Hourglass className="h-9 w-9" />}
          </div>
          <p className="mt-5 text-sm font-black uppercase tracking-[0.18em] text-emerald-600">
            {confirmed ? "Horario confirmado" : "Aguardando confirmacao"}
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">{title}</h1>
          <p className="mt-3 text-base leading-7 text-slate-600">{message}</p>

          {summary ? (
            <dl className="mt-6 grid gap-3 text-left">
              {[
                ["Empresa", summary.organization.name],
                ["Servico", summary.service.name],
                ["Profissional", summary.professional.name],
                ["Data e horario", formatDate(summary.starts_at)],
                ["Duracao aproximada", `${summary.service.duration_minutes} minutos`],
                ["Status", confirmed ? "Confirmado" : "Aguardando confirmacao"]
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-slate-50 p-4">
                  <dt className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</dt>
                  <dd className="mt-1 font-black text-slate-950">{value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <div className="mt-6 rounded-2xl bg-amber-50 p-4 text-sm font-bold text-amber-800">
              Nao encontramos o resumo publico deste agendamento. Se precisar, fale com a empresa pelo canal de atendimento.
            </div>
          )}

          <div className="mt-6 grid gap-3">
            <Button asChild className="h-14 rounded-2xl bg-emerald-600 text-base font-black text-white hover:bg-emerald-700">
              <Link href={summary ? `/p/${summary.organization.slug}` : "/"}>
                Voltar para a vitrine
              </Link>
            </Button>
            {whatsapp ? (
              <Button asChild variant="outline" className="h-14 rounded-2xl text-base font-black">
                <a href={whatsapp} target="_blank" rel="noreferrer">
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Falar com a empresa
                </a>
              </Button>
            ) : null}
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-500">
              <CalendarDays className="h-4 w-4" />
              Confirmacao e lembretes serao enviados conforme as integracoes configuradas.
              <Clock3 className="h-4 w-4" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
