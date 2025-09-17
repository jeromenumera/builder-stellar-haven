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
    let body: any = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }
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
    let body: any = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }
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
