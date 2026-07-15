"use client";

import { useActionState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  createFinancialCategoryStateAction,
  createFinancialTransactionStateAction,
  type FinanceActionState
} from "@/features/finance/actions";

type Category = {
  id: string;
  name: string;
  type: string;
};

const initialState: FinanceActionState = { ok: false };
const paymentMethods = [
  "PIX",
  "CREDIT_CARD",
  "DEBIT_CARD",
  "BANK_TRANSFER",
  "CASH",
  "BOLETO",
  "OTHER"
];

export function FinanceForms({ categories }: { categories: Category[] }) {
  const categoryFormRef = useRef<HTMLFormElement>(null);
  const transactionFormRef = useRef<HTMLFormElement>(null);
  const [categoryState, categoryAction] = useActionState(
    createFinancialCategoryStateAction,
    initialState
  );
  const [transactionState, transactionAction] = useActionState(
    createFinancialTransactionStateAction,
    initialState
  );

  useEffect(() => {
    if (categoryState.ok) categoryFormRef.current?.reset();
  }, [categoryState.ok]);

  useEffect(() => {
    if (transactionState.ok) transactionFormRef.current?.reset();
  }, [transactionState.ok]);

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader><CardTitle>Nova categoria</CardTitle></CardHeader>
        <CardContent>
          <form ref={categoryFormRef} action={categoryAction} className="grid gap-3">
            <FormMessage type="success">{categoryState.message}</FormMessage>
            <FormMessage>{categoryState.error}</FormMessage>
            <Select name="type">
              <option value="INCOME">Receita</option>
              <option value="EXPENSE">Despesa</option>
            </Select>
            <Input name="name" placeholder="Categoria" required />
            <Input name="description" placeholder="Descricao" />
            <SubmitButton>Criar categoria</SubmitButton>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Novo lancamento</CardTitle></CardHeader>
        <CardContent>
          <form ref={transactionFormRef} action={transactionAction} className="grid gap-3">
            <FormMessage type="success">{transactionState.message}</FormMessage>
            <FormMessage>{transactionState.error}</FormMessage>
            <div className="grid grid-cols-2 gap-3">
              <Select name="type">
                <option value="INCOME">Receita</option>
                <option value="EXPENSE">Despesa</option>
              </Select>
              <Select name="status">
                <option value="PENDING">Pendente</option>
                <option value="PAID">Pago</option>
                <option value="CANCELED">Cancelado</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryId">Categoria</Label>
              <Select id="categoryId" name="categoryId">
                <option value="">Sem categoria</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.type} - {category.name}
                  </option>
                ))}
              </Select>
            </div>
            <Input name="description" placeholder="Descricao do lancamento" required />
            <Input name="amountCents" type="number" placeholder="Valor em centavos" min={1} required />
            <div className="grid grid-cols-2 gap-3">
              <Input name="dueDate" type="date" />
              <Input name="paidAt" type="datetime-local" />
            </div>
            <Select name="paymentMethod">
              {paymentMethods.map((method) => <option key={method} value={method}>{method}</option>)}
            </Select>
            <Input name="notes" placeholder="Observacoes" />
            <SubmitButton>Criar lancamento</SubmitButton>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
