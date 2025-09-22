import { NavLink } from "react-router-dom";
import { usePos } from "@/context/PosStore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function Header() {
  const { state, selectEvent, selectPointDeVente } = usePos();
  const activeClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-md ${isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`;

  const selectedValue = state.selectedEventId ?? "";
  const selectedPdv = state.selectedPointDeVenteId ?? "";

  return (
    <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center gap-4">
        <div className="font-extrabold text-xl tracking-tight">
          SOS MEDITERRANEE
        </div>
        <nav className="hidden md:flex items-center gap-2">
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
        <div className="ml-auto flex items-center gap-3">
          <div className="text-sm text-muted-foreground hidden md:block">
            Événement
          </div>
          <Select
            value={selectedValue}
            onValueChange={(v) => selectEvent(v || null)}
          >
            <SelectTrigger className="min-w-[220px]">
              <SelectValue placeholder="Sélectionner un événement" />
            </SelectTrigger>
            <SelectContent>
              {state.evenements
                .filter((e) => e.statut === "actif")
                .map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.nom} — {e.lieu}
                  </SelectItem>
                ))}
              {state.evenements.filter((e) => e.statut === "actif").length ===
                0 && (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  Aucun événement actif
                </div>
              )}
            </SelectContent>
          </Select>
          <div className="text-sm text-muted-foreground hidden md:block">
            Point de vente
          </div>
          <Select
            value={selectedPdv}
            onValueChange={(v) => selectPointDeVente(v || null)}
          >
            <SelectTrigger className="min-w-[180px]">
              <SelectValue placeholder="Point de vente" />
            </SelectTrigger>
            <SelectContent>
              {state.pointsDeVente.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.nom}
                </SelectItem>
              ))}
              {state.pointsDeVente.length === 0 && (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  Aucun stand
                </div>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>
    </header>
  );
}
