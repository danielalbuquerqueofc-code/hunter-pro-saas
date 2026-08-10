import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { requireOrganizationAccess } from "@/features/organizations/guards";
import { savePaymentSettingsAction } from "@/features/payments/actions";
import { decryptSecret } from "@/lib/server-crypto";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  searchParams: Promise<{ error?: string; success?: string }>;
};

function formatCents(cents?: number | null) {
  if (!cents) return "";
  return (cents / 100).toFixed(2).replace(".", ",");
}

function maskLast(value?: string | null) {
  if (!value) return "Nao informado";
  const visible = value.replace(/\s/g, "").slice(-4);
  return `****${visible}`;
}

export default async function PagamentosPixPage({ searchParams }: PageProps) {
  const query = await searchParams;
  const { organization } = await requireOrganizationAccess(["OWNER", "ADMIN", "FINANCIAL"]);
  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("organization_payment_settings")
    .select("*")
    .eq("organization_id", organization.id)
    .maybeSingle();
  const holderDocument = decryptSecret(settings?.holder_document_encrypted) || settings?.holder_document || "";
  const bankAccount = decryptSecret(settings?.bank_account_encrypted) || settings?.bank_account || "";
  const pixKey = decryptSecret(settings?.pix_key_encrypted) || settings?.pix_key || "";

  return (
    <>
      <AppHeader title="Pagamentos e Pix" eyebrow="Configuracoes da empresa" />
      <section className="grid gap-6 p-5 pb-28 lg:grid-cols-[1fr_360px] lg:p-8">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>Dados para recebimento</CardTitle>
          </CardHeader>
          <CardContent>
            {query.error ? <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{query.error}</div> : null}
            {query.success ? <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-700">Dados de pagamento salvos com sucesso.</div> : null}

            <form action={savePaymentSettingsAction} className="grid gap-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="holderName">Nome do titular</Label>
                  <Input id="holderName" name="holderName" defaultValue={settings?.holder_name ?? ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="holderDocument">CPF ou CNPJ</Label>
                  <Input id="holderDocument" name="holderDocument" defaultValue={holderDocument} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="bankName">Banco</Label>
                  <Input id="bankName" name="bankName" defaultValue={settings?.bank_name ?? ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankAgency">Agencia</Label>
                  <Input id="bankAgency" name="bankAgency" defaultValue={settings?.bank_agency ?? ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankAccount">Conta</Label>
                  <Input id="bankAccount" name="bankAccount" defaultValue={bankAccount} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="accountType">Tipo de conta</Label>
                  <Select id="accountType" name="accountType" defaultValue={settings?.account_type ?? ""}>
                    <option value="">Nao informar</option>
                    <option value="CHECKING">Conta corrente</option>
                    <option value="SAVINGS">Conta poupanca</option>
                    <option value="PAYMENT">Conta pagamento</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pixKeyType">Tipo da chave Pix</Label>
                  <Select id="pixKeyType" name="pixKeyType" defaultValue={settings?.pix_key_type ?? ""}>
                    <option value="">Nao informar</option>
                    <option value="CPF">CPF</option>
                    <option value="CNPJ">CNPJ</option>
                    <option value="EMAIL">E-mail</option>
                    <option value="PHONE">Telefone</option>
                    <option value="RANDOM">Aleatoria</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pixKey">Chave Pix</Label>
                  <Input id="pixKey" name="pixKey" defaultValue={pixKey} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="beneficiaryName">Nome do favorecido</Label>
                  <Input id="beneficiaryName" name="beneficiaryName" defaultValue={settings?.beneficiary_name ?? ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="staticPixQrCodeUrl">QR Code Pix estatico</Label>
                  <Input id="staticPixQrCodeUrl" name="staticPixQrCodeUrl" defaultValue={settings?.static_pix_qr_code_url ?? ""} placeholder="https://..." />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="defaultDeposit">Valor padrao de sinal</Label>
                  <Input id="defaultDeposit" name="defaultDeposit" defaultValue={formatCents(settings?.default_deposit_cents)} inputMode="decimal" placeholder="30,00" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultDepositPercent">Percentual padrao</Label>
                  <Input id="defaultDepositPercent" name="defaultDepositPercent" defaultValue={settings?.default_deposit_percent ?? ""} inputMode="numeric" placeholder="30" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentDeadlineHours">Prazo para pagamento em horas</Label>
                  <Input id="paymentDeadlineHours" name="paymentDeadlineHours" defaultValue={settings?.payment_deadline_hours ?? 24} inputMode="numeric" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sendMode">Envio apos agendamento</Label>
                <Select id="sendMode" name="sendMode" defaultValue={settings?.send_payment_data_mode ?? "NEVER"}>
                  <option value="NEVER">Nao enviar automaticamente</option>
                  <option value="ALWAYS">Enviar sempre</option>
                  <option value="DEPOSIT_ONLY">Enviar somente quando houver sinal</option>
                  <option value="PUBLIC_BOOKINGS">Enviar somente em agendamentos publicos</option>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentInstructions">Instrucoes de pagamento</Label>
                <Textarea id="paymentInstructions" name="paymentInstructions" defaultValue={settings?.payment_instructions ?? ""} placeholder="Ex.: Para confirmar o horario, envie o comprovante apos pagar o sinal." />
              </div>

              <div className="grid gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm font-bold text-zinc-700">
                <label className="flex items-center gap-3">
                  <input type="checkbox" name="isActive" defaultChecked={settings?.is_active ?? true} />
                  Ativar dados de pagamento
                </label>
                <label className="flex items-center gap-3">
                  <input type="checkbox" name="showBankDetailsPublicly" defaultChecked={settings?.show_bank_details_publicly ?? false} />
                  Permitir exibir dados bancarios completos quando a regra de envio solicitar
                </label>
              </div>

              <Button type="submit" className="w-full sm:w-fit">Salvar pagamentos e Pix</Button>
            </form>
          </CardContent>
        </Card>

        <aside className="space-y-4">
          <Card className="rounded-3xl">
            <CardContent className="p-5">
              <p className="text-xs font-black uppercase text-zinc-500">Resumo seguro</p>
              <h2 className="mt-2 text-xl font-black">{settings?.is_active ? "Recebimento ativo" : "Nao configurado"}</h2>
              <div className="mt-4 grid gap-3 text-sm text-zinc-600">
                <p><strong className="text-zinc-950">Pix:</strong> {pixKey ? maskLast(pixKey) : "Nao informado"}</p>
                <p><strong className="text-zinc-950">Conta:</strong> {bankAccount ? maskLast(bankAccount) : "Nao informado"}</p>
                <p><strong className="text-zinc-950">Envio:</strong> {settings?.send_payment_data_mode ?? "NEVER"}</p>
              </div>
            </CardContent>
          </Card>
        </aside>
      </section>
    </>
  );
}
