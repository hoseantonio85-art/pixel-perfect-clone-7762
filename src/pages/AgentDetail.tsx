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
  ArrowLeftRight,
  History,
  FileText,
  ArrowRight,
} from "lucide-react";

import AppLayout from "@/components/AppLayout";
import RiskBadge from "@/components/RiskBadge";
import StatusBadge from "@/components/StatusBadge";
import {
  agents,
  versionHistory,
  agentVersions,
  type Risk,
  type RiskFactor,
  type RiskMeasure,
  type AgentCardStatus,
  type WorkflowEvent,
  type WorkflowActor,
  type AgentVersionHistory,
} from "@/data/mockData";



// --- Локальные конфиги статусов ---

const cardStatusShort: Record<AgentCardStatus, string> = {
  no_eval: "Нет оценки",
  in_eval: "В оценке",
  ready: "Готово",
  dispute: "Есть спор",
  arbitration: "Арбитраж",
  approval: "Согласование",
  approved: "Согласовано",
  corrected: "Скорректировано",
};

const cardStatusHint: Record<AgentCardStatus, string> = {
  no_eval: "Оценка ещё не запускалась",
  in_eval: "AI оценивает риски",
  ready: "Оценка завершена, можно отправить",
  dispute: "Есть оспоренные риски — будет отправлено на арбитраж",
  arbitration: "Спорные риски рассматриваются в отдельном канале",
  approval: "Карточка отправлена на согласование",
  approved: "Карточка согласована",
  corrected: "Оценка скорректирована после арбитража",
};

// --- Компонент ---

const AgentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const baseAgent = agents.find((a) => a.id === id);

  const [risks, setRisks] = useState<Risk[]>(baseAgent?.risks ?? []);

  const disputeCount = useMemo(
    () => risks.filter((r) => r.ownerAction === "dispute").length,
    [risks]
  );

  // Базовый статус (зависит от пользовательских отправок). Производный для UI учитывает споры.
  const [baseStatus, setBaseStatus] = useState<AgentCardStatus>(
    baseAgent?.cardStatus ?? "no_eval"
  );
  const cardStatus: AgentCardStatus = useMemo(() => {
    // После отправки — фиксированный статус
    if (
      baseStatus === "arbitration" ||
      baseStatus === "approval" ||
      baseStatus === "approved" ||
      baseStatus === "corrected"
    ) {
      return baseStatus;
    }
    if (baseStatus === "no_eval" || baseStatus === "in_eval") return baseStatus;
    return disputeCount > 0 ? "dispute" : "ready";
  }, [baseStatus, disputeCount]);

  const [showBanner, setShowBanner] = useState(true);
  const [selectedRiskId, setSelectedRiskId] = useState<string | null>(null);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showVersionDetail, setShowVersionDetail] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showDisputeForm, setShowDisputeForm] = useState(false);

  // --- История агента ---
  const versionsList: AgentVersionHistory[] = agentVersions[id ?? ""] ?? [];
  const currentVersion = versionsList.find((v) => v.isCurrent) ?? versionsList[0];

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyMode, setHistoryMode] = useState<"current" | "all">("current");
  const [historyVersionId, setHistoryVersionId] = useState<string | null>(
    currentVersion?.id ?? null
  );
  const [extraEvents, setExtraEvents] = useState<Record<string, WorkflowEvent[]>>({});

  const ownerActor: WorkflowActor = {
    id: "u1",
    name: "Майерз Михаил Николаевич",
    role: "Владелец агента",
  };

  const addEvent = (e: Omit<WorkflowEvent, "id" | "agentId" | "versionId" | "createdAt"> & { createdAt?: string }) => {
    if (!currentVersion) return;
    const evt: WorkflowEvent = {
      id: `e-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      agentId: id ?? "",
      versionId: currentVersion.id,
      createdAt: e.createdAt ?? new Date().toISOString(),
      ...e,
    };
    setExtraEvents((prev) => ({
      ...prev,
      [currentVersion.id]: [...(prev[currentVersion.id] ?? []), evt],
    }));
  };

  const eventsForVersion = (v: AgentVersionHistory): WorkflowEvent[] => {
    const extra = extraEvents[v.id] ?? [];
    return [...v.events, ...extra].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  };

  const lastEvent: WorkflowEvent | undefined = currentVersion
    ? eventsForVersion(currentVersion)[0]
    : undefined;

  if (!baseAgent) return null;
  const agent = baseAgent;

  const selectedRisk = risks.find((r) => r.id === selectedRiskId) ?? null;

  const isSent =
    cardStatus === "arbitration" ||
    cardStatus === "approval" ||
    cardStatus === "approved" ||
    cardStatus === "corrected";

  // Главная кнопка
  const mainAction = useMemo(() => {
    if (cardStatus === "no_eval" || cardStatus === "in_eval") {
      return { label: "Оценить", disabled: false };
    }
    if (isSent) {
      return { label: "Отправлено", disabled: true };
    }
    return {
      label: disputeCount > 0 ? "Арбитраж" : "Отправить",
      disabled: false,
    };
  }, [cardStatus, disputeCount, isSent]);

  const handleMainAction = () => {
    if (mainAction.disabled) return;
    if (mainAction.label === "Оценить") {
      addEvent({ type: "evaluation_started", title: "Оценка запущена", actor: ownerActor, statusBefore: "Нет оценки", statusAfter: "В оценке" });
      addEvent({ type: "evaluation_completed", title: "Оценка завершена", actor: { id: "ai", name: "AI-оценка", role: "Система" }, statusBefore: "В оценке", statusAfter: "Готово" });
      setBaseStatus("ready");
      return;
    }
    setShowSendModal(true);
  };

  const confirmSend = () => {
    const disputed = disputeCount > 0;
    setBaseStatus(disputed ? "arbitration" : "approval");
    if (disputed) {
      addEvent({ type: "sent_to_arbitration", title: "Отправлено на арбитраж", actor: ownerActor, statusBefore: "Есть спор", statusAfter: "Арбитраж", metadata: { disputedRisksCount: disputeCount } });
    } else {
      addEvent({ type: "sent_for_approval", title: "Отправлено на согласование", actor: ownerActor, statusBefore: "Готово", statusAfter: "Согласование" });
    }
    setShowSendModal(false);
  };

  const saveDispute = (comment: string) => {
    if (!selectedRisk) return;
    const wasDispute = selectedRisk.ownerAction === "dispute";
    setRisks((prev) =>
      prev.map((r) =>
        r.id === selectedRisk.id
          ? { ...r, ownerAction: "dispute", ownerActionComment: comment }
          : r
      )
    );
    addEvent({
      type: wasDispute ? "dispute_updated" : "risk_disputed",
      title: wasDispute ? "Спор изменён" : "Оспорена оценка риска",
      actor: ownerActor,
      risk: { id: selectedRisk.id, code: selectedRisk.code, title: selectedRisk.title },
      comment,
    });
    setShowDisputeForm(false);
  };


  // Информационный блок над списком рисков
  const infoBlock = (() => {
    if (cardStatus === "arbitration") {
      return {
        title: "На арбитраже",
        text:
          "Спорные риски будут рассмотрены в отдельном канале. После решения оценка будет согласована или скорректирована.",
      };
    }
    if (cardStatus === "approval") {
      return {
        title: "Отправлено на согласование",
        text: "Карточка передана согласующим. Спорных рисков нет.",
      };
    }
    if (cardStatus === "approved") {
      return { title: "Согласовано", text: "Карточка согласована." };
    }
    if (cardStatus === "corrected") {
      return {
        title: "Скорректировано",
        text: "Оценка обновлена по результатам арбитража.",
      };
    }
    if (disputeCount > 0) {
      return {
        title: "Есть спор",
        text: `Вы оспорили ${disputeCount} ${disputeCount === 1 ? "риск" : "рисков"}. Карточка будет отправлена на арбитраж.`,
      };
    }
    return {
      title: "Оценка готова",
      text: "AI оценил 18 рисков версии. Если результат вас устраивает, отправьте карточку дальше.",
    };
  })();

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

            {/* Информационный блок */}
            <div className="bg-card rounded-xl border border-border p-4 mb-6">
              <div className="text-sm font-semibold text-foreground mb-1">{infoBlock.title}</div>
              <div className="text-xs text-muted-foreground leading-relaxed">{infoBlock.text}</div>
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
                      <RiskBadge level={risk.level} />
                      {risk.ownerAction === "dispute" && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full border font-medium bg-destructive/10 text-destructive border-destructive/20 inline-flex items-center gap-1">
                          <ArrowLeftRight className="w-3 h-3" /> Спор
                        </span>
                      )}
                      <Sparkles className="w-4 h-4 text-primary" />
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

              {/* Последнее действие */}
              {lastEvent && (
                <div className="bg-card rounded-xl border border-border p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <History className="w-4 h-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold text-foreground">Последнее действие</h3>
                  </div>
                  <div className="text-sm font-medium text-foreground mb-1 leading-snug">
                    {lastEvent.title}
                  </div>
                  <div className="text-xs text-muted-foreground mb-2">
                    {shortName(lastEvent.actor.name)} · {formatDateTime(lastEvent.createdAt)}
                  </div>
                  {lastEvent.comment && (
                    <div className="text-xs text-muted-foreground line-clamp-2 mb-3 italic">
                      «{lastEvent.comment}»
                    </div>
                  )}
                  <button
                    onClick={() => { setHistoryMode("current"); setHistoryVersionId(currentVersion?.id ?? null); setHistoryOpen(true); }}
                    className="w-full flex items-center justify-between text-sm text-primary hover:underline border-t border-border pt-3"
                  >
                    <span>Посмотреть историю</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}


              {/* Actions */}
              <div className="bg-card rounded-xl border border-border p-5 space-y-2">
                <div className="flex gap-2">
                  <button
                    onClick={handleMainAction}
                    disabled={mainAction.disabled}
                    className="flex-1 h-10 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-opacity hover:opacity-90 bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div
            className="flex-1 bg-foreground/20"
            onClick={() => {
              setSelectedRiskId(null);
              setShowDisputeForm(false);
            }}
          />
          <div className="w-[760px] bg-card shadow-2xl animate-slide-in-right overflow-y-auto">
            <div className="p-6">
              <button
                onClick={() => {
                  setSelectedRiskId(null);
                  setShowDisputeForm(false);
                }}
                className="mb-4 text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-muted-foreground">{selectedRisk.code}</span>
              </div>
              <h2 className="text-xl font-bold text-foreground mb-4">{selectedRisk.title}</h2>

              {/* Виджет «Уровень риска» с действием Оспорить */}
              <div className="mb-6 border border-border rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground mb-2">Уровень риска</div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <RiskBadge level={selectedRisk.level} size="md" />
                      {selectedRisk.ownerAction === "dispute" && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full border font-medium bg-destructive/10 text-destructive border-destructive/20 inline-flex items-center gap-1">
                          <ArrowLeftRight className="w-3 h-3" /> Спор
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      AI оценил риск на основе факторов и мер.
                    </div>
                  </div>
                  {!isSent && (
                    <button
                      onClick={() => setShowDisputeForm(true)}
                      className="text-sm text-foreground hover:text-primary inline-flex items-center gap-1 shrink-0"
                    >
                      <ArrowLeftRight className="w-4 h-4" />
                      {selectedRisk.ownerAction === "dispute" ? "Изменить" : "Оспорить"}
                    </button>
                  )}
                </div>

                {selectedRisk.ownerAction === "dispute" && selectedRisk.ownerActionComment && (
                  <div className="mt-3 pt-3 border-t border-border text-xs">
                    <div className="font-medium text-foreground mb-1">Комментарий владельца</div>
                    <div className="text-muted-foreground leading-relaxed">
                      {selectedRisk.ownerActionComment}
                    </div>
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

          {showDisputeForm && (
            <DisputeFormModal
              initialComment={selectedRisk.ownerActionComment ?? ""}
              onCancel={() => setShowDisputeForm(false)}
              onSave={saveDispute}
            />
          )}
        </div>
      )}

      {/* Send confirmation modal */}
      {showSendModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/40 p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
            {disputeCount === 0 ? (
              <>
                <h3 className="text-lg font-bold text-foreground mb-3">Отправить оценку?</h3>
                <p className="text-sm text-muted-foreground mb-5">
                  Будет отправлена карточка агента и {risks.length} рисков. Спорных рисков нет.
                </p>
              </>
            ) : (
              <>
                <h3 className="text-lg font-bold text-foreground mb-3">Отправить на арбитраж?</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Будет отправлена карточка агента и {risks.length} рисков. На арбитраж уйдут спорные риски: {disputeCount}.
                </p>
                <div className="bg-muted rounded-lg p-3 mb-5 space-y-1.5">
                  {risks
                    .filter((r) => r.ownerAction === "dispute")
                    .map((r) => (
                      <div key={r.id} className="text-xs">
                        <span className="text-muted-foreground">{r.code}</span>{" "}
                        <span className="text-foreground">{r.title}</span>
                      </div>
                    ))}
                </div>
              </>
            )}
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
                    onClick={() => { setShowVersionDetail(false); setHistoryMode("all"); setHistoryOpen(true); }}
                    className="w-full mt-3 text-sm text-primary hover:underline"
                  >
                    История агента →
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

      {/* История агента */}
      {historyOpen && (
        <HistoryDrawer
          agentName={agent.name}
          versions={versionsList}
          eventsFor={eventsForVersion}
          mode={historyMode}
          setMode={setHistoryMode}
          versionId={historyVersionId}
          setVersionId={setHistoryVersionId}
          onClose={() => setHistoryOpen(false)}
          onOpenRisk={(rid) => setSelectedRiskId(rid)}
        />
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

// --- Форма «Оспорить» ---

const DisputeFormModal = ({
  initialComment,
  onCancel,
  onSave,
}: {
  initialComment: string;
  onCancel: () => void;
  onSave: (comment: string) => void;
}) => {
  const [comment, setComment] = useState(initialComment);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-foreground/40 p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
        <h3 className="text-lg font-bold text-foreground mb-2">Комментарий к риску</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Опишите, с чем не согласны. Комментарий уйдёт на арбитраж вместе с карточкой.
        </p>
        <label className="block mb-5">
          <div className="text-xs font-medium text-muted-foreground mb-1">Комментарий</div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="form-input min-h-[110px]"
            placeholder="Например: уровень завышен, есть компенсирующая мера…"
          />
        </label>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="h-10 px-4 rounded-lg border border-border text-sm text-foreground hover:bg-muted transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={() => onSave(comment.trim())}
            disabled={!comment.trim()}
            className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
};

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

// ============ История агента: хелперы и компонент ============

function shortName(full: string): string {
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const [last, ...rest] = parts;
  const initials = rest.map((p) => p[0] + ".").join(" ");
  return `${last} ${initials}`;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const months = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
  const day = d.getDate();
  const month = months[d.getMonth()];
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${day} ${month}, ${hh}:${mm}`;
}

function formatDateLong(iso: string): string {
  const d = new Date(iso);
  const months = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}, ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const riskLevelRu: Record<"critical" | "high" | "medium" | "low", string> = {
  critical: "Очень высокий",
  high: "Высокий",
  medium: "Средний",
  low: "Низкий",
};

const cardStatusRu: Record<AgentCardStatus, string> = {
  no_eval: "Нет оценки",
  in_eval: "В оценке",
  ready: "Готово",
  dispute: "Есть спор",
  arbitration: "Арбитраж",
  approval: "Согласование",
  approved: "Согласовано",
  corrected: "Скорректировано",
};

type HistoryDrawerProps = {
  agentName: string;
  versions: AgentVersionHistory[];
  eventsFor: (v: AgentVersionHistory) => WorkflowEvent[];
  mode: "current" | "all";
  setMode: (m: "current" | "all") => void;
  versionId: string | null;
  setVersionId: (id: string | null) => void;
  onClose: () => void;
  onOpenRisk: (riskId: string) => void;
};

const HistoryDrawer = ({
  agentName,
  versions,
  eventsFor,
  mode,
  setMode,
  versionId,
  setVersionId,
  onClose,
  onOpenRisk,
}: HistoryDrawerProps) => {
  const current = versions.find((v) => v.isCurrent) ?? versions[0];
  const activeVersion =
    mode === "current"
      ? current
      : versions.find((v) => v.id === versionId) ?? null;

  // В режиме "all" если выбрана конкретная версия — показываем её историю с кнопкой «Назад»
  const showVersionDetailView = mode === "all" && activeVersion !== null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-foreground/20" onClick={onClose} />
      <div className="w-[640px] bg-card shadow-2xl animate-slide-in-right overflow-y-auto">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-foreground">История агента</h2>
              <div className="text-sm text-muted-foreground mt-1">{agentName}</div>
              {current && (
                <div className="text-xs text-muted-foreground mt-1">
                  Текущая версия {current.version}
                </div>
              )}
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Toggle */}
          <div className="inline-flex rounded-lg border border-border p-1 mb-5 bg-muted/40">
            <button
              onClick={() => { setMode("current"); setVersionId(current?.id ?? null); }}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${mode === "current" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              Текущая версия
            </button>
            <button
              onClick={() => { setMode("all"); setVersionId(null); }}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${mode === "all" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              Все версии
            </button>
          </div>

          {mode === "current" && current && (
            <VersionSummary v={current} />
          )}

          {mode === "current" && current && (
            <>
              <h3 className="text-sm font-semibold text-foreground mt-6 mb-3">История изменений</h3>
              <Timeline events={eventsFor(current)} onOpenRisk={onOpenRisk} />
            </>
          )}

          {mode === "all" && !showVersionDetailView && (
            <div className="space-y-3">
              {versions.map((v) => {
                const last = eventsFor(v)[0];
                return (
                  <div key={v.id} className="rounded-xl border border-border p-4 bg-card">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">Версия {v.version}</span>
                        {v.isCurrent ? (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">Текущая</span>
                        ) : (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Архив</span>
                        )}
                        <span className="text-[11px] px-2 py-0.5 rounded-full border border-border text-muted-foreground">
                          {v.versionStatus}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">{riskLevelRu[v.overallRiskLevel]} уровень</span>
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">
                      {v.riskSummary.total} рисков · {v.riskSummary.high} высоких · {v.riskSummary.medium} средних · {v.riskSummary.low} низких
                      {v.riskSummary.disputed > 0 && <> · {v.riskSummary.disputed} спор</>}
                    </div>
                    <div className="text-xs text-muted-foreground mb-3">
                      Статус: {cardStatusRu[v.cardStatus]}
                      {v.riskAcceptance?.accepted ? " · Риск принят" : ""}
                    </div>
                    {last && (
                      <div className="text-xs text-muted-foreground mb-3 border-t border-border pt-2">
                        Последнее действие: <span className="text-foreground font-medium">{last.title}</span>
                        <div className="text-[11px] text-muted-foreground/80">{formatDateLong(last.createdAt)}</div>
                      </div>
                    )}
                    <button
                      onClick={() => setVersionId(v.id)}
                      className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                    >
                      Открыть историю <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {showVersionDetailView && activeVersion && (
            <>
              <button
                onClick={() => setVersionId(null)}
                className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-3"
              >
                <ArrowLeft className="w-4 h-4" /> Ко всем версиям
              </button>
              <VersionSummary v={activeVersion} />
              <h3 className="text-sm font-semibold text-foreground mt-6 mb-3">История изменений</h3>
              <Timeline events={eventsFor(activeVersion)} onOpenRisk={onOpenRisk} />
            </>
          )}

          {versions.length === 0 && (
            <div className="text-sm text-muted-foreground">Действий пока нет.</div>
          )}
        </div>
      </div>
    </div>
  );
};

const VersionSummary = ({ v }: { v: AgentVersionHistory }) => (
  <div className="rounded-xl border border-border p-4 bg-card">
    <div className="flex items-center gap-2 mb-3">
      <span className="text-base font-semibold text-foreground">Версия {v.version}</span>
      {v.isCurrent ? (
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">Текущая</span>
      ) : (
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Архив</span>
      )}
      <span className="text-[11px] px-2 py-0.5 rounded-full border border-border text-muted-foreground">
        {v.versionStatus}
      </span>
    </div>
    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
      <div className="text-muted-foreground">Общий уровень</div>
      <div className="text-foreground font-medium text-right">{riskLevelRu[v.overallRiskLevel]}</div>

      <div className="text-muted-foreground">Всего рисков</div>
      <div className="text-foreground font-medium text-right">{v.riskSummary.total}</div>

      <div className="text-muted-foreground">Очень высоких</div>
      <div className="text-foreground text-right">{v.riskSummary.critical}</div>

      <div className="text-muted-foreground">Высоких</div>
      <div className="text-foreground text-right">{v.riskSummary.high}</div>

      <div className="text-muted-foreground">Средних</div>
      <div className="text-foreground text-right">{v.riskSummary.medium}</div>

      <div className="text-muted-foreground">Низких</div>
      <div className="text-foreground text-right">{v.riskSummary.low}</div>

      <div className="text-muted-foreground">Спорных</div>
      <div className="text-foreground text-right">{v.riskSummary.disputed}</div>

      <div className="text-muted-foreground">Статус</div>
      <div className="text-foreground font-medium text-right">{cardStatusRu[v.cardStatus]}</div>

      <div className="text-muted-foreground">Принятие риска</div>
      <div className="text-foreground text-right">
        {v.riskAcceptance?.accepted ? "Зафиксировано" : "Не зафиксировано"}
      </div>
    </div>
  </div>
);

const Timeline = ({
  events,
  onOpenRisk,
}: {
  events: WorkflowEvent[];
  onOpenRisk: (riskId: string) => void;
}) => {
  if (events.length === 0) {
    return <div className="text-sm text-muted-foreground">Действий пока нет.</div>;
  }
  return (
    <div className="relative pl-5 border-l border-border space-y-5">
      {events.map((e) => (
        <div key={e.id} className="relative">
          <span className="absolute -left-[23px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary/70 border-2 border-card" />
          <div className="text-sm font-medium text-foreground leading-snug">{e.title}</div>

          {(e.statusBefore || e.statusAfter) && (
            <div className="text-xs text-muted-foreground mt-0.5">
              {e.statusBefore} {e.statusBefore && e.statusAfter && "→"} {e.statusAfter}
            </div>
          )}

          {e.risk && (
            <button
              onClick={() => onOpenRisk(e.risk!.id)}
              className="mt-1.5 block text-left hover:underline"
            >
              <span className="text-xs text-muted-foreground">{e.risk.code}</span>{" "}
              <span className="text-xs text-foreground">{e.risk.title}</span>
            </button>
          )}

          {e.changes && e.changes.length > 0 && (
            <div className="mt-1.5 text-xs text-muted-foreground space-y-0.5">
              {e.changes.map((c, i) => (
                <div key={i}>
                  {c.label}: <span className="text-foreground">{c.before ?? "—"}</span> → <span className="text-foreground">{c.after ?? "—"}</span>
                </div>
              ))}
            </div>
          )}

          <div className="text-xs text-muted-foreground mt-1">
            {shortName(e.actor.name)} · {e.actor.role}
          </div>
          <div className="text-[11px] text-muted-foreground">
            {formatDateLong(e.createdAt)}
          </div>

          {e.comment && (
            <div className="mt-2 text-xs text-foreground bg-muted/50 rounded-md px-3 py-2 leading-relaxed">
              {e.comment}
            </div>
          )}

          {e.attachments && e.attachments.length > 0 && (
            <div className="mt-2 space-y-1">
              {e.attachments.map((a) => (
                <button
                  key={a.id}
                  className="w-full flex items-center justify-between text-xs bg-muted/50 hover:bg-muted rounded-md px-3 py-2 transition-colors"
                >
                  <span className="flex items-center gap-2 text-foreground">
                    <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                    {a.name}
                  </span>
                  {a.size && <span className="text-muted-foreground">{a.size}</span>}
                </button>
              ))}
            </div>
          )}

          {e.metadata?.expiresAt && (
            <div className="text-[11px] text-muted-foreground mt-1">
              Срок действия: {e.metadata.expiresAt}
            </div>
          )}
          {e.metadata?.basis && (
            <div className="text-[11px] text-muted-foreground mt-1">
              Основание: {e.metadata.basis}
            </div>
          )}
          {e.metadata?.disputedRisksCount !== undefined && (
            <div className="text-[11px] text-muted-foreground mt-1">
              Спорных рисков: {e.metadata.disputedRisksCount}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
