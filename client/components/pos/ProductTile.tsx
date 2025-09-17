import { Produit } from "@shared/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { usePos } from "@/context/PosStore";
import { feedback } from "@/lib/feedback";

export function ProductTile({ produit, qty = 0 }: { produit: Produit; qty?: number }) {
  const { addToCart, removeFromCart } = usePos();

  const onAdd = () => {
    addToCart(produit.id);
    feedback();
  };
  const onRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeFromCart(produit.id);
  };

  return (
    <Card
      role="button"
      onClick={onAdd}
      className="relative overflow-hidden select-none bg-card hover:ring-2 hover:ring-primary/60 transition h-full touch-manipulation"
      style={{ minHeight: 120 }}
    >
      <div className="flex h-full">
        <div className="w-24 shrink-0 bg-muted/30 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={produit.image_url} alt={produit.nom} className="h-20 w-20 object-contain" />
        </div>
        <div className="flex-1 p-3">
          <div className="font-semibold leading-tight line-clamp-2 text-white">{produit.nom}</div>
          <div className="text-green-300 text-lg font-extrabold mt-1">{produit.prix_ttc.toFixed(2)} CHF</div>
        </div>
      </div>

      {qty > 0 && (
        <div className="absolute bottom-2 right-2 flex items-center gap-2">
          <Button variant="secondary" size="icon" className="h-12 w-12" onClick={onRemove}>
            −
          </Button>
          <div className="px-3 py-1 rounded-md bg-primary text-primary-foreground font-bold text-lg min-w-10 text-center">
            {qty}
          </div>
          <Button variant="secondary" size="icon" className="h-12 w-12" onClick={onAdd}>
            +
          </Button>
        </div>
      )}
    </Card>
  );
}
