import { usePos } from "@/context/PosStore";
import { ProductTile } from "@/components/pos/ProductTile";
import { useEffect, useMemo } from "react";
import { CartSummary } from "@/components/pos/CartSummary";
import { PaymentButtons } from "@/components/pos/PaymentButtons";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2 } from "lucide-react";

export default function Vente() {
  const { state, loadProduitsByPOS } = usePos() as any;

  const qtyById = state.cart;

  useEffect(() => {
    const evId = state.selectedEventId;
    const posId = state.selectedPointDeVenteId;

    if (evId && posId) {
      loadProduitsByPOS(evId, posId);
    }
  }, [state.selectedEventId, state.selectedPointDeVenteId, loadProduitsByPOS]);

  const { positiveProducts, negativeProducts } = useMemo(() => {
    const allProducts = state.produits.slice(0, 20);
    const positive = allProducts.filter(p => p.prix_ttc >= 0);
    const negative = allProducts.filter(p => p.prix_ttc < 0);
    return { positiveProducts: positive, negativeProducts: negative };
  }, [state.produits]);

  const requireEvent = !state.selectedEventId;

  return (
    <div className="container mx-auto p-4">
      {requireEvent && (
        <Card className="p-4 mb-4 border-2 border-destructive/40 bg-destructive/10 text-destructive-foreground">
          Veuillez sélectionner un événement pour démarrer la vente.
        </Card>
      )}

      <div className="flex flex-col md:flex-row gap-4 min-h-[70vh]">
        <aside className="md:w-96 w-full order-2 md:order-1">
          <div className="sticky top-20">
            <CartSummary />
            <div className="mt-3">
              <PaymentButtons />
            </div>
          </div>
        </aside>

        <section className="flex-1 order-1 md:order-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              Produits {state.selectedPointDeVenteId ?
                `(${state.pointsDeVente.find(p => p.id === state.selectedPointDeVenteId)?.nom || 'Point de vente'})` :
                ''
              }
            </h2>
            <div className="flex items-center gap-2">
              {state.loading.produits && (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const evId = state.selectedEventId;
                  const posId = state.selectedPointDeVenteId;
                  if (evId && posId) {
                    loadProduitsByPOS(evId, posId);
                  }
                }}
                disabled={!state.selectedEventId || !state.selectedPointDeVenteId || state.loading.produits}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Rafraîchir
              </Button>
            </div>
          </div>
          <div
            style={{
              maxHeight: "calc(100vh - 8rem)",
              overflow: "auto",
            }}
          >
            {state.loading.produits && positiveProducts.length === 0 && negativeProducts.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                Chargement des produits...
              </div>
            ) : positiveProducts.length === 0 && negativeProducts.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                Aucun produit disponible pour ce point de vente
              </div>
            ) : (
              <>
                {/* Positive products section */}
                {positiveProducts.length > 0 && (
                  <div
                    className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6"
                    style={{ gridAutoRows: "140px" }}
                  >
                    {positiveProducts.map((p) => (
                      <ProductTile key={p.id} produit={p} qty={qtyById[p.id] || 0} />
                    ))}
                  </div>
                )}

                {/* Negative products section */}
                {negativeProducts.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-amber-400 mb-4 border-b border-amber-400/30 pb-2">
                      Retour
                    </h3>
                    <div
                      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
                      style={{ gridAutoRows: "140px" }}
                    >
                      {negativeProducts.map((p) => (
                        <ProductTile key={p.id} produit={p} qty={qtyById[p.id] || 0} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
