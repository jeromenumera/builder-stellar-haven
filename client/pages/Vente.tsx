import { usePos } from "@/context/PosStore";
import { ProductTile } from "@/components/pos/ProductTile";
import { useEffect, useMemo } from "react";
import { CartSummary } from "@/components/pos/CartSummary";
import { PaymentButtons } from "@/components/pos/PaymentButtons";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2 } from "lucide-react";

export default function Vente() {
  const { state, loadProduitsByEvent } = usePos() as any;

  const qtyById = state.cart;

  useEffect(() => {
    const eventId = state.selectedEventId;

    if (eventId) {
      loadProduitsByEvent(eventId);
    }
  }, [state.selectedEventId, loadProduitsByEvent]);

  const { positiveProducts, negativeProducts } = useMemo(() => {
    const allProducts = state.produits.slice(0, 20);
    const positive = allProducts.filter((p) => p.prix_ttc >= 0);
    const negative = allProducts.filter((p) => p.prix_ttc < 0);
    return { positiveProducts: positive, negativeProducts: negative };
  }, [state.produits]);

  const requireEvent = !state.selectedEventId;

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile/Tablet Layout */}
      <div className="block md:hidden">
        <div className="flex flex-col h-[calc(100vh-3.5rem)]">
          {requireEvent && (
            <div className="p-3 sm:p-4">
              <Card className="p-3 border-2 border-destructive/40 bg-destructive/10 text-destructive-foreground text-sm">
                Veuillez sélectionner un événement pour démarrer la vente.
              </Card>
            </div>
          )}

          {/* Products Section - Takes most of the screen */}
          <div className="flex-1 overflow-hidden">
            <div className="p-3 sm:p-4 h-full">
              {/* Header with responsive title */}
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="min-w-0 flex-1">
                  <h2 className="text-base sm:text-lg font-semibold truncate">
                    Produits
                  </h2>
                  {state.selectedEventId && (
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">
                      {
                        state.evenements.find(
                          (e) => e.id === state.selectedEventId,
                        )?.nom
                      }
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {state.loading.produits && (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const eventId = state.selectedEventId;
                      if (eventId) {
                        loadProduitsByEvent(eventId);
                      }
                    }}
                    disabled={!state.selectedEventId || state.loading.produits}
                    className="h-8 px-2 sm:h-9 sm:px-3"
                  >
                    <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline ml-1">Rafraîchir</span>
                  </Button>
                </div>
              </div>

              {/* Products Grid - Optimized for touch */}
              <div className="h-[calc(100%-5rem)] overflow-auto -mx-1">
                {state.loading.produits &&
                positiveProducts.length === 0 &&
                negativeProducts.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    Chargement des produits...
                  </div>
                ) : positiveProducts.length === 0 &&
                  negativeProducts.length === 0 ? (
                  <div className="flex items-center justify-center py-12 text-center">
                    <div className="space-y-2">
                      <div className="text-lg">🛍️</div>
                      <div className="text-sm text-muted-foreground">
                        Aucun produit disponible
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 px-1">
                    {/* Positive products */}
                    {positiveProducts.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
                        {positiveProducts.map((p) => (
                          <ProductTile
                            key={p.id}
                            produit={p}
                            qty={qtyById[p.id] || 0}
                          />
                        ))}
                      </div>
                    )}

                    {/* Returns section */}
                    {negativeProducts.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-sm font-semibold text-amber-400 border-b border-amber-400/30 pb-2">
                          Retour (Consignes)
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
                          {negativeProducts.map((p) => (
                            <ProductTile
                              key={p.id}
                              produit={p}
                              qty={qtyById[p.id] || 0}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Cart Summary - Fixed at bottom */}
          <div className="flex-shrink-0 border-t bg-background/95 backdrop-blur">
            <div className="p-3 sm:p-4 space-y-3">
              <CartSummary />
              <PaymentButtons />
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block">
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
                  Produits{" "}
                  {state.selectedEventId
                    ? `(${state.evenements.find((e) => e.id === state.selectedEventId)?.nom || "Événement"})`
                    : ""}
                </h2>
                <div className="flex items-center gap-2">
                  {state.loading.produits && (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const eventId = state.selectedEventId;
                      if (eventId) {
                        loadProduitsByEvent(eventId);
                      }
                    }}
                    disabled={!state.selectedEventId || state.loading.produits}
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
                {state.loading.produits &&
                positiveProducts.length === 0 &&
                negativeProducts.length === 0 ? (
                  <div className="flex items-center justify-center py-8 text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    Chargement des produits...
                  </div>
                ) : positiveProducts.length === 0 &&
                  negativeProducts.length === 0 ? (
                  <div className="flex items-center justify-center py-8 text-muted-foreground">
                    Aucun produit disponible pour cet événement
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
                          <ProductTile
                            key={p.id}
                            produit={p}
                            qty={qtyById[p.id] || 0}
                          />
                        ))}
                      </div>
                    )}

                    {/* Negative products section */}
                    {negativeProducts.length > 0 && (
                      <div className="mt-8">
                        <p className="text-lg font-semibold text-amber-400 mb-4 border-b border-amber-400/30 pb-2">
                          Retour (Consignes)
                        </p>
                        <div
                          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
                          style={{ gridAutoRows: "140px" }}
                        >
                          {negativeProducts.map((p) => (
                            <ProductTile
                              key={p.id}
                              produit={p}
                              qty={qtyById[p.id] || 0}
                            />
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
      </div>
    </div>
  );
}
