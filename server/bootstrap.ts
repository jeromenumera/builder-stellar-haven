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
      END$$;`,
    );
  } catch {}

  // Create produit_evenement join table
  await query(
    `CREATE TABLE IF NOT EXISTS produit_evenement (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      produit_id uuid NOT NULL REFERENCES produits(id) ON DELETE CASCADE,
      evenement_id uuid NOT NULL REFERENCES evenements(id) ON DELETE CASCADE,
      created_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (produit_id, evenement_id)
    );`,
  );

  // Create images table if not exists
  await query(
    `CREATE TABLE IF NOT EXISTS images (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      mime text NOT NULL,
      data bytea NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );`,
  );

  // Drop old PDV-related tables if they exist
  try {
    // First, remove the point_de_vente_id foreign key from ventes if it exists
    await query(
      `ALTER TABLE ventes DROP CONSTRAINT IF EXISTS ventes_point_de_vente_id_fkey;`,
    );
  } catch {}

  try {
    // Drop produit_point_de_vente if it exists
    await query(`DROP TABLE IF EXISTS produit_point_de_vente;`);
  } catch {}

  try {
    // Drop point_de_vente if it exists
    await query(`DROP TABLE IF EXISTS point_de_vente;`);
  } catch {}
}
