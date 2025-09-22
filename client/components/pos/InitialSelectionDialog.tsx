import { useEffect, useMemo, useState } from "react";
import { usePos } from "@/context/PosStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function InitialSelectionDialog() {
  const { state, selectEvent, selectPointDeVente, refreshData } = usePos();
  const [open, setOpen] = useState(false);
  const [eventId, setEventId] = useState<string>(state.selectedEventId || "");
  const [pdvId, setPdvId] = useState<string>(state.selectedPointDeVenteId || "");

  useEffect(() => {
    const hasPdv = !!(state.selectedPointDeVenteId && state.selectedPointDeVenteId.length > 0);
    setOpen(!hasPdv);
  }, [state.selectedPointDeVenteId]);

  const pdvOptions = useMemo(() => {
    return state.pointsDeVente.filter((p) => !eventId || p.evenement_id === eventId);
  }, [state.pointsDeVente, eventId]);

  const confirm = async () => {
    if (!eventId || !pdvId) return;
    selectEvent(eventId);
    selectPointDeVente(pdvId);
    await refreshData();
    setOpen(false);
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Sélectionner l'événement et le point de vente</DialogTitle>
          <DialogDescription>
            Choisis d'abord l'événement, puis le point de vente. Cette sélection est obligatoire pour continuer.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Événement</label>
            <select
              className="h-10 w-full rounded-md border bg-background px-3"
              value={eventId}
              onChange={(e) => { setEventId(e.target.value); setPdvId(""); }}
            >
              <option value="">— Choisir —</option>
              {state.evenements.filter(e => e.statut === "actif").map((e) => (
                <option key={e.id} value={e.id}>{e.nom} — {e.lieu}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Point de vente</label>
            <select
              className="h-10 w-full rounded-md border bg-background px-3"
              value={pdvId}
              onChange={(e) => setPdvId(e.target.value)}
              disabled={!eventId}
            >
              <option value="">— Choisir —</option>
              {pdvOptions.map((p) => (
                <option key={p.id} value={p.id}>{p.nom}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <Button onClick={confirm} disabled={!eventId || !pdvId}>Confirmer</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
