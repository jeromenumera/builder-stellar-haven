import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types based on our schema
export interface DbProduit {
  id: string;
  nom: string;
  prix_ttc: number;
  tva: number;
  image_url: string | null;
  sku: string | null;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbEvenement {
  id: string;
  nom: string;
  date_debut: string;
  date_fin: string;
  lieu: string;
  statut: 'actif' | 'archivé';
  created_at: string;
  updated_at: string;
}

export interface DbVente {
  id: string;
  horodatage: string;
  evenement_id: string;
  mode_paiement: 'carte' | 'cash';
  total_ttc: number;
  total_ht: number;
  tva_totale: number;
  created_at: string;
}

export interface DbLigneVente {
  id: string;
  vente_id: string;
  produit_id: string;
  quantite: number;
  prix_unitaire_ttc: number;
  sous_total_ttc: number;
  tva_taux: number;
  created_at: string;
}
