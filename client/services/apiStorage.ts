import { Evenement, Produit, Vente, PointDeVente } from "@shared/api";

// API client functions for Supabase backend

export async function fetchProduits(
  eventId?: string,
  pointDeVenteId?: string,
): Promise<Produit[]> {
  try {
    const params = new URLSearchParams();
    if (eventId) params.set("evenement_id", eventId);
    if (pointDeVenteId) params.set("point_de_vente_id", pointDeVenteId);
    const qs = params.toString();
    const rel = `/api/produits${qs ? `?${qs}` : ""}`;
    const abs = `https://cash.sosmediterranee.ch${rel}`;

    const tryFetch = async (u: string, timeout = 10000) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(u, {
          credentials: "omit",
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        clearTimeout(timeoutId);
        return response;
      } catch (error) {
        return null;
      }
    };

    // Try local first with shorter timeout
    let response = await tryFetch(rel, 5000);

    // If local fails, try production with longer timeout
    if (!response || !response.ok) {
      response = await tryFetch(abs, 15000);
    }

    if (!response || !response.ok) {
      throw new Error("Failed to fetch products");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching products:", error);
    // Return empty array to prevent UI crashes, but log the error
    return [];
  }
}

export async function saveProduit(
  produit: Produit & { eventIds?: string[] },
): Promise<Produit> {
  try {
    const isNew = !produit.id || produit.id.startsWith("prod_");
    const url = isNew ? "/api/produits" : `/api/produits/${produit.id}`;
    const method = isNew ? "POST" : "PUT";

    // Prepare payload with proper field mapping for the API
    const payload = {
      id: isNew ? undefined : produit.id,
      nom: produit.nom,
      prix_ttc: produit.prix_ttc,
      tva: produit.tva,
      image_url: produit.image_url,
      sku: produit.sku,
      eventIds: produit.eventIds || [],
    };

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let detail = "";
      try {
        const data = await response.json();
        detail = data?.error || JSON.stringify(data);
      } catch {}
      throw new Error(detail || `Failed to save product (${response.status})`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error saving product:", error);
    throw error;
  }
}

export async function deleteProduit(id: string): Promise<void> {
  try {
    const response = await fetch(`/api/produits/${id}`, { method: "DELETE" });
    if (!response.ok) throw new Error("Failed to delete product");
  } catch (error) {
    console.error("Error deleting product:", error);
    throw error;
  }
}

export async function fetchEvenements(): Promise<Evenement[]> {
  try {
    const response = await fetch("/api/evenements");
    if (!response.ok) throw new Error("Failed to fetch events");
    return await response.json();
  } catch (error) {
    console.error("Error fetching events:", error);
    return [];
  }
}

export async function saveEvenement(evenement: Evenement): Promise<Evenement> {
  try {
    const isNew = !evenement.id || evenement.id.startsWith("evt_");
    const rel = isNew ? "/api/evenements" : `/api/evenements/${evenement.id}`;
    const abs = `https://cash.sosmediterranee.ch${rel}`;
    const method = isNew ? "POST" : "PUT";

    // Remove client-generated ID for new records
    const payload = isNew ? { ...evenement, id: undefined } : evenement;

    const tryFetch = async (u: string) => {
      try { return await fetch(u, { method, headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(payload), credentials: "omit" }); } catch { return null as any; }
    };

    let response = await tryFetch(rel);
    if (!response || !response.ok) response = await tryFetch(abs);

    if (!response || !response.ok) {
      let detail = "";
      try {
        const data = await response.json();
        detail = data?.error || JSON.stringify(data);
      } catch {}
      throw new Error(detail || `Failed to save event (${response.status})`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error saving event:", error);
    throw error;
  }
}

export async function deleteEvenement(id: string): Promise<void> {
  try {
    const response = await fetch(`/api/evenements/${id}`, { method: "DELETE" });
    if (!response.ok) throw new Error("Failed to delete event");
  } catch (error) {
    console.error("Error deleting event:", error);
    throw error;
  }
}

export async function fetchVentes(
  evenementId?: string,
  pointDeVenteId?: string,
): Promise<Vente[]> {
  try {
    const params = new URLSearchParams();
    if (evenementId) params.set("evenement_id", evenementId);
    if (pointDeVenteId) params.set("point_de_vente_id", pointDeVenteId);
    const url = params.toString()
      ? `/api/ventes?${params.toString()}`
      : "/api/ventes";
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch sales");
    return await response.json();
  } catch (error) {
    console.error("Error fetching sales:", error);
    return [];
  }
}

export async function saveVente(vente: Vente): Promise<Vente> {
  try {
    const isNew = !vente.id || vente.id.startsWith("vente_");
    const url = isNew ? "/api/ventes" : `/api/ventes/${vente.id}`;
    const method = isNew ? "POST" : "PUT";

    // Remove client-generated IDs and horodatage for new records (let Supabase handle timestamp)
    const payload = isNew
      ? {
          ...vente,
          id: undefined,
          horodatage: undefined,
          lignes: vente.lignes.map((l) => ({
            ...l,
            id: undefined,
            vente_id: undefined,
          })),
        }
      : vente;

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let detail = "";
      try {
        const data = await response.json();
        detail = data?.error || JSON.stringify(data);
      } catch {}
      throw new Error(detail || `Failed to save sale (${response.status})`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error saving sale:", error);
    throw error;
  }
}

export async function deleteVente(id: string): Promise<void> {
  try {
    const response = await fetch(`/api/ventes/${id}`, { method: "DELETE" });
    if (!response.ok) throw new Error("Failed to delete sale");
  } catch (error) {
    console.error("Error deleting sale:", error);
    throw error;
  }
}

export async function fetchPointsDeVente(
  evenementId?: string,
): Promise<PointDeVente[]> {
  try {
    const url = evenementId
      ? `/api/points-de-vente?evenement_id=${encodeURIComponent(evenementId)}`
      : "/api/points-de-vente";
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch points de vente");
    return await response.json();
  } catch (error) {
    console.error("Error fetching points de vente:", error);
    return [];
  }
}

export async function savePointDeVente(
  pdv: Partial<PointDeVente> & { evenement_id: string; nom: string },
): Promise<PointDeVente> {
  const isNew = !pdv.id;
  const rel = isNew ? "/api/points-de-vente" : `/api/points-de-vente/${pdv.id}`;
  const abs = `https://cash.sosmediterranee.ch${rel}`;
  const method = isNew ? "POST" : "PUT";

  const tryFetch = async (u: string) => {
    try { return await fetch(u, { method, headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(pdv), credentials: "omit" }); } catch { return null as any; }
  };

  let response = await tryFetch(rel);
  if (!response || !response.ok) response = await tryFetch(abs);

  if (!response || !response.ok) {
    let detail = "";
    try {
      const data = await response.json();
      detail = data?.error || JSON.stringify(data);
    } catch {}
    throw new Error(
      detail || `Failed to save point de vente (${response.status})`,
    );
  }
  return response.json();
}

export async function deletePointDeVente(id: string): Promise<void> {
  const response = await fetch(`/api/points-de-vente/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete point de vente");
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
