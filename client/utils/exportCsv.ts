import { Evenement, Produit, Vente } from "@shared/api";

function escapeCSV(val: unknown): string {
  const s = String(val ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function exportCSV(
  ventes: Vente[],
  evenementsById: Record<string, Evenement>,
  produitsById: Record<string, Produit>,
  filename = "ventes.csv",
) {
  const headers = [
    "vente_id",
    "date",
    "evenement",
    "mode_paiement",
    "produit",
    "quantite",
    "prix_unitaire_ttc",
    "sous_total_ttc",
  ];

  const rows: string[] = [headers.join(",")];
  for (const v of ventes) {
    const evt = evenementsById[v.evenement_id];
    for (const l of v.lignes) {
      const p = produitsById[l.produit_id];
      rows.push(
        [
          v.id,
          v.horodatage,
          evt ? evt.nom : "",
          v.mode_paiement,
          p ? p.nom : l.produit_id,
          l.quantite,
          l.prix_unitaire_ttc.toFixed(2),
          l.sous_total_ttc.toFixed(2),
        ]
          .map(escapeCSV)
          .join(","),
      );
    }
  }

  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
