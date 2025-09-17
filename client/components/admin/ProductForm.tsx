import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { usePos } from "@/context/PosStore";
import { Produit } from "@shared/api";
import { uid } from "@/services/id";

export function ProductForm({
  initial,
  onDone,
}: {
  initial?: Produit | null;
  onDone?: () => void;
}) {
  const { saveProduit } = usePos();
  const [form, setForm] = useState<Produit>(
    initial ?? {
      id: uid("prod"),
      nom: "",
      prix_ttc: 0,
      tva: 8.1,
      image_url: "",
      sku: "",
    },
  );

  useEffect(() => {
    if (initial) setForm({ ...initial, tva: 8.1 });
  }, [initial]);

  const [uploading, setUploading] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // enforce TVA fixed at 8.1
    saveProduit({ ...form, prix_ttc: Number(form.prix_ttc), tva: 8.1 });
    onDone?.();
  };

  const onFileChange = async (f?: File) => {
    if (!f) return;
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(f.type)) {
      alert("Type d'image non supporté. Utilisez JPG, PNG ou WebP.");
      return;
    }
    if (f.size > 3 * 1024 * 1024) {
      alert("Image trop lourde (max 3MB).");
      return;
    }
    setUploading(true);
    try {
      const { resizeImageFile } = await import("@/lib/image");
      const data = await resizeImageFile(f, 512);
      setForm({ ...form, image_url: data });
    } catch (err) {
      console.error(err);
      alert("Erreur lors du traitement de l'image.");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => setForm({ ...form, image_url: "" });

  return (
    <Card className="p-4">
      <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Nom</Label>
          <Input
            value={form.nom}
            onChange={(e) => setForm({ ...form, nom: e.target.value })}
            required
          />
        </div>
        <div>
          <Label>Prix TTC (CHF)</Label>
          <Input
            type="number"
            min={0}
            step="0.05"
            value={form.prix_ttc}
            onChange={(e) =>
              setForm({ ...form, prix_ttc: Number(e.target.value) })
            }
            required
          />
        </div>
        <div>
          <Label>TVA (%)</Label>
          <Input value={8.1} disabled />
        </div>
        <div>
          <Label>SKU (optionnel)</Label>
          <Input
            value={form.sku || ""}
            onChange={(e) => setForm({ ...form, sku: e.target.value })}
          />
        </div>

        <div className="md:col-span-2">
          <Label>Image</Label>
          <div className="flex items-center gap-3">
            <div className="w-20 h-20 rounded-md overflow-hidden bg-muted flex items-center justify-center">
              {form.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.image_url}
                  alt="preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src="/public/placeholder.svg"
                  alt="placeholder"
                  className="w-10 h-10"
                />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <input
                id="file-upload"
                type="file"
                accept="image/*"
                onChange={(e) => onFileChange(e.target.files?.[0])}
                className="text-sm"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={() =>
                    document.getElementById("file-upload")?.click()
                  }
                  disabled={uploading}
                >
                  {uploading ? "Chargement..." : "Téléverser"}
                </Button>
                {form.image_url && (
                  <Button
                    variant="destructive"
                    type="button"
                    onClick={removeImage}
                  >
                    Supprimer
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                JPEG/PNG/WebP — max 3MB
              </p>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 flex justify-end gap-2">
          <Button type="submit">Enregistrer</Button>
        </div>
      </form>
    </Card>
  );
}
