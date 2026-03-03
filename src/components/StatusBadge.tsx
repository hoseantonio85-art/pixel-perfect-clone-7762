interface StatusBadgeProps {
  status: string;
  variant?: "filled" | "outlined";
}

const StatusBadge = ({ status, variant = "outlined" }: StatusBadgeProps) => {
  let colorClasses = "";

  switch (status) {
    case "Согласовано":
      colorClasses = variant === "filled"
        ? "bg-primary/10 text-primary border-primary/30"
        : "bg-primary/10 text-primary border-primary/30";
      break;
    case "Ожидает оценки":
      colorClasses = "bg-muted text-muted-foreground border-border";
      break;
    case "Оценка":
      colorClasses = "bg-primary/10 text-primary border-primary/30";
      break;
    case "Согласование":
      colorClasses = "bg-primary/10 text-primary border-primary/30";
      break;
    default:
      colorClasses = "bg-muted text-muted-foreground border-border";
  }

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${colorClasses}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
