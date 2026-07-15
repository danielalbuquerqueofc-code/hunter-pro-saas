"use client";

import { useActionState, useEffect, useRef } from "react";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import {
  createShowcaseLinkStateAction,
  saveShowcaseStateAction,
  type ShowcaseActionState
} from "@/features/showcase/actions";

type ShowcaseFormData = {
  title: string | null;
  subtitle: string | null;
  description: string | null;
  hero_image_url: string | null;
  whatsapp: string | null;
  instagram_url: string | null;
  status: string | null;
} | null;

const initialState: ShowcaseActionState = { ok: false };

export function ShowcaseMainForm({
  showcase,
  organizationName
}: {
  showcase: ShowcaseFormData;
  organizationName: string;
}) {
  const [state, action] = useActionState(saveShowcaseStateAction, initialState);

  return (
    <form action={action} className="grid gap-4">
      <FormMessage type="success">{state.message}</FormMessage>
      <FormMessage>{state.error}</FormMessage>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title">Titulo</Label>
          <Input id="title" name="title" defaultValue={showcase?.title ?? organizationName} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select id="status" name="status" defaultValue={showcase?.status ?? "DRAFT"}>
            <option value="DRAFT">Rascunho</option>
            <option value="PUBLISHED">Publicado</option>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="subtitle">Subtitulo</Label>
        <Input id="subtitle" name="subtitle" defaultValue={showcase?.subtitle ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Descricao</Label>
        <Textarea id="description" name="description" defaultValue={showcase?.description ?? ""} className="min-h-28" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="heroImageUrl">Imagem principal</Label>
          <Input id="heroImageUrl" name="heroImageUrl" defaultValue={showcase?.hero_image_url ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="whatsapp">WhatsApp</Label>
          <Input id="whatsapp" name="whatsapp" defaultValue={showcase?.whatsapp ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="instagramUrl">Instagram</Label>
          <Input id="instagramUrl" name="instagramUrl" defaultValue={showcase?.instagram_url ?? ""} />
        </div>
      </div>
      <SubmitButton>Salvar vitrine</SubmitButton>
    </form>
  );
}

export function ShowcaseLinkForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action] = useActionState(createShowcaseLinkStateAction, initialState);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form ref={formRef} action={action} className="grid gap-3">
      <FormMessage type="success">{state.message}</FormMessage>
      <FormMessage>{state.error}</FormMessage>
      <Input name="label" placeholder="WhatsApp comercial" required />
      <Input name="url" placeholder="https://..." required />
      <SubmitButton variant="secondary">Adicionar link</SubmitButton>
    </form>
  );
}
