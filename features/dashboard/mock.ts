import {
  Banknote,
  CalendarDays,
  CircleDollarSign,
  FileText,
  Goal,
  TrendingUp,
  Users,
  WalletCards
} from "lucide-react";

export const dashboardQuickActions = [
  { href: "/leads", label: "Novo lead", icon: Users },
  { href: "/agenda", label: "Novo agendamento", icon: CalendarDays },
  { href: "/orcamentos", label: "Novo orcamento", icon: FileText },
  { href: "/vendas", label: "Nova venda", icon: Banknote },
  { href: "/financeiro", label: "Nova transacao", icon: WalletCards },
  { href: "/clientes", label: "Cadastrar cliente", icon: Users }
];

export const dashboardMetrics = [
  {
    title: "Faturamento do mes",
    value: "R$ 0,00",
    comparison: "Aguardando primeiras vendas",
    trend: "neutral",
    href: "/vendas",
    icon: CircleDollarSign
  },
  {
    title: "Saldo atual",
    value: "R$ 0,00",
    comparison: "Sem movimentacoes hoje",
    trend: "neutral",
    href: "/financeiro",
    icon: WalletCards
  },
  {
    title: "Ticket medio",
    value: "R$ 0,00",
    comparison: "Sera calculado com vendas",
    trend: "neutral",
    href: "/relatorios",
    icon: TrendingUp
  },
  {
    title: "Agendamentos de hoje",
    value: "0",
    comparison: "Agenda livre",
    trend: "positive",
    href: "/agenda",
    icon: CalendarDays
  },
  {
    title: "Novos leads",
    value: "0",
    comparison: "Conecte sua vitrine",
    trend: "neutral",
    href: "/leads",
    icon: Users
  },
  {
    title: "Oportunidades abertas",
    value: "0",
    comparison: "Funil pronto para uso",
    trend: "neutral",
    href: "/pipeline",
    icon: Goal
  },
  {
    title: "Contas a receber",
    value: "R$ 0,00",
    comparison: "Nenhuma pendencia",
    trend: "positive",
    href: "/financeiro",
    icon: Banknote
  },
  {
    title: "Taxa de conversao",
    value: "0%",
    comparison: "Sem base suficiente",
    trend: "neutral",
    href: "/relatorios",
    icon: TrendingUp
  }
] as const;

export const paymentSummary = [
  { label: "Pix", value: "R$ 0,00", color: "#38bdf8" },
  { label: "Dinheiro", value: "R$ 0,00", color: "#ef4444" },
  { label: "Credito", value: "R$ 0,00", color: "#22c55e" },
  { label: "Debito", value: "R$ 0,00", color: "#f59e0b" },
  { label: "Boleto", value: "R$ 0,00", color: "#94a3b8" },
  { label: "Transferencia", value: "R$ 0,00", color: "#111827" }
];

export const todayAppointments = [
  {
    time: "09:00",
    customer: "Agenda livre",
    service: "Crie seu primeiro agendamento",
    professional: "Equipe",
    status: "Pendente",
    value: "R$ 0,00"
  }
];

export const pipelineSummary = [
  { label: "Novos leads", value: 88 },
  { label: "Em contato", value: 76 },
  { label: "Orcamento enviado", value: 64 },
  { label: "Negociacao", value: 52 },
  { label: "Venda realizada", value: 40 },
  { label: "Perdidos", value: 12 }
];

export const activityFeed = [
  "Empresa criada com sucesso",
  "Checklist de configuracao iniciado",
  "Vitrine digital pronta para personalizacao",
  "Pipeline comercial preparado"
];

export const pendingTasks = [
  { title: "Cadastrar primeiro servico", due: "Hoje", owner: "Administrador", priority: "Alta" },
  { title: "Publicar vitrine digital", due: "Esta semana", owner: "Administrador", priority: "Media" },
  { title: "Convidar funcionario", due: "Opcional", owner: "Administrador", priority: "Baixa" }
];

export const setupChecklist = [
  { label: "Adicionar logo", href: "/configuracoes", done: false, weight: 10 },
  { label: "Preencher descricao", href: "/configuracoes", done: false, weight: 10 },
  { label: "Adicionar telefone", href: "/configuracoes", done: false, weight: 10 },
  { label: "Adicionar endereco", href: "/configuracoes", done: false, weight: 10 },
  { label: "Cadastrar primeiro servico", href: "/servicos", done: false, weight: 15 },
  { label: "Cadastrar primeiro profissional", href: "/servicos", done: false, weight: 10 },
  { label: "Configurar disponibilidade", href: "/agenda", done: false, weight: 10 },
  { label: "Publicar vitrine", href: "/vitrine", done: false, weight: 10 },
  { label: "Convidar funcionario", href: "/usuarios", done: false, weight: 10 },
  { label: "Conectar WhatsApp", href: "/automacoes", done: false, weight: 5 }
];

export type SetupChecklistItem = (typeof setupChecklist)[number];

export const aiAlerts = [
  "Voce possui 7 orcamentos sem retorno.",
  "Existem 4 clientes que nao compram ha mais de 90 dias.",
  "Amanha existem 3 horarios disponiveis.",
  "Seu faturamento esta 12% abaixo do mes anterior."
];
