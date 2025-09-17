import { Produit } from "@shared/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { usePos } from "@/context/PosStore";
import { feedback } from "@/lib/feedback";
import { categoryIconDataUrl } from "@/lib/avatar";

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

  const useAvatar = !produit.image_url || produit.image_url.includes("placeholder.svg");
  const iconSrc = categoryIconDataUrl(produit.nom);
  const imgSrc = useAvatar ? iconSrc : produit.image_url;

  return (
    <Card
      role="button"
      onClick={onAdd}
      className="relative overflow-hidden select-none bg-card transition-transform transform hover:scale-[1.01] active:scale-[0.98] touch-manipulation rounded-xl shadow-md border border-transparent hover:border-primary/40"
      style={{ minHeight: 160 }}
    >
      <div className="flex h-full">
        <div className="w-28 shrink-0 bg-muted/20 flex items-center justify-center p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgSrc}
            alt={produit.nom}
            className="h-24 w-24 object-cover rounded-md bg-center"
            onError={(e) => {
              // fallback to generated icon if the provided image fails
              (e.currentTarget as HTMLImageElement).src = iconSrc;
            }}
          />
        </div>
        <div className="flex-1 p-4 flex flex-col justify-center">
          <div className="font-semibold leading-tight line-clamp-2 text-white text-base">{produit.nom}</div>
          <div className="text-green-300 text-lg font-extrabold mt-2">{produit.prix_ttc.toFixed(2)} CHF</div>
        </div>
      </div>

      {qty > 0 && (
        <div className="absolute bottom-3 right-3 flex items-center gap-3">
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
