import { RequestHandler } from "express";
import { query } from "../services/db";
import { convertProduitFromDb } from "../services/converters";

export const getProducts: RequestHandler = async (_req, res) => {
  try {
    const { rows } = await query(`SELECT * FROM produits WHERE actif = true ORDER BY nom`);
    const products = rows.map(convertProduitFromDb);
    res.json(products);
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
        try { b = JSON.parse(b); } catch { b = {}; }
      }
      if (b && typeof b === "object" && typeof b.body === "string") {
        try {
          const inner = JSON.parse(b.body);
          if (inner && typeof inner === "object") b = inner;
        } catch {}
      }
      if (b && typeof b === "object" && (Buffer.isBuffer?.(b) || b instanceof Uint8Array)) {
        try {
          const s = Buffer.isBuffer?.(b) ? (b as Buffer).toString("utf8") : new TextDecoder().decode(b as Uint8Array);
          b = JSON.parse(s);
        } catch {}
      }
      if (b && typeof b === "object" && !Array.isArray(b)) {
        const keys = Object.keys(b);
        if (keys.length > 0 && keys.every((k) => /^\d+$/.test(k) && typeof (b as any)[k] === "string")) {
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

    if (!nom || !Number.isFinite(prix_ttc)) {
      return res
        .status(400)
        .json({
          error: "Missing required fields: nom, prix_ttc",
          received: body,
        });
    }

    const { rows } = await query(
      `INSERT INTO produits (nom, prix_ttc, tva, image_url, sku, actif)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING *`,
      [nom, prix_ttc, tva, image_url, sku]
    );

    const product = convertProduitFromDb(rows[0]);
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
        try { b = JSON.parse(b); } catch { b = {}; }
      }
      if (b && typeof b === "object" && typeof b.body === "string") {
        try {
          const inner = JSON.parse(b.body);
          if (inner && typeof inner === "object") b = inner;
        } catch {}
      }
      if (b && typeof b === "object" && (Buffer.isBuffer?.(b) || b instanceof Uint8Array)) {
        try {
          const s = Buffer.isBuffer?.(b) ? (b as Buffer).toString("utf8") : new TextDecoder().decode(b as Uint8Array);
          b = JSON.parse(s);
        } catch {}
      }
      if (b && typeof b === "object" && !Array.isArray(b)) {
        const keys = Object.keys(b);
        if (keys.length > 0 && keys.every((k) => /^\d+$/.test(k) && typeof (b as any)[k] === "string")) {
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

    const { rows } = await query(
      `UPDATE produits SET nom=$2, prix_ttc=$3, tva=$4, image_url=$5, sku=$6
       WHERE id=$1 RETURNING *`,
      [id, nom, prix_ttc, tva, image_url, sku]
    );

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

    // Soft delete by setting actif to false
    await query(`UPDATE produits SET actif=false WHERE id=$1`, [id]);

    res.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting product:", error);
    res.status(500).json({ error: error.message });
  }
};
