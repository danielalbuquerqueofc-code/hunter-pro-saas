"use client";

import { useActionState, useEffect, useRef } from "react";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  createAutomationStateAction,
  createConversationStateAction,
  createMessageStateAction,
  createTaskStateAction,
  type OperationsActionState
} from "@/features/operations/actions";

type Contact = {
  id: string;
  name: string;
};

type Deal = {
  id: string;
  title: string;
};

const initialState: OperationsActionState = { ok: false };

export function ConversationForm({ contacts }: { contacts: Contact[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action] = useActionState(createConversationStateAction, initialState);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form ref={formRef} action={action} className="grid gap-3">
      <FormMessage type="success">{state.message}</FormMessage>
      <FormMessage>{state.error}</FormMessage>
      <Select name="contactId">
        <option value="">Sem contato vinculado</option>
        {contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.name}</option>)}
      </Select>
      <Select name="channel">
        <option value="WHATSAPP">WhatsApp</option>
        <option value="EMAIL">E-mail</option>
        <option value="INSTAGRAM">Instagram</option>
        <option value="WEBCHAT">Webchat</option>
        <option value="MANUAL">Manual</option>
      </Select>
      <Input name="subject" placeholder="Assunto" required />
      <Input name="lgpdContext" placeholder="Base/consentimento do contato" />
      <SubmitButton>Criar atendimento</SubmitButton>
    </form>
  );
}

export function MessageForm({ conversationId }: { conversationId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action] = useActionState(createMessageStateAction, initialState);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form ref={formRef} action={action} className="mt-4 grid gap-2 md:grid-cols-[1fr_auto]">
      <input type="hidden" name="conversationId" value={conversationId} />
      <div className="md:col-span-2">
        <FormMessage type="success">{state.message}</FormMessage>
        <FormMessage>{state.error}</FormMessage>
      </div>
      <Input name="body" placeholder="Registrar rascunho de resposta" required />
      <SubmitButton variant="secondary">Salvar</SubmitButton>
    </form>
  );
}

export function TaskForm({ contacts, deals }: { contacts: Contact[]; deals: Deal[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action] = useActionState(createTaskStateAction, initialState);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form ref={formRef} action={action} className="grid gap-3">
      <FormMessage type="success">{state.message}</FormMessage>
      <FormMessage>{state.error}</FormMessage>
      <Select name="contactId">
        <option value="">Sem contato</option>
        {contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.name}</option>)}
      </Select>
      <Select name="dealId">
        <option value="">Sem oportunidade</option>
        {deals.map((deal) => <option key={deal.id} value={deal.id}>{deal.title}</option>)}
      </Select>
      <Input name="title" placeholder="Tarefa" required />
      <Input name="description" placeholder="Descricao" />
      <Select name="priority">
        <option value="LOW">Baixa</option>
        <option value="MEDIUM">Media</option>
        <option value="HIGH">Alta</option>
        <option value="URGENT">Urgente</option>
      </Select>
      <Input name="dueAt" type="datetime-local" />
      <SubmitButton>Criar tarefa</SubmitButton>
    </form>
  );
}

export function AutomationForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action] = useActionState(createAutomationStateAction, initialState);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form ref={formRef} action={action} className="grid gap-3">
      <FormMessage type="success">{state.message}</FormMessage>
      <FormMessage>{state.error}</FormMessage>
      <Input name="name" placeholder="Follow-up de novo lead" required />
      <Input name="description" placeholder="Descricao" />
      <Select name="triggerKey">
        <option value="lead.created">Lead criado</option>
        <option value="deal.created">Oportunidade criada</option>
        <option value="appointment.requested">Agendamento solicitado</option>
        <option value="task.due">Tarefa vencendo</option>
      </Select>
      <Select name="status">
        <option value="DRAFT">Rascunho</option>
        <option value="ACTIVE">Ativa</option>
        <option value="PAUSED">Pausada</option>
      </Select>
      <SubmitButton>Criar automacao</SubmitButton>
    </form>
  );
}
