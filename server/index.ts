import "dotenv/config";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { handleDemo } from "./routes/demo";
import { handleDbPing, handleDbInfo } from "./routes/neon";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  upsertProductOverride,
} from "./routes/produits";
import {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} from "./routes/evenements";
import { getSales, createSale, updateSale, deleteSale } from "./routes/ventes";
import { echo } from "./routes/echo";
import { uploadImage, getImage } from "./routes/images";
import { debugImages, testDbConnection } from "./routes/debug";

import { ensurePdvSchema } from "./bootstrap";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  // Use Express built-in JSON parser for broader compatibility in serverless envs
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
  // Fallback: if body came through as a plain string, try to parse JSON
  app.use((req, _res, next) => {
    if (typeof req.body === "string") {
      try {
        req.body = JSON.parse(req.body);
      } catch {
        // keep as string
      }
    }
    next();
  });

  // Ensure DB schema
  (async () => {
    try {
      await ensurePdvSchema();
    } catch (e) {
      console.error("Schema init error", e);
    }
  })();

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Neon/Postgres readiness endpoints
  app.get("/api/db/ping", handleDbPing);
  app.get("/api/db/info", handleDbInfo);

  // Products API
  app.get("/api/produits", getProducts);
  app.post("/api/produits", createProduct);
  app.put("/api/produits/:id", updateProduct);
  app.delete("/api/produits/:id", deleteProduct);
  app.post("/api/produits/:id/override", upsertProductOverride);

  // Events API
  app.get("/api/evenements", getEvents);
  app.post("/api/evenements", createEvent);
  app.put("/api/evenements/:id", updateEvent);
  app.delete("/api/evenements/:id", deleteEvent);

  // Sales API
  app.get("/api/ventes", getSales);
  app.post("/api/ventes", createSale);
  app.put("/api/ventes/:id", updateSale);
  app.delete("/api/ventes/:id", deleteSale);

  // Image upload/serve
  app.post("/api/upload-image", uploadImage);
  app.get("/api/image/:id", getImage);

  // Debug endpoints
  app.get("/api/debug/images", debugImages);
  app.get("/api/debug/db", testDbConnection);

  // Test API
  app.all("/api/echo", echo);

  return app;
}
