import { Evenement, Produit, Vente } from "@shared/api";

// API client functions for Supabase backend

export async function fetchProduits(): Promise<Produit[]> {
  try {
    const response = await fetch('/api/produits');
    if (!response.ok) throw new Error('Failed to fetch products');
    return await response.json();
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

export async function saveProduit(produit: Produit): Promise<Produit> {
  try {
    const isNew = !produit.id || produit.id.startsWith('prod_');
    const url = isNew ? '/api/produits' : `/api/produits/${produit.id}`;
    const method = isNew ? 'POST' : 'PUT';

    // Remove client-generated ID for new records
    const payload = isNew ? { ...produit, id: undefined } : produit;

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error('Failed to save product');
    return await response.json();
  } catch (error) {
    console.error('Error saving product:', error);
    throw error;
  }
}

export async function deleteProduit(id: string): Promise<void> {
  try {
    const response = await fetch(`/api/produits/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete product');
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
}

export async function fetchEvenements(): Promise<Evenement[]> {
  try {
    const response = await fetch('/api/evenements');
    if (!response.ok) throw new Error('Failed to fetch events');
    return await response.json();
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
}

export async function saveEvenement(evenement: Evenement): Promise<Evenement> {
  try {
    const isNew = !evenement.id || evenement.id.startsWith('evt_');
    const url = isNew ? '/api/evenements' : `/api/evenements/${evenement.id}`;
    const method = isNew ? 'POST' : 'PUT';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(evenement),
    });

    if (!response.ok) throw new Error('Failed to save event');
    return await response.json();
  } catch (error) {
    console.error('Error saving event:', error);
    throw error;
  }
}

export async function deleteEvenement(id: string): Promise<void> {
  try {
    const response = await fetch(`/api/evenements/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete event');
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
}

export async function fetchVentes(evenementId?: string): Promise<Vente[]> {
  try {
    const url = evenementId ? `/api/ventes?evenement_id=${evenementId}` : '/api/ventes';
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch sales');
    return await response.json();
  } catch (error) {
    console.error('Error fetching sales:', error);
    return [];
  }
}

export async function saveVente(vente: Vente): Promise<Vente> {
  try {
    const isNew = !vente.id || vente.id.startsWith('vente_');
    const url = isNew ? '/api/ventes' : `/api/ventes/${vente.id}`;
    const method = isNew ? 'POST' : 'PUT';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vente),
    });

    if (!response.ok) throw new Error('Failed to save sale');
    return await response.json();
  } catch (error) {
    console.error('Error saving sale:', error);
    throw error;
  }
}

export async function deleteVente(id: string): Promise<void> {
  try {
    const response = await fetch(`/api/ventes/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete sale');
  } catch (error) {
    console.error('Error deleting sale:', error);
    throw error;
  }
}

// Local storage fallback for selected event ID
const LS_SELECTED_EVENT = "pos_selected_event_id";

export function getSelectedEventId(): string | null {
  try {
    return localStorage.getItem(LS_SELECTED_EVENT);
  } catch {
    return null;
  }
}

export function setSelectedEventId(id: string | null) {
  try {
    if (id) {
      localStorage.setItem(LS_SELECTED_EVENT, id);
    } else {
      localStorage.removeItem(LS_SELECTED_EVENT);
    }
  } catch {
    // ignore localStorage errors
  }
}
