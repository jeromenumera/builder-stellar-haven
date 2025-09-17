import { useMemo } from "react";
import { usePos } from "@/context/PosStore";
import { ProductTile } from "@/components/pos/ProductTile";
import { CartSummary } from "@/components/pos/CartSummary";
import { PaymentButtons } from "@/components/pos/PaymentButtons";
import { Card } from "@/components/ui/card";

export default function Vente() {
  const { state } = usePos();

  const qtyById = state.cart;

  const gridProducts = useMemo(() => {
    // Only active products; limit 20
    return state.produits.slice(0, 20);
  }, [state.produits]);

  const requireEvent = !state.selectedEventId;

  return (
    <div className="container mx-auto p-4">
      {requireEvent && (
        <Card className="p-4 mb-4 border-2 border-destructive/40 bg-destructive/10 text-destructive-foreground">
          Veuillez sélectionner un événement pour démarrer la vente.
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[70vh]">
        <div className="lg:col-span-4 order-2 lg:order-1">
          <CartSummary />
          <PaymentButtons />
        </div>
        <div className="lg:col-span-8 order-1 lg:order-2">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {gridProducts.map((p) => (
              <ProductTile key={p.id} produit={p} qty={qtyById[p.id] || 0} />)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
