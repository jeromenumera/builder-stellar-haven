import { useMemo, useState, useCallback, memo } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw } from "lucide-react";
import { computeTotals, Vente } from "@shared/api";

// Memoized row component for better performance
const VenteRow = memo(({
  vente,
  produits,
  onEdit,
  onDelete,
  isDeleting
}: {
  vente: Vente;
  produits: any[];
  onEdit: (v: any) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) => (
  <TableRow>
    <TableCell className="font-mono text-sm">
      {new Date(vente.horodatage).toLocaleTimeString('fr-FR')}
    </TableCell>
    <TableCell className="font-semibold text-green-600">
      {vente.total_ttc.toFixed(2)} CHF
    </TableCell>
    <TableCell>
      <Badge variant={vente.mode_paiement === 'carte' ? 'default' : 'secondary'}>
        {vente.mode_paiement === 'carte' ? '💳 Carte' : '💰 Espèces'}
      </Badge>
    </TableCell>
    <TableCell>
      <ul className="text-sm space-y-1">
        {vente.lignes.map((l) => (
          <li key={l.id} className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {l.quantite}×
            </Badge>
            <span>{produits.find((p) => p.id === l.produit_id)?.nom || l.produit_id}</span>
          </li>
        ))}
      </ul>
    </TableCell>
    <TableCell className="text-right">
      <div className="flex gap-2 justify-end">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onEdit(vente)}
          disabled={isDeleting}
        >
          Modifier
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onDelete(vente.id)}
          disabled={isDeleting}
        >
          {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Supprimer"}
        </Button>
      </div>
    </TableCell>
  </TableRow>
));

VenteRow.displayName = 'VenteRow';

function Historique() {
  const { state, deleteVente, updateVente, refreshData } = usePos();
  const [editing, setEditing] = useState<null | string>(null);
  const [draft, setDraft] = useState<any>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Optimized filtering with early returns
  const { ventes, totalCount, filteredCount } = useMemo(() => {
    const allVentes = state.ventes || [];
    let filtered = allVentes;

    // Filter by event first (most selective)
    if (state.selectedEventId) {
      filtered = filtered.filter(v => v.evenement_id === state.selectedEventId);
    }

    // Sort by most recent first
    filtered.sort((a, b) => new Date(b.horodatage).getTime() - new Date(a.horodatage).getTime());

    return {
      ventes: filtered,
      totalCount: allVentes.length,
      filteredCount: filtered.length
    };
  }, [state.ventes, state.selectedEventId]);

  // Optimized callbacks
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
    } catch (error) {
      console.error('Erreur lors du rafraîchissement:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshData]);

  const onDelete = useCallback(async (id: string) => {
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
  }, [deleteVente]);

  const openEdit = useCallback((v: any) => {
    setDraft(JSON.parse(JSON.stringify(v)));
    setEditing(v.id);
  }, []);

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
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Historique des ventes</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{filteredCount} vente{filteredCount !== 1 ? 's' : ''} affichée{filteredCount !== 1 ? 's' : ''}</span>
            {filteredCount !== totalCount && (
              <span>({totalCount} au total)</span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-8 px-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="ml-1">Actualiser</span>
            </Button>
          </div>
        </div>
        <ExportActions />
      </div>

      {/* Filter Status */}
      {state.selectedEventId && (
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Filtres actifs:</span>
            <Badge variant="default">
              📅 {state.evenements.find(e => e.id === state.selectedEventId)?.nom}
            </Badge>
          </div>
        </Card>
      )}

      <Card className="p-0 overflow-hidden">
        {state.loading.ventes ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Chargement de l'historique...</span>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">Heure</TableHead>
                <TableHead className="w-32">Total TTC</TableHead>
                <TableHead className="w-28">Mode</TableHead>
                <TableHead>Produits</TableHead>
                <TableHead className="w-48 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ventes.map((v) => (
                <VenteRow
                  key={v.id}
                  vente={v}
                  produits={state.produits}
                  onEdit={openEdit}
                  onDelete={onDelete}
                  isDeleting={deleting === v.id}
                />
              ))}
              {ventes.length === 0 && !state.loading.ventes && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground py-12"
                  >
                    <div className="space-y-2">
                      <div className="text-lg">📊 Aucune vente trouvée</div>
                      <div className="text-sm">
                        {!state.selectedEventId
                          ? "Sélectionnez un événement pour voir l'historique"
                          : "Aucune vente enregistrée pour les filtres sélectionnés"}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
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

export default memo(Historique);
