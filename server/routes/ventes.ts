import { RequestHandler } from 'express';
import { supabase, convertVenteFromDb } from '../services/supabase';

export const getSales: RequestHandler = async (req, res) => {
  try {
    const { evenement_id } = req.query;

    let query = supabase
      .from('ventes')
      .select(`
        *,
        lignes_ventes (*)
      `)
      .order('horodatage', { ascending: false });

    if (evenement_id) {
      query = query.eq('evenement_id', evenement_id);
    }

    const { data, error } = await query;

    if (error) throw error;

    const sales = data.map(vente => convertVenteFromDb(vente, vente.lignes_ventes));
    res.json(sales);
  } catch (error: any) {
    console.error('Error fetching sales:', error);
    res.status(500).json({ error: error.message });
  }
};

export const createSale: RequestHandler = async (req, res) => {
  try {
    const { evenement_id, mode_paiement, total_ttc, total_ht, tva_totale, lignes } = req.body;

    // Validate required fields
    if (!evenement_id || !mode_paiement || total_ttc === undefined || total_ht === undefined || tva_totale === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Insert sale record
    const { data: venteData, error: venteError } = await supabase
      .from('ventes')
      .insert({
        evenement_id,
        mode_paiement,
        total_ttc: parseFloat(total_ttc),
        total_ht: parseFloat(total_ht),
        tva_totale: parseFloat(tva_totale),
      })
      .select()
      .single();

    if (venteError) throw venteError;

    // Insert sale lines
    const lignesData = lignes.map((ligne: any) => ({
      vente_id: venteData.id,
      produit_id: ligne.produit_id,
      quantite: ligne.quantite,
      prix_unitaire_ttc: parseFloat(ligne.prix_unitaire_ttc),
      sous_total_ttc: parseFloat(ligne.sous_total_ttc),
      tva_taux: parseFloat(ligne.tva_taux),
    }));

    const { data: lignesInserted, error: lignesError } = await supabase
      .from('lignes_ventes')
      .insert(lignesData)
      .select();

    if (lignesError) throw lignesError;

    const sale = convertVenteFromDb(venteData, lignesInserted);
    res.json(sale);
  } catch (error: any) {
    console.error('Error creating sale:', error);
    res.status(500).json({ error: error.message });
  }
};

export const updateSale: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { mode_paiement, total_ttc, total_ht, tva_totale, lignes } = req.body;

    // Update sale record
    const { data: venteData, error: venteError } = await supabase
      .from('ventes')
      .update({
        mode_paiement,
        total_ttc: parseFloat(total_ttc),
        total_ht: parseFloat(total_ht),
        tva_totale: parseFloat(tva_totale),
      })
      .eq('id', id)
      .select()
      .single();

    if (venteError) throw venteError;

    // Delete existing lines and insert new ones
    await supabase
      .from('lignes_ventes')
      .delete()
      .eq('vente_id', id);

    const lignesData = lignes.map((ligne: any) => ({
      vente_id: id,
      produit_id: ligne.produit_id,
      quantite: ligne.quantite,
      prix_unitaire_ttc: parseFloat(ligne.prix_unitaire_ttc),
      sous_total_ttc: parseFloat(ligne.sous_total_ttc),
      tva_taux: parseFloat(ligne.tva_taux),
    }));

    const { data: lignesInserted, error: lignesError } = await supabase
      .from('lignes_ventes')
      .insert(lignesData)
      .select();

    if (lignesError) throw lignesError;

    const sale = convertVenteFromDb(venteData, lignesInserted);
    res.json(sale);
  } catch (error: any) {
    console.error('Error updating sale:', error);
    res.status(500).json({ error: error.message });
  }
};

export const deleteSale: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    // Delete sale lines first (foreign key constraint)
    await supabase
      .from('lignes_ventes')
      .delete()
      .eq('vente_id', id);

    // Delete sale record
    const { error } = await supabase
      .from('ventes')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting sale:', error);
    res.status(500).json({ error: error.message });
  }
};
