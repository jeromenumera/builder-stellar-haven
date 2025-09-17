import { useMemo } from "react";
import { usePos } from "@/context/PosStore";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExportActions } from "@/components/exports/ExportActions";

export default function Historique() {
  const { state } = usePos();

  const ventes = useMemo(() => {
    return state.selectedEventId
      ? state.ventes.filter((v) => v.evenement_id === state.selectedEventId)
      : [];
  }, [state.ventes, state.selectedEventId]);

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
              <TableHead>ID</TableHead>
              <TableHead>Heure</TableHead>
              <TableHead>Total TTC</TableHead>
              <TableHead>Mode</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ventes.map((v) => (
              <TableRow key={v.id}>
                <TableCell className="font-mono text-xs">{v.id}</TableCell>
                <TableCell>{new Date(v.horodatage).toLocaleTimeString()}</TableCell>
                <TableCell className="font-semibold">{v.total_ttc.toFixed(2)} CHF</TableCell>
                <TableCell className="capitalize">{v.mode_paiement}</TableCell>
              </TableRow>
            ))}
            {ventes.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-10">
                  Aucun enregistrement pour l'événement sélectionné
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
