"use client";

import { useActionState, useEffect, useRef } from "react";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { createAiAgentStateAction, type AiActionState } from "@/features/ai/actions";

const initialState: AiActionState = { ok: false };

export function AiAgentForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action] = useActionState(createAiAgentStateAction, initialState);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form ref={formRef} action={action} className="grid gap-3">
      <FormMessage type="success">{state.message}</FormMessage>
      <FormMessage>{state.error}</FormMessage>
      <Input name="name" placeholder="SDR de qualificacao" required />
      <Select name="goal" defaultValue="QUALIFY_LEADS">
        <option value="QUALIFY_LEADS">Qualificar leads</option>
        <option value="FOLLOW_UP">Follow-up</option>
        <option value="SUPPORT">Suporte</option>
        <option value="SALES_ASSISTANT">Assistente de vendas</option>
        <option value="OPERATIONS">Operacoes</option>
      </Select>
      <Select name="status" defaultValue="DRAFT">
        <option value="DRAFT">Rascunho</option>
        <option value="ACTIVE">Ativo</option>
        <option value="PAUSED">Pausado</option>
      </Select>
      <Textarea
        name="instructions"
        placeholder="Instrucoes do agente, tom de voz, perguntas e criterios de qualificacao"
        className="min-h-32"
        required
      />
      <Textarea
        name="guardrails"
        placeholder="Limites: nao prometer resultados, nao pedir dados sensiveis, transferir para humano..."
      />
      <SubmitButton>Criar agente</SubmitButton>
    </form>
  );
}
