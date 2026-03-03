interface RiskBadgeProps {
  level: "critical" | "high" | "medium" | "low";
  size?: "sm" | "md";
}

const labels: Record<string, string> = {
  critical: "Очень высокий",
  high: "Высокий",
  medium: "Средний",
  low: "Низкий",
};

const RiskBadge = ({ level, size = "sm" }: RiskBadgeProps) => {
  const colorMap = {
    critical: "bg-risk-critical",
    high: "bg-risk-high",
    medium: "bg-risk-medium",
    low: "bg-risk-low",
  };

  return (
    <span className={`inline-flex items-center gap-1.5 ${size === "md" ? "text-sm" : "text-xs"}`}>
      <span className={`w-2 h-2 rounded-full ${colorMap[level]}`} />
      <span className="font-medium text-foreground">{labels[level]}</span>
    </span>
  );
};

export default RiskBadge;
