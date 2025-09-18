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
          <div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
            style={{
              gridAutoRows: "140px",
              maxHeight: "calc(100vh - 8rem)",
              overflow: "hidden",
            }}
          >
            {gridProducts.map((p) => (
              <ProductTile key={p.id} produit={p} qty={qtyById[p.id] || 0} />
            ))}
          </div>
        </section>

        {/* On tablets and up show payment buttons as a fixed bottom bar */}
        <div className="hidden md:flex md:fixed md:left-6 md:bottom-6 md:w-80 md:justify-center pointer-events-none">
          <div className="pointer-events-auto w-full">
            <PaymentButtons />
          </div>
        </div>
      </div>
    </div>
  );
}
