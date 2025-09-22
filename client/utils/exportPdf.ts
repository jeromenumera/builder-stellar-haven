import { Evenement, KPIResume, Produit, Vente, computeKPI, PointDeVente } from "@shared/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function exportPDF(
  ventes: Vente[],
  evenementsById: Record<string, Evenement>,
  produitsById: Record<string, Produit>,
  pointsById: Record<string, PointDeVente>,
  selectedEventId: string | null,
  selectedPointDeVenteId: string | null,
  filename = "ventes.pdf",
) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const marginX = 40;
  let cursorY = 50;

  const now = new Date();
  const evt = selectedEventId ? evenementsById[selectedEventId] : null;
  const pdv = selectedPointDeVenteId ? pointsById[selectedPointDeVenteId] : null;
  const title = evt && pdv ? `Rapport — ${evt.nom} — ${pdv.nom}` : evt ? `Rapport — ${evt.nom}` : "Rapport des ventes";
  const subtitle = evt
    ? `${evt.date_debut} → ${evt.date_fin} — ${evt.lieu}`
    : "Tous événements";

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(title, marginX, cursorY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  cursorY += 20;
  doc.text(subtitle, marginX, cursorY);
  cursorY += 10;
  doc.setTextColor(120);
  doc.text(`Généré le ${now.toISOString()}`, marginX, cursorY);
  doc.setTextColor(0);

  const kpi: KPIResume = computeKPI(ventes, produitsById);

  // KPI section
  cursorY += 25;
  autoTable(doc, {
    startY: cursorY,
    styles: { fontSize: 12 },
    head: [["KPI", "Valeur"]],
    body: [
      ["CA total (TTC)", `${kpi.ca_total.toFixed(2)} CHF`],
      ["Nombre de ventes", `${kpi.nombre_ventes}`],
      ["Ticket moyen", `${kpi.ticket_moyen.toFixed(2)} CHF`],
    ],
    theme: "striped",
    headStyles: { fillColor: [30, 41, 59] },
  });

  // Totaux par mode de paiement
  autoTable(doc, {
    styles: { fontSize: 12 },
    startY: (doc as any).lastAutoTable.finalY + 18,
    head: [["Mode de paiement", "CA TTC"]],
    body: [
      ["Carte", `${kpi.par_mode_paiement.carte.toFixed(2)} CHF`],
      ["Cash", `${kpi.par_mode_paiement.cash.toFixed(2)} CHF`],
    ],
    theme: "striped",
    headStyles: { fillColor: [30, 41, 59] },
  });

  // Totaux par produit
  autoTable(doc, {
    styles: { fontSize: 12 },
    startY: (doc as any).lastAutoTable.finalY + 18,
    head: [["Produit", "Quantité", "CA TTC"]],
    body: kpi.par_produit.map((x) => [
      x.produit?.nom || "",
      String(x.quantite),
      `${x.ca.toFixed(2)} CHF`,
    ]),
    theme: "striped",
    headStyles: { fillColor: [30, 41, 59] },
  });

  doc.save(filename);
}
