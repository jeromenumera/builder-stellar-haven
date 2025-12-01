import { Button } from "@/components/ui/button";
import { usePos } from "@/context/PosStore";
import { exportCSV } from "@/utils/exportCsv";
import { exportPDF } from "@/utils/exportPdf";

export function ExportActions() {
  const { state } = usePos();
  const produitsById = Object.fromEntries(
    state.produits.map((p) => [p.id, p] as const),
  );
  const evenementsById = Object.fromEntries(
    state.evenements.map((e) => [e.id, e] as const),
  );

  const ventesForScope = state.selectedEventId
    ? state.ventes.filter((v) => v.evenement_id === state.selectedEventId)
    : [];

  const disabled = ventesForScope.length === 0 || !state.selectedEventId;

  return (
    <div className="flex gap-2">
      <Button
        variant="secondary"
        disabled={disabled}
        onClick={() =>
          exportCSV(
            ventesForScope,
            evenementsById,
            produitsById,
            `ventes_${state.selectedEventId}.csv`,
          )
        }
      >
        Exporter CSV
      </Button>
      <Button
        disabled={disabled}
        onClick={() =>
          exportPDF(
            ventesForScope,
            evenementsById,
            produitsById,
            state.selectedEventId,
            `ventes_${state.selectedEventId}.pdf`,
          )
        }
      >
        Exporter PDF
      </Button>
    </div>
  );
}
