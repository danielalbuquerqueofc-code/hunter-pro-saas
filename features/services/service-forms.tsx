"use client";

import { useActionState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  createServiceCategoryStateAction,
  createServiceStateAction,
  type ServiceActionState
} from "@/features/services/actions";

type Category = {
  id: string;
  name: string;
};

const initialState: ServiceActionState = { ok: false };

export function ServiceForms({ categories }: { categories: Category[] }) {
  const categoryFormRef = useRef<HTMLFormElement>(null);
  const serviceFormRef = useRef<HTMLFormElement>(null);
  const [categoryState, categoryAction] = useActionState(
    createServiceCategoryStateAction,
    initialState
  );
  const [serviceState, serviceAction] = useActionState(createServiceStateAction, initialState);

  useEffect(() => {
    if (categoryState.ok) categoryFormRef.current?.reset();
  }, [categoryState.ok]);

  useEffect(() => {
    if (serviceState.ok) serviceFormRef.current?.reset();
  }, [serviceState.ok]);

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader><CardTitle>Nova categoria</CardTitle></CardHeader>
        <CardContent>
          <form ref={categoryFormRef} action={categoryAction} className="grid gap-3">
            <FormMessage type="success">{categoryState.message}</FormMessage>
            <FormMessage>{categoryState.error}</FormMessage>
            <Input name="name" placeholder="Consultoria" required />
            <Input name="description" placeholder="Descricao curta" />
            <SubmitButton>Criar categoria</SubmitButton>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Novo servico</CardTitle></CardHeader>
        <CardContent>
          <form ref={serviceFormRef} action={serviceAction} className="grid gap-3">
            <FormMessage type="success">{serviceState.message}</FormMessage>
            <FormMessage>{serviceState.error}</FormMessage>
            <Select name="categoryId">
              <option value="">Sem categoria</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </Select>
            <Input name="name" placeholder="Diagnostico estrategico" required />
            <Input name="description" placeholder="O que sera entregue" />
            <div className="grid grid-cols-2 gap-3">
              <Input name="durationMinutes" type="number" defaultValue={60} min={15} />
              <Input name="priceCents" type="number" defaultValue={0} min={0} />
            </div>
            <label className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white p-3 text-sm font-semibold text-zinc-700">
              <input name="isOnline" type="checkbox" defaultChecked />
              Atendimento online
            </label>
            <SubmitButton>Criar servico</SubmitButton>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
