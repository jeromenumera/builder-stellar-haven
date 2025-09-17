import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
// Prefer service role on the server (never expose to client). Fallback to anon key if not provided.
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables on server");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Helper functions for data conversion
export function convertProduitFromDb(dbProduit: any) {
  const prix = parseFloat(dbProduit.prix_ttc);
  const tva = parseFloat(dbProduit.tva);
  return {
    id: dbProduit.id,
    nom: dbProduit.nom,
    prix_ttc: Number.isFinite(prix) ? prix : 0,
    tva: Number.isFinite(tva) ? tva : 0,
    image_url: dbProduit.image_url || "",
    sku: dbProduit.sku || "",
  };
}

export function convertEvenementFromDb(dbEvenement: any) {
  return {
    id: dbEvenement.id,
    nom: dbEvenement.nom,
    date_debut: dbEvenement.date_debut,
    date_fin: dbEvenement.date_fin,
    lieu: dbEvenement.lieu,
    statut: dbEvenement.statut,
  };
}

export function convertVenteFromDb(dbVente: any, lignes: any[] = []) {
  return {
    id: dbVente.id,
    horodatage: dbVente.horodatage,
    evenement_id: dbVente.evenement_id,
    mode_paiement: dbVente.mode_paiement,
    total_ttc: parseFloat(dbVente.total_ttc),
    total_ht: parseFloat(dbVente.total_ht),
    tva_totale: parseFloat(dbVente.tva_totale),
    lignes: lignes.map((ligne) => ({
      id: ligne.id,
      vente_id: ligne.vente_id,
      produit_id: ligne.produit_id,
      quantite: ligne.quantite,
      prix_unitaire_ttc: parseFloat(ligne.prix_unitaire_ttc),
      sous_total_ttc: parseFloat(ligne.sous_total_ttc),
      tva_taux: parseFloat(ligne.tva_taux),
    })),
  };
}
