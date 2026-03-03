import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles, X, ChevronRight, Edit, QrCode, RotateCcw, AlertTriangle } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import RiskBadge from "@/components/RiskBadge";
import StatusBadge from "@/components/StatusBadge";
import { agents, versionHistory, type Risk } from "@/data/mockData";

const AgentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const agent = agents.find((a) => a.id === id);
  const [showBanner, setShowBanner] = useState(true);
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showVersionDetail, setShowVersionDetail] = useState(false);

  if (!agent) return null;

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
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  <span className="text-sm font-medium text-destructive">Ошибка синхронизации QGM</span>
                </div>
              </div>
            )}

            {/* Risk levels card */}
            <div className="bg-card rounded-xl border border-border p-5 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-foreground">Уровень риска</span>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Нет оценки</span>
                </div>
                <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                  Редактировать <Edit className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {riskCategories.map((cat) => (
                  <div key={cat} className="border border-border rounded-lg p-3">
                    <div className="text-sm font-bold text-foreground mb-1">{cat}</div>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Нет оценки</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk list */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold text-foreground">Список рисков</span>
                <span className="text-sm text-muted-foreground">{agent.risks.length}</span>
              </div>
              <button className="text-xs text-muted-foreground flex items-center gap-1">
                ↓ По умолчанию
              </button>
            </div>

            <div className="space-y-2">
              {agent.risks.map((risk) => (
                <div
                  key={risk.id}
                  onClick={() => setSelectedRisk(risk)}
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
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Статус:</span>
                    <StatusBadge status={agent.info.statusText} />
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
                  <button className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                    <Sparkles className="w-4 h-4" /> Оценить
                  </button>
                  <button className="w-10 h-10 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground">
                    <QrCode className="w-4 h-4" />
                  </button>
                </div>
                <button className="w-full h-10 rounded-lg border border-border text-sm text-foreground flex items-center justify-center gap-2 hover:bg-muted transition-colors">
                  <Edit className="w-4 h-4" /> Редактировать
                </button>
                <button className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
                  В работу
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Detail Slide Panel */}
      {selectedRisk && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-foreground/20" onClick={() => setSelectedRisk(null)} />
          <div className="w-[560px] bg-card shadow-2xl animate-slide-in-right overflow-y-auto">
            <div className="p-6">
              <button onClick={() => setSelectedRisk(null)} className="mb-4 text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
              <div className="text-xs text-muted-foreground mb-2">{selectedRisk.code}</div>
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

export default AgentDetail;
