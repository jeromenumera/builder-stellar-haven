export function convertProduitFromDb(dbProduit: any) {
  const prix = parseFloat(dbProduit.prix_ttc);
  const tva = parseFloat(dbProduit.tva);
  return {
    id: String(dbProduit.id),
    nom: dbProduit.nom,
    prix_ttc: Number.isFinite(prix) ? prix : 0,
    tva: Number.isFinite(tva) ? tva : 0,
    image_url: dbProduit.image_url || '',
    sku: dbProduit.sku || '',
    points_de_vente: Array.isArray(dbProduit.points_de_vente) ? dbProduit.points_de_vente : [],
  };
}

export function convertEvenementFromDb(dbEvenement: any) {
  return {
    id: String(dbEvenement.id),
    nom: dbEvenement.nom,
    date_debut: dbEvenement.date_debut,
    date_fin: dbEvenement.date_fin,
    lieu: dbEvenement.lieu,
    statut: dbEvenement.statut,
  };
}

export function convertVenteFromDb(dbVente: any, lignes: any[] = []) {
  return {
    id: String(dbVente.id),
    horodatage: dbVente.horodatage,
    evenement_id: String(dbVente.evenement_id),
    point_de_vente_id: dbVente.point_de_vente_id ? String(dbVente.point_de_vente_id) : null,
    mode_paiement: dbVente.mode_paiement,
    total_ttc: parseFloat(dbVente.total_ttc),
    total_ht: parseFloat(dbVente.total_ht),
    tva_totale: parseFloat(dbVente.tva_totale),
    lignes: lignes.map((ligne) => ({
      id: String(ligne.id),
      vente_id: String(ligne.vente_id),
      produit_id: String(ligne.produit_id),
      quantite: Number(ligne.quantite),
      prix_unitaire_ttc: parseFloat(ligne.prix_unitaire_ttc),
      sous_total_ttc: parseFloat(ligne.sous_total_ttc),
      tva_taux: parseFloat(ligne.tva_taux),
    })),
  };
}
