import { useMemo, useState } from "react";
import { usePos } from "@/context/PosStore";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExportActions } from "@/components/exports/ExportActions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { computeTotals } from "@shared/api";

export default function Historique() {
  const { state, deleteVente, updateVente } = usePos();
  const [editing, setEditing] = useState<null | string>(null);
  const [draft, setDraft] = useState<any>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const ventes = useMemo(() => {
    if (!state.selectedEventId) return [];

    return state.ventes.filter((v) => {
      const matchEvent = v.evenement_id === state.selectedEventId;
      const matchPdv = state.selectedPointDeVenteId
        ? v.point_de_vente_id === state.selectedPointDeVenteId
        : true; // Si aucun PDV sélectionné, afficher toutes les ventes de l'événement

      return matchEvent && matchPdv;
    });
  }, [state.ventes, state.selectedEventId, state.selectedPointDeVenteId]);

  const onDelete = async (id: string) => {
    if (
      !confirm(
        "Confirmer la suppression de cette vente ? Cette action est irréversible.",
      )
    )
      return;
    setDeleting(id);
    try {
      await deleteVente(id);
    } catch (error) {
      alert("Erreur lors de la suppression de la vente.");
    } finally {
      setDeleting(null);
    }
  };

  const openEdit = (v: any) => {
    setDraft(JSON.parse(JSON.stringify(v)));
    setEditing(v.id);
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      // recompute totals
      const totals = computeTotals(draft.lignes);
      const updated = {
        ...draft,
        total_ttc: totals.total_ttc,
        total_ht: totals.total_ht,
        tva_totale: totals.tva_totale,
      };
      await updateVente(updated);
      setEditing(null);
      setDraft(null);
    } catch (error) {
      alert("Erreur lors de la modification de la vente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Historique des ventes</h1>
        <ExportActions />
      </div>
      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Heure</TableHead>
              <TableHead>Total TTC</TableHead>
              <TableHead>Mode</TableHead>
              <TableHead>Produits</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ventes.map((v) => (
              <TableRow key={v.id}>
                <TableCell>
                  {new Date(v.horodatage).toLocaleTimeString()}
                </TableCell>
                <TableCell className="font-semibold text-green-300">
                  {v.total_ttc.toFixed(2)} CHF
                </TableCell>
                <TableCell className="capitalize">{v.mode_paiement}</TableCell>
                <TableCell>
                  <ul className="text-sm">
                    {v.lignes.map((l) => (
                      <li key={l.id}>
                        {l.quantite} ×{" "}
                        {state.produits.find((p) => p.id === l.produit_id)
                          ?.nom || l.produit_id}
                      </li>
                    ))}
                  </ul>
                </TableCell>
                <TableCell className="flex gap-2 justify-end">
                  <Button
                    variant="secondary"
                    onClick={() => openEdit(v)}
                    disabled={deleting === v.id}
                  >
                    Modifier
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => onDelete(v.id)}
                    disabled={deleting === v.id}
                  >
                    {deleting === v.id ? "..." : "Supprimer"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {ventes.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground py-10"
                >
                  Aucun enregistrement pour l'événement sélectionné
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la vente</DialogTitle>
          </DialogHeader>

          {draft && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Mode de paiement</label>
                <select
                  className="w-full h-10 rounded-md bg-background px-3"
                  value={draft.mode_paiement}
                  onChange={(e) =>
                    setDraft({ ...draft, mode_paiement: e.target.value })
                  }
                >
                  <option value="carte">Carte</option>
                  <option value="cash">Espèces</option>
                </select>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Lignes</h3>
                <div className="space-y-2">
                  {draft.lignes.map((l: any, idx: number) => {
                    const produit = state.produits.find(
                      (p) => p.id === l.produit_id,
                    );
                    return (
                      <div key={l.id} className="flex items-center gap-2">
                        <div className="w-1/2">
                          {produit?.nom || l.produit_id}
                        </div>
                        <input
                          type="number"
                          min={0}
                          value={l.quantite}
                          className="w-24 h-10 rounded-md px-2"
                          onChange={(e) => {
                            const qty = Number(e.target.value);
                            const next = { ...draft };
                            next.lignes[idx].quantite = qty;
                            next.lignes[idx].sous_total_ttc = Number(
                              (
                                next.lignes[idx].prix_unitaire_ttc * qty
                              ).toFixed(2),
                            );
                            setDraft(next);
                          }}
                        />
                        <div className="ml-auto">
                          {(l.prix_unitaire_ttc * l.quantite).toFixed(2)} CHF
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <DialogFooter>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setEditing(null);
                      setDraft(null);
                    }}
                    disabled={saving}
                  >
                    Annuler
                  </Button>
                  <Button onClick={saveEdit} disabled={saving}>
                    {saving ? "Enregistrement..." : "Enregistrer"}
                  </Button>
                </DialogFooter>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
