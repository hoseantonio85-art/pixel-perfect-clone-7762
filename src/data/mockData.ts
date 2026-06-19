export interface QGMIntegration {
  flag: "PASS" | "ERR";
  lastSuccessSync: string | null;
  sentValue: "PASS" | "ERR";
  syncStatus: "Успешно" | "Ошибка";
}

// Короткий статус карточки агента (workflow)
export type AgentCardStatus =
  | "no_eval"        // Нет оценки
  | "in_eval"        // В оценке
  | "ready"          // Готово (AI оценил, владелец смотрит)
  | "dispute"        // Есть спор (владелец оспорил риск)
  | "arbitration"    // Арбитраж (отправлено на арбитраж)
  | "approval"       // Согласование (отправлено без споров)
  | "approved"       // Согласовано
  | "corrected";     // Скорректировано

export interface Agent {
  id: string;
  name: string;
  code: string;
  division: string;
  department: string;
  version: number;
  lastModified: string;
  status: "awaiting" | "approved" | "review" | "none";
  riskLevel?: "critical" | "high" | "medium" | "low";
  cardStatus?: AgentCardStatus;
  info: {
    version: string;
    versionStatus: "Пром" | "Разработка";
    evaluatedAt: string | null;
    statusText: string;
    ke: string;
    cra: string;
    lifecycle: string;
    created: string;
    daysInWork: number;
    responsible: string;
    owner: string;
    description: string;
    qgm?: QGMIntegration;
  };
  risks: Risk[];
}

export interface RiskQuote {
  source: string;
  text: string;
}

export interface RiskFactor {
  code: string;
  title: string;
  weight: number;
  isDual?: boolean;
  quotes: RiskQuote[];
}

export interface RiskMeasure {
  code: string;
  title: string;
  weight: number;
  isDual?: boolean;
  factorCode: string;
  quotes: RiskQuote[];
}

// Действие владельца по риску. Если null — риск считается согласованным по умолчанию.
export type RiskOwnerAction = "dispute" | "returned" | null;

export interface Risk {
  id: string;
  code: string;
  title: string;
  level: "critical" | "high" | "medium" | "low";
  status: string;
  description: string;
  comment: string;
  reasoning?: string;
  finalRiskScore?: number;
  reasoningRaw?: RiskFactor[];
  measures?: RiskMeasure[];
  ownerAction?: RiskOwnerAction;
  ownerActionComment?: string;
}

export const agents: Agent[] = [
  {
    id: "1",
    name: "Агент клонирования диалога с бизнесом",
    code: "CI10112914",
    division: 'Дивизион "Опер центр"',
    department: "Клеть продаж",
    version: 1,
    lastModified: "24.12.2024",
    status: "awaiting",
    cardStatus: "ready",
    info: {
      version: "1.2",
      versionStatus: "Разработка",
      evaluatedAt: "18.02.2026 · 14:32",
      statusText: "Готово",
      ke: "CI10112914",
      cra: "CRA-1000",
      lifecycle: "Страховка",
      created: "24.09.2025",
      daysInWork: 1,
      responsible: "Вурхиз Н.Н.",
      owner: "Майерз М.Н.",
      description: "Текстовое поле с описанием версии Агента",
      qgm: {
        flag: "PASS",
        lastSuccessSync: "18.02.2026 · 14:33",
        sentValue: "PASS",
        syncStatus: "Успешно",
      },
    },
    risks: [
      {
        id: "r1",
        code: "CRA-12323",
        title: "Отказ инфраструктуры ИИ - платформ и сервисов",
        level: "high",
        status: "Не применим",
        ownerAction: "dispute",
        ownerActionComment: "Не согласен с уровнем — резервирование уже внедрено",
        description: "Одностороннее изменение условий договора о выпуске и обслуживании банковской карты, договора оказания услуги «Уведомления по операциям», а также условий предоставления тарифных планов и пакетов услуг стороной, осуществляющей предпринимательскую деятельность.\n\nТакие действия могут быть расценены как нарушение прав потребителей и привести к снижению доверия клиентов к компании.",
        comment: "Здесь сотрудник сообщает почему оценка данного вида риска требует корректировки и имеет статус не применим",
        reasoning: "Анализ выявил высокую вероятность отказа инфраструктуры на основе зависимости от внешних сервисов и отсутствия резервирования. Меры снижения частично компенсируют риск.",
        finalRiskScore: 11.3,
        reasoningRaw: [
          {
            code: "UFR-001",
            title: "Зависимость от внешних API-сервисов",
            weight: 1.0,
            isDual: false,
            quotes: [
              { source: "BT.docx", text: "Открытый ввод текста" },
              { source: "Arch.pdf", text: "Интеграция с внешним провайдером LLM без fallback" },
            ],
          },
          {
            code: "UFR-002",
            title: "Отсутствие механизма автоматического переключения",
            weight: 1.5,
            isDual: true,
            quotes: [
              { source: "BT.docx", text: "Нет описания механизма failover" },
            ],
          },
          {
            code: "UFR-003",
            title: "Недостаточное покрытие мониторингом",
            weight: 0.8,
            isDual: false,
            quotes: [
              { source: "Monitoring.xlsx", text: "Алерты настроены только на критические ошибки" },
            ],
          },
        ],
        measures: [
          {
            code: "UMF-095",
            title: "Наличие SLA с провайдером",
            weight: 2.0,
            isDual: false,
            factorCode: "UFR-001",
            quotes: [
              { source: "BT.docx", text: "нет открытого ввода" },
            ],
          },
          {
            code: "UMF-096",
            title: "Резервный канал обработки запросов",
            weight: 1.5,
            isDual: true,
            factorCode: "UFR-002",
            quotes: [
              { source: "Arch.pdf", text: "Предусмотрен ручной режим обработки" },
              { source: "BT.docx", text: "Описан процесс эскалации" },
            ],
          },
        ],
      },
      {
        id: "r2",
        code: "CRA-12324",
        title: "Взаимное влияние ИИ решений на едином ландшафте",
        level: "medium",
        status: "",
        description: "В августе 2022 в рамках сублицензионного договора осуществлена закупка лицензий ПО Kizen, но никаких файловых ...",
        comment: "",
        reasoning: "Обнаружены потенциальные конфликты между несколькими ИИ-агентами, работающими на общей инфраструктуре. Взаимное влияние может привести к деградации качества.",
        finalRiskScore: 7.2,
        reasoningRaw: [
          {
            code: "UFR-010",
            title: "Общие ресурсы GPU между агентами",
            weight: 1.2,
            isDual: false,
            quotes: [
              { source: "Infra.docx", text: "Все агенты используют единый кластер GPU" },
            ],
          },
          {
            code: "UFR-011",
            title: "Отсутствие изоляции данных между моделями",
            weight: 0.9,
            isDual: true,
            quotes: [
              { source: "Security.pdf", text: "Данные training pipeline не разделены" },
            ],
          },
        ],
        measures: [
          {
            code: "UMF-110",
            title: "Namespace-изоляция в Kubernetes",
            weight: 1.8,
            isDual: false,
            factorCode: "UFR-010",
            quotes: [
              { source: "Arch.pdf", text: "Каждый агент в отдельном namespace" },
            ],
          },
        ],
      },
      {
        id: "r3",
        code: "CRA-12325",
        title: "Уязвимости конфигурации и цепочки поставок",
        level: "low",
        status: "",
        description: "Уязвимости в зависимостях и конфигурации компонентов.",
        comment: "",
      },
      {
        id: "r4",
        code: "CRA-12326",
        title: "Прямые промпт-инъекции и манипуляции выводом модели",
        level: "high",
        status: "",
        description: "Возможность направленного воздействия на модель через промпт.",
        comment: "",
      },
      {
        id: "r5",
        code: "CRA-12327",
        title: "Не прямые промпт-инъекции (через данные и RAG)",
        level: "medium",
        status: "",
        description: "Инъекции через внешние документы и источники данных.",
        comment: "",
      },
      {
        id: "r6",
        code: "CRA-12328",
        title: "Утечка конфиденциальных данных через модель",
        level: "medium",
        status: "",
        description: "Возможность утечки данных через взаимодействие с языковой моделью.",
        comment: "",
      },
      {
        id: "r7",
        code: "CRA-12329",
        title: "Некорректная генерация контента",
        level: "medium",
        status: "",
        description: "Модель может генерировать некорректный или вредоносный контент.",
        comment: "",
      },
      {
        id: "r8",
        code: "CRA-12330",
        title: "Недостаточный мониторинг и аудит",
        level: "low",
        status: "",
        description: "Отсутствие мониторинга действий ИИ-агента.",
        comment: "",
      },
      {
        id: "r9",
        code: "CRA-12331",
        title: "Нарушение регуляторных требований",
        level: "medium",
        status: "",
        description: "Несоответствие требованиям регулятора в части использования ИИ.",
        comment: "",
      },
      {
        id: "r10",
        code: "CRA-12332",
        title: "Отказ в обслуживании ИИ-сервиса",
        level: "medium",
        status: "",
        description: "Возможность DoS-атаки на ИИ-сервис.",
        comment: "",
      },
      {
        id: "r11",
        code: "CRA-12333",
        title: "Несанкционированный доступ к модели",
        level: "low",
        status: "",
        description: "Возможность несанкционированного доступа.",
        comment: "",
      },
      {
        id: "r12",
        code: "CRA-12334",
        title: "Ошибки в обучающих данных",
        level: "low",
        status: "",
        description: "Наличие ошибок или предвзятости в данных обучения.",
        comment: "",
      },
      {
        id: "r13",
        code: "CRA-12335",
        title: "Репутационные риски",
        level: "low",
        status: "",
        description: "Риски для репутации компании при использовании ИИ.",
        comment: "",
      },
      {
        id: "r14",
        code: "CRA-12336",
        title: "Дрейф модели и деградация качества",
        level: "low",
        status: "",
        description: "Снижение качества предсказаний модели со временем.",
        comment: "",
      },
      {
        id: "r15",
        code: "CRA-12337",
        title: "Зависимость от единственного провайдера LLM",
        level: "low",
        status: "",
        description: "Vendor lock-in для базовой модели.",
        comment: "",
      },
      {
        id: "r16",
        code: "CRA-12338",
        title: "Недостаточная объяснимость решений",
        level: "low",
        status: "",
        description: "Сложность интерпретации выводов модели.",
        comment: "",
      },
      {
        id: "r17",
        code: "CRA-12339",
        title: "Юридические риски использования контента",
        level: "low",
        status: "",
        description: "Авторские права и лицензии на сгенерированный контент.",
        comment: "",
      },
      {
        id: "r18",
        code: "CRA-12340",
        title: "Риски этического характера",
        level: "low",
        status: "",
        description: "Этические аспекты применения ИИ-агента.",
        comment: "",
      },
    ],
  },
  {
    id: "2",
    name: "ИИ-агент в процесс регистрация самозанятого в сервисе Чужое дело",
    code: "CI10112914",
    division: "Дивизион «Опер центр»",
    department: "Клеть продаж",
    version: 1,
    lastModified: "24.12.2024",
    status: "approved",
    riskLevel: "high",
    info: {
      version: "1.0",
      versionStatus: "Пром",
      evaluatedAt: "20.01.2026 · 10:15",
      statusText: "Согласовано",
      ke: "CI10112914",
      cra: "CRA-1001",
      lifecycle: "Продакшн",
      created: "20.09.2025",
      daysInWork: 5,
      responsible: "Иванов И.И.",
      owner: "Петров П.П.",
      description: "ИИ-агент для автоматизации регистрации самозанятых.",
      qgm: {
        flag: "ERR",
        lastSuccessSync: "18.02.2026 · 12:01",
        sentValue: "ERR",
        syncStatus: "Ошибка",
      },
    },
    risks: [],
  },
  {
    id: "3",
    name: "Агент сервисов розыска",
    code: "CI10112914",
    division: "Розовое взыскание",
    department: "Подразделение по работе",
    version: 1,
    lastModified: "24.12.2024",
    status: "review",
    info: {
      version: "1.0",
      versionStatus: "Разработка",
      evaluatedAt: null,
      statusText: "Оценка",
      ke: "CI10112914",
      cra: "CRA-1002",
      lifecycle: "Тестирование",
      created: "18.09.2025",
      daysInWork: 7,
      responsible: "Сидоров С.С.",
      owner: "Козлов К.К.",
      description: "Агент для автоматизации сервисов розыска.",
    },
    risks: [],
  },
  {
    id: "4",
    name: "Credit cards.Debt",
    code: "CI10112914",
    division: "Финансы",
    department: "Кредитный отдел",
    version: 2,
    lastModified: "23.12.2024",
    status: "review",
    info: {
      version: "2.1",
      versionStatus: "Разработка",
      evaluatedAt: null,
      statusText: "Оценка",
      ke: "CI10112914",
      cra: "CRA-1003",
      lifecycle: "Разработка",
      created: "15.09.2025",
      daysInWork: 10,
      responsible: "Смирнов А.А.",
      owner: "Волков В.В.",
      description: "Агент для управления кредитными картами.",
    },
    risks: [],
  },
];

export interface VersionHistory {
  version: string;
  status: string;
  riskLevel: string;
  bigRisks: number;
  smallRisks: number;
}

export const versionHistory: VersionHistory[] = [
  { version: "Версия 3.4", status: "Пром", riskLevel: "Низкий", bigRisks: 5, smallRisks: 3 },
  { version: "Версия 3.3", status: "Архив", riskLevel: "Низкий", bigRisks: 5, smallRisks: 3 },
  { version: "Версия 3.2", status: "Архив", riskLevel: "Низкий", bigRisks: 5, smallRisks: 3 },
];

// ====== История агента (workflow) ======

export interface WorkflowActor {
  id: string;
  name: string;
  role: string;
}

export interface WorkflowAttachment {
  id: string;
  name: string;
  size?: string;
}

export interface WorkflowChange {
  field: string;
  label: string;
  before?: string;
  after?: string;
}

export type WorkflowEventType =
  | "version_created"
  | "version_activated"
  | "version_archived"
  | "evaluation_started"
  | "evaluation_completed"
  | "risk_disputed"
  | "dispute_updated"
  | "dispute_cancelled"
  | "sent_to_arbitration"
  | "proposal_accepted"
  | "proposal_rejected"
  | "risk_level_changed"
  | "applicability_changed"
  | "risk_accepted"
  | "acceptance_document_added"
  | "acceptance_document_replaced"
  | "sent_for_approval"
  | "returned_for_revision"
  | "resent"
  | "approved"
  | "corrected";

export interface WorkflowEvent {
  id: string;
  agentId: string;
  versionId: string;
  type: WorkflowEventType;
  title: string;
  actor: WorkflowActor;
  createdAt: string;
  statusBefore?: string;
  statusAfter?: string;
  comment?: string;
  risk?: { id: string; code: string; title: string };
  changes?: WorkflowChange[];
  attachments?: WorkflowAttachment[];
  metadata?: {
    expiresAt?: string;
    approver?: string;
    disputedRisksCount?: number;
    basis?: string;
  };
}

export interface AgentVersionHistory {
  id: string;
  agentId: string;
  version: string;
  versionStatus: "Текущая" | "Пром" | "Разработка" | "Архив";
  isCurrent: boolean;
  createdAt: string;
  evaluatedAt?: string;
  cardStatus: AgentCardStatus;
  overallRiskLevel: "critical" | "high" | "medium" | "low";
  riskSummary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    disputed: number;
  };
  riskAcceptance?: {
    accepted: boolean;
    acceptedAt?: string;
    acceptedBy?: string;
    documentName?: string;
    expiresAt?: string;
  };
  events: WorkflowEvent[];
}

const _owner: WorkflowActor = { id: "u1", name: "Майерз Михаил Николаевич", role: "Владелец агента" };
const _rm: WorkflowActor = { id: "u2", name: "Михайлова Екатерина", role: "Риск-менеджер" };
const _resp: WorkflowActor = { id: "u3", name: "Вурхиз Николай Николаевич", role: "Ответственный" };
const _ai: WorkflowActor = { id: "ai", name: "AI-оценка", role: "Система" };
const _riskRef = { id: "r1", code: "CRA-12323", title: "Отказ инфраструктуры ИИ - платформ и сервисов" };

export const agentVersions: Record<string, AgentVersionHistory[]> = {
  "1": [
    {
      id: "v1.2", agentId: "1", version: "1.2", versionStatus: "Разработка", isCurrent: true,
      createdAt: "2026-06-15T09:00:00", evaluatedAt: "2026-06-17T12:10:00",
      cardStatus: "approval", overallRiskLevel: "high",
      riskSummary: { total: 18, critical: 0, high: 2, medium: 6, low: 10, disputed: 1 },
      events: [
        { id: "e1", agentId: "1", versionId: "v1.2", type: "version_created", title: "Версия создана", actor: _resp, createdAt: "2026-06-15T09:00:00" },
        { id: "e2", agentId: "1", versionId: "v1.2", type: "evaluation_started", title: "Оценка запущена", actor: _owner, createdAt: "2026-06-17T11:40:00", statusBefore: "Нет оценки", statusAfter: "В оценке" },
        { id: "e3", agentId: "1", versionId: "v1.2", type: "evaluation_completed", title: "Оценка завершена", actor: _ai, createdAt: "2026-06-17T12:10:00", statusBefore: "В оценке", statusAfter: "Готово" },
        { id: "e4", agentId: "1", versionId: "v1.2", type: "risk_disputed", title: "Оспорена оценка риска", actor: _owner, createdAt: "2026-06-18T13:48:00", risk: _riskRef, changes: [{ field: "level", label: "Уровень риска", before: "Высокий", after: "Средний" }], comment: "Уровень завышен, есть компенсирующая мера." },
        { id: "e5", agentId: "1", versionId: "v1.2", type: "sent_to_arbitration", title: "Отправлено на арбитраж", actor: _owner, createdAt: "2026-06-18T14:05:00", statusBefore: "Есть спор", statusAfter: "Арбитраж", metadata: { disputedRisksCount: 1 } },
        { id: "e6", agentId: "1", versionId: "v1.2", type: "proposal_rejected", title: "Предложение отклонено", actor: _rm, createdAt: "2026-06-18T15:10:00", risk: _riskRef, comment: "Компенсирующая мера не покрывает риск полностью." },
        { id: "e7", agentId: "1", versionId: "v1.2", type: "corrected", title: "Оценка скорректирована", actor: _rm, createdAt: "2026-06-18T15:20:00", statusBefore: "Арбитраж", statusAfter: "Скорректировано" },
        { id: "e8", agentId: "1", versionId: "v1.2", type: "sent_for_approval", title: "Отправлено на согласование", actor: _owner, createdAt: "2026-06-18T14:32:00", statusBefore: "Готово", statusAfter: "Согласование", comment: "Оценка направлена в УОР и Кибербезопасность." },
      ],
    },
    {
      id: "v1.1", agentId: "1", version: "1.1", versionStatus: "Пром", isCurrent: false,
      createdAt: "2026-03-01T10:00:00", evaluatedAt: "2026-03-05T11:00:00",
      cardStatus: "approved", overallRiskLevel: "medium",
      riskSummary: { total: 18, critical: 0, high: 0, medium: 5, low: 13, disputed: 0 },
      events: [
        { id: "v11-1", agentId: "1", versionId: "v1.1", type: "version_created", title: "Версия создана", actor: _resp, createdAt: "2026-03-01T10:00:00" },
        { id: "v11-2", agentId: "1", versionId: "v1.1", type: "evaluation_completed", title: "Оценка завершена", actor: _ai, createdAt: "2026-03-05T11:00:00", statusBefore: "В оценке", statusAfter: "Готово" },
        { id: "v11-3", agentId: "1", versionId: "v1.1", type: "sent_for_approval", title: "Отправлено на согласование", actor: _owner, createdAt: "2026-03-10T09:20:00", statusBefore: "Готово", statusAfter: "Согласование" },
        { id: "v11-4", agentId: "1", versionId: "v1.1", type: "approved", title: "Карточка согласована", actor: _rm, createdAt: "2026-03-12T16:00:00", statusBefore: "Согласование", statusAfter: "Согласовано" },
      ],
    },
    {
      id: "v1.0", agentId: "1", version: "1.0", versionStatus: "Архив", isCurrent: false,
      createdAt: "2025-09-24T10:00:00", evaluatedAt: "2025-10-01T12:00:00",
      cardStatus: "approved", overallRiskLevel: "high",
      riskSummary: { total: 18, critical: 0, high: 3, medium: 7, low: 8, disputed: 1 },
      riskAcceptance: { accepted: true, acceptedAt: "2025-10-15T15:26:00", acceptedBy: "Майерз М. Н.", documentName: "Решение_КРГ_15-10-2025.pdf", expiresAt: "2026-04-15" },
      events: [
        { id: "v10-1", agentId: "1", versionId: "v1.0", type: "version_created", title: "Версия создана", actor: _resp, createdAt: "2025-09-24T10:00:00" },
        { id: "v10-2", agentId: "1", versionId: "v1.0", type: "evaluation_completed", title: "Оценка завершена", actor: _ai, createdAt: "2025-10-01T12:00:00", statusBefore: "В оценке", statusAfter: "Готово" },
        { id: "v10-3", agentId: "1", versionId: "v1.0", type: "risk_disputed", title: "Оспорена оценка риска", actor: _owner, createdAt: "2025-10-05T11:00:00", risk: _riskRef, comment: "Завышен уровень." },
        { id: "v10-4", agentId: "1", versionId: "v1.0", type: "sent_to_arbitration", title: "Отправлено на арбитраж", actor: _owner, createdAt: "2025-10-05T11:30:00", statusBefore: "Есть спор", statusAfter: "Арбитраж", metadata: { disputedRisksCount: 1 } },
        { id: "v10-5", agentId: "1", versionId: "v1.0", type: "risk_accepted", title: "Риск принят", actor: _owner, createdAt: "2025-10-15T15:26:00", attachments: [{ id: "a1", name: "Решение_КРГ_15-10-2025.pdf", size: "1.2 Мб" }], metadata: { expiresAt: "до 15 апреля 2026", approver: "КРГ", basis: "Продолжить эксплуатацию агента при текущем уровне риска." } },
        { id: "v10-6", agentId: "1", versionId: "v1.0", type: "approved", title: "Карточка согласована", actor: _rm, createdAt: "2025-10-16T10:00:00", statusBefore: "Согласование", statusAfter: "Согласовано" },
      ],
    },
  ],
};

