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
  filename = "rapport-ventes.pdf",
) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 50;
  const marginY = 50;
  let cursorY = marginY;

  // Colors
  const primaryColor = [37, 99, 235]; // Blue
  const secondaryColor = [75, 85, 99]; // Gray
  const accentColor = [16, 185, 129]; // Green
  const lightGray = [248, 250, 252];
  const darkGray = [51, 65, 85];

  const now = new Date();
  const evt = selectedEventId ? evenementsById[selectedEventId] : null;
  const pdv = selectedPointDeVenteId ? pointsById[selectedPointDeVenteId] : null;

  // Header Section with background
  doc.setFillColor(...lightGray);
  doc.rect(0, 0, pageWidth, 120, 'F');
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 8, 'F');

  // Organization name
  doc.setTextColor(...primaryColor);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("SOS MÉDITERRANÉE", marginX, cursorY + 35);

  // Report title
  const title = evt && pdv
    ? `Rapport de ventes — ${evt.nom}`
    : evt
    ? `Rapport de ventes — ${evt.nom}`
    : "Rapport de ventes";

  doc.setTextColor(...darkGray);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  cursorY += 65;
  doc.text(title, marginX, cursorY);

  // Subtitle with location and POS
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(...secondaryColor);
  cursorY += 20;

  if (evt) {
    const dateDebut = new Date(evt.date_debut).toLocaleDateString('fr-FR');
    const dateFin = evt.date_fin ? new Date(evt.date_fin).toLocaleDateString('fr-FR') : dateDebut;
    const dateRange = dateDebut === dateFin ? dateDebut : `${dateDebut} - ${dateFin}`;
    doc.text(`📅 ${dateRange} • 📍 ${evt.lieu}`, marginX, cursorY);
  } else {
    doc.text("📊 Tous événements", marginX, cursorY);
  }

  if (pdv) {
    cursorY += 15;
    doc.text(`🏪 Point de vente: ${pdv.nom}`, marginX, cursorY);
  }

  // Generation timestamp
  cursorY += 20;
  doc.setFontSize(10);
  doc.setTextColor(150);
  doc.text(`Généré le ${now.toLocaleDateString('fr-FR')} à ${now.toLocaleTimeString('fr-FR')}`, marginX, cursorY);

  const kpi: KPIResume = computeKPI(ventes, produitsById);
  cursorY += 40;

  // KPI Cards Section
  doc.setTextColor(...darkGray);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("📈 Indicateurs clés", marginX, cursorY);
  cursorY += 25;

  // Create KPI cards layout
  const cardWidth = (pageWidth - 2 * marginX - 20) / 3;
  const cardHeight = 80;
  const cardSpacing = 10;

  const kpiCards = [
    { label: "Chiffre d'affaires", value: `${kpi.ca_total.toFixed(2)} CHF`, color: accentColor, icon: "💰" },
    { label: "Nombre de ventes", value: kpi.nombre_ventes.toString(), color: primaryColor, icon: "🛒" },
    { label: "Ticket moyen", value: `${kpi.ticket_moyen.toFixed(2)} CHF`, color: secondaryColor, icon: "📊" }
  ];

  kpiCards.forEach((card, index) => {
    const x = marginX + index * (cardWidth + cardSpacing);

    // Card background
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x, cursorY, cardWidth, cardHeight, 5, 5, 'F');
    doc.setDrawColor(...card.color);
    doc.setLineWidth(2);
    doc.roundedRect(x, cursorY, cardWidth, cardHeight, 5, 5, 'S');

    // Card content
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...secondaryColor);
    doc.text(card.label, x + 15, cursorY + 25);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...card.color);
    doc.text(card.value, x + 15, cursorY + 45);

    // Icon
    doc.setFontSize(20);
    doc.text(card.icon, x + cardWidth - 35, cursorY + 45);
  });

  cursorY += cardHeight + 40;

  // Payment methods section
  autoTable(doc, {
    startY: cursorY,
    head: [["💳 Mode de paiement", "Montant (CHF)", "Pourcentage"]],
    body: [
      [
        "Carte bancaire",
        `${kpi.par_mode_paiement.carte.toFixed(2)}`,
        `${((kpi.par_mode_paiement.carte / kpi.ca_total) * 100).toFixed(1)}%`
      ],
      [
        "Espèces",
        `${kpi.par_mode_paiement.cash.toFixed(2)}`,
        `${((kpi.par_mode_paiement.cash / kpi.ca_total) * 100).toFixed(1)}%`
      ],
    ],
    styles: {
      fontSize: 11,
      cellPadding: 8,
      lineColor: [220, 220, 220],
      lineWidth: 0.5
    },
    headStyles: {
      fillColor: [...primaryColor],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 12
    },
    alternateRowStyles: {
      fillColor: [...lightGray]
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { halign: 'right', fontStyle: 'bold' },
      2: { halign: 'center' }
    },
    theme: 'grid',
    margin: { left: marginX, right: marginX }
  });

  // Products section
  const productStartY = (doc as any).lastAutoTable.finalY + 30;

  autoTable(doc, {
    startY: productStartY,
    head: [["🛍️ Produit", "Quantité", "Prix unitaire", "Total (CHF)"]],
    body: kpi.par_produit.map((x) => [
      x.produit?.nom || "Produit inconnu",
      x.quantite.toString(),
      `${(x.ca / x.quantite).toFixed(2)} CHF`,
      `${x.ca.toFixed(2)}`
    ]),
    styles: {
      fontSize: 10,
      cellPadding: 6,
      lineColor: [220, 220, 220],
      lineWidth: 0.5
    },
    headStyles: {
      fillColor: [...accentColor],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 11
    },
    alternateRowStyles: {
      fillColor: [...lightGray]
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { halign: 'center' },
      2: { halign: 'right' },
      3: { halign: 'right', fontStyle: 'bold' }
    },
    theme: 'grid',
    margin: { left: marginX, right: marginX }
  });

  // Footer
  const footerY = pageHeight - 40;
  doc.setFillColor(...primaryColor);
  doc.rect(0, footerY, pageWidth, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("SOS MÉDITERRANÉE - Rapport automatisé", marginX, footerY + 25);

  const pageNum = `Page 1`;
  const pageNumWidth = doc.getTextWidth(pageNum);
  doc.text(pageNum, pageWidth - marginX - pageNumWidth, footerY + 25);

  doc.save(filename);
}
