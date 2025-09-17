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

    const vente = await withTransaction(async (client) => {
      const inserted = await client.query(
        `INSERT INTO ventes (evenement_id, mode_paiement, total_ttc, total_ht, tva_totale)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [evenement_id, mode_paiement, total_ttc, total_ht, tva_totale]
      );
      const vd = inserted.rows[0];

      if (lignesData.length > 0) {
        const values: any[] = [];
        const params: string[] = [];
        lignesData.forEach((l, i) => {
          const base = i * 6;
          params.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`);
          values.push(vd.id, l.produit_id, l.quantite, l.prix_unitaire_ttc, l.sous_total_ttc, l.tva_taux);
        });
        await client.query(
          `INSERT INTO lignes_ventes (vente_id, produit_id, quantite, prix_unitaire_ttc, sous_total_ttc, tva_taux)
           VALUES ${params.join(',')}`,
          values
        );
      }
      return vd;
    });

    res.json(convertVenteFromDb(vente, lignesData));
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
    const mode_paiement = body?.mode_paiement ?? body?.paymentMethod ?? body?.modePaiement;
    const lignes = body?.lignes ?? body?.lines ?? [];

    const toPct = (v: any) => {
      const n = parseFloat(v);
      if (!Number.isFinite(n)) return 0;
      return n <= 1 ? n * 100 : n;
    };

    const lignesData = (lignes as any[]).map((ligne: any) => {
      const produit_id = ligne.produit_id ?? ligne.productId ?? ligne.produitId;
      const quantite = Number.parseInt(String(ligne.quantite ?? ligne.quantity), 10);
      const prix_unitaire_ttc = parseFloat(ligne.prix_unitaire_ttc ?? ligne.unitPriceTTC);
      const tva_taux = toPct(ligne.tva_taux ?? ligne.taxRate ?? 0);
      const sous_total_ttc = Number.isFinite(prix_unitaire_ttc) && Number.isFinite(quantite)
        ? Math.round(prix_unitaire_ttc * quantite * 100) / 100
        : NaN;
      return { produit_id, quantite, prix_unitaire_ttc, sous_total_ttc, tva_taux };
    });

    const total_ttc = Math.round(lignesData.reduce((s, l) => s + l.sous_total_ttc, 0) * 100) / 100;
    const total_ht = Math.round(lignesData.reduce((s, l) => s + (l.sous_total_ttc / (1 + (l.tva_taux || 0) / 100)), 0) * 100) / 100;
    const tva_totale = Math.round((total_ttc - total_ht) * 100) / 100;

    const vente = await withTransaction(async (client) => {
      const updated = await client.query(
        `UPDATE ventes SET mode_paiement=$2, total_ttc=$3, total_ht=$4, tva_totale=$5 WHERE id=$1 RETURNING *`,
        [id, mode_paiement, total_ttc, total_ht, tva_totale]
      );
      await client.query(`DELETE FROM lignes_ventes WHERE vente_id=$1`, [id]);

      if (lignesData.length > 0) {
        const values: any[] = [];
        const params: string[] = [];
        lignesData.forEach((l, i) => {
          const base = i * 6;
          params.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`);
          values.push(id, l.produit_id, l.quantite, l.prix_unitaire_ttc, l.sous_total_ttc, l.tva_taux);
        });
        await client.query(
          `INSERT INTO lignes_ventes (vente_id, produit_id, quantite, prix_unitaire_ttc, sous_total_ttc, tva_taux)
           VALUES ${params.join(',')}`,
          values
        );
      }
      return updated.rows[0];
    });

    res.json(convertVenteFromDb(vente, lignesData));
  } catch (error: any) {
    console.error("Error updating sale:", error);
    res.status(500).json({ error: error.message });
  }
};

export const deleteSale: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    await withTransaction(async (client) => {
      await client.query(`DELETE FROM lignes_ventes WHERE vente_id=$1`, [id]);
      await client.query(`DELETE FROM ventes WHERE id=$1`, [id]);
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting sale:", error);
    res.status(500).json({ error: error.message });
  }
};
