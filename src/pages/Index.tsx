import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, SlidersHorizontal } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import RiskBadge from "@/components/RiskBadge";
import StatusBadge from "@/components/StatusBadge";
import { agents } from "@/data/mockData";

const statsData = [
  { label: "Всего агентов", value: "639", extra: "+ 16 за май" },
  { label: "Оцененные", value: "142", extra: "/ 500" },
  { label: "В оценке", value: "12", extra: "/ 500" },
];

const riskLevels = [
  { level: "critical" as const, label: "Очень высокий", count: 5 },
  { level: "high" as const, label: "Высокий", count: 3 },
  { level: "medium" as const, label: "Средний", count: 5 },
  { level: "low" as const, label: "Низкий", count: 5 },
];

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const filteredAgents = agents.filter((a) =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusInfo = (agent: typeof agents[0]) => {
    switch (agent.status) {
      case "awaiting":
        return { text: "Ожидает оценки", show: true };
      case "approved":
        return { text: "Согласовано", show: true };
      case "review":
        return { text: "Оценка", show: true };
      default:
        return { text: "", show: false };
    }
  };

  return (
    <AppLayout>
      <div className="max-w-[1200px] mx-auto">
        {/* Title */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Риски ИИ-агентов</h1>
            <p className="text-sm text-muted-foreground max-w-xl">
              Главная страница отображает список оценок по продуктам и процессам. Можно создать новую оценку, просмотреть результаты, применить фильтры и найти нужную оценку.
            </p>
          </div>
          <button className="px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
            Создать оценку
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Поиск"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-10 pr-4 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
            />
          </div>
          <button className="w-11 h-11 rounded-lg border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-px bg-border rounded-xl overflow-hidden mb-6">
          {statsData.map((stat, i) => (
            <div key={i} className="bg-card p-5">
              <div className="text-xs text-muted-foreground mb-1">{stat.label}</div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-foreground">{stat.value}</span>
                <span className="text-sm text-primary font-medium">{stat.extra}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Risk levels */}
        <div className="bg-card rounded-xl border border-border p-5 mb-6">
          <div className="text-sm font-semibold text-foreground mb-3">Уровень риска</div>
          <div className="grid grid-cols-4 gap-3">
            {riskLevels.map((r) => (
              <div
                key={r.level}
                className="flex items-center justify-between p-3 rounded-lg border border-border"
              >
                <RiskBadge level={r.level} size="md" />
                <span className="text-lg font-bold text-foreground">{r.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Agent list */}
        <div className="text-xs text-muted-foreground mb-3">
          Всего: {filteredAgents.length * 30 + 2} объекта
        </div>

        <div className="space-y-2">
          {filteredAgents.map((agent) => {
            const statusInfo = getStatusInfo(agent);
            return (
              <div
                key={agent.id}
                onClick={() => navigate(`/agent/${agent.id}`)}
                className="bg-card rounded-xl border border-border p-5 cursor-pointer hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-foreground mb-1">{agent.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{agent.code}</span>
                      <span>•</span>
                      <span>{agent.division}</span>
                      <span>•</span>
                      <span>{agent.department}</span>
                      <span>•</span>
                      <span>📄 Версия {agent.version}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-right">
                    <div className="flex items-center gap-2">
                      {statusInfo.show && <StatusBadge status={statusInfo.text} />}
                      {agent.riskLevel && <RiskBadge level={agent.riskLevel} />}
                    </div>
                    <div className="text-xs text-muted-foreground ml-2">
                      Последнее изменение от {agent.lastModified}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
