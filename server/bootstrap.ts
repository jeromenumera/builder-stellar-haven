import { query } from "./services/db";

export async function ensurePdvSchema() {
  try {
    await query(
      `DO $$
      BEGIN
        PERFORM 1 FROM pg_extension WHERE extname = 'pgcrypto';
        IF NOT FOUND THEN
          CREATE EXTENSION pgcrypto;
        END IF;
      END$$;`
    );
  } catch {}
  await query(
    `CREATE TABLE IF NOT EXISTS point_de_vente (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      evenement_id uuid NOT NULL REFERENCES evenements(id) ON DELETE CASCADE,
      nom text NOT NULL,
      actif boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );`
  );
  await query(
    `CREATE TABLE IF NOT EXISTS produit_point_de_vente (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      produit_id uuid NOT NULL REFERENCES produits(id) ON DELETE CASCADE,
      point_de_vente_id uuid NOT NULL REFERENCES point_de_vente(id) ON DELETE CASCADE,
      UNIQUE (produit_id, point_de_vente_id)
    );`
  );
  await query(
    `ALTER TABLE ventes
       ADD COLUMN IF NOT EXISTS point_de_vente_id uuid REFERENCES point_de_vente(id);`
  );
}
