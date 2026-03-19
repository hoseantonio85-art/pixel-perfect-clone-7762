export interface QGMIntegration {
  flag: "PASS" | "ERR";
  lastSuccessSync: string | null;
  sentValue: "PASS" | "ERR";
  syncStatus: "Успешно" | "Ошибка";
}

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
  quotes: RiskQuote[];
}

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
    info: {
      version: "1.2",
      versionStatus: "Разработка",
      evaluatedAt: "18.02.2026 · 14:32",
      statusText: "Согласование",
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
            quotes: [
              { source: "BT.docx", text: "нет открытого ввода" },
            ],
          },
          {
            code: "UMF-096",
            title: "Резервный канал обработки запросов",
            weight: 1.5,
            isDual: true,
            quotes: [
              { source: "Arch.pdf", text: "Предусмотрен ручной режим обработки" },
              { source: "BT.docx", text: "Описан процесс эскалации" },
            ],
          },
        ],
        comment: "",
      },
      {
        id: "r3",
        code: "CRA-12325",
        title: "Уязвимости конфигурации и цепочки поставок",
        level: "low",
        status: "",
        description: "В августе 2022 в рамках сублицензионного договора осуществлена закупка лицензий ПО Kizen, но никаких файловых ...",
        comment: "",
      },
      {
        id: "r4",
        code: "CRA-12326",
        title: "Прямые промпт-инъекции и манипуляции выводом модели",
        level: "high",
        status: "",
        description: "В августе 2022 в рамках сублицензионного договора осуществлена закупка лицензий ПО Kizen, но никаких файловых ...",
        comment: "",
      },
      {
        id: "r5",
        code: "CRA-12327",
        title: "Не прямые промпт-инъекции (через данные и RAG)",
        level: "medium",
        status: "",
        description: "В августе 2022 в рамках сублицензионного договора осуществлена закупка лицензий ПО Kizen, но никаких файловых ...",
        comment: "",
      },
      {
        id: "r6",
        code: "CRA-12328",
        title: "Утечка конфиденциальных данных через модель",
        level: "critical",
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
        level: "high",
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
        level: "critical",
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
        level: "medium",
        status: "",
        description: "Риски для репутации компании при использовании ИИ.",
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
