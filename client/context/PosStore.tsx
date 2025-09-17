import React, { createContext, useContext, useEffect, useMemo, useReducer, useState } from "react";
import {
  Evenement,
  LigneVente,
  ModePaiement,
  Produit,
  Vente,
  buildLigneVente,
  computeTotals,
} from "@shared/api";
import {
  fetchEvenements,
  fetchProduits,
  getSelectedEventId,
  fetchVentes,
  setSelectedEventId,
  saveProduit as apiSaveProduit,
  deleteProduit as apiDeleteProduit,
  saveEvenement as apiSaveEvenement,
  deleteEvenement as apiDeleteEvenement,
  saveVente as apiSaveVente,
  deleteVente as apiDeleteVente,
} from "@/services/apiStorage";
import { uid } from "@/services/id";

interface State {
  produits: Produit[];
  evenements: Evenement[];
  ventes: Vente[];
  selectedEventId: string | null;
  cart: Record<string, number>; // produit_id -> qty
  loading: {
    produits: boolean;
    evenements: boolean;
    ventes: boolean;
  };
}

type Action =
  | { type: "init"; payload: Partial<State> }
  | { type: "selectEvent"; id: string | null }
  | { type: "setProduits"; produits: Produit[] }
  | { type: "setEvenements"; evenements: Evenement[] }
  | { type: "setVentes"; ventes: Vente[] }
  | { type: "setLoading"; key: keyof State['loading']; loading: boolean }
  | { type: "addToCart"; id: string }
  | { type: "removeFromCart"; id: string }
  | { type: "removeItem"; id: string }
  | { type: "clearCart" };

const PosContext = createContext<{
  state: State;
  addToCart: (id: string) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  selectEvent: (id: string | null) => void;
  saveProduit: (p: Produit) => Promise<void>;
  deleteProduit: (id: string) => Promise<void>;
  saveEvenement: (e: Evenement) => Promise<void>;
  deleteEvenement: (id: string) => Promise<void>;
  checkout: (mode: ModePaiement) => Promise<{ ok: boolean; error?: string }>;
  deleteVente: (id: string) => Promise<void>;
  updateVente: (v: Vente) => Promise<void>;
  removeItem: (id: string) => void;
  refreshData: () => Promise<void>;
} | null>(null);

const initial: State = {
  produits: [],
  evenements: [],
  ventes: [],
  selectedEventId: null,
  cart: {},
  loading: {
    produits: false,
    evenements: false,
    ventes: false,
  },
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "init":
      return { ...state, ...action.payload } as State;
    case "selectEvent":
      setSelectedEventId(action.id);
      return { ...state, selectedEventId: action.id };
    case "setProduits":
      return { ...state, produits: action.produits };
    case "setEvenements":
      return { ...state, evenements: action.evenements };
    case "setVentes":
      return { ...state, ventes: action.ventes };
    case "setLoading":
      return {
        ...state,
        loading: { ...state.loading, [action.key]: action.loading }
      };
    case "addToCart": {
      const qty = (state.cart[action.id] || 0) + 1;
      return { ...state, cart: { ...state.cart, [action.id]: qty } };
    }
    case "removeFromCart": {
      const qty = (state.cart[action.id] || 0) - 1;
      const next = { ...state.cart };
      if (qty <= 0) delete next[action.id];
      else next[action.id] = qty;
      return { ...state, cart: next };
    }
    case "removeItem": {
      const next = { ...state.cart };
      delete next[action.id];
      return { ...state, cart: next };
    }
    case "clearCart":
      return { ...state, cart: {} };
    default:
      return state;
  }
}

export function PosProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);

  // Load initial data
  const loadInitialData = async () => {
    const selectedEventId = getSelectedEventId();
    dispatch({ type: "init", payload: { selectedEventId } });

    // Load all data in parallel
    await Promise.all([
      loadProduits(),
      loadEvenements(),
      loadVentes(),
    ]);
  };

  const loadProduits = async () => {
    dispatch({ type: "setLoading", key: "produits", loading: true });
    try {
      const produits = await fetchProduits();
      dispatch({ type: "setProduits", produits });
    } catch (error) {
      console.error("Failed to load products:", error);
    } finally {
      dispatch({ type: "setLoading", key: "produits", loading: false });
    }
  };

  const loadEvenements = async () => {
    dispatch({ type: "setLoading", key: "evenements", loading: true });
    try {
      const evenements = await fetchEvenements();
      dispatch({ type: "setEvenements", evenements });
    } catch (error) {
      console.error("Failed to load events:", error);
    } finally {
      dispatch({ type: "setLoading", key: "evenements", loading: false });
    }
  };

  const loadVentes = async () => {
    dispatch({ type: "setLoading", key: "ventes", loading: true });
    try {
      const ventes = await fetchVentes();
      dispatch({ type: "setVentes", ventes });
    } catch (error) {
      console.error("Failed to load sales:", error);
    } finally {
      dispatch({ type: "setLoading", key: "ventes", loading: false });
    }
  };

  const refreshData = async () => {
    await Promise.all([loadProduits(), loadEvenements(), loadVentes()]);
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const addToCart = (id: string) => dispatch({ type: "addToCart", id });
  const removeFromCart = (id: string) => dispatch({ type: "removeFromCart", id });
  const removeItem = (id: string) => dispatch({ type: "removeItem", id });
  const clearCart = () => dispatch({ type: "clearCart" });
  const selectEvent = (id: string | null) => dispatch({ type: "selectEvent", id });

  const saveProduit = async (p: Produit) => {
    try {
      const saved = await apiSaveProduit(p);
      await loadProduits(); // Reload to get updated list
    } catch (error) {
      console.error("Failed to save product:", error);
      throw error;
    }
  };

  const deleteProduit = async (id: string) => {
    try {
      await apiDeleteProduit(id);
      await loadProduits(); // Reload to get updated list
      // Remove from cart if present
      if (state.cart[id]) dispatch({ type: "removeFromCart", id });
    } catch (error) {
      console.error("Failed to delete product:", error);
      throw error;
    }
  };

  const saveEvenement = async (e: Evenement) => {
    try {
      const saved = await apiSaveEvenement(e);
      await loadEvenements(); // Reload to get updated list
    } catch (error) {
      console.error("Failed to save event:", error);
      throw error;
    }
  };

  const deleteEvenement = async (id: string) => {
    try {
      await apiDeleteEvenement(id);
      await loadEvenements(); // Reload to get updated list
      if (state.selectedEventId === id) dispatch({ type: "selectEvent", id: null });
    } catch (error) {
      console.error("Failed to delete event:", error);
      throw error;
    }
  };

  const checkout = async (mode: ModePaiement): Promise<{ ok: boolean; error?: string }> => {
    if (!state.selectedEventId) {
      return { ok: false, error: "Sélectionnez un événement avant la vente." };
    }
    const items = Object.entries(state.cart);
    if (items.length === 0) {
      return { ok: false, error: "Panier vide." };
    }

    try {
      const lignes: LigneVente[] = items.map(([pid, qty]) => {
        const produit = state.produits.find((p) => p.id === pid)!;
        return buildLigneVente("temp", produit, qty); // temp ID, server will generate real one
      });
      const { total_ttc, total_ht, tva_totale } = computeTotals(lignes);

      const vente: Vente = {
        id: uid("vente"), // temp ID
        horodatage: new Date().toISOString(),
        evenement_id: state.selectedEventId,
        mode_paiement: mode,
        total_ttc,
        total_ht,
        tva_totale,
        lignes,
      };

      await apiSaveVente(vente);
      await loadVentes(); // Reload to get updated list
      dispatch({ type: "clearCart" });
      return { ok: true };
    } catch (error) {
      console.error("Failed to save sale:", error);
      return { ok: false, error: "Erreur lors de l'enregistrement de la vente." };
    }
  };

  const deleteVente = async (id: string) => {
    try {
      await apiDeleteVente(id);
      await loadVentes(); // Reload to get updated list
    } catch (error) {
      console.error("Failed to delete sale:", error);
      throw error;
    }
  };

  const updateVente = async (updated: Vente) => {
    try {
      await apiSaveVente(updated); // Use same save function for updates
      await loadVentes(); // Reload to get updated list
    } catch (error) {
      console.error("Failed to update sale:", error);
      throw error;
    }
  };

  const value = useMemo(
    () => ({
      state,
      addToCart,
      removeFromCart,
      removeItem,
      clearCart,
      selectEvent,
      saveProduit,
      deleteProduit,
      saveEvenement,
      deleteEvenement,
      checkout,
      deleteVente,
      updateVente,
      refreshData,
    }),
    [state],
  );

  return <PosContext.Provider value={value}>{children}</PosContext.Provider>;
}

export function usePos() {
  const ctx = useContext(PosContext);
  if (!ctx) throw new Error("usePos must be used within PosProvider");
  return ctx;
}
