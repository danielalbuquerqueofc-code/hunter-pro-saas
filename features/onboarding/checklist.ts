export const setupChecklist = [
  { label: "Adicionar logo", href: "/configuracoes", done: false, weight: 10 },
  { label: "Preencher descricao", href: "/configuracoes", done: false, weight: 10 },
  { label: "Adicionar telefone", href: "/configuracoes", done: false, weight: 10 },
  { label: "Adicionar endereco", href: "/configuracoes", done: false, weight: 10 },
  { label: "Cadastrar primeiro servico", href: "/servicos", done: false, weight: 15 },
  { label: "Cadastrar primeiro profissional", href: "/agenda", done: false, weight: 10 },
  { label: "Configurar disponibilidade", href: "/agenda", done: false, weight: 10 },
  { label: "Publicar vitrine", href: "/vitrine", done: false, weight: 10 },
  { label: "Convidar funcionario", href: "/usuarios", done: false, weight: 10 },
  { label: "Conectar WhatsApp", href: "/automacoes", done: false, weight: 5 }
];

export type SetupChecklistItem = (typeof setupChecklist)[number];
