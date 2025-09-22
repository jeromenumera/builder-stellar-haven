import type { RequestHandler } from "express";
import { query } from "../services/db";
import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const uploadImage: RequestHandler = (req, res, next) => {
  // Use multer to parse a single file field named "file"
  (upload.single("file") as any)(req, res, async (err: any) => {
    if (err) {
      console.error("Multer upload error:", err);
      return res.status(400).json({ error: err.message || "Upload error" });
    }
    try {
      const f = (req as any).file as Express.Multer.File | undefined;
      if (!f) {
        console.error("No file provided in upload request");
        return res.status(400).json({ error: "Missing file" });
      }

      console.log(`Uploading image: ${f.originalname}, size: ${f.size}, mime: ${f.mimetype}`);

      const mime = f.mimetype || "application/octet-stream";
      const data = f.buffer; // Buffer
      const { rows } = await query(
        `INSERT INTO images (mime, data) VALUES ($1, $2) RETURNING id`,
        [mime, data],
      );
      const id = rows[0]?.id;

      console.log(`Image uploaded successfully with ID: ${id}`);
      return res.json({ id, url: `/api/image/${id}` });
    } catch (e: any) {
      console.error("uploadImage error", e);
      return res.status(500).json({ error: e.message || String(e) });
    }
  });
};

export const getImage: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Fetching image with ID: ${id}`);

    const { rows } = await query(`SELECT mime, data FROM images WHERE id=$1`, [
      id,
    ]);

    if (!rows || rows.length === 0) {
      console.log(`Image not found for ID: ${id}`);
      return res.status(404).json({ error: "Not found" });
    }

    const row = rows[0];
    console.log(`Found image: mime=${row.mime}, data size=${row.data?.length || 0} bytes`);

    // Ensure we have a proper Buffer
    const buffer = Buffer.isBuffer(row.data) ? row.data : Buffer.from(row.data);

    // Set headers using Express methods
    res.setHeader("Content-Type", row.mime || "application/octet-stream");
    res.setHeader("Cache-Control", "public, max-age=31536000");
    res.setHeader("Access-Control-Allow-Origin", "*");

    // Send the buffer directly - Express will handle the rest
    return res.send(buffer);
  } catch (e: any) {
    console.error("getImage error", e);
    return res.status(500).json({ error: e.message || String(e) });
  }
};
