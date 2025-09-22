import type { RequestHandler } from "express";
import { query } from "../services/db";

export const debugImages: RequestHandler = async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT 
        id, 
        mime, 
        created_at,
        length(data) as data_size
      FROM images 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    return res.json({
      success: true,
      count: rows.length,
      images: rows.map(row => ({
        id: row.id,
        mime: row.mime,
        data_size: row.data_size,
        created_at: row.created_at,
        url: `/api/image/${row.id}`
      }))
    });
  } catch (e: any) {
    console.error("debugImages error", e);
    return res.status(500).json({ error: e.message || String(e) });
  }
};

export const testDbConnection: RequestHandler = async (req, res) => {
  try {
    const { rows } = await query("SELECT 1 as test, now() as time");
    return res.json({ 
      success: true, 
      database_connected: true,
      test_value: rows[0]?.test,
      server_time: rows[0]?.time
    });
  } catch (e: any) {
    console.error("testDbConnection error", e);
    return res.status(500).json({ 
      success: false,
      database_connected: false,
      error: e.message || String(e) 
    });
  }
};
