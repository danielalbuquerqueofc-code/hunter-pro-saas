"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { Archive, CheckCircle2, Pencil, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  archiveProfessionalStateAction,
  createProfessionalStateAction,
  updateProfessionalStateAction,
  type ProfessionalActionState
} from "@/features/appointments/actions";

export type ProfessionalListItem = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  bio: string | null;
  is_active: boolean;
};

const initialState: ProfessionalActionState = { ok: false };

function SubmitButton({ children }: { children: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? "Salvando..." : children}
    </Button>
  );
}

function CreateProfessionalForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action] = useActionState(createProfessionalStateAction, initialState);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
    }
  }, [state.ok]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <UserPlus className="h-5 w-5 text-brand-orange" />
          Novo profissional
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={action} className="grid gap-3">
          <FormMessage type="success">{state.message}</FormMessage>
          <FormMessage>{state.error}</FormMessage>
          <Input name="name" placeholder="Nome do profissional" autoComplete="name" required />
          <Input name="phone" type="tel" inputMode="tel" placeholder="Telefone" autoComplete="tel" />
          <Input name="email" type="email" placeholder="email@empresa.com" autoComplete="email" />
          <Textarea name="bio" placeholder="Cargo, especialidade ou observacao curta" />
          <label className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white p-3 text-sm font-semibold text-zinc-700">
            <input name="isActive" type="checkbox" defaultChecked />
            Profissional ativo
          </label>
          <SubmitButton>Cadastrar profissional</SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}

function EditProfessionalForm({ professional }: { professional: ProfessionalListItem }) {
  const [state, action] = useActionState(updateProfessionalStateAction, initialState);
  const [archiveState, archiveAction] = useActionState(archiveProfessionalStateAction, initialState);

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <form action={action} className="grid gap-3">
        <input type="hidden" name="professionalId" value={professional.id} />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="flex items-center gap-2 font-black">
              <Pencil className="h-4 w-4 text-brand-orange" />
              Editar profissional
            </h3>
            <p className="text-sm text-zinc-500">
              {professional.is_active ? "Ativo na agenda" : "Inativo"}
            </p>
          </div>
          <label className="flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-2 text-xs font-black text-zinc-700">
            <input name="isActive" type="checkbox" defaultChecked={professional.is_active} />
            Ativo
          </label>
        </div>
        <FormMessage type="success">{state.message}</FormMessage>
        <FormMessage>{state.error}</FormMessage>
        <Input name="name" defaultValue={professional.name} required />
        <div className="grid gap-3 sm:grid-cols-2">
          <Input name="phone" type="tel" inputMode="tel" defaultValue={professional.phone ?? ""} placeholder="Telefone" />
          <Input name="email" type="email" defaultValue={professional.email ?? ""} placeholder="E-mail" />
        </div>
        <Textarea name="bio" defaultValue={professional.bio ?? ""} placeholder="Cargo ou especialidade" />
        <SubmitButton>Salvar alteracoes</SubmitButton>
      </form>

      <form action={archiveAction} className="mt-4 border-t border-zinc-100 pt-4">
        <input type="hidden" name="professionalId" value={professional.id} />
        <FormMessage type="success">{archiveState.message}</FormMessage>
        <FormMessage>{archiveState.error}</FormMessage>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-2 text-sm font-semibold text-zinc-600">
            <input name="confirmArchive" type="checkbox" />
            Confirmo arquivar este profissional
          </label>
          <Button type="submit" variant="outline" className="w-full text-red-700 sm:w-auto">
            <Archive className="mr-2 h-4 w-4" />
            Arquivar
          </Button>
        </div>
      </form>
    </div>
  );
}

export function ProfessionalsPanel({ professionals }: { professionals: ProfessionalListItem[] }) {
  return (
    <div className="grid gap-6">
      <CreateProfessionalForm />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CheckCircle2 className="h-5 w-5 text-brand-orange" />
            Profissionais cadastrados
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {professionals.length === 0 ? (
            <p className="rounded-lg bg-zinc-50 p-4 text-sm font-medium text-zinc-600">
              Nenhum profissional cadastrado ainda.
            </p>
          ) : (
            professionals.map((professional) => (
              <EditProfessionalForm key={professional.id} professional={professional} />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
