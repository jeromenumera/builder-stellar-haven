import { RequestHandler } from "express";
import { query } from "../services/db";
import { convertProduitFromDb } from "../services/converters";

export const getProducts: RequestHandler = async (req, res) => {
  try {
    const q: any = req.query || {};
    const eventId = q.evenement_id || q.eventId || q.event_id || null;

    // Admin mode: return all active products with associated events
    if (!eventId) {
      const { rows } = await query(
        `SELECT
           p.id, p.nom, p.prix_ttc, p.tva, p.image_url, p.sku,
           COALESCE(
             json_agg(
               jsonb_build_object(
                 'id', e.id,
                 'nom', e.nom,
                 'date_debut', e.date_debut,
                 'date_fin', e.date_fin,
                 'lieu', e.lieu,
                 'statut', e.statut
               )
               ORDER BY e.nom
             ) FILTER (WHERE e.id IS NOT NULL),
             '[]'
           ) AS evenements
         FROM produits p
         LEFT JOIN produit_evenement pe ON pe.produit_id = p.id
         LEFT JOIN evenements e ON e.id = pe.evenement_id
         WHERE p.actif = true
         GROUP BY p.id, p.nom, p.prix_ttc, p.tva, p.image_url, p.sku
         ORDER BY p.nom`,
      );
      const products = rows.map(convertProduitFromDb);
      return res.json(products);
    }

    // Filter by event: return products assigned to this event
    const params: any[] = [eventId];
    const { rows } = await query(
      `SELECT p.id, p.nom, p.prix_ttc, p.tva, p.image_url, p.sku
       FROM produits p
       JOIN produit_evenement pe ON pe.produit_id = p.id
       WHERE pe.evenement_id = $1 AND p.actif = true
       ORDER BY p.nom`,
      params,
    );
    const products = rows.map(convertProduitFromDb);
    return res.json(products);
  } catch (error: any) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: error.message });
  }
};

export const createProduct: RequestHandler = async (req, res) => {
  try {
    const normalize = (input: any) => {
      let b: any = input;
      if (typeof b === "string") {
        try {
          b = JSON.parse(b);
        } catch {
          b = {};
        }
      }
      if (b && typeof b === "object" && typeof b.body === "string") {
        try {
          const inner = JSON.parse(b.body);
          if (inner && typeof inner === "object") b = inner;
        } catch {}
      }
      if (
        b &&
        typeof b === "object" &&
        (Buffer.isBuffer?.(b) || b instanceof Uint8Array)
      ) {
        try {
          const s = Buffer.isBuffer?.(b)
            ? (b as Buffer).toString("utf8")
            : new TextDecoder().decode(b as Uint8Array);
          b = JSON.parse(s);
        } catch {}
      }
      if (b && typeof b === "object" && !Array.isArray(b)) {
        const keys = Object.keys(b);
        if (
          keys.length > 0 &&
          keys.every(
            (k) => /^\d+$/.test(k) && typeof (b as any)[k] === "string",
          )
        ) {
          try {
            const s = keys
              .map((k) => parseInt(k, 10))
              .sort((a, c) => a - c)
              .map((i) => (b as any)[String(i)])
              .join("");
            const parsed = JSON.parse(s);
            if (parsed && typeof parsed === "object") b = parsed;
          } catch {}
        }
      }
      return b || {};
    };
    let body: any = normalize(req.body);
    const nom = body?.nom ?? body?.name;
    const prix_ttc = parseFloat(body?.prix_ttc ?? body?.priceTTC);
    const tva = parseFloat(body?.tva ?? body?.taxRate ?? 0);
    const image_url = body?.image_url ?? body?.imageUrl ?? null;
    const sku = body?.sku ?? null;
    const eventIds: string[] = Array.isArray(body?.eventIds)
      ? body.eventIds
      : [];

    if (!nom || !Number.isFinite(prix_ttc)) {
      return res.status(400).json({
        error: "Missing required fields: nom, prix_ttc",
        received: body,
      });
    }

    const { rows } = await query(
      `INSERT INTO produits (nom, prix_ttc, tva, image_url, sku, actif)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING *`,
      [nom, prix_ttc, tva, image_url, sku],
    );

    const prod = rows[0];
    if (eventIds.length > 0) {
      await query(
        `INSERT INTO produit_evenement (produit_id, evenement_id)
         VALUES ${eventIds.map((_, i) => `($1, $${i + 2})`).join(",")}
         ON CONFLICT (produit_id, evenement_id) DO NOTHING`,
        [prod.id, ...eventIds],
      );
    }

    const product = convertProduitFromDb(prod);
    res.json(product);
  } catch (error: any) {
    console.error("Error creating product:", error);
    res.status(500).json({ error: error.message });
  }
};

export const updateProduct: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const normalize = (input: any) => {
      let b: any = input;
      if (typeof b === "string") {
        try {
          b = JSON.parse(b);
        } catch {
          b = {};
        }
      }
      if (b && typeof b === "object" && typeof b.body === "string") {
        try {
          const inner = JSON.parse(b.body);
          if (inner && typeof inner === "object") b = inner;
        } catch {}
      }
      if (
        b &&
        typeof b === "object" &&
        (Buffer.isBuffer?.(b) || b instanceof Uint8Array)
      ) {
        try {
          const s = Buffer.isBuffer?.(b)
            ? (b as Buffer).toString("utf8")
            : new TextDecoder().decode(b as Uint8Array);
          b = JSON.parse(s);
        } catch {}
      }
      if (b && typeof b === "object" && !Array.isArray(b)) {
        const keys = Object.keys(b);
        if (
          keys.length > 0 &&
          keys.every(
            (k) => /^\d+$/.test(k) && typeof (b as any)[k] === "string",
          )
        ) {
          try {
            const s = keys
              .map((k) => parseInt(k, 10))
              .sort((a, c) => a - c)
              .map((i) => (b as any)[String(i)])
              .join("");
            const parsed = JSON.parse(s);
            if (parsed && typeof parsed === "object") b = parsed;
          } catch {}
        }
      }
      return b || {};
    };
    let body: any = normalize(req.body);
    const nom = body?.nom ?? body?.name;
    const prix_ttc = parseFloat(body?.prix_ttc ?? body?.priceTTC);
    const tva = parseFloat(body?.tva ?? body?.taxRate ?? 0);
    const image_url = body?.image_url ?? body?.imageUrl ?? null;
    const sku = body?.sku ?? null;
    const eventIds: string[] | undefined = Array.isArray(body?.eventIds)
      ? (body.eventIds as string[])
      : undefined;

    const { rows } = await query(
      `UPDATE produits SET nom=$2, prix_ttc=$3, tva=$4, image_url=$5, sku=$6
       WHERE id=$1 RETURNING *`,
      [id, nom, prix_ttc, tva, image_url, sku],
    );

    if (eventIds !== undefined) {
      await query(`DELETE FROM produit_evenement WHERE produit_id=$1`, [id]);
      if (eventIds.length > 0) {
        await query(
          `INSERT INTO produit_evenement (produit_id, evenement_id)
           VALUES ${eventIds.map((_, i) => `($1, $${i + 2})`).join(",")}
           ON CONFLICT (produit_id, evenement_id) DO NOTHING`,
          [id, ...eventIds],
        );
      }
    }

    const product = convertProduitFromDb(rows[0]);
    res.json(product);
  } catch (error: any) {
    console.error("Error updating product:", error);
    res.status(500).json({ error: error.message });
  }
};

export const deleteProduct: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    await query(`UPDATE produits SET actif=false WHERE id=$1`, [id]);

    res.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting product:", error);
    res.status(500).json({ error: error.message });
  }
};

export const upsertProductOverride: RequestHandler = async (req, res) => {
  try {
    res.status(404).json({ error: "Product price overrides are no longer supported" });
  } catch (error: any) {
    console.error("Error in product override:", error);
    res.status(500).json({ error: error.message });
  }
};
