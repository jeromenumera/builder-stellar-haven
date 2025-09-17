import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { usePos } from "@/context/PosStore";
import { categoryIconDataUrl } from "@/lib/avatar";
import { Trash } from "lucide-react";

export function CartSummary() {
  const { state, addToCart, removeFromCart, removeItem, clearCart } = usePos();

  const items = useMemo(() => {
    return Object.entries(state.cart)
      .map(([pid, q]) => ({
        produit: state.produits.find((p) => p.id === pid)!,
        qty: q,
      }))
      .filter((x) => x.produit);
  }, [state.cart, state.produits]);

  const total = items.reduce((s, it) => s + it.produit.prix_ttc * it.qty, 0);

  return (
    <Card className="p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg md:text-xl font-semibold">Récapitulatif</h2>
        <Button
          variant="ghost"
          onClick={clearCart}
          disabled={items.length === 0}
        >
          Annuler
        </Button>
      </div>
      <div className="flex-1 overflow-auto pr-1 max-h-[56vh] md:max-h-[60vh]">
        {items.length === 0 ? (
          <div className="text-muted-foreground">Aucun article</div>
        ) : (
          <ul className="space-y-3">
            {items.map(({ produit, qty }) => {
              const thumb =
                produit.image_url && produit.image_url.length > 0
                  ? produit.image_url
                  : "/public/placeholder.svg";
              return (
                <li key={produit.id} className="flex items-center gap-3 py-2">
                  <img
                    src={thumb}
                    alt={produit.nom}
                    className="h-10 w-10 object-cover rounded bg-muted"
                  />
                  <div className="flex-1">
                    <div className="font-medium leading-tight text-white">
                      {produit.nom}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {qty} × {produit.prix_ttc.toFixed(2)} CHF
                    </div>
                  </div>

                  <div className="font-semibold tabular-nums text-white mr-2">
                    {(produit.prix_ttc * qty).toFixed(2)} CHF
                  </div>

                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => removeItem(produit.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <Separator className="my-3" />
      <div className="mt-auto">
        <div className="text-muted-foreground">TOTAL</div>
        <div className="text-4xl md:text-5xl font-extrabold tabular-nums text-green-400 drop-shadow-lg">
          {total.toFixed(2)} CHF
        </div>
      </div>
    </Card>
  );
}
