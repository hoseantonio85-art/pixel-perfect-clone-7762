import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Sparkles,
  X,
  ChevronRight,
  Edit,
  QrCode,
  RotateCcw,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  ChevronDown,
  Check,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import RiskBadge from "@/components/RiskBadge";
import StatusBadge from "@/components/StatusBadge";
import {
  agents,
  versionHistory,
  type Risk,
  type RiskFactor,
  type RiskMeasure,
  type RiskOwnerAction,
  type AgentCardStatus,
} from "@/data/mockData";

// --- Локальные конфиги статусов и действий ---

const ownerActionLabels: Record<Exclude<RiskOwnerAction, null | undefined>, string> = {
  dispute: "Спор",
  edit: "Правка",
  accept: "Принят",
  measure: "Меры",
  returned: "Возврат",
};

const ownerActionStyles: Record<Exclude<RiskOwnerAction, null | undefined>, string> = {
  dispute: "bg-destructive/10 text-destructive border-destructive/20",
  edit: "bg-accent text-accent-foreground border-accent",
  accept: "bg-muted text-foreground border-border",
  measure: "bg-primary/10 text-primary border-primary/20",
  returned: "bg-destructive/10 text-destructive border-destructive/20",
};

const cardStatusShort: Record<AgentCardStatus, string> = {
  no_eval: "Нет оценки",
  in_eval: "В оценке",
  ready: "Готово",
  review: "На разборе",
  approval: "Согласование",
  rework: "Доработка",
  approved: "Согласовано",
  with_risks: "С рисками",
  reeval: "Переоценка",
};

const cardStatusHint: Record<AgentCardStatus, string> = {
  no_eval: "Оценка ещё не запускалась",
  in_eval: "AI оценивает риски",
  ready: "Оценка завершена, можно отправить на согласование",
  review: "Есть отмеченные риски — проверьте перед отправкой",
  approval: "Ожидается проверка УОР и Кибербезопасности",
  rework: "Согласующие вернули риски на доработку",
  approved: "Карточка согласована",
  with_risks: "Согласовано с принятыми рисками",
  reeval: "Требуется переоценка",
};

// Соответствие статуса карточки и активного шага в stepper
const cardStatusToStep: Record<AgentCardStatus, number> = {
  no_eval: 0,
  in_eval: 0,
  ready: 0,
  review: 1,
  approval: 2,
  rework: 1,
  approved: 3,
  with_risks: 3,
  reeval: 0,
};

const STEPS = ["Готово", "Разбор", "Согласование", "Фиксация"];

// --- Компонент ---

const AgentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const baseAgent = agents.find((a) => a.id === id);

  // Локальное состояние для прототипа: статус карточки и действия по рискам
  const [cardStatus, setCardStatus] = useState<AgentCardStatus>(
    baseAgent?.cardStatus ?? "no_eval"
  );
  const [risks, setRisks] = useState<Risk[]>(baseAgent?.risks ?? []);

  const [showBanner, setShowBanner] = useState(true);
  const [selectedRiskId, setSelectedRiskId] = useState<string | null>(null);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showVersionDetail, setShowVersionDetail] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);

  // Активная форма действия по риску
  const [activeAction, setActiveAction] = useState<null | "dispute" | "edit" | "accept" | "measure">(null);

  if (!baseAgent) return null;
  const agent = baseAgent;

  const selectedRisk = risks.find((r) => r.id === selectedRiskId) ?? null;

  // Подсчёт отмеченных владельцем рисков
  const markedRisks = useMemo(
    () => risks.filter((r) => r.ownerAction && r.ownerAction !== "returned"),
    [risks]
  );
  const disputeCount = markedRisks.filter((r) => r.ownerAction === "dispute").length;
  const editCount = markedRisks.filter((r) => r.ownerAction === "edit").length;
  const acceptCount = markedRisks.filter((r) => r.ownerAction === "accept").length;
  const measureCount = markedRisks.filter((r) => r.ownerAction === "measure").length;

  const returnedCount = risks.filter((r) => r.ownerAction === "returned").length;

  // Главная кнопка зависит от состояния
  const mainAction = useMemo(() => {
    switch (cardStatus) {
      case "no_eval":
      case "in_eval":
      case "reeval":
        return { label: "Оценить", tooltip: "Запустить AI-оценку 18 рисков", primary: true };
      case "ready":
      case "review":
        return { label: "Отправить", tooltip: "Отправить карточку и 18 рисков на согласование", primary: true };
      case "rework":
        return { label: "Повторно", tooltip: "Отправить карточку повторно после доработки", primary: true };
      case "approved":
      case "with_risks":
        return { label: "Архив", tooltip: "Карточка согласована, перенести в архив", primary: false };
      case "approval":
        return { label: "Разобрать", tooltip: "Открыть карточку для разбора", primary: true };
      default:
        return { label: "Отправить", tooltip: "", primary: true };
    }
  }, [cardStatus]);

  const handleMainAction = () => {
    if (mainAction.label === "Отправить" || mainAction.label === "Повторно") {
      setShowSendModal(true);
    } else if (mainAction.label === "Оценить") {
      setCardStatus("ready");
    }
  };

  const confirmSend = () => {
    setCardStatus("approval");
    setShowSendModal(false);
  };

  const setRiskAction = (
    riskId: string,
    action: Exclude<RiskOwnerAction, null | undefined>,
    comment?: string
  ) => {
    setRisks((prev) =>
      prev.map((r) =>
        r.id === riskId ? { ...r, ownerAction: action, ownerActionComment: comment ?? r.ownerActionComment } : r
      )
    );
    if (cardStatus === "ready") setCardStatus("review");
  };

  // Динамический helper-текст под stepper
  const helperText = (() => {
    if (cardStatus === "approval") {
      return "Оценка отправлена. УОР и Кибербезопасность проверяют результаты.";
    }
    if (cardStatus === "rework") {
      return `Кибербезопасность вернула ${returnedCount || 2} риска. Исправьте замечания и отправьте карточку повторно.`;
    }
    if (markedRisks.length > 0) {
      const parts: string[] = [];
      if (disputeCount) parts.push(`${disputeCount} спор`);
      if (editCount) parts.push(`${editCount} правка`);
      if (acceptCount) parts.push(`${acceptCount} принятие риска`);
      if (measureCount) parts.push(`${measureCount} мера`);
      return `Перед отправкой проверьте ${markedRisks.length} отмеченных риска: ${parts.join(", ")}.`;
    }
    if (cardStatus === "ready" || cardStatus === "review") {
      return "Можно отправить карточку на согласование. Если не согласны с отдельными рисками — отметьте их перед отправкой.";
    }
    return cardStatusHint[cardStatus];
  })();

  const activeStep = cardStatusToStep[cardStatus];

  const riskCategories = ["УМР", "УОР", "ДТН", "ДКБ"];

  return (
    <AppLayout>
      <div className="max-w-full">
        {/* Back button + title */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-foreground">{agent.name}</h1>
        </div>

        <div className="flex gap-6">
          {/* Left content */}
          <div className="flex-1 min-w-0">
            {/* AI Banner */}
            {showBanner && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6 relative">
                <button onClick={() => setShowBanner(false)} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <div className="text-sm font-semibold text-foreground mb-1">Мы выявили и оценили для тебя риски</div>
                    <div className="text-xs text-muted-foreground">
                      Проверь и скорректируй их при необходимости. Некоторые риски нужно оценить у ответственных подразделений, мы подскажем как это сделать.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* QGM Error Banner */}
            {agent.info.qgm?.syncStatus === "Ошибка" && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                    <span className="text-sm font-medium text-destructive">Ошибка синхронизации QGM</span>
                  </div>
                  <button onClick={() => setShowVersionDetail(true)} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Подробнее →
                  </button>
                </div>
              </div>
            )}

            {/* Doработка alert */}
            {cardStatus === "rework" && (
              <div className="bg-card border border-border rounded-xl p-4 mb-6">
                <div className="text-sm font-semibold text-foreground mb-1">Есть замечания</div>
                <div className="text-sm text-muted-foreground mb-3">
                  Кибербезопасность вернула 2 риска. УОР подтвердило оценку без замечаний.
                </div>
                <ul className="text-sm text-foreground space-y-1 mb-3 list-disc pl-5">
                  <li>CRA-12323: уточнить применимость риска</li>
                  <li>CRA-12324: приложить документ</li>
                </ul>
              </div>
            )}

            {/* Risk levels card */}
            <div className="bg-card rounded-xl border border-border p-5 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-foreground">Уровень риска</span>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {cardStatusShort[cardStatus]}
                  </span>
                </div>
                <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                  Редактировать <Edit className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {riskCategories.map((cat) => (
                  <div key={cat} className="border border-border rounded-lg p-3">
                    <div className="text-sm font-bold text-foreground mb-1">{cat}</div>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {cardStatusShort[cardStatus]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Workflow stepper */}
            <div className="bg-card rounded-xl border border-border p-4 mb-6">
              <div className="flex items-center gap-2">
                {STEPS.map((s, i) => {
                  const isActive = i === activeStep;
                  const isDone = i < activeStep;
                  return (
                    <div key={s} className="flex items-center gap-2 flex-1 min-w-0">
                      <div
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : isDone
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <span className="w-4 h-4 rounded-full bg-background/30 flex items-center justify-center text-[10px] font-semibold">
                          {isDone ? <Check className="w-3 h-3" /> : i + 1}
                        </span>
                        {s}
                      </div>
                      {i < STEPS.length - 1 && (
                        <div className="flex-1 h-px bg-border" />
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="text-xs text-muted-foreground mt-3">{helperText}</div>
            </div>

            {/* Risk list */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold text-foreground">Список рисков</span>
                <span className="text-sm text-muted-foreground">{risks.length}</span>
              </div>
              <button className="text-xs text-muted-foreground flex items-center gap-1">
                ↓ По умолчанию
              </button>
            </div>

            <div className="space-y-2">
              {risks.map((risk) => (
                <div
                  key={risk.id}
                  onClick={() => setSelectedRiskId(risk.id)}
                  className="bg-card rounded-xl border border-border p-4 cursor-pointer hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground mb-1">{risk.title}</div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span>▸ Обоснование</span>
                        <span className="truncate">{risk.description.substring(0, 80)}...</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4 shrink-0">
                      {risk.ownerAction && (
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${ownerActionStyles[risk.ownerAction]}`}
                        >
                          {ownerActionLabels[risk.ownerAction]}
                        </span>
                      )}
                      <Sparkles className="w-4 h-4 text-primary" />
                      <RiskBadge level={risk.level} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right sidebar info */}
          <div className="w-[300px] shrink-0">
            <div className="space-y-4 sticky top-20">
              {/* Блок Информация */}
              <div className="bg-card rounded-xl border border-border p-5">
                <h3 className="text-base font-semibold text-foreground mb-4">Информация</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Статус:</span>
                      <span className="text-sm font-medium text-foreground">{cardStatusShort[cardStatus]}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground leading-snug">
                      {cardStatusHint[cardStatus]}
                    </div>
                  </div>
                  <InfoRow label="КЭ:" value={agent.info.ke} />
                  <InfoRow label="ID:" value={agent.info.cra} />
                  <InfoRow label="Статус ЖЦ:" value={agent.info.lifecycle} />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Создано:</span>
                    <div className="text-right">
                      <div className="font-medium text-foreground">{agent.info.created}</div>
                      <div className="text-xs text-primary">{agent.info.daysInWork} день в работе</div>
                    </div>
                  </div>
                  <InfoRow label="Ответственный:" value={agent.info.responsible} />
                  <InfoRow label="Владелец:" value={agent.info.owner} />
                </div>
              </div>

              {/* Блок Текущая версия */}
              <div className="bg-card rounded-xl border border-border p-5">
                <h3 className="text-base font-semibold text-foreground mb-3">Текущая версия</h3>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-semibold text-foreground">Версия {agent.info.version}</span>
                  <StatusBadge status={agent.info.versionStatus} />
                </div>
                <div className="text-sm text-muted-foreground mb-4">
                  <span className="font-medium text-foreground">Оценено:</span>{" "}
                  {agent.info.evaluatedAt ?? "—"}
                </div>
                <button
                  onClick={() => setShowVersionDetail(true)}
                  className="w-full flex items-center justify-between text-sm text-foreground hover:text-primary transition-colors border-t border-border pt-3"
                >
                  <span>Подробнее о версии</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Actions */}
              <div className="bg-card rounded-xl border border-border p-5 space-y-2">
                <div className="flex gap-2">
                  <button
                    onClick={handleMainAction}
                    title={mainAction.tooltip}
                    className={`flex-1 h-10 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-opacity hover:opacity-90 ${
                      mainAction.primary
                        ? "bg-primary text-primary-foreground"
                        : "border border-border text-foreground bg-card"
                    }`}
                  >
                    {mainAction.label === "Оценить" && <Sparkles className="w-4 h-4" />}
                    {mainAction.label}
                  </button>
                  <button className="w-10 h-10 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground">
                    <QrCode className="w-4 h-4" />
                  </button>
                </div>
                <button className="w-full h-10 rounded-lg border border-border text-sm text-foreground flex items-center justify-center gap-2 hover:bg-muted transition-colors">
                  <Edit className="w-4 h-4" /> Редактировать
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Detail Slide Panel */}
      {selectedRisk && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-foreground/20" onClick={() => { setSelectedRiskId(null); setActiveAction(null); }} />
          <div className="w-[760px] bg-card shadow-2xl animate-slide-in-right overflow-y-auto">
            <div className="p-6">
              <button onClick={() => { setSelectedRiskId(null); setActiveAction(null); }} className="mb-4 text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-muted-foreground">{selectedRisk.code}</span>
                {selectedRisk.ownerAction && (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${ownerActionStyles[selectedRisk.ownerAction]}`}
                  >
                    {ownerActionLabels[selectedRisk.ownerAction]}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-foreground mb-4">{selectedRisk.title}</h2>

              <div className="mb-4">
                <div className="text-xs text-muted-foreground mb-1">Уровень риска</div>
                <div className="flex items-center gap-2">
                  <RiskBadge level={selectedRisk.level} size="md" />
                  {selectedRisk.status && (
                    <span className="text-sm text-muted-foreground">{selectedRisk.status}</span>
                  )}
                </div>
              </div>

              {/* Действия владельца */}
              <div className="mb-6 bg-muted/40 rounded-lg p-4">
                <div className="text-xs font-medium text-muted-foreground mb-2">Действия владельца</div>
                <div className="flex flex-wrap gap-2">
                  <ActionButton label="Спор" onClick={() => setActiveAction("dispute")} />
                  <ActionButton label="Правка" onClick={() => setActiveAction("edit")} />
                  <ActionButton label="Принять" onClick={() => setActiveAction("accept")} />
                  <ActionButton label="Мера" onClick={() => setActiveAction("measure")} />
                </div>
                {selectedRisk.ownerActionComment && (
                  <div className="mt-3 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Комментарий: </span>
                    {selectedRisk.ownerActionComment}
                  </div>
                )}
              </div>

              {/* AI Reasoning */}
              {selectedRisk.reasoning && (
                <div className="mb-6">
                  <h3 className="text-base font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    AI-обоснование
                  </h3>
                  <div className="bg-muted rounded-lg p-4">
                    <p className="text-sm text-foreground mb-2">{selectedRisk.reasoning}</p>
                    {selectedRisk.finalRiskScore !== undefined && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Балл: </span>
                        <span className="font-semibold text-foreground">{selectedRisk.finalRiskScore}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Risk Factors with nested Measures */}
              {selectedRisk.reasoningRaw && selectedRisk.reasoningRaw.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-base font-semibold text-foreground mb-3">Что повлияло на оценку</h3>
                  <FactorsList
                    factors={selectedRisk.reasoningRaw}
                    measures={selectedRisk.measures ?? []}
                  />
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-base font-semibold text-foreground mb-2">Данные риска</h3>
                <div className="text-xs text-muted-foreground mb-1">Обоснование уровня риска</div>
                <p className="text-sm text-foreground whitespace-pre-line">{selectedRisk.description}</p>
              </div>

              {selectedRisk.comment && (
                <div className="mb-6">
                  <h3 className="text-base font-semibold text-foreground mb-2">Комментарий</h3>
                  <div className="bg-muted rounded-lg p-4 text-sm text-foreground">
                    {selectedRisk.comment}
                  </div>
                </div>
              )}

              <button className="w-full h-10 rounded-lg border border-border text-sm text-muted-foreground flex items-center justify-center gap-2 hover:text-foreground transition-colors">
                <RotateCcw className="w-4 h-4" /> Восстановить
              </button>
            </div>
          </div>

          {/* Inline action form modal (внутри дровера) */}
          {activeAction && (
            <ActionFormModal
              action={activeAction}
              riskLevel={selectedRisk.level}
              onCancel={() => setActiveAction(null)}
              onSave={(comment) => {
                setRiskAction(selectedRisk.id, activeAction, comment);
                setActiveAction(null);
              }}
            />
          )}
        </div>
      )}

      {/* Send confirmation modal */}
      {showSendModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/40 p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-foreground mb-3">Отправить оценку?</h3>
            {markedRisks.length === 0 ? (
              <p className="text-sm text-muted-foreground mb-4">
                Будет отправлена карточка агента и {risks.length} рисков. Спорных рисков нет.
              </p>
            ) : (
              <div className="text-sm text-muted-foreground mb-4">
                <div>Будет отправлена карточка агента и {risks.length} рисков.</div>
                <div className="mt-2 text-foreground font-medium">Отмечено владельцем:</div>
                <ul className="mt-1 space-y-0.5">
                  {disputeCount > 0 && <li>— {disputeCount} спор</li>}
                  {editCount > 0 && <li>— {editCount} правка</li>}
                  {acceptCount > 0 && <li>— {acceptCount} принятие риска</li>}
                  {measureCount > 0 && <li>— {measureCount} мера</li>}
                </ul>
              </div>
            )}
            <div className="text-sm text-foreground mb-5">
              <div className="font-medium mb-1">Согласующие:</div>
              <div className="text-muted-foreground">— УОР</div>
              <div className="text-muted-foreground">— Кибербезопасность</div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowSendModal(false)}
                className="h-10 px-4 rounded-lg border border-border text-sm text-foreground hover:bg-muted transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={confirmSend}
                className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Отправить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Version Detail Panel */}
      {showVersionDetail && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-foreground/20" onClick={() => setShowVersionDetail(false)} />
          <div className="w-[560px] bg-card shadow-2xl animate-slide-in-right overflow-y-auto">
            <div className="p-6">
              <button onClick={() => setShowVersionDetail(false)} className="mb-4 text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>

              {!showVersionHistory ? (
                <>
                  <h2 className="text-xl font-bold text-foreground mb-6">Подробнее о версии</h2>
                  <h3 className="text-base font-semibold text-foreground mb-3">Информация</h3>
                  <div className="space-y-3 text-sm mb-6">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">Версия {agent.info.version}</span>
                        <StatusBadge status={agent.info.versionStatus} />
                      </div>
                      <div className="text-muted-foreground mt-1">
                        <span className="font-medium text-foreground">Оценено:</span>{" "}
                        {agent.info.evaluatedAt ?? "—"}
                      </div>
                    </div>
                    <InfoRow label="КЭ" value={agent.info.ke} />
                    <InfoRow label="ID" value={agent.info.cra} />
                    <InfoRow label="Статус жизненного цикла" value={agent.info.lifecycle} />
                    <InfoRow label="Ответственный" value={agent.info.responsible} />
                    <InfoRow label="Владелец" value={agent.info.owner} />
                  </div>

                  <h3 className="text-base font-semibold text-foreground mb-2">Описание</h3>
                  <p className="text-sm text-foreground mb-6">{agent.info.description}</p>

                  <h3 className="text-base font-semibold text-foreground mb-3">Вложения</h3>
                  <div className="flex items-center justify-between bg-muted rounded-lg p-3 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-card border border-border flex items-center justify-center text-muted-foreground text-xs">📄</div>
                      <div>
                        <div className="text-sm font-medium text-foreground">Отчет.zip</div>
                        <div className="text-xs text-muted-foreground">Константинопольский Константин Константинович • 01.01.2025</div>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">25 Мб</span>
                  </div>

                  {/* QGM Integration block */}
                  {agent.info.qgm && (
                    <>
                      <h3 className="text-base font-semibold text-foreground mb-3">Интеграции</h3>
                      <div className="bg-muted rounded-lg p-4 mb-6">
                        <div className="text-sm font-semibold text-foreground mb-3">QGM</div>
                        <div className="space-y-2 text-sm">
                          <InfoRow label="Флаг" value={agent.info.qgm.flag} />
                          <InfoRow label="Последняя успешная синхронизация" value={agent.info.qgm.lastSuccessSync ?? "—"} />
                          <InfoRow label="Значение, отправленное в QGM" value={agent.info.qgm.sentValue} />
                          <InfoRow label="Статус синхронизации" value={agent.info.qgm.syncStatus} />
                        </div>
                      </div>
                    </>
                  )}

                  <button className="w-full h-10 rounded-lg border border-border text-sm text-foreground flex items-center justify-center gap-2 hover:bg-muted transition-colors">
                    <Edit className="w-4 h-4" /> Редактировать
                  </button>

                  <button
                    onClick={() => setShowVersionHistory(true)}
                    className="w-full mt-3 text-sm text-primary hover:underline"
                  >
                    История версий →
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <button onClick={() => setShowVersionHistory(false)} className="text-muted-foreground hover:text-foreground">
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h2 className="text-xl font-bold text-foreground">История версий</h2>
                  </div>

                  <div className="space-y-4">
                    {versionHistory.map((v, i) => (
                      <div key={i}>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-6 h-6 rounded bg-foreground/80 flex items-center justify-center">
                            <span className="text-card text-[10px]">▶</span>
                          </div>
                          <span className="text-sm font-semibold text-foreground">{v.version}</span>
                          {v.status === "Пром" && <StatusBadge status="Пром" />}
                          {v.status === "Архив" && <span className="text-xs text-muted-foreground">Архив</span>}
                          <span className="text-xs text-muted-foreground">{v.riskLevel}</span>
                        </div>
                        <div className="ml-9 space-y-1">
                          <div className="bg-muted rounded-lg p-3 text-sm text-foreground">
                            {v.bigRisks} рисков Больших
                          </div>
                          <div className="bg-muted rounded-lg p-3 text-sm text-foreground">
                            {v.smallRisks} риска маленьких
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium text-foreground">{value}</span>
  </div>
);

const ActionButton = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="h-9 px-3 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:bg-muted transition-colors"
  >
    {label}
  </button>
);

// --- Формы действий ---

const ActionFormModal = ({
  action,
  riskLevel,
  onCancel,
  onSave,
}: {
  action: "dispute" | "edit" | "accept" | "measure";
  riskLevel: Risk["level"];
  onCancel: () => void;
  onSave: (comment?: string) => void;
}) => {
  const [comment, setComment] = useState("");
  const [reason, setReason] = useState("");
  const [editField, setEditField] = useState("уровень");
  const [acceptDeadline, setAcceptDeadline] = useState("");
  const [acceptApprover, setAcceptApprover] = useState("КРГ");
  const [measureMode, setMeasureMode] = useState<"existing" | "new">("existing");
  const [measureValue, setMeasureValue] = useState("");

  const titles: Record<typeof action, string> = {
    dispute: "Спор по риску",
    edit: "Правка риска",
    accept: "Принять риск",
    measure: "Мера",
  } as const;

  const docRequired = action === "accept" && (riskLevel === "medium" || riskLevel === "high" || riskLevel === "critical");

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-foreground/40 p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
        <h3 className="text-lg font-bold text-foreground mb-4">{titles[action]}</h3>

        {action === "dispute" && (
          <div className="space-y-3 mb-5">
            <Field label="Причина спора">
              <input value={reason} onChange={(e) => setReason(e.target.value)} className="form-input" placeholder="Например: уровень завышен" />
            </Field>
            <Field label="Комментарий">
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} className="form-input min-h-[80px]" />
            </Field>
            <FileField />
          </div>
        )}

        {action === "edit" && (
          <div className="space-y-3 mb-5">
            <Field label="Что изменить">
              <select value={editField} onChange={(e) => setEditField(e.target.value)} className="form-input">
                <option value="уровень">Уровень</option>
                <option value="вероятность">Вероятность</option>
                <option value="влияние">Влияние</option>
                <option value="формулировку">Формулировку</option>
                <option value="применимость">Применимость</option>
              </select>
            </Field>
            <Field label="Комментарий">
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} className="form-input min-h-[80px]" />
            </Field>
            <FileField />
          </div>
        )}

        {action === "accept" && (
          <div className="space-y-3 mb-5">
            <p className="text-sm text-muted-foreground">
              Вы фиксируете решение продолжить использование агента с этим риском без дополнительных мер снижения.
            </p>
            <Field label="Причина">
              <input value={reason} onChange={(e) => setReason(e.target.value)} className="form-input" />
            </Field>
            <Field label="Срок действия">
              <input type="date" value={acceptDeadline} onChange={(e) => setAcceptDeadline(e.target.value)} className="form-input" />
            </Field>
            <Field label="Согласующий">
              <select value={acceptApprover} onChange={(e) => setAcceptApprover(e.target.value)} className="form-input">
                <option value="КРГ">КРГ</option>
                <option value="Руководитель блока">Руководитель блока</option>
              </select>
            </Field>
            <FileField required={docRequired} />
            {docRequired && (
              <div className="text-xs text-muted-foreground">Документ обязателен для среднего и высокого риска.</div>
            )}
          </div>
        )}

        {action === "measure" && (
          <div className="space-y-3 mb-5">
            <div className="flex gap-2">
              <button
                onClick={() => setMeasureMode("existing")}
                className={`flex-1 h-9 rounded-lg text-sm border transition-colors ${
                  measureMode === "existing" ? "bg-primary text-primary-foreground border-primary" : "border-border text-foreground"
                }`}
              >
                Выбрать существующую
              </button>
              <button
                onClick={() => setMeasureMode("new")}
                className={`flex-1 h-9 rounded-lg text-sm border transition-colors ${
                  measureMode === "new" ? "bg-primary text-primary-foreground border-primary" : "border-border text-foreground"
                }`}
              >
                Создать новую
              </button>
            </div>
            <Field label={measureMode === "existing" ? "Существующая мера" : "Название новой меры"}>
              <input value={measureValue} onChange={(e) => setMeasureValue(e.target.value)} className="form-input" />
            </Field>
            <Field label="Комментарий">
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} className="form-input min-h-[80px]" />
            </Field>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="h-10 px-4 rounded-lg border border-border text-sm text-foreground hover:bg-muted transition-colors">
            Отмена
          </button>
          <button
            onClick={() => onSave(comment || reason || measureValue)}
            className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block">
    <div className="text-xs font-medium text-muted-foreground mb-1">{label}</div>
    {children}
  </label>
);

const FileField = ({ required = false }: { required?: boolean }) => (
  <Field label={`Файл${required ? " (обязательно)" : ""}`}>
    <input type="file" className="block w-full text-xs text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-muted file:text-foreground hover:file:bg-muted/70" />
  </Field>
);

const FactorsList = ({ factors, measures }: { factors: RiskFactor[]; measures: RiskMeasure[] }) => {
  const useAccordion = factors.length > 3;
  const [openFactors, setOpenFactors] = useState<Record<string, boolean>>(
    useAccordion ? {} : Object.fromEntries(factors.map((f) => [f.code, true]))
  );

  const toggle = (code: string) => {
    setOpenFactors((prev) => ({ ...prev, [code]: !prev[code] }));
  };

  return (
    <div className="space-y-3">
      {factors.map((factor) => {
        const relatedMeasures = measures.filter((m) => m.factorCode === factor.code);
        const isOpen = !!openFactors[factor.code];

        return (
          <div key={factor.code} className="rounded-lg border border-border bg-card overflow-hidden transition-colors hover:border-muted-foreground/30">
            <button
              onClick={() => toggle(factor.code)}
              className="w-full text-left p-4 flex items-start gap-3"
            >
              <ShieldAlert className="w-4 h-4 text-muted-foreground/60 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-muted-foreground/70 mb-1">
                  {factor.code} · вес {factor.weight.toFixed(1)}
                </div>
                <div className="text-sm font-semibold text-foreground leading-snug">{factor.title}</div>
                {!isOpen && (
                  <div className="flex items-center gap-2 mt-2">
                    {factor.isDual && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent text-accent-foreground font-medium">
                        Требует контекста
                      </span>
                    )}
                    {relatedMeasures.length > 0 ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded border border-border text-muted-foreground">
                        Покрыт мерами
                      </span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive">
                        Нет мер
                      </span>
                    )}
                  </div>
                )}
              </div>
              <ChevronDown className={`w-4 h-4 text-muted-foreground/50 shrink-0 mt-0.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && (
              <div className="px-4 pb-4 space-y-4">
                <div className="flex items-center gap-2 ml-7">
                  {factor.isDual && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent text-accent-foreground font-medium">
                      Требует контекста
                    </span>
                  )}
                  {relatedMeasures.length > 0 ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded border border-border text-muted-foreground">
                      Покрыт мерами
                    </span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive">
                      Нет мер
                    </span>
                  )}
                </div>

                {factor.quotes.length > 0 && (
                  <div className="space-y-2.5 ml-7">
                    {factor.quotes.map((q, i) => (
                      <div key={i} className="border-l-2 border-primary/25 pl-3 py-0.5">
                        <div className="text-[11px] text-muted-foreground/70 mb-0.5">{q.source}</div>
                        <div className="text-xs text-foreground/80 italic leading-relaxed">«{q.text}»</div>
                      </div>
                    ))}
                  </div>
                )}

                {relatedMeasures.length > 0 && (
                  <div className="ml-7 border-l-2 border-border pl-4 py-3 space-y-4 bg-muted/25 rounded-r-lg">
                    {relatedMeasures.map((measure) => (
                      <div key={measure.code} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground/50 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] text-muted-foreground/70 mb-1">
                            {measure.code} · вес {measure.weight.toFixed(1)}
                          </div>
                          <div className="text-sm font-medium text-foreground leading-snug">{measure.title}</div>
                          {measure.isDual && (
                            <span className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-accent text-accent-foreground font-medium mt-1.5">
                              Требует контекста
                            </span>
                          )}
                          {measure.quotes.length > 0 && (
                            <div className="space-y-2 mt-2.5">
                              {measure.quotes.map((q, i) => (
                                <div key={i} className="border-l-2 border-primary/25 pl-3 py-0.5">
                                  <div className="text-[11px] text-muted-foreground/70 mb-0.5">{q.source}</div>
                                  <div className="text-xs text-foreground/80 italic leading-relaxed">«{q.text}»</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default AgentDetail;
