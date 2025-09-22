import { RequestHandler } from "express";
import { query } from "../services/db";
import { convertProduitFromDb } from "../services/converters";

export const getProducts: RequestHandler = async (req, res) => {
  try {
    const q: any = req.query || {};
    const eventId = q.evenement_id || q.eventId || q.event_id || null;
    const pdvId =
      q.point_de_vente_id || q.pointOfSaleId || q.point_of_sale_id || null;

    // Admin mode: no PDV filter -> return all active products with associated PDV info
    if (!pdvId) {
      // detect PDV table name (singular/plural)
      const t = await query(
        `SELECT to_regclass('public.point_de_vente') AS s, to_regclass('public.points_de_vente') AS p`,
      );
      const row = (t.rows && t.rows[0]) || {};
      const pdvTable = row.s
        ? "point_de_vente"
        : row.p
          ? "points_de_vente"
          : null;
      if (!pdvTable)
        return res
          .status(500)
          .json({ error: "PDV table missing (point_de_vente/points_de_vente)" });

      const { rows } = await query(
        `SELECT
           p.id, p.nom, p.prix_ttc, p.tva, p.image_url, p.sku,
           COALESCE(
             json_agg(
               jsonb_build_object(
                 'id', pdv.id,
                 'nom', pdv.nom,
                 'evenement_id', pdv.evenement_id,
                 'actif', pdv.actif
               )
               ORDER BY pdv.nom
             ) FILTER (WHERE pdv.id IS NOT NULL),
             '[]'
           ) AS points_de_vente
         FROM produits p
         LEFT JOIN produit_point_de_vente ppv ON ppv.produit_id = p.id
         LEFT JOIN ${pdvTable} pdv ON pdv.id = ppv.point_de_vente_id
         WHERE p.actif = true
         GROUP BY p.id, p.nom, p.prix_ttc, p.tva, p.image_url, p.sku
         ORDER BY p.nom`,
      );
      const products = rows.map(convertProduitFromDb);
      return res.json(products);
    }

    const params: any[] = [pdvId];
    let where = "ppv.point_de_vente_id = $1 AND p.actif = true";
    // Remove event filtering for products - products should be available regardless of event
    // detect PDV table name (singular/plural)
    const t = await query(
      `SELECT to_regclass('public.point_de_vente') AS s, to_regclass('public.points_de_vente') AS p`,
    );
    const row = (t.rows && t.rows[0]) || {};
    const pdvTable = row.s
      ? "point_de_vente"
      : row.p
        ? "points_de_vente"
        : null;
    if (!pdvTable)
      return res
        .status(500)
        .json({ error: "PDV table missing (point_de_vente/points_de_vente)" });

    const { rows } = await query(
      `SELECT p.id, p.nom, p.prix_ttc, p.tva, p.image_url, p.sku
       FROM produits p
       JOIN produit_point_de_vente ppv ON ppv.produit_id = p.id
       JOIN ${pdvTable} pdv ON pdv.id = ppv.point_de_vente_id
       WHERE ${where}
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
    const pointOfSaleIds: string[] = Array.isArray(body?.pointOfSaleIds)
      ? body.pointOfSaleIds
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
    if (pointOfSaleIds.length > 0) {
      await query(
        `INSERT INTO produit_point_de_vente (produit_id, point_de_vente_id)
         VALUES ${pointOfSaleIds.map((_, i) => `($1, $${i + 2})`).join(",")}
         ON CONFLICT (produit_id, point_de_vente_id) DO NOTHING`,
        [prod.id, ...pointOfSaleIds],
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
    const pointOfSaleIds: string[] | undefined = Array.isArray(
      body?.pointOfSaleIds,
    )
      ? (body.pointOfSaleIds as string[])
      : undefined;

    const { rows } = await query(
      `UPDATE produits SET nom=$2, prix_ttc=$3, tva=$4, image_url=$5, sku=$6
       WHERE id=$1 RETURNING *`,
      [id, nom, prix_ttc, tva, image_url, sku],
    );

    if (pointOfSaleIds) {
      await query(`DELETE FROM produit_point_de_vente WHERE produit_id=$1`, [
        id,
      ]);
      if (pointOfSaleIds.length > 0) {
        await query(
          `INSERT INTO produit_point_de_vente (produit_id, point_de_vente_id)
           VALUES ${pointOfSaleIds.map((_, i) => `($1, $${i + 2})`).join(",")}
           ON CONFLICT (produit_id, point_de_vente_id) DO NOTHING`,
          [id, ...pointOfSaleIds],
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
    const { id } = req.params; // produit_id
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
    const body: any = normalize(req.body);
    const point_de_vente_id =
      body?.point_de_vente_id ?? body?.pointOfSaleId ?? null;
    const prix_ttc = body?.prix_ttc ?? body?.priceTTC;
    const prix = parseFloat(prix_ttc);

    if (!point_de_vente_id || !Number.isFinite(prix)) {
      return res
        .status(400)
        .json({
          error: "Missing required fields: point_de_vente_id, prix_ttc",
        });
    }

    await query(
      `INSERT INTO produit_point_de_vente (produit_id, point_de_vente_id, prix_ttc_override)
       VALUES ($1, $2, $3)
       ON CONFLICT (produit_id, point_de_vente_id)
       DO UPDATE SET prix_ttc_override = EXCLUDED.prix_ttc_override`,
      [id, point_de_vente_id, prix],
    );

    res.json({ success: true });
  } catch (error: any) {
    console.error("Error upserting product override:", error);
    res.status(500).json({ error: error.message });
  }
};
