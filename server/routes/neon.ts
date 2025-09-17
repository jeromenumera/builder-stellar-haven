import { RequestHandler } from "express";
import { testConnection } from "../services/db";

export const handleDbPing: RequestHandler = async (_req, res) => {
  const env = !!process.env.DATABASE_URL || !!process.env.NEON_DATABASE_URL;
  res.json({ ok: env });
};

export const handleDbInfo: RequestHandler = async (_req, res) => {
  const info = await testConnection();
  res.json(info);
};
