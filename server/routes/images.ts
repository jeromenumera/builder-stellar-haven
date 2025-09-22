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

    // Convert to Buffer for better serverless compatibility
    const buffer = Buffer.isBuffer(row.data) ? row.data : Buffer.from(row.data);

    res.setHeader("Content-Type", row.mime || "application/octet-stream");
    res.setHeader("Content-Length", buffer.length.toString());
    res.setHeader("Cache-Control", "public, max-age=31536000"); // Cache for 1 year
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    // For serverless, end the response properly
    res.writeHead(200, {
      "Content-Type": row.mime || "application/octet-stream",
      "Content-Length": buffer.length.toString(),
      "Cache-Control": "public, max-age=31536000",
      "Access-Control-Allow-Origin": "*"
    });

    return res.end(buffer, 'binary');
  } catch (e: any) {
    console.error("getImage error", e);
    return res.status(500).json({ error: e.message || String(e) });
  }
};
