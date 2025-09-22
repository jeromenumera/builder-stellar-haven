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
import { Badge } from "@/components/ui/badge";
import { MapPin, Check, X } from "lucide-react";
import { useState } from "react";

export function Header() {
  const { state, selectEvent, selectPointDeVente } = usePos();
  const [isOpen, setIsOpen] = useState(false);
  const [draftEventId, setDraftEventId] = useState<string | null>(null);
  const [draftPdvId, setDraftPdvId] = useState<string | null>(null);

  const activeClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-md ${isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`;

  const selectedValue = state.selectedEventId ?? "";
  const selectedPdv = state.selectedPointDeVenteId ?? "";

  // Initialize draft values when dropdown opens
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      setDraftEventId(state.selectedEventId);
      setDraftPdvId(state.selectedPointDeVenteId);
    }
  };

  // Apply selections
  const handleApplySelection = () => {
    if (draftEventId !== state.selectedEventId) {
      selectEvent(draftEventId);
    }
    if (draftPdvId !== state.selectedPointDeVenteId) {
      if (Object.keys(state.cart).length > 0 && draftPdvId !== state.selectedPointDeVenteId) {
        const ok = confirm("Changer de stand va vider le panier, continuer ?");
        if (!ok) return;
      }
      selectPointDeVente(draftPdvId);
    }
    setIsOpen(false);
  };

  // Cancel selection
  const handleCancel = () => {
    setDraftEventId(state.selectedEventId);
    setDraftPdvId(state.selectedPointDeVenteId);
    setIsOpen(false);
  };

  return (
    <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between">
        {/* Logo - responsive sizing */}
        <div className="font-extrabold text-lg sm:text-xl tracking-tight text-primary">
          SOS MEDITERRANÉE
        </div>

        {/* Desktop Navigation */}
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

        {/* Selection Status and Settings */}
        <div className="flex items-center justify-end gap-2 sm:gap-3">
          {/* Mobile: Show compact status */}
          <div className="hidden xs:flex sm:hidden items-center gap-1">
            {state.selectedEventId && state.selectedPointDeVenteId ? (
              <Badge variant="default" className="text-xs px-2 py-1">
                ✓ Configuré
              </Badge>
            ) : (
              <Badge variant="destructive" className="text-xs px-2 py-1">
                Config
              </Badge>
            )}
          </div>

          {/* Desktop: Show full status */}
          <div className="hidden sm:flex items-center gap-2">
            {state.selectedEventId ? (
              <Badge variant="default" className="text-xs font-medium truncate max-w-48 md:max-w-64">
                📅 {state.evenements.find(e => e.id === state.selectedEventId)?.nom}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs">
                Aucun événement
              </Badge>
            )}
            {state.selectedPointDeVenteId ? (
              <Badge variant="secondary" className="text-xs font-medium max-w-32 truncate">
                🏪 {state.pointsDeVente.find(p => p.id === state.selectedPointDeVenteId)?.nom}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs">
                Aucun PDV
              </Badge>
            )}
          </div>

          <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={`h-9 w-9 sm:h-10 sm:w-10 rounded-full transition-colors ${
                  isOpen ? 'bg-primary text-primary-foreground' : ''
                }`}
              >
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="sr-only">
                  Sélection Événement/Point de vente
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-[calc(100vw-2rem)] sm:w-96 max-w-md p-0 mr-2 sm:mr-0"
            >
              <div className="p-4 space-y-4">
                <DropdownMenuLabel className="p-0 text-base font-semibold">
                  Configuration
                </DropdownMenuLabel>

                {/* Event Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Événement</label>
                  <select
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    value={draftEventId ?? ""}
                    onChange={(e) => setDraftEventId(e.target.value || null)}
                  >
                    <option value="">Sélectionner un événement...</option>
                    {state.evenements
                      .filter((e) => e.statut === "actif")
                      .map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.nom} — {e.lieu}
                        </option>
                      ))}
                  </select>
                  {draftEventId && (
                    <div className="text-xs text-muted-foreground">
                      ✓ {state.evenements.find(e => e.id === draftEventId)?.nom}
                    </div>
                  )}
                </div>

                <DropdownMenuSeparator />

                {/* POS Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Point de vente</label>
                  <select
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    value={draftPdvId ?? ""}
                    onChange={(e) => setDraftPdvId(e.target.value || null)}
                  >
                    <option value="">Sélectionner un point de vente...</option>
                    {state.pointsDeVente.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nom}
                      </option>
                    ))}
                  </select>
                  {draftPdvId && (
                    <div className="text-xs text-muted-foreground">
                      ✓ {state.pointsDeVente.find(p => p.id === draftPdvId)?.nom}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                    className="flex-1"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Annuler
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleApplySelection}
                    className="flex-1"
                    disabled={draftEventId === state.selectedEventId && draftPdvId === state.selectedPointDeVenteId}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Appliquer
                  </Button>
                </div>

                {/* Current Status */}
                <div className="text-xs text-muted-foreground border-t pt-2">
                  <div className="flex items-center justify-between">
                    <span>Statut actuel:</span>
                    <div className="flex gap-1">
                      {state.selectedEventId && state.selectedPointDeVenteId ? (
                        <Badge variant="default" className="text-xs">Configuré</Badge>
                      ) : (
                        <Badge variant="destructive" className="text-xs">Incomplet</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
