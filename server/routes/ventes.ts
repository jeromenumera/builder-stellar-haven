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
    const { evenement_id, mode_paiement, total_ttc, total_ht, tva_totale, lignes } = req.body || {};

    // Basic request logging for diagnostics
    console.log('createSale payload', {
      has_evenement_id: Boolean(evenement_id),
      mode_paiement,
      total_ttc,
      total_ht,
      tva_totale,
      lignes_count: Array.isArray(lignes) ? lignes.length : 0,
    });

    // Validate required fields
    const missing: string[] = [];
    if (!evenement_id) missing.push('evenement_id');
    if (!mode_paiement) missing.push('mode_paiement');
    if (total_ttc === undefined) missing.push('total_ttc');
    if (total_ht === undefined) missing.push('total_ht');
    if (tva_totale === undefined) missing.push('tva_totale');
    if (missing.length > 0) {
      return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}`, missing });
    }

    if (!lignes || !Array.isArray(lignes) || lignes.length === 0) {
      return res.status(400).json({ error: 'Missing or empty lignes array', missing: ['lignes'] });
    }

    // Validate numeric values
    const n_total_ttc = parseFloat(total_ttc);
    const n_total_ht = parseFloat(total_ht);
    const n_tva_totale = parseFloat(tva_totale);
    const invalids: string[] = [];
    if (!Number.isFinite(n_total_ttc)) invalids.push('total_ttc');
    if (!Number.isFinite(n_total_ht)) invalids.push('total_ht');
    if (!Number.isFinite(n_tva_totale)) invalids.push('tva_totale');

    const lignesData = lignes.map((ligne: any, idx: number) => {
      const q = parseInt(ligne.quantite, 10);
      const puttc = parseFloat(ligne.prix_unitaire_ttc);
      const st = parseFloat(ligne.sous_total_ttc);
      const tva = parseFloat(ligne.tva_taux);
      if (!Number.isFinite(q) || q <= 0) invalids.push(`lignes[${idx}].quantite`);
      if (!Number.isFinite(puttc)) invalids.push(`lignes[${idx}].prix_unitaire_ttc`);
      if (!Number.isFinite(st)) invalids.push(`lignes[${idx}].sous_total_ttc`);
      if (!Number.isFinite(tva)) invalids.push(`lignes[${idx}].tva_taux`);
      return {
        vente_id: undefined,
        produit_id: ligne.produit_id,
        quantite: q,
        prix_unitaire_ttc: puttc,
        sous_total_ttc: st,
        tva_taux: tva,
      };
    });

    if (invalids.length > 0) {
      return res.status(400).json({ error: `Invalid numeric values: ${invalids.join(', ')}`, fields: invalids });
    }

    // Insert sale record
    const { data: venteData, error: venteError } = await supabase
      .from('ventes')
      .insert({
        evenement_id,
        mode_paiement,
        total_ttc: n_total_ttc,
        total_ht: n_total_ht,
        tva_totale: n_tva_totale,
      })
      .select()
      .single();

    if (venteError) throw venteError;

    // Insert sale lines
    const lignesToInsert = lignesData.map((l: any) => ({
      ...l,
      vente_id: venteData.id,
    }));

    const { data: lignesInserted, error: lignesError } = await supabase
      .from('lignes_ventes')
      .insert(lignesToInsert)
      .select();

    if (lignesError) throw lignesError;

    const sale = convertVenteFromDb(venteData, lignesInserted);
    res.json(sale);
  } catch (error: any) {
    console.error('Error creating sale:', error);
    const msg = error?.message || String(error);
    // If Supabase returns a 400-like error, surface as 400
    if (msg && /invalid|bad request|constraint|syntax/i.test(msg)) {
      return res.status(400).json({ error: msg });
    }
    res.status(500).json({ error: msg });
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
