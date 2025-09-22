import { NavLink } from "react-router-dom";
import { usePos } from "@/context/PosStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

export function Header() {
  const { state, selectEvent, selectPointDeVente } = usePos();
  const activeClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-md ${isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`;

  const selectedValue = state.selectedEventId ?? "";
  const selectedPdv = state.selectedPointDeVenteId ?? "";

  return (
    <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 grid grid-cols-3 items-center">
        <div className="font-extrabold text-xl tracking-tight">
          SOS MEDITERRANEE
        </div>
        <nav className="hidden md:flex items-center justify-center gap-2">
          <NavLink to="/vente" className={activeClass}>
            Vente
          </NavLink>
          <NavLink to="/historique" className={activeClass}>
            Historique
          </NavLink>
          <NavLink to="/admin" className={activeClass}>
            Administration
          </NavLink>
        </nav>
        <div className="ml-auto flex items-center justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-full">
                <MapPin className="h-5 w-5" />
                <span className="sr-only">
                  Sélection Événement/Point de vente
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Événement</DropdownMenuLabel>
              <div className="p-2">
                <select
                  className="h-10 w-full rounded-md border bg-background px-3"
                  value={selectedValue}
                  onChange={(e) => selectEvent(e.target.value || null)}
                >
                  <option value="">Sélectionner...</option>
                  {state.evenements
                    .filter((e) => e.statut === "actif")
                    .map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.nom} — {e.lieu}
                      </option>
                    ))}
                </select>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Point de vente</DropdownMenuLabel>
              <div className="p-2">
                <select
                  className="h-10 w-full rounded-md border bg-background px-3"
                  value={selectedPdv}
                  onChange={(e) => {
                    const next = e.target.value || null;
                    if (next === state.selectedPointDeVenteId) return;
                    if (Object.keys(state.cart).length > 0) {
                      const ok = confirm(
                        "Changer de stand va vider le panier, continuer ?",
                      );
                      if (!ok) return;
                    }
                    selectPointDeVente(next);
                  }}
                >
                  <option value="">Sélectionner...</option>
                  {state.pointsDeVente.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nom}
                    </option>
                  ))}
                </select>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
