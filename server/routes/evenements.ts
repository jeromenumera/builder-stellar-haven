import { RequestHandler } from "express";
import { query } from "../services/db";
import { convertEvenementFromDb } from "../services/converters";

export const getEvents: RequestHandler = async (_req, res) => {
  try {
    const { rows } = await query(`SELECT * FROM evenements ORDER BY date_debut DESC`);
    const events = rows.map(convertEvenementFromDb);
    res.json(events);
  } catch (error: any) {
    console.error("Error fetching events:", error);
    res.status(500).json({ error: error.message });
  }
};

export const createEvent: RequestHandler = async (req, res) => {
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
    const date_debut = body?.date_debut ?? body?.startDate;
    const date_fin = body?.date_fin ?? body?.endDate ?? null;
    const lieu = body?.lieu ?? body?.location ?? null;
    const statut =
      body?.statut ??
      (typeof body?.active === "boolean"
        ? body.active
          ? "actif"
          : "archivé"
        : "actif");

    if (!nom || !date_debut) {
      return res
        .status(400)
        .json({
          error: "Missing required fields: nom, date_debut",
          received: body,
        });
    }

    const { rows } = await query(
      `INSERT INTO evenements (nom, date_debut, date_fin, lieu, statut)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [nom, date_debut, date_fin, lieu, statut]
    );

    const event = convertEvenementFromDb(rows[0]);
    res.json(event);
  } catch (error: any) {
    console.error("Error creating event:", error);
    res.status(500).json({ error: error.message });
  }
};

export const updateEvent: RequestHandler = async (req, res) => {
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
    const date_debut = body?.date_debut ?? body?.startDate;
    const date_fin = body?.date_fin ?? body?.endDate ?? null;
    const lieu = body?.lieu ?? body?.location ?? null;
    const statut =
      body?.statut ??
      (typeof body?.active === "boolean"
        ? body.active
          ? "actif"
          : "archivé"
        : undefined);

    const { rows } = await query(
      `UPDATE evenements SET nom=$2, date_debut=$3, date_fin=$4, lieu=$5, statut=COALESCE($6, statut)
       WHERE id=$1 RETURNING *`,
      [id, nom, date_debut, date_fin, lieu, statut]
    );

    const event = convertEvenementFromDb(rows[0]);
    res.json(event);
  } catch (error: any) {
    console.error("Error updating event:", error);
    res.status(500).json({ error: error.message });
  }
};

export const deleteEvent: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    await query(`DELETE FROM evenements WHERE id=$1`, [id]);

    res.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting event:", error);
    res.status(500).json({ error: error.message });
  }
};
