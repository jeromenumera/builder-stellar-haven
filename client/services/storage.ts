import { Evenement, Produit, Vente } from "@shared/api";

const LS_KEYS = {
  produits: "pos_produits",
  evenements: "pos_evenements",
  ventes: "pos_ventes",
  selectedEventId: "pos_selected_event_id",
} as const;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getProduits(): Produit[] {
  return read<Produit[]>(LS_KEYS.produits, []);
}

export function setProduits(list: Produit[]) {
  write(LS_KEYS.produits, list);
}

export function getEvenements(): Evenement[] {
  return read<Evenement[]>(LS_KEYS.evenements, []);
}

export function setEvenements(list: Evenement[]) {
  write(LS_KEYS.evenements, list);
}

export function getVentes(): Vente[] {
  return read<Vente[]>(LS_KEYS.ventes, []);
}

export function setVentes(list: Vente[]) {
  write(LS_KEYS.ventes, list);
}

export function getSelectedEventId(): string | null {
  return read<string | null>(LS_KEYS.selectedEventId, null);
}

export function setSelectedEventId(id: string | null) {
  write(LS_KEYS.selectedEventId, id);
}

// Seed minimal demo data if empty
export function seedIfEmpty(publicBase = "/") {
  const produits = getProduits();
  if (produits.length === 0) {
    const baseImg = `${publicBase}placeholder.svg`;
    setProduits([
      { id: "p1", nom: "T-shirt Noir", prix_ttc: 25, tva: 7.7, image_url: baseImg, sku: "TSHIRT-BLACK" },
      { id: "p2", nom: "Tote Bag", prix_ttc: 12, tva: 7.7, image_url: baseImg, sku: "TOTE" },
      { id: "p3", nom: "Casquette", prix_ttc: 20, tva: 7.7, image_url: baseImg, sku: "CAP" },
      { id: "p4", nom: "Affiche A3", prix_ttc: 8, tva: 2.5, image_url: baseImg, sku: "POSTER-A3" },
      { id: "p5", nom: "Sticker Pack", prix_ttc: 5, tva: 7.7, image_url: baseImg, sku: "STICKERS" },
      { id: "p6", nom: "Vinyle", prix_ttc: 30, tva: 2.5, image_url: baseImg, sku: "VINYL" },
    ]);
  }

  const evts = getEvenements();
  if (evts.length === 0) {
    const today = new Date();
    const iso = (d: Date) => d.toISOString().slice(0, 10);
    setEvenements([
      { id: "e1", nom: "Festival Été", date_debut: iso(today), date_fin: iso(today), lieu: "Lausanne", statut: "actif" },
      { id: "e2", nom: "Marché de Noël", date_debut: `${new Date().getFullYear()}-12-01`, date_fin: `${new Date().getFullYear()}-12-24`, lieu: "Genève", statut: "archivé" },
    ]);
  }

  const ventes = getVentes();
  if (ventes.length === 0) setVentes([]);
}
