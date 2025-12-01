import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";
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
  | { type: "setLoading"; key: keyof State["loading"]; loading: boolean }
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
  loadProduitsAdmin: () => Promise<void>;
  loadProduitsByEvent: (eventId: string) => Promise<void>;
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
        loading: { ...state.loading, [action.key]: action.loading },
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
    let selectedEventId: string | null = null;
    try {
      selectedEventId =
        localStorage.getItem("pos.selectedEventId") ||
        getSelectedEventId() ||
        localStorage.getItem("pos_selected_event_id");
    } catch {}
    dispatch({
      type: "init",
      payload: { selectedEventId },
    });

    await Promise.all([loadEvenements()]);
    await Promise.all([loadProduits(), loadVentes()]);
  };

  const loadProduits = async () => {
    dispatch({ type: "setLoading", key: "produits", loading: true });
    try {
      const produits = await fetchProduits(
        state.selectedEventId || undefined,
      );
      dispatch({ type: "setProduits", produits });
    } catch (error) {
      console.error("Failed to load products:", error);
    } finally {
      dispatch({ type: "setLoading", key: "produits", loading: false });
    }
  };

  const loadProduitsAdmin = useCallback(async () => {
    dispatch({ type: "setLoading", key: "produits", loading: true });
    try {
      // Load all products (admin mode)
      const produits = await fetchProduits();
      dispatch({ type: "setProduits", produits });
    } catch (error) {
      console.error("Failed to load admin products:", error);
      dispatch({ type: "setProduits", produits: [] });
    } finally {
      dispatch({ type: "setLoading", key: "produits", loading: false });
    }
  }, []);

  const loadProduitsByEvent = useCallback(async (eventId: string) => {
    dispatch({ type: "setLoading", key: "produits", loading: true });
    try {
      const produits = await fetchProduits(eventId);
      dispatch({ type: "setProduits", produits });
    } catch (error) {
      console.error("Failed to load event products:", error);
      dispatch({ type: "setProduits", produits: [] });
    } finally {
      dispatch({ type: "setLoading", key: "produits", loading: false });
    }
  }, []);

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
      const ventes = await fetchVentes(
        state.selectedEventId || undefined,
      );
      dispatch({ type: "setVentes", ventes });
    } catch (error) {
      console.error("Failed to load sales:", error);
    } finally {
      dispatch({ type: "setLoading", key: "ventes", loading: false });
    }
  };

  const refreshData = useCallback(async () => {
    await Promise.all([loadProduits(), loadEvenements(), loadVentes()]);
  }, [loadProduits, loadEvenements, loadVentes]);

  useEffect(() => {
    loadInitialData();
    const onStorage = (e: StorageEvent) => {
      if (e.key === "pos.selectedEventId") {
        dispatch({ type: "selectEvent", id: e.newValue });
        refreshData();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const addToCart = (id: string) => dispatch({ type: "addToCart", id });
  const removeFromCart = (id: string) =>
    dispatch({ type: "removeFromCart", id });
  const removeItem = (id: string) => dispatch({ type: "removeItem", id });
  const clearCart = () => dispatch({ type: "clearCart" });
  const selectEvent = (id: string | null) => {
    try {
      id
        ? localStorage.setItem("pos.selectedEventId", id)
        : localStorage.removeItem("pos.selectedEventId");
    } catch {}
    dispatch({ type: "selectEvent", id });
    window.dispatchEvent(
      new CustomEvent("pos:changed", {
        detail: { eventId: id },
      }),
    );
  };

  const saveProduit = async (p: Produit) => {
    try {
      const saved = await apiSaveProduit(p);
      await loadProduitsAdmin();
    } catch (error) {
      console.error("Failed to save product:", error);
      throw error;
    }
  };

  const deleteProduit = async (id: string) => {
    try {
      await apiDeleteProduit(id);
      await loadProduitsAdmin();
      if (state.cart[id]) dispatch({ type: "removeFromCart", id });
    } catch (error) {
      console.error("Failed to delete product:", error);
      throw error;
    }
  };

  const saveEvenement = async (e: Evenement) => {
    try {
      const saved = await apiSaveEvenement(e);
      await loadEvenements();
    } catch (error) {
      console.error("Failed to save event:", error);
      throw error;
    }
  };

  const deleteEvenement = async (id: string) => {
    try {
      await apiDeleteEvenement(id);
      await loadEvenements();
      if (state.selectedEventId === id)
        dispatch({ type: "selectEvent", id: null });
    } catch (error) {
      console.error("Failed to delete event:", error);
      throw error;
    }
  };

  const checkout = async (
    mode: ModePaiement,
  ): Promise<{ ok: boolean; error?: string }> => {
    if (!state.selectedEventId) {
      return { ok: false, error: "Sélectionnez un événement avant la vente." };
    }
    const items = Object.entries(state.cart);
    if (items.length === 0) {
      return { ok: false, error: "Panier vide." };
    }

    try {
      // Ensure selected event exists on the server and has a valid UUID.
      const isUuid = (id: string) =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          id,
        );
      let evenementId = state.selectedEventId as string;

      if (!isUuid(evenementId)) {
        const localEvt = state.evenements.find((e) => e.id === evenementId);
        if (!localEvt) {
          return { ok: false, error: "Événement sélectionné introuvable." };
        }
        const saved = await apiSaveEvenement(localEvt);
        dispatch({ type: "selectEvent", id: saved.id });
        evenementId = saved.id;
      }

      const lignes: LigneVente[] = items.map(([pid, qty]) => {
        const produit = state.produits.find((p) => p.id === pid)!;
        return buildLigneVente("temp", produit, qty);
      });
      const { total_ttc, total_ht, tva_totale } = computeTotals(lignes);

      const vente: Vente = {
        id: uid("vente"),
        horodatage: new Date().toISOString(),
        evenement_id: evenementId,
        mode_paiement: mode,
        total_ttc,
        total_ht,
        tva_totale,
        lignes,
      };

      await apiSaveVente(vente);
      await Promise.all([loadVentes(), loadEvenements()]);
      dispatch({ type: "clearCart" });
      return { ok: true };
    } catch (error) {
      console.error("Failed to save sale:", error);
      return {
        ok: false,
        error: "Erreur lors de l'enregistrement de la vente.",
      };
    }
  };

  const deleteVente = async (id: string) => {
    try {
      await apiDeleteVente(id);
      await loadVentes();
    } catch (error) {
      console.error("Failed to delete sale:", error);
      throw error;
    }
  };

  const updateVente = async (updated: Vente) => {
    try {
      await apiSaveVente(updated);
      await loadVentes();
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
      loadProduitsAdmin,
      loadProduitsByEvent,
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
