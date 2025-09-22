import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { usePos } from "@/context/PosStore";
import placeholderSvg from "@/assets/placeholder.svg";

type Product = {
  id?: string;
  nom: string;
  prix_ttc: number;
  tva?: number | null;
  sku?: string | null;
  image_url?: string | null;
  actif?: boolean;
};

export function ProductForm({
  initial,
  onDone,
}: {
  initial: Product | null;
  onDone?: () => void;
}) {
  const { state, refreshData, loadProduitsAdmin } = usePos() as any;
  const [nom, setNom] = useState(initial?.nom ?? "");
  const [prix, setPrix] = useState<string>(initial ? String(initial.prix_ttc) : "");
  const [tva, setTva] = useState<string>(
    initial?.tva != null ? String(initial.tva) : "8.1"
  );
  const [sku, setSku] = useState<string>(initial?.sku ?? "");
  const [imageUrl, setImageUrl] = useState<string>(initial?.image_url ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const pdvList = useMemo(() => {
    const evId = state.selectedEventId;
    return state.pointsDeVente.filter((p) => p.evenement_id === evId && p.actif);
  }, [state.pointsDeVente, state.selectedEventId]);

  useEffect(() => {
    setNom(initial?.nom ?? "");
    setPrix(initial ? String(initial.prix_ttc) : "");
    setTva(initial?.tva != null ? String(initial.tva) : "8.1");
    setSku(initial?.sku ?? "");
    setImageUrl(initial?.image_url ?? "");
    setFile(null);
    setChecked({});
    setErr(null);
  }, [initial]);

  function togglePdv(id: string) {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  }

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
      const res = await fetch("/api/upload-image", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as any)?.error || "Upload image échoué");
      return (data as any).url || null;
    } finally {
      setUploading(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    const eventId = state.selectedEventId;
    if (!nom.trim()) return setErr("Le nom est requis.");
    if (prix.trim() === "" || isNaN(Number(prix))) return setErr("Prix TTC invalide.");
    if (!eventId) return setErr("Sélectionne un événement dans la barre du haut.");

    let tvaNumber = Number(tva);
    if (isNaN(tvaNumber)) tvaNumber = 0;
    if (tvaNumber > 1.0) tvaNumber = tvaNumber / 100;

    const finalUrl = await uploadImageIfNeeded();

    const payload = {
      id: initial?.id,
      name: nom.trim(),
      priceTTC: Number(prix),
      taxRate: tvaNumber,
      imageUrl: finalUrl,
      sku: sku || null,
      active: true,
      pointOfSaleIds: Object.keys(checked).filter((k) => checked[k]),
      eventId,
    };

    setSaving(true);
    try {
      const res = await fetch("/api/produits" + (initial?.id ? `/${initial.id}` : ""), {
        method: initial?.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as any)?.error || "Échec de l'enregistrement");

      // Reload admin list explicitly to avoid POS filters interfering
      try { await loadProduitsAdmin?.(); } catch {}
      onDone?.();
      if (!initial?.id) {
        setNom("");
        setPrix("");
        setTva("8.1");
        setSku("");
        setImageUrl("");
        setChecked({});
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
          <Input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex: ToteBag" />
        </div>
        <div>
          <Label>Prix TTC (CHF)</Label>
          <Input value={prix} onChange={(e) => setPrix(e.target.value)} placeholder="20" />
        </div>
        <div>
          <Label>TVA (%)</Label>
          <Input value={tva} onChange={(e) => setTva(e.target.value)} placeholder="8.1" />
        </div>
        <div>
          <Label>SKU (optionnel)</Label>
          <Input value={sku} onChange={(e) => setSku(e.target.value)} />
        </div>
      </div>

      <div>
        <Label>Attribution aux points de vente</Label>
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {pdvList.map((p) => (
            <label key={p.id} className="flex items-center gap-2">
              <Checkbox checked={!!checked[p.id]} onCheckedChange={() => togglePdv(p.id)} />
              <span>{p.nom}</span>
            </label>
          ))}
          {pdvList.length === 0 && (
            <div className="text-xs text-muted-foreground">Aucun point de vente actif pour l'événement courant.</div>
          )}
        </div>
      </div>

      <div className="md:col-span-2">
        <Label>Image produit</Label>
        <div className="flex items-center gap-3">
          <div className="w-20 h-20 rounded-md overflow-hidden bg-muted flex items-center justify-center">
            {(imageUrl || file) ? (
              <img src={file ? URL.createObjectURL(file) : imageUrl} alt="preview" className="w-full h-full object-cover" />
            ) : (
              <img src={placeholderSvg} alt="placeholder" className="w-10 h-10" />
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
              <Button type="button" onClick={() => document.getElementById("file-upload")?.click()} disabled={uploading}>
                {uploading ? "Chargement..." : "Choisir un fichier"}
              </Button>
              {(imageUrl || file) && (
                <Button variant="destructive" type="button" onClick={removeImage}>
                  Supprimer
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">JPEG/PNG/WebP — max 5MB</p>
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
