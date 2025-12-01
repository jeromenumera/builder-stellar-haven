import { useEffect, useState } from "react";
import { usePos } from "@/context/PosStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function InitialSelectionDialog() {
  const { state, selectEvent, refreshData } = usePos();
  const [open, setOpen] = useState(false);
  const [eventId, setEventId] = useState<string>(state.selectedEventId || "");

  useEffect(() => {
    const hasEvent = !!(
      state.selectedEventId && state.selectedEventId.length > 0
    );
    setOpen(!hasEvent);
  }, [state.selectedEventId]);

  const confirm = async () => {
    if (!eventId) return;
    selectEvent(eventId);
    await refreshData();
    setOpen(false);
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Sélectionner l'événement</DialogTitle>
          <DialogDescription>
            Choisis l'événement pour continuer.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Événement</label>
            <select
              className="h-10 w-full rounded-md border bg-background px-3"
              value={eventId}
              onChange={(e) => {
                setEventId(e.target.value);
              }}
            >
              <option value="">— Choisir —</option>
              {state.evenements
                .filter((e) => e.statut === "actif")
                .map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nom} — {e.lieu}
                  </option>
                ))}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <Button onClick={confirm} disabled={!eventId}>
              Confirmer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
