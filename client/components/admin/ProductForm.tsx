import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { usePos } from "@/context/PosStore";
import { Produit } from "@shared/api";
import { uid } from "@/services/id";

export function ProductForm({ initial, onDone }: { initial?: Produit | null; onDone?: () => void }) {
  const { saveProduit } = usePos();
  const [form, setForm] = useState<Produit>(
    initial ?? {
      id: uid("prod"),
      nom: "",
      prix_ttc: 0,
      tva: 7.7,
      image_url: "/public/placeholder.svg",
      sku: "",
    },
  );

  useEffect(() => {
    if (initial) setForm(initial);
  }, [initial]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    saveProduit({ ...form, prix_ttc: Number(form.prix_ttc), tva: Number(form.tva) });
    onDone?.();
  };

  return (
    <Card className="p-4">
      <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Nom</Label>
          <Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required />
        </div>
        <div>
          <Label>Prix TTC (CHF)</Label>
          <Input
            type="number"
            min={0}
            step="0.05"
            value={form.prix_ttc}
            onChange={(e) => setForm({ ...form, prix_ttc: Number(e.target.value) })}
            required
          />
        </div>
        <div>
          <Label>TVA (%)</Label>
          <Input
            type="number"
            min={0}
            step="0.1"
            value={form.tva}
            onChange={(e) => setForm({ ...form, tva: Number(e.target.value) })}
            required
          />
        </div>
        <div>
          <Label>SKU (optionnel)</Label>
          <Input value={form.sku || ""} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
        </div>
        <div className="md:col-span-2">
          <Label>Image URL</Label>
          <Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
        </div>
        <div className="md:col-span-2 flex justify-end gap-2">
          <Button type="submit">Enregistrer</Button>
        </div>
      </form>
    </Card>
  );
}
