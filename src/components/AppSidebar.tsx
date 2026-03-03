import { Home, MessageSquare, CheckSquare, BarChart3, Calendar, Users, Shield, Settings, Clock, Bell, UserCircle, LogOut, Plus, Sparkles } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const navItems = [
  { icon: Home, path: "/" },
  { icon: MessageSquare, path: "#" },
  { icon: CheckSquare, path: "#" },
  { icon: BarChart3, path: "#" },
  { icon: Calendar, path: "#" },
  { icon: Users, path: "#" },
  { icon: Shield, path: "#" },
  { icon: Settings, path: "#" },
  { icon: Bell, path: "#" },
  { icon: UserCircle, path: "#" },
  { icon: Clock, path: "#" },
];

const AppSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[60px] bg-sidebar flex flex-col items-center z-50">
      {/* Logo */}
      <div className="w-10 h-10 mt-3 mb-1 rounded-lg bg-primary flex items-center justify-center cursor-pointer">
        <Sparkles className="w-5 h-5 text-primary-foreground" />
      </div>

      {/* Add button */}
      <button className="w-10 h-10 my-1 rounded-lg bg-primary flex items-center justify-center hover:opacity-90 transition-opacity">
        <Plus className="w-5 h-5 text-primary-foreground" />
      </button>

      {/* Nav items */}
      <nav className="flex-1 flex flex-col items-center gap-0.5 mt-2 w-full">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = item.path === location.pathname;
          return (
            <button
              key={index}
              onClick={() => item.path !== "#" && navigate(item.path)}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <Icon className="w-5 h-5" />
            </button>
          );
        })}
      </nav>

      {/* Bottom - active indicator */}
      <div className="mb-4">
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-primary-foreground" />
        </div>
      </div>

      {/* Collapse arrow */}
      <button className="w-full py-3 flex items-center justify-center text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors">
        <LogOut className="w-4 h-4 rotate-180" />
      </button>
    </aside>
  );
};

export default AppSidebar;
