import { RequestHandler } from "express";
import { query, withTransaction } from "../services/db";
import { convertVenteFromDb } from "../services/converters";

export const getSales: RequestHandler = async (req, res) => {
  try {
    const { evenement_id } = req.query as { evenement_id?: string };
    const where = evenement_id ? 'WHERE v.evenement_id = $1' : '';
    const params: any[] = evenement_id ? [evenement_id] : [];
    const { rows } = await query(
      `SELECT v.*, COALESCE(json_agg(l.*) FILTER (WHERE l.id IS NOT NULL), '[]') AS lignes
       FROM ventes v
       LEFT JOIN lignes_ventes l ON l.vente_id = v.id
       ${where}
       GROUP BY v.id
       ORDER BY v.horodatage DESC`,
      params
    );
    const sales = rows.map((r: any) => convertVenteFromDb(r, r.lignes || []));
    res.json(sales);
  } catch (error: any) {
    console.error("Error fetching sales:", error);
    res.status(500).json({ error: error.message });
  }
};

export const createSale: RequestHandler = async (req, res) => {
  try {
    let body: any = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }
    // Accept snake_case and camelCase
    const evenement_id = body?.evenement_id ?? body?.eventId ?? body?.event_id;
    let mode_paiement: any =
      body?.mode_paiement ?? body?.paymentMethod ?? body?.modePaiement;
    if (mode_paiement === "card") mode_paiement = "carte";
    const lignesInput = body?.lignes ?? body?.lines;

    // Basic request logging for diagnostics
    console.log("createSale payload keys", Object.keys(body || {}));

    // Validate minimal fields
    const missing: string[] = [];
    if (!evenement_id) missing.push("evenement_id");
    if (!mode_paiement) missing.push("mode_paiement");
    if (!Array.isArray(lignesInput) || lignesInput.length === 0)
      missing.push("lignes");
    if (missing.length > 0) {
      const keys = body ? Object.keys(body) : [];
      return res
        .status(400)
        .json({
          error: `Missing required fields: ${missing.join(", ")}`,
          missing,
          keys,
          received: body,
        });
    }

    const toPct = (v: any) => {
      const n = parseFloat(v);
      if (!Number.isFinite(n)) return 0;
      return n <= 1 ? n * 100 : n;
    };

    const lignesData = (lignesInput as any[]).map((ligne: any, idx: number) => {
      const produit_id = ligne.produit_id ?? ligne.productId ?? ligne.produitId;
      const quantite = Number.parseInt(
        String(ligne.quantite ?? ligne.quantity),
        10,
      );
      const prix_unitaire_ttc = parseFloat(
        ligne.prix_unitaire_ttc ?? ligne.unitPriceTTC,
      );
      const tva_taux = toPct(ligne.tva_taux ?? ligne.taxRate ?? 0);
      const sous_total_ttc =
        Number.isFinite(prix_unitaire_ttc) && Number.isFinite(quantite)
          ? Math.round(prix_unitaire_ttc * quantite * 100) / 100
          : NaN;
      return {
        produit_id,
        quantite,
        prix_unitaire_ttc,
        sous_total_ttc,
        tva_taux,
      };
    });

    // Validate lines
    const invalids: string[] = [];
    for (let i = 0; i < lignesData.length; i++) {
      const l = lignesData[i];
      if (!l.produit_id) invalids.push(`lignes[${i}].produit_id`);
      if (!Number.isFinite(l.quantite) || l.quantite <= 0)
        invalids.push(`lignes[${i}].quantite`);
      if (!Number.isFinite(l.prix_unitaire_ttc))
        invalids.push(`lignes[${i}].prix_unitaire_ttc`);
      if (!Number.isFinite(l.sous_total_ttc))
        invalids.push(`lignes[${i}].sous_total_ttc`);
      if (!Number.isFinite(l.tva_taux)) invalids.push(`lignes[${i}].tva_taux`);
    }
    if (invalids.length > 0) {
      return res
        .status(400)
        .json({
          error: `Invalid numeric values: ${invalids.join(", ")}`,
          fields: invalids,
          received: body,
        });
    }

    // Compute totals server-side
    const total_ttc =
      Math.round(lignesData.reduce((s, l) => s + l.sous_total_ttc, 0) * 100) /
      100;
    const total_ht =
      Math.round(
        lignesData.reduce(
          (s, l) => s + l.sous_total_ttc / (1 + (l.tva_taux || 0) / 100),
          0,
        ) * 100,
      ) / 100;
    const tva_totale = Math.round((total_ttc - total_ht) * 100) / 100;

    // Insert sale record
    const { data: venteData, error: venteError } = await supabase
      .from("ventes")
      .insert({
        evenement_id,
        mode_paiement,
        total_ttc,
        total_ht,
        tva_totale,
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
      .from("lignes_ventes")
      .insert(lignesToInsert)
      .select();

    if (lignesError) throw lignesError;

    const sale = convertVenteFromDb(venteData, lignesInserted);
    res.json(sale);
  } catch (error: any) {
    console.error("Error creating sale:", error);
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
    let body: any = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }
    const { mode_paiement, total_ttc, total_ht, tva_totale, lignes } =
      body || {};

    // Update sale record
    const { data: venteData, error: venteError } = await supabase
      .from("ventes")
      .update({
        mode_paiement,
        total_ttc: parseFloat(total_ttc),
        total_ht: parseFloat(total_ht),
        tva_totale: parseFloat(tva_totale),
      })
      .eq("id", id)
      .select()
      .single();

    if (venteError) throw venteError;

    // Delete existing lines and insert new ones
    await supabase.from("lignes_ventes").delete().eq("vente_id", id);

    const lignesData = lignes.map((ligne: any) => ({
      vente_id: id,
      produit_id: ligne.produit_id,
      quantite: ligne.quantite,
      prix_unitaire_ttc: parseFloat(ligne.prix_unitaire_ttc),
      sous_total_ttc: parseFloat(ligne.sous_total_ttc),
      tva_taux: parseFloat(ligne.tva_taux),
    }));

    const { data: lignesInserted, error: lignesError } = await supabase
      .from("lignes_ventes")
      .insert(lignesData)
      .select();

    if (lignesError) throw lignesError;

    const sale = convertVenteFromDb(venteData, lignesInserted);
    res.json(sale);
  } catch (error: any) {
    console.error("Error updating sale:", error);
    res.status(500).json({ error: error.message });
  }
};

export const deleteSale: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    // Delete sale lines first (foreign key constraint)
    await supabase.from("lignes_ventes").delete().eq("vente_id", id);

    // Delete sale record
    const { error } = await supabase.from("ventes").delete().eq("id", id);

    if (error) throw error;

    res.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting sale:", error);
    res.status(500).json({ error: error.message });
  }
};
