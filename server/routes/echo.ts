import { RequestHandler } from 'express';

export const echo: RequestHandler = async (req, res) => {
  try {
    let body: any = req.body;
    const originalType = typeof body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch {}
    }
    res.json({
      ok: true,
      method: req.method,
      headers: req.headers,
      body,
      originalType,
    });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
}
