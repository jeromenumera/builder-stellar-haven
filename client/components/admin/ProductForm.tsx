import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { usePos } from "@/context/PosStore";
import { Produit } from "@shared/api";
import placeholderSvg from "@/assets/placeholder.svg";

export function ProductForm({
  initial,
  onDone,
}: {
  initial: Produit | null;
  onDone?: () => void;
}) {
  const { state, saveProduit } = usePos() as any;
  const [nom, setNom] = useState(initial?.nom ?? "");
  const [prix, setPrix] = useState<string>(
    initial ? String(initial.prix_ttc) : "",
  );
  const [tva, setTva] = useState<string>(
    initial?.tva != null ? String(initial.tva) : "8.1",
  );
  const [sku, setSku] = useState<string>(initial?.sku ?? "");
  const [imageUrl, setImageUrl] = useState<string>(initial?.image_url ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(
    new Set(),
  );
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setNom(initial?.nom ?? "");
    setPrix(initial ? String(initial.prix_ttc) : "");
    setTva(initial?.tva != null ? String(initial.tva) : "8.1");
    setSku(initial?.sku ?? "");
    setImageUrl(initial?.image_url ?? "");
    setFile(null);
    // Initialize selected events from product's associated events
    if (initial?.evenements && Array.isArray(initial.evenements)) {
      setSelectedEventIds(new Set(initial.evenements.map((e) => e.id)));
    } else {
      setSelectedEventIds(new Set());
    }
    setErr(null);
  }, [initial]);

  async function onFileChange(f?: File) {
    if (!f) return;
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(f.type)) {
      setErr("Type d'image non supporté. Utilisez JPG, PNG ou WebP.");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setErr("Image trop lourde (max 5MB).");
      return;
    }
    setFile(f);
    setErr(null);
  }

  function removeImage() {
    setImageUrl("");
    setFile(null);
  }

  async function uploadImageIfNeeded(): Promise<string | null> {
    if (!file) return imageUrl || null;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload-image", {
        method: "POST",
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error((data as any)?.error || "Upload image échoué");
      return (data as any).url || null;
    } finally {
      setUploading(false);
    }
  }

  function toggleEvent(eventId: string) {
    const newSet = new Set(selectedEventIds);
    if (newSet.has(eventId)) {
      newSet.delete(eventId);
    } else {
      newSet.add(eventId);
    }
    setSelectedEventIds(newSet);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (!nom.trim()) return setErr("Le nom est requis.");
    if (prix.trim() === "" || isNaN(Number(prix)))
      return setErr("Prix TTC invalide.");
    if (selectedEventIds.size === 0)
      return setErr("Sélectionnez au moins un événement.");

    let tvaNumber = Number(tva);
    if (isNaN(tvaNumber)) tvaNumber = 0;
    if (tvaNumber > 1.0) tvaNumber = tvaNumber / 100;

    const finalUrl = await uploadImageIfNeeded();

    const produit = {
      id: initial?.id,
      nom: nom.trim(),
      prix_ttc: Number(prix),
      tva: tvaNumber,
      image_url: finalUrl,
      sku: sku || null,
      actif: true,
      eventIds: Array.from(selectedEventIds),
    };

    setSaving(true);
    try {
      await saveProduit(produit);
      onDone?.();
      if (!initial?.id) {
        setNom("");
        setPrix("");
        setTva("8.1");
        setSku("");
        setImageUrl("");
        setSelectedEventIds(new Set());
      }
    } catch (e: any) {
      setErr(e.message || "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Nom</Label>
          <Input
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Ex: ToteBag"
          />
        </div>
        <div>
          <Label>Prix TTC (CHF)</Label>
          <Input
            value={prix}
            onChange={(e) => setPrix(e.target.value)}
            placeholder="20"
          />
        </div>
        <div>
          <Label>TVA (%)</Label>
          <Input
            value={tva}
            onChange={(e) => setTva(e.target.value)}
            placeholder="8.1"
          />
        </div>
        <div>
          <Label>SKU (optionnel)</Label>
          <Input value={sku} onChange={(e) => setSku(e.target.value)} />
        </div>
      </div>

      <div>
        <Label>Événements</Label>
        <div className="mt-2 space-y-2 p-3 border rounded-md max-h-48 overflow-y-auto">
          {state.evenements.length === 0 ? (
            <div className="text-xs text-muted-foreground">
              Aucun événement disponible.
            </div>
          ) : (
            state.evenements.map((event: any) => (
              <div key={event.id} className="flex items-center gap-2">
                <Checkbox
                  id={`event-${event.id}`}
                  checked={selectedEventIds.has(event.id)}
                  onCheckedChange={() => toggleEvent(event.id)}
                />
                <label
                  htmlFor={`event-${event.id}`}
                  className="text-sm font-medium cursor-pointer flex-1"
                >
                  {event.nom}
                </label>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="md:col-span-2">
        <Label>Image produit</Label>
        <div className="flex items-center gap-3">
          <div className="w-20 h-20 rounded-md overflow-hidden bg-muted flex items-center justify-center">
            {imageUrl || file ? (
              <img
                src={file ? URL.createObjectURL(file) : imageUrl}
                alt="preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={placeholderSvg}
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
                onClick={() => document.getElementById("file-upload")?.click()}
                disabled={uploading}
              >
                {uploading ? "Chargement..." : "Choisir un fichier"}
              </Button>
              {(imageUrl || file) && (
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
              JPEG/PNG/WebP — max 5MB
            </p>
          </div>
        </div>
      </div>

      {err && <p className="text-red-400 text-sm">{err}</p>}

      <Button type="submit" disabled={saving}>
        {saving ? "Enregistrement..." : "Enregistrer"}
      </Button>
    </form>
  );
}
