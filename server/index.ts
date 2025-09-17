import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleDbPing, handleDbInfo } from "./routes/neon";
import { getProducts, createProduct, updateProduct, deleteProduct } from "./routes/produits";
import { getEvents, createEvent, updateEvent, deleteEvent } from "./routes/evenements";
import { getSales, createSale, updateSale, deleteSale } from "./routes/ventes";
import { testSupabase } from "./routes/test";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

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

  return app;
}
