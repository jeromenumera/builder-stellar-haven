import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { usePos } from "@/context/PosStore";
import { Evenement } from "@shared/api";
import { uid } from "@/services/id";

export function EventForm({
  initial,
  onDone,
}: {
  initial?: Evenement | null;
  onDone?: () => void;
}) {
  const { saveEvenement } = usePos();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Evenement>(
    initial ?? {
      id: uid("evt"),
      nom: "",
      date_debut: new Date().toISOString().slice(0, 10),
      date_fin: new Date().toISOString().slice(0, 10),
      lieu: "",
      statut: "actif",
    },
  );

  useEffect(() => {
    if (initial) setForm(initial);
  }, [initial]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveEvenement(form);
      onDone?.();
    } catch (error) {
      console.error("Failed to save event:", error);
      alert("Erreur lors de l'enregistrement de l'événement.");
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
            value={form.nom}
            onChange={(e) => setForm({ ...form, nom: e.target.value })}
            required
          />
        </div>
        <div>
          <Label>Lieu</Label>
          <Input
            value={form.lieu}
            onChange={(e) => setForm({ ...form, lieu: e.target.value })}
            required
          />
        </div>
        <div>
          <Label>Début</Label>
          <Input
            type="date"
            value={form.date_debut}
            onChange={(e) => setForm({ ...form, date_debut: e.target.value })}
            required
          />
        </div>
        <div>
          <Label>Fin</Label>
          <Input
            type="date"
            value={form.date_fin}
            onChange={(e) => setForm({ ...form, date_fin: e.target.value })}
            required
          />
        </div>
        <div>
          <Label>Statut</Label>
          <select
            className="h-10 rounded-md border bg-background px-3"
            value={form.statut}
            onChange={(e) =>
              setForm({ ...form, statut: e.target.value as any })
            }
          >
            <option value="actif">Actif</option>
            <option value="archivé">Archivé</option>
          </select>
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
