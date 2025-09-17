import { RequestHandler } from 'express';

export const debugVente: RequestHandler = async (req, res) => {
  console.log('=== DEBUG VENTE PAYLOAD ===');
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));
  console.log('Body size:', JSON.stringify(req.body).length);
  
  // Extract fields exactly like in createSale
  const { evenement_id, mode_paiement, total_ttc, total_ht, tva_totale, lignes } = req.body;
  
  console.log('Extracted fields:', {
    evenement_id,
    mode_paiement, 
    total_ttc,
    total_ht,
    tva_totale,
    lignes_count: lignes?.length
  });
  
  console.log('Field types:', {
    evenement_id: typeof evenement_id,
    mode_paiement: typeof mode_paiement,
    total_ttc: typeof total_ttc,
    total_ht: typeof total_ht,
    tva_totale: typeof tva_totale,
    lignes: typeof lignes
  });
  
  if (lignes && lignes.length > 0) {
    console.log('First ligne:', JSON.stringify(lignes[0], null, 2));
  }
  
  res.json({ 
    message: 'Debug data logged to console',
    extracted: { evenement_id, mode_paiement, total_ttc, total_ht, tva_totale, lignes_count: lignes?.length }
  });
};
