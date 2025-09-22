import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { usePos } from "@/context/PosStore";
import { PointDeVente } from "@shared/api";

export function PointDeVenteForm({
  initial,
  onDone,
}: {
  initial?: PointDeVente | null;
  onDone?: () => void;
}) {
  const { state, savePointDeVente } = usePos();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<PointDeVente>>(
    initial ?? {
      nom: "",
      actif: true,
      evenement_id: state.selectedEventId || "",
    },
  );

  useEffect(() => {
    if (initial) setForm(initial);
  }, [initial]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nom || !form.type || !form.evenement_id) return;
    setSaving(true);
    try {
      await savePointDeVente({
        id: form.id,
        nom: form.nom,
        type: form.type as any,
        actif: !!form.actif,
        evenement_id: form.evenement_id!,
      });
      onDone?.();
    } catch (error) {
      console.error("Failed to save point de vente:", error);
      alert("Erreur lors de l'enregistrement du point de vente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-4">
      <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <Label>Nom</Label>
          <Input
            value={form.nom || ""}
            onChange={(e) => setForm({ ...form, nom: e.target.value })}
            required
          />
        </div>
        <div>
          <Label>Type</Label>
          <select
            className="h-10 rounded-md border bg-background px-3 w-full"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as any })}
          >
            <option value="merch">Merch</option>
            <option value="bar">Bar</option>
            <option value="vestiaire">Vestiaire</option>
            <option value="autre">Autre</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <Label>Événement associé</Label>
          <select
            className="h-10 rounded-md border bg-background px-3 w-full"
            value={form.evenement_id || ""}
            onChange={(e) => setForm({ ...form, evenement_id: e.target.value })}
            required
          >
            <option value="" disabled>
              Sélectionner...
            </option>
            {state.evenements.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nom} — {e.lieu}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!form.actif}
              onChange={(e) => setForm({ ...form, actif: e.target.checked })}
            />
            Actif
          </Label>
        </div>
        <div className="md:col-span-3 flex justify-end gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
