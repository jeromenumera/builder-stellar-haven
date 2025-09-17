/**
 * Shared types and pure utilities for the Event POS (Caisse Événementielle)
 */

export type ModePaiement = "carte" | "cash";
export type StatutEvenement = "actif" | "archivé";

export interface Produit {
  id: string;
  nom: string;
  prix_ttc: number; // TTC price in currency units
  tva: number; // VAT rate as percentage, e.g. 2.5 or 7.7
  image_url: string;
  sku?: string | null;
}

export interface Evenement {
  id: string;
  nom: string;
  date_debut: string; // ISO date
  date_fin: string; // ISO date
  lieu: string;
  statut: StatutEvenement;
}

export interface LigneVente {
  id: string;
  vente_id: string;
  produit_id: string;
  quantite: number;
  prix_unitaire_ttc: number;
  sous_total_ttc: number;
  tva_taux: number; // percentage
}

export interface Vente {
  id: string;
  horodatage: string; // ISO timestamp
  evenement_id: string;
  mode_paiement: ModePaiement;
  total_ttc: number;
  total_ht: number;
  tva_totale: number;
  lignes: LigneVente[];
}

export interface CartItem {
  produit: Produit;
  quantite: number;
}

export interface KPIResume {
  ca_total: number; // total TTC
  nombre_ventes: number;
  ticket_moyen: number; // ca_total / nombre_ventes
  par_mode_paiement: Record<ModePaiement, number>;
  par_produit: { produit: Produit; quantite: number; ca: number }[];
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function computeHTfromTTC(ttc: number, tvaPct: number): number {
  const factor = 1 + (tvaPct || 0) / 100;
  if (factor <= 0) return ttc; // safeguard
  return ttc / factor;
}

export function buildLigneVente(
  venteId: string,
  produit: Produit,
  quantite: number,
): LigneVente {
  const sous_total_ttc = round2(produit.prix_ttc * quantite);
  return {
    id: `${venteId}-${produit.id}`,
    vente_id: venteId,
    produit_id: produit.id,
    quantite,
    prix_unitaire_ttc: produit.prix_ttc,
    sous_total_ttc,
    tva_taux: produit.tva,
  };
}

export function computeTotals(lignes: LigneVente[]): {
  total_ttc: number;
  total_ht: number;
  tva_totale: number;
} {
  const total_ttc = round2(lignes.reduce((s, l) => s + l.sous_total_ttc, 0));
  const total_ht = round2(
    lignes.reduce((s, l) => s + computeHTfromTTC(l.sous_total_ttc, l.tva_taux), 0),
  );
  const tva_totale = round2(total_ttc - total_ht);
  return { total_ttc, total_ht, tva_totale };
}

export function computeKPI(
  ventes: Vente[],
  produitsById: Record<string, Produit>,
): KPIResume {
  const ca_total = round2(ventes.reduce((s, v) => s + v.total_ttc, 0));
  const nombre_ventes = ventes.length;
  const ticket_moyen = round2(nombre_ventes ? ca_total / nombre_ventes : 0);

  const par_mode_paiement: Record<ModePaiement, number> = {
    carte: 0,
    cash: 0,
  };
  for (const v of ventes) {
    par_mode_paiement[v.mode_paiement] = round2(
      (par_mode_paiement[v.mode_paiement] || 0) + v.total_ttc,
    );
  }

  const agg: Record<string, { quantite: number; ca: number }> = {};
  for (const v of ventes) {
    for (const l of v.lignes) {
      if (!agg[l.produit_id]) agg[l.produit_id] = { quantite: 0, ca: 0 };
      agg[l.produit_id].quantite += l.quantite;
      agg[l.produit_id].ca = round2(agg[l.produit_id].ca + l.sous_total_ttc);
    }
  }
  const par_produit = Object.entries(agg).map(([pid, vals]) => ({
    produit: produitsById[pid],
    quantite: vals.quantite,
    ca: vals.ca,
  }));

  return { ca_total, nombre_ventes, ticket_moyen, par_mode_paiement, par_produit };
}

// keep DemoResponse for legacy demo route
export interface DemoResponse {
  message: string;
}
