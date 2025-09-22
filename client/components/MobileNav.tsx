import { NavLink } from "react-router-dom";
import { ShoppingCart, BarChart3, Settings } from "lucide-react";

export function MobileNav() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center justify-center flex-1 py-3 transition-all duration-200 touch-manipulation active:scale-95 ${
      isActive
        ? "text-primary bg-primary/10"
        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
    }`;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden shadow-lg">
      <div className="flex safe-area-inset-bottom">
        <NavLink to="/vente" className={linkClass}>
          <ShoppingCart className="h-5 w-5 mb-1" />
          <span className="text-xs font-medium">Vente</span>
        </NavLink>
        <NavLink to="/historique" className={linkClass}>
          <BarChart3 className="h-5 w-5 mb-1" />
          <span className="text-xs font-medium">Historique</span>
        </NavLink>
        <NavLink to="/admin" className={linkClass}>
          <Settings className="h-5 w-5 mb-1" />
          <span className="text-xs font-medium">Admin</span>
        </NavLink>
      </div>
    </nav>
  );
}
