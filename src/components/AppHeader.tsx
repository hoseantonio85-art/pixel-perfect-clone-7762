import { HelpCircle, LogOut } from "lucide-react";

const AppHeader = () => {
  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-end px-6 gap-4">
      <button className="text-muted-foreground hover:text-foreground transition-colors">
        <HelpCircle className="w-5 h-5" />
      </button>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-foreground">
          МЕ
        </div>
        <div className="text-sm">
          <div className="font-medium text-foreground leading-tight">Михайлова Екатерина</div>
          <div className="text-xs text-muted-foreground leading-tight">Риск-менеджер (ЦА)</div>
        </div>
      </div>
      <button className="text-muted-foreground hover:text-foreground transition-colors">
        <LogOut className="w-5 h-5" />
      </button>
    </header>
  );
};

export default AppHeader;
