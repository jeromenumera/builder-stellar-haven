import { RequestHandler } from "express";
import { query } from "../services/db";

function normalize(input: any) {
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
}

export const getPointsDeVente: RequestHandler = async (req, res) => {
  try {
    const { evenement_id } = req.query as { evenement_id?: string };
    if (evenement_id) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(evenement_id);
      if (!isUuid) return res.json([]);
      const { rows } = await query(
        `SELECT * FROM point_de_vente WHERE actif = true AND evenement_id = $1 ORDER BY nom`,
        [evenement_id]
      );
      return res.json(rows);
    }
    const { rows } = await query(
      `SELECT * FROM point_de_vente WHERE actif = true ORDER BY nom`
    );
    return res.json(rows);
  } catch (error: any) {
    console.error("Error fetching points_de_vente:", error);
    res.status(500).json({ error: error.message });
  }
};

export const createPointDeVente: RequestHandler = async (req, res) => {
  try {
    const body: any = normalize(req.body);
    const evenement_id = body?.evenement_id ?? body?.eventId;
    const nom = body?.nom ?? body?.name;
    const actif = typeof body?.actif === "boolean" ? body.actif : true;

    if (!evenement_id || !nom) {
      return res.status(400).json({ error: "Missing required fields: evenement_id, nom" });
    }

    const { rows } = await query(
      `INSERT INTO point_de_vente (evenement_id, nom, actif)
       VALUES ($1, $2, $3) RETURNING *`,
      [evenement_id, nom, actif]
    );
    return res.json(rows[0]);
  } catch (error: any) {
    console.error("Error creating point_de_vente:", error);
    res.status(500).json({ error: error.message });
  }
};

export const updatePointDeVente: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const body: any = normalize(req.body);
  const evenement_id = body?.evenement_id ?? body?.eventId ?? null;
  const nom = body?.nom ?? body?.name ?? null;
  const actif = typeof body?.actif === "boolean" ? body.actif : null;

  const { rows } = await query(
      `UPDATE point_de_vente
         SET evenement_id = COALESCE($2, evenement_id),
             nom = COALESCE($3, nom),
             actif = COALESCE($4, actif),
             updated_at = now()
       WHERE id = $1
       RETURNING *`,
      [id, evenement_id, nom, actif]
    );
    return res.json(rows[0]);
  } catch (error: any) {
    console.error("Error updating point_de_vente:", error);
    res.status(500).json({ error: error.message });
  }
};

export const deletePointDeVente: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    await query(`UPDATE point_de_vente SET actif=false WHERE id=$1`, [id]);
    return res.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting point_de_vente:", error);
    res.status(500).json({ error: error.message });
  }
};
