import { Evenement, Produit, Vente, PointDeVente } from "@shared/api";

function escapeCSV(val: unknown): string {
  const s = String(val ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function exportCSV(
  ventes: Vente[],
  evenementsById: Record<string, Evenement>,
  produitsById: Record<string, Produit>,
  pointsById: Record<string, PointDeVente>,
  filename = "ventes.csv",
) {
  const headers = [
    "sale_id",
    "date_iso",
    "event",
    "point_de_vente",
    "payment_method",
    "product_name",
    "sku",
    "quantity",
    "unit_price_ttc",
    "sub_total_ttc",
    "tax_rate",
  ];

  const rows: string[] = [headers.join(",")];
  for (const v of ventes) {
    const evt = evenementsById[v.evenement_id];
    const pdv = v.point_de_vente_id ? pointsById[v.point_de_vente_id] : undefined;
    for (const l of v.lignes) {
      const p = produitsById[l.produit_id];
      rows.push(
        [
          v.id,
          v.horodatage,
          evt ? evt.nom : "",
          pdv ? pdv.nom : "",
          v.mode_paiement,
          p ? p.nom : l.produit_id,
          p?.sku ?? "",
          l.quantite,
          l.prix_unitaire_ttc.toFixed(2),
          l.sous_total_ttc.toFixed(2),
          (l.tva_taux ?? 0).toFixed(2),
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
