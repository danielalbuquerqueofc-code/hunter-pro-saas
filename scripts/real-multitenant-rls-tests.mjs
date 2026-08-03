import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = process.cwd();

loadEnvFile(".env.rls.local");
loadEnvFile(".env.local");

const testUrl = process.env.SUPABASE_TEST_URL ?? "";
const testAnonKey = process.env.SUPABASE_TEST_ANON_KEY ?? "";
const testServiceRoleKey = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY ?? "";
const confirmation = process.env.HUNTER_RLS_TEST_CONFIRM ?? "";
const appSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

const failures = [];
const evidence = [];
const createdUsers = [];
const runId = randomUUID().slice(0, 8);
const emailDomain = "hunter-pro-rls.test";
const password = `HunterPro!${runId}Test`;

if (!testUrl || !testAnonKey || !testServiceRoleKey) {
  fail(
    "Configure SUPABASE_TEST_URL, SUPABASE_TEST_ANON_KEY e SUPABASE_TEST_SERVICE_ROLE_KEY em um projeto Supabase exclusivo de teste."
  );
}

if (confirmation !== "TEST_PROJECT_ONLY") {
  fail('Defina HUNTER_RLS_TEST_CONFIRM="TEST_PROJECT_ONLY" para confirmar que este nao e o banco de producao.');
}

if (testUrl && appSupabaseUrl && normalizeUrl(testUrl) === normalizeUrl(appSupabaseUrl)) {
  fail("SUPABASE_TEST_URL aponta para o mesmo projeto de NEXT_PUBLIC_SUPABASE_URL. Use um projeto exclusivo de teste.");
}

if (failures.length > 0) {
  printResultsAndExit();
}

const admin = createClient(testUrl, testServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

const users = {
  ownerA: userSpec("owner_empresa_a"),
  adminA: userSpec("admin_empresa_a"),
  professionalA: userSpec("profissional_empresa_a"),
  financialA: userSpec("financeiro_empresa_a"),
  ownerB: userSpec("owner_empresa_b"),
  professionalB: userSpec("profissional_empresa_b")
};

const roles = [
  ["ownerA", "OWNER"],
  ["adminA", "ADMIN"],
  ["professionalA", "PROFESSIONAL"],
  ["financialA", "FINANCIAL"],
  ["ownerB", "OWNER"],
  ["professionalB", "PROFESSIONAL"]
];

const tables = [
  { table: "organizations", update: { description: `isolamento ${runId}` }, insert: null },
  { table: "organization_members", update: null, insert: null },
  { table: "subscriptions", update: null, insert: null },
  entity("contacts", { notes: `editado ${runId}` }, ({ orgB }) => ({
    organization_id: orgB.id,
    name: `Contato invasao ${runId}`,
    type: "LEAD",
    status: "NEW"
  })),
  entity("professionals", { bio: `editado ${runId}` }, ({ orgB }) => ({
    organization_id: orgB.id,
    name: `Profissional invasao ${runId}`
  })),
  entity("service_categories", { description: `editado ${runId}` }, ({ orgB }) => ({
    organization_id: orgB.id,
    name: `Categoria invasao ${runId}`
  })),
  entity("services", { description: `editado ${runId}` }, ({ orgB, categoryB }) => ({
    organization_id: orgB.id,
    category_id: categoryB.id,
    name: `Servico invasao ${runId}`,
    duration_minutes: 30,
    price_cents: 1000,
    is_online: true,
    is_active: true
  })),
  entity("availability_rules", { label: `editado ${runId}` }, ({ orgB, professionalB }) => ({
    organization_id: orgB.id,
    professional_id: professionalB.id,
    weekday: 2,
    start_time: "08:00",
    end_time: "12:00",
    is_active: true
  })),
  entity("blocked_times", { reason: `editado ${runId}` }, ({ orgB, professionalB }) => ({
    organization_id: orgB.id,
    professional_id: professionalB.id,
    starts_at: inFuture(9),
    ends_at: inFuture(10),
    reason: `Bloqueio invasao ${runId}`
  })),
  entity("appointments", { notes: `editado ${runId}` }, ({ orgB, serviceB, professionalB }) => ({
    organization_id: orgB.id,
    service_id: serviceB.id,
    professional_id: professionalB.id,
    customer_name: `Cliente invasao ${runId}`,
    starts_at: inFuture(11),
    ends_at: inFuture(12),
    occupied_starts_at: inFuture(11),
    occupied_ends_at: inFuture(12),
    status: "REQUESTED",
    status_v2: "pending",
    source: "showcase"
  })),
  entity("financial_categories", { description: `editado ${runId}` }, ({ orgB }) => ({
    organization_id: orgB.id,
    type: "INCOME",
    name: `Financeiro invasao ${runId}`
  })),
  entity("financial_transactions", { notes: `editado ${runId}` }, ({ orgB, financialCategoryB, ownerB }) => ({
    organization_id: orgB.id,
    category_id: financialCategoryB.id,
    created_by: ownerB.id,
    type: "INCOME",
    status: "PENDING",
    payment_method: "PIX",
    description: `Transacao invasao ${runId}`,
    amount_cents: 1000
  })),
  entity("tasks", { description: `editado ${runId}` }, ({ orgB, ownerB }) => ({
    organization_id: orgB.id,
    created_by: ownerB.id,
    assigned_to: ownerB.id,
    title: `Tarefa invasao ${runId}`
  })),
  entity("notifications", { message: `editado ${runId}` }, ({ orgB, ownerB }) => ({
    organization_id: orgB.id,
    user_id: ownerB.id,
    title: `Notificacao invasao ${runId}`,
    body: "Validacao RLS"
  })),
  entity("showcases", { description: `editado ${runId}` }, ({ orgB }) => ({
    organization_id: orgB.id,
    title: `Vitrine invasao ${runId}`,
    status: "DRAFT"
  })),
  entity("showcase_gallery", { alt_text: `editado ${runId}` }, ({ orgB, showcaseB }) => ({
    organization_id: orgB.id,
    showcase_id: showcaseB.id,
    image_url: "https://example.com/test.jpg",
    alt_text: `Galeria invasao ${runId}`
  })),
  entity("integrations", { public_config: { edited: runId } }, ({ orgB }) => ({
    organization_id: orgB.id,
    provider: "WHATSAPP",
    status: "DISCONNECTED",
    display_name: `WhatsApp invasao ${runId}`
  })),
  entity("automations", { description: `editado ${runId}` }, ({ orgB, ownerB }) => ({
    organization_id: orgB.id,
    name: `Automacao invasao ${runId}`,
    trigger_key: "appointment.created",
    created_by: ownerB.id
  })),
  entity("organization_settings", { theme: "light" }, ({ orgB }) => ({
    organization_id: orgB.id,
    theme: "dark",
    primary_color: "#123456"
  })),
  entity("onboarding_progress", { dismissed: true }, ({ orgB, ownerB }) => ({
    organization_id: orgB.id,
    user_id: ownerB.id,
    current_step: 1
  })),
  entity("conversations", { subject: `editado ${runId}` }, ({ orgB, contactB, ownerB }) => ({
    organization_id: orgB.id,
    contact_id: contactB.id,
    assigned_to: ownerB.id,
    channel: "MANUAL",
    status: "OPEN",
    subject: `Conversa invasao ${runId}`
  })),
  entity("messages", { body: `editado ${runId}` }, ({ orgB, conversationB, contactB, ownerB }) => ({
    organization_id: orgB.id,
    conversation_id: conversationB.id,
    contact_id: contactB.id,
    actor_id: ownerB.id,
    direction: "OUTBOUND",
    status: "DRAFT",
    body: `Mensagem invasao ${runId}`
  })),
  entity("appointment_holds", { status: "EXPIRED" }, ({ orgB, professionalB, serviceB }) => ({
    organization_id: orgB.id,
    professional_id: professionalB.id,
    service_id: serviceB.id,
    starts_at: inFuture(13),
    ends_at: inFuture(14),
    occupied_starts_at: inFuture(13),
    occupied_ends_at: inFuture(14),
    expires_at: inFuture(15)
  })),
  entity("reminder_rules", { name: `editado ${runId}` }, ({ orgB }) => ({
    organization_id: orgB.id,
    name: `Regra invasao ${runId}`,
    offset_minutes: 60,
    template_key: "appointment_reminder"
  })),
  entity("reminder_jobs", { error_message: `editado ${runId}` }, ({ orgB, appointmentB }) => ({
    organization_id: orgB.id,
    appointment_id: appointmentB.id,
    scheduled_at: inFuture(16),
    idempotency_key: `rls-${runId}-job-b`
  })),
  entity("whatsapp_message_deliveries", { last_error: `editado ${runId}` }, ({ orgB, appointmentB }) => ({
    organization_id: orgB.id,
    appointment_id: appointmentB.id,
    to_phone: "+5599999999999",
    idempotency_key: `rls-${runId}-wa-b`
  })),
  entity("google_calendar_connections", { last_error: `editado ${runId}` }, ({ orgB, professionalB }) => ({
    organization_id: orgB.id,
    professional_id: professionalB.id,
    status: "DISCONNECTED",
    calendar_id: `rls-${runId}`
  }))
];

try {
  const context = await seedScenario();
  const ownerAClient = await signIn(users.ownerA.email, password);
  const ownerBClient = await signIn(users.ownerB.email, password);

  await assertCurrentUser(ownerAClient, users.ownerA.email);
  await assertCurrentUser(ownerBClient, users.ownerB.email);

  for (const tableSpec of tables) {
    await testIsolation(tableSpec, ownerAClient, context, "A", "B");
    await testIsolation(tableSpec, ownerBClient, context, "B", "A");
  }
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
} finally {
  await cleanupUsers();
}

printResultsAndExit();

async function seedScenario() {
  for (const spec of Object.values(users)) {
    const { data, error } = await admin.auth.admin.createUser({
      email: spec.email,
      password,
      email_confirm: true,
      user_metadata: { full_name: spec.name }
    });

    if (error) {
      throw new Error(`Nao foi possivel criar usuario ${spec.email}: ${error.message}`);
    }

    spec.id = data.user.id;
    createdUsers.push(data.user.id);

    await mustInsert("profiles", {
      id: spec.id,
      full_name: spec.name
    });
  }

  const plan = await getOrCreatePlan();

  const orgA = await mustInsert("organizations", {
    name: `Empresa A RLS ${runId}`,
    slug: `rls-a-${runId}`,
    owner_id: users.ownerA.id,
    plan_id: plan?.id ?? null,
    status: "ACTIVE"
  });
  const orgB = await mustInsert("organizations", {
    name: `Empresa B RLS ${runId}`,
    slug: `rls-b-${runId}`,
    owner_id: users.ownerB.id,
    plan_id: plan?.id ?? null,
    status: "ACTIVE"
  });

  const seededMembers = {};
  for (const [key, role] of roles) {
    const organization_id = key.endsWith("B") ? orgB.id : orgA.id;
    seededMembers[key] = await mustInsert("organization_members", {
      organization_id,
      user_id: users[key].id,
      role,
      status: "ACTIVE",
      accepted_at: new Date().toISOString()
    });
  }

  const subscriptionA = await maybeInsert("subscriptions", {
    organization_id: orgA.id,
    plan_id: plan?.id,
    status: "ACTIVE"
  });
  const subscriptionB = await maybeInsert("subscriptions", {
    organization_id: orgB.id,
    plan_id: plan?.id,
    status: "ACTIVE"
  });

  const baseA = await seedOrganizationData(orgA, users.ownerA, "A");
  const baseB = await seedOrganizationData(orgB, users.ownerB, "B");

  evidence.push(`Cenario criado: Empresa A ${orgA.id} / Empresa B ${orgB.id}`);

  return {
    orgA,
    orgB,
    subscriptionA,
    subscriptionB,
    memberA: seededMembers.ownerA,
    memberB: seededMembers.ownerB,
    ...prefixKeys(baseA, "A"),
    ...prefixKeys(baseB, "B"),
    ownerA: users.ownerA,
    ownerB: users.ownerB
  };
}

async function seedOrganizationData(org, owner, label) {
  const contact = await mustInsert("contacts", {
    organization_id: org.id,
    owner_id: owner.id,
    type: "CUSTOMER",
    status: "ACTIVE",
    name: `Cliente ${label} ${runId}`,
    email: `cliente-${label}-${runId}@${emailDomain}`,
    lgpd_consent_at: new Date().toISOString(),
    lgpd_consent_source: "rls-test"
  });

  const category = await mustInsert("service_categories", {
    organization_id: org.id,
    name: `Categoria ${label} ${runId}`
  });

  const service = await mustInsert("services", {
    organization_id: org.id,
    category_id: category.id,
    name: `Servico ${label} ${runId}`,
    duration_minutes: 30,
    price_cents: 1000,
    is_online: true,
    is_active: true
  });

  const professional = await mustInsert("professionals", {
    organization_id: org.id,
    user_id: owner.id,
    name: `Profissional ${label} ${runId}`,
    email: owner.email,
    is_active: true
  });

  await maybeInsert("professional_services", {
    organization_id: org.id,
    professional_id: professional.id,
    service_id: service.id
  });

  const availabilityRule = await maybeInsert("availability_rules", {
    organization_id: org.id,
    professional_id: professional.id,
    weekday: 1,
    start_time: "08:00",
    end_time: "12:00",
    is_active: true,
    label: `Turno ${label}`
  });

  const blockedTime = await maybeInsert("blocked_times", {
    organization_id: org.id,
    professional_id: professional.id,
    starts_at: inFuture(label === "A" ? 1 : 2),
    ends_at: inFuture(label === "A" ? 2 : 3),
    reason: `Bloqueio ${label} ${runId}`
  });

  const appointment = await mustInsert("appointments", {
    organization_id: org.id,
    service_id: service.id,
    professional_id: professional.id,
    customer_name: `Agendamento ${label} ${runId}`,
    customer_email: `agenda-${label}-${runId}@${emailDomain}`,
    customer_phone: "+5599999999999",
    starts_at: inFuture(label === "A" ? 3 : 4),
    ends_at: inFuture(label === "A" ? 4 : 5),
    occupied_starts_at: inFuture(label === "A" ? 3 : 4),
    occupied_ends_at: inFuture(label === "A" ? 4 : 5),
    status: "REQUESTED",
    status_v2: "pending",
    source: "showcase",
    notes: `Teste ${label}`
  });

  const financialCategory = await mustInsert("financial_categories", {
    organization_id: org.id,
    type: "INCOME",
    name: `Receita ${label} ${runId}`
  });

  const financialTransaction = await mustInsert("financial_transactions", {
    organization_id: org.id,
    category_id: financialCategory.id,
    contact_id: contact.id,
    appointment_id: appointment.id,
    created_by: owner.id,
    type: "INCOME",
    status: "PENDING",
    payment_method: "PIX",
    description: `Transacao ${label} ${runId}`,
    amount_cents: 2500
  });

  const task = await mustInsert("tasks", {
    organization_id: org.id,
    contact_id: contact.id,
    assigned_to: owner.id,
    created_by: owner.id,
    title: `Tarefa ${label} ${runId}`,
    description: "Validacao RLS"
  });

  const notification = await mustInsert("notifications", {
    organization_id: org.id,
    user_id: owner.id,
    title: `Notificacao ${label} ${runId}`,
    body: "Validacao RLS"
  });

  const showcase = await mustInsert("showcases", {
    organization_id: org.id,
    title: `Vitrine ${label} ${runId}`,
    subtitle: "Rascunho de validacao",
    status: "DRAFT"
  });

  const showcaseGallery = await maybeInsert("showcase_gallery", {
    organization_id: org.id,
    showcase_id: showcase.id,
    image_url: "https://example.com/test.jpg",
    alt_text: `Galeria ${label} ${runId}`
  });

  const integration = await maybeInsert("integrations", {
    organization_id: org.id,
    provider: "WHATSAPP",
    status: "DISCONNECTED",
    display_name: `WhatsApp ${label} ${runId}`
  });

  const automation = await maybeInsert("automations", {
    organization_id: org.id,
    name: `Automacao ${label} ${runId}`,
    status: "DRAFT",
    trigger_key: "appointment.created",
    created_by: owner.id
  });

  const organizationSetting = await maybeInsert("organization_settings", {
    organization_id: org.id,
    theme: "light",
    primary_color: "#F74E14"
  });

  const onboardingProgress = await maybeInsert("onboarding_progress", {
    organization_id: org.id,
    user_id: owner.id,
    current_step: 1
  });

  const conversation = await maybeInsert("conversations", {
    organization_id: org.id,
    contact_id: contact.id,
    assigned_to: owner.id,
    channel: "MANUAL",
    status: "OPEN",
    subject: `Conversa ${label} ${runId}`
  });

  const message = await maybeInsert("messages", {
    organization_id: org.id,
    conversation_id: conversation?.id,
    contact_id: contact.id,
    actor_id: owner.id,
    direction: "OUTBOUND",
    status: "DRAFT",
    body: `Mensagem ${label} ${runId}`
  });

  const appointmentHold = await maybeInsert("appointment_holds", {
    organization_id: org.id,
    professional_id: professional.id,
    service_id: service.id,
    starts_at: inFuture(label === "A" ? 5 : 6),
    ends_at: inFuture(label === "A" ? 6 : 7),
    occupied_starts_at: inFuture(label === "A" ? 5 : 6),
    occupied_ends_at: inFuture(label === "A" ? 6 : 7),
    expires_at: inFuture(8)
  });

  const reminderRule = await maybeInsert("reminder_rules", {
    organization_id: org.id,
    name: `Lembrete ${label} ${runId}`,
    offset_minutes: 60,
    template_key: "appointment_reminder"
  });

  const reminderJob = await maybeInsert("reminder_jobs", {
    organization_id: org.id,
    appointment_id: appointment.id,
    scheduled_at: inFuture(8),
    idempotency_key: `rls-${runId}-job-${label}`
  });

  const whatsappDelivery = await maybeInsert("whatsapp_message_deliveries", {
    organization_id: org.id,
    appointment_id: appointment.id,
    reminder_job_id: reminderJob?.id ?? null,
    to_phone: "+5599999999999",
    idempotency_key: `rls-${runId}-wa-${label}`
  });

  const googleConnection = await maybeInsert("google_calendar_connections", {
    organization_id: org.id,
    professional_id: professional.id,
    status: "DISCONNECTED",
    calendar_id: `rls-${runId}-${label}`
  });

  return {
    contact,
    category,
    service,
    professional,
    availabilityRule,
    blockedTime,
    appointment,
    financialCategory,
    financialTransaction,
    task,
    notification,
    showcase,
    showcaseGallery,
    integration,
    automation,
    organizationSetting,
    onboardingProgress,
    conversation,
    message,
    appointmentHold,
    reminderRule,
    reminderJob,
    whatsappDelivery,
    googleConnection
  };
}

async function testIsolation(tableSpec, client, context, ownLabel, otherLabel) {
  const ownOrg = context[`org${ownLabel}`];
  const otherOrg = context[`org${otherLabel}`];
  const ownRow = getSeedRow(tableSpec.table, context, ownLabel);
  const otherRow = getSeedRow(tableSpec.table, context, otherLabel);

  if (!ownRow || !otherRow) {
    evidence.push(`SKIP ${tableSpec.table}: tabela ou seed nao disponivel no schema atual.`);
    return;
  }

  const ownList =
    tableSpec.table === "organizations"
      ? await client.from(tableSpec.table).select("id").eq("id", ownOrg.id)
      : await client.from(tableSpec.table).select("id, organization_id").eq("organization_id", ownOrg.id);
  expectNoError(`${tableSpec.table}: listagem propria ${ownLabel}`, ownList.error);
  expectRows(`${tableSpec.table}: listagem propria ${ownLabel}`, ownList.data, 1);

  const otherList =
    tableSpec.table === "organizations"
      ? await client.from(tableSpec.table).select("id").eq("id", otherOrg.id)
      : await client.from(tableSpec.table).select("id, organization_id").eq("organization_id", otherOrg.id);
  expectNoLeak(`${tableSpec.table}: listagem cruzada ${ownLabel}->${otherLabel}`, otherList);

  const readOther =
    tableSpec.table === "organizations"
      ? await client.from(tableSpec.table).select("id").eq("id", otherRow.id)
      : await client.from(tableSpec.table).select("id, organization_id").eq("id", otherRow.id);
  expectNoLeak(`${tableSpec.table}: leitura por ID cruzado ${ownLabel}->${otherLabel}`, readOther);

  if (tableSpec.update) {
    const updateOther = await client
      .from(tableSpec.table)
      .update(tableSpec.update)
      .eq("id", otherRow.id)
      .select("id");
    expectNoLeak(`${tableSpec.table}: edicao cruzada ${ownLabel}->${otherLabel}`, updateOther);
  }

  if (tableSpec.insert) {
    const payload = tableSpec.insert(context);
    const insertOther = await client.from(tableSpec.table).insert(payload).select("id");
    expectNoLeak(`${tableSpec.table}: criacao com organization_id de outra empresa ${ownLabel}->${otherLabel}`, insertOther);
  }

  const deleteOther = await client.from(tableSpec.table).delete().eq("id", otherRow.id).select("id");
  expectNoLeak(`${tableSpec.table}: exclusao cruzada ${ownLabel}->${otherLabel}`, deleteOther);
}

function getSeedRow(table, context, label) {
  const map = {
    organizations: `org${label}`,
    organization_members: label === "A" ? "memberA" : "memberB",
    subscriptions: `subscription${label}`,
    contacts: `contact${label}`,
    professionals: `professional${label}`,
    service_categories: `category${label}`,
    services: `service${label}`,
    availability_rules: `availabilityRule${label}`,
    blocked_times: `blockedTime${label}`,
    appointments: `appointment${label}`,
    financial_categories: `financialCategory${label}`,
    financial_transactions: `financialTransaction${label}`,
    tasks: `task${label}`,
    notifications: `notification${label}`,
    showcases: `showcase${label}`,
    showcase_gallery: `showcaseGallery${label}`,
    integrations: `integration${label}`,
    automations: `automation${label}`,
    organization_settings: `organizationSetting${label}`,
    onboarding_progress: `onboardingProgress${label}`,
    conversations: `conversation${label}`,
    messages: `message${label}`,
    appointment_holds: `appointmentHold${label}`,
    reminder_rules: `reminderRule${label}`,
    reminder_jobs: `reminderJob${label}`,
    whatsapp_message_deliveries: `whatsappDelivery${label}`,
    google_calendar_connections: `googleConnection${label}`
  };

  if (table === "organization_members") {
    return context[map[table]];
  }

  return context[map[table]];
}

async function getOrCreatePlan() {
  const { data: current, error: currentError } = await admin.from("plans").select("id").eq("code", "free").maybeSingle();
  if (currentError) {
    throw new Error(`Nao foi possivel consultar plano free: ${currentError.message}`);
  }

  if (current) {
    return current;
  }

  return mustInsert("plans", {
    code: `rls-free-${runId}`,
    name: "RLS Test",
    description: "Plano temporario para validacao RLS",
    price_cents: 0
  });
}

async function signIn(email, passwordValue) {
  const client = createClient(testUrl, testAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
  const { error } = await client.auth.signInWithPassword({ email, password: passwordValue });
  if (error) {
    throw new Error(`Nao foi possivel autenticar usuario comum ${email}: ${error.message}`);
  }
  return client;
}

async function assertCurrentUser(client, expectedEmail) {
  const { data, error } = await client.auth.getUser();
  if (error || data.user?.email !== expectedEmail) {
    throw new Error(`Sessao autenticada invalida para ${expectedEmail}.`);
  }
}

async function mustInsert(table, payload) {
  const { data, error } = await admin.from(table).insert(payload).select("*").single();
  if (error) {
    throw new Error(`Seed falhou em ${table}: ${error.message}`);
  }
  return data;
}

async function maybeInsert(table, payload) {
  const { data, error } = await admin.from(table).insert(payload).select("*").single();
  if (error) {
    evidence.push(`SKIP seed ${table}: ${error.message}`);
    return null;
  }
  return data;
}

function expectNoError(label, error) {
  if (error) {
    fail(`${label}: erro inesperado - ${error.message}`);
  } else {
    evidence.push(`OK ${label}`);
  }
}

function expectRows(label, rows, minimum) {
  if (!Array.isArray(rows) || rows.length < minimum) {
    fail(`${label}: esperado ao menos ${minimum} linha(s), recebido ${rows?.length ?? 0}.`);
  } else {
    evidence.push(`OK ${label}: ${rows.length} linha(s).`);
  }
}

function expectNoLeak(label, result) {
  if (result.error) {
    evidence.push(`OK ${label}: bloqueado por erro controlado (${result.error.code ?? "sem codigo"}).`);
    return;
  }

  const count = Array.isArray(result.data) ? result.data.length : result.data ? 1 : 0;
  if (count > 0) {
    fail(`${label}: VAZAMENTO DETECTADO (${count} linha(s) retornada(s)/alterada(s)).`);
    return;
  }

  evidence.push(`OK ${label}: 0 linha.`);
}

async function cleanupUsers() {
  for (const userId of createdUsers) {
    await admin.auth.admin.deleteUser(userId);
  }
}

function entity(table, update, insert) {
  return { table, update, insert };
}

function userSpec(name) {
  return {
    name,
    email: `${name}.${runId}@${emailDomain}`,
    id: null
  };
}

function prefixKeys(object, suffix) {
  const prefixed = {};
  for (const [key, value] of Object.entries(object)) {
    prefixed[`${key}${suffix}`] = value;
  }
  return prefixed;
}

function inFuture(hours) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + 14);
  date.setUTCHours(8 + hours, 0, 0, 0);
  return date.toISOString();
}

function fail(message) {
  failures.push(message);
}

function printResultsAndExit() {
  console.log(`Hunter Pro RLS real test run: ${runId}`);
  console.log(`Evidencias registradas: ${evidence.length}`);
  for (const line of evidence) {
    console.log(`- ${line}`);
  }

  if (failures.length > 0) {
    console.error("\nFalhas encontradas:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log("\nAPROVADO: nenhum vazamento multiempresa detectado nos testes executados.");
  process.exit(0);
}

function loadEnvFile(fileName) {
  const filePath = join(root, fileName);
  if (!existsSync(filePath)) {
    return;
  }

  const content = readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const [key, ...valueParts] = trimmed.split("=");
    const value = valueParts.join("=").replace(/^["']|["']$/g, "");
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function normalizeUrl(value) {
  return value.replace(/\/+$/, "").trim().toLowerCase();
}
