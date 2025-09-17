import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { usePos } from "@/context/PosStore";

export function CartSummary() {
  const { state, addToCart, removeFromCart, clearCart } = usePos();

  const items = useMemo(() => {
    return Object.entries(state.cart)
      .map(([pid, q]) => ({ produit: state.produits.find((p) => p.id === pid)!, qty: q }))
      .filter((x) => x.produit);
  }, [state.cart, state.produits]);

  const total = items.reduce((s, it) => s + it.produit.prix_ttc * it.qty, 0);

  return (
    <Card className="p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-semibold">Récapitulatif</h2>
        <Button variant="ghost" onClick={clearCart} disabled={items.length === 0}>
          Annuler
        </Button>
      </div>
      <div className="flex-1 overflow-auto pr-1">
        {items.length === 0 ? (
          <div className="text-muted-foreground">Aucun article</div>
        ) : (
          <ul className="space-y-2">
            {items.map(({ produit, qty }) => (
              <li key={produit.id} className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="font-medium leading-tight">{produit.nom}</div>
                  <div className="text-xs text-muted-foreground">
                    {qty} × {produit.prix_ttc.toFixed(2)} CHF
                  </div>
                </div>
                <div className="font-semibold tabular-nums">
                  {(produit.prix_ttc * qty).toFixed(2)} CHF
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="secondary" size="icon" className="h-9 w-9" onClick={() => removeFromCart(produit.id)}>
                    −
                  </Button>
                  <div className="w-9 text-center">{qty}</div>
                  <Button variant="secondary" size="icon" className="h-9 w-9" onClick={() => addToCart(produit.id)}>
                    +
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <Separator className="my-3" />
      <div className="mt-auto">
        <div className="text-muted-foreground">TOTAL</div>
        <div className="text-5xl md:text-6xl font-extrabold tabular-nums text-green-400 drop-shadow-lg">{total.toFixed(2)} CHF</div>
      </div>
    </Card>
  );
}
