import { NavLink } from "react-router-dom";
import { ShoppingCart, BarChart3, Settings } from "lucide-react";

export function MobileNav() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center justify-center flex-1 py-2 ${isActive ? "text-primary" : "text-muted-foreground"}`;
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 border-t bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <div className="flex">
        <NavLink to="/vente" className={linkClass}>
          <ShoppingCart className="h-5 w-5" />
          <span className="text-xs">Vente</span>
        </NavLink>
        <NavLink to="/historique" className={linkClass}>
          <BarChart3 className="h-5 w-5" />
          <span className="text-xs">Historique</span>
        </NavLink>
        <NavLink to="/admin" className={linkClass}>
          <Settings className="h-5 w-5" />
          <span className="text-xs">Admin</span>
        </NavLink>
      </div>
    </nav>
  );
}
