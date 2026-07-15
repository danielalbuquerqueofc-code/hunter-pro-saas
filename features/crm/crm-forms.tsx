"use client";

import { useActionState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import {
  createContactStateAction,
  createDealActivityStateAction,
  createDealStateAction,
  type CrmActionState
} from "@/features/crm/actions";

type Contact = {
  id: string;
  name: string;
};

type Deal = {
  id: string;
  title: string;
};

const initialState: CrmActionState = { ok: false };

export function CrmForms({ contacts }: { contacts: Contact[] }) {
  const contactFormRef = useRef<HTMLFormElement>(null);
  const dealFormRef = useRef<HTMLFormElement>(null);
  const [contactState, contactAction] = useActionState(createContactStateAction, initialState);
  const [dealState, dealAction] = useActionState(createDealStateAction, initialState);

  useEffect(() => {
    if (contactState.ok) contactFormRef.current?.reset();
  }, [contactState.ok]);

  useEffect(() => {
    if (dealState.ok) dealFormRef.current?.reset();
  }, [dealState.ok]);

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader><CardTitle>Novo lead</CardTitle></CardHeader>
        <CardContent>
          <form ref={contactFormRef} action={contactAction} className="grid gap-3">
            <FormMessage type="success">{contactState.message}</FormMessage>
            <FormMessage>{contactState.error}</FormMessage>
            <Input name="name" placeholder="Nome do lead" autoComplete="name" required />
            <Input name="email" type="email" placeholder="email@empresa.com" autoComplete="email" />
            <Input name="phone" type="tel" inputMode="tel" placeholder="WhatsApp" autoComplete="tel" />
            <Input name="companyName" placeholder="Empresa" />
            <Input name="source" placeholder="Origem: site, indicacao, trafego..." />
            <Textarea name="notes" placeholder="Observacoes comerciais" />
            <label className="flex items-start gap-2 rounded-lg border border-zinc-200 bg-white p-3 text-xs font-semibold text-zinc-600">
              <input name="lgpdConsent" type="checkbox" className="mt-1" />
              O lead autorizou contato comercial e registro dos dados.
            </label>
            <SubmitButton>Criar lead</SubmitButton>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Nova oportunidade</CardTitle></CardHeader>
        <CardContent>
          <form ref={dealFormRef} action={dealAction} className="grid gap-3">
            <FormMessage type="success">{dealState.message}</FormMessage>
            <FormMessage>{dealState.error}</FormMessage>
            <div className="space-y-2">
              <Label htmlFor="contactId">Lead</Label>
              <Select id="contactId" name="contactId" required>
                <option value="">Selecione</option>
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>{contact.name}</option>
                ))}
              </Select>
            </div>
            <Input name="title" placeholder="Ex: Consultoria mensal" required />
            <Input name="valueCents" type="number" defaultValue={0} min={0} />
            <Input name="expectedCloseDate" type="date" />
            <SubmitButton>Criar oportunidade</SubmitButton>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export function CrmActivityForm({ contacts, deals }: { contacts: Contact[]; deals: Deal[] }) {
  const activityFormRef = useRef<HTMLFormElement>(null);
  const [activityState, activityAction] = useActionState(
    createDealActivityStateAction,
    initialState
  );

  useEffect(() => {
    if (activityState.ok) activityFormRef.current?.reset();
  }, [activityState.ok]);

  return (
    <form ref={activityFormRef} action={activityAction} className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
      <div className="md:col-span-4">
        <FormMessage type="success">{activityState.message}</FormMessage>
        <FormMessage>{activityState.error}</FormMessage>
      </div>
      <Select name="dealId">
        <option value="">Sem oportunidade</option>
        {deals.map((deal) => (
          <option key={deal.id} value={deal.id}>{deal.title}</option>
        ))}
      </Select>
      <Select name="contactId">
        <option value="">Sem contato</option>
        {contacts.map((contact) => (
          <option key={contact.id} value={contact.id}>{contact.name}</option>
        ))}
      </Select>
      <Input name="title" placeholder="Proximo passo" required />
      <input type="hidden" name="type" value="NOTE" />
      <SubmitButton>Salvar</SubmitButton>
    </form>
  );
}
