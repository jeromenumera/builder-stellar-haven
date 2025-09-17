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
  saveProduit: (p: Produit) => void;
  deleteProduit: (id: string) => void;
  saveEvenement: (e: Evenement) => void;
  deleteEvenement: (id: string) => void;
  checkout: (mode: ModePaiement) => { ok: boolean; error?: string };
  deleteVente: (id: string) => void;
  updateVente: (v: Vente) => void;
  removeItem: (id: string) => void;
} | null>(null);

const initial: State = {
  produits: [],
  evenements: [],
  ventes: [],
  selectedEventId: null,
  cart: {},
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "init":
      return { ...state, ...action.payload } as State;
    case "selectEvent":
      setSelectedEventId(action.id);
      return { ...state, selectedEventId: action.id };
    case "setProduits":
      setProduits(action.produits);
      return { ...state, produits: action.produits };
    case "setEvenements":
      setEvenements(action.evenements);
      return { ...state, evenements: action.evenements };
    case "setVentes":
      setVentes(action.ventes);
      return { ...state, ventes: action.ventes };
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

  useEffect(() => {
    seedIfEmpty("/public/");
    dispatch({
      type: "init",
      payload: {
        produits: getProduits(),
        evenements: getEvenements(),
        ventes: getVentes(),
        selectedEventId: getSelectedEventId(),
      },
    });
  }, []);

  const addToCart = (id: string) => dispatch({ type: "addToCart", id });
  const removeFromCart = (id: string) => dispatch({ type: "removeFromCart", id });
  const removeItem = (id: string) => dispatch({ type: "removeItem", id });
  const clearCart = () => dispatch({ type: "clearCart" });
  const selectEvent = (id: string | null) => dispatch({ type: "selectEvent", id });

  const saveProduit = (p: Produit) => {
    const existing = state.produits.find((x) => x.id === p.id);
    const list = existing
      ? state.produits.map((x) => (x.id === p.id ? p : x))
      : [...state.produits, p].slice(0, 20);
    dispatch({ type: "setProduits", produits: list });
  };

  const deleteProduit = (id: string) => {
    const list = state.produits.filter((x) => x.id !== id);
    dispatch({ type: "setProduits", produits: list });
    // Remove from cart if present
    if (state.cart[id]) dispatch({ type: "removeFromCart", id });
  };

  const saveEvenement = (e: Evenement) => {
    const existing = state.evenements.find((x) => x.id === e.id);
    const list = existing
      ? state.evenements.map((x) => (x.id === e.id ? e : x))
      : [...state.evenements, e];
    dispatch({ type: "setEvenements", evenements: list });
  };

  const deleteEvenement = (id: string) => {
    const list = state.evenements.filter((x) => x.id !== id);
    dispatch({ type: "setEvenements", evenements: list });
    if (state.selectedEventId === id) dispatch({ type: "selectEvent", id: null });
  };

  const checkout = (mode: ModePaiement) => {
    if (!state.selectedEventId)
      return { ok: false, error: "Sélectionnez un événement avant la vente." };
    const items = Object.entries(state.cart);
    if (items.length === 0) return { ok: false, error: "Panier vide." };

    const venteId = uid("vente");
    const lignes: LigneVente[] = items.map(([pid, qty]) => {
      const produit = state.produits.find((p) => p.id === pid)!;
      return buildLigneVente(venteId, produit, qty);
    });
    const { total_ttc, total_ht, tva_totale } = computeTotals(lignes);

    const vente: Vente = {
      id: venteId,
      horodatage: new Date().toISOString(),
      evenement_id: state.selectedEventId,
      mode_paiement: mode,
      total_ttc,
      total_ht,
      tva_totale,
      lignes,
    };

    const ventes = [vente, ...state.ventes];
    dispatch({ type: "setVentes", ventes });
    dispatch({ type: "clearCart" });
    return { ok: true };
  };

  const deleteVente = (id: string) => {
    const ventes = state.ventes.filter((v) => v.id !== id);
    dispatch({ type: "setVentes", ventes });
  };

  const updateVente = (updated: Vente) => {
    const ventes = state.ventes.map((v) => (v.id === updated.id ? updated : v));
    dispatch({ type: "setVentes", ventes });
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
