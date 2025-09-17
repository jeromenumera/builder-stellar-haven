import { Produit } from "@shared/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { usePos } from "@/context/PosStore";
import { feedback } from "@/lib/feedback";
import { avatarDataUrl } from "@/lib/avatar";

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
  const imgSrc = useAvatar ? avatarDataUrl(produit.nom) : produit.image_url;

  return (
    <Card
      role="button"
      onClick={onAdd}
      className="relative overflow-hidden select-none bg-card hover:ring-2 hover:ring-primary/60 transition h-full touch-manipulation border-2 border-border/40"
      style={{ minHeight: 160 }}
    >
      <div className="flex h-full">
        <div className="w-28 shrink-0 bg-muted/30 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imgSrc} alt={produit.nom} className="h-24 w-24 object-contain rounded" />
        </div>
        <div className="flex-1 p-4">
          <div className="font-semibold leading-tight line-clamp-2 text-white text-base">{produit.nom}</div>
          <div className="text-green-300 text-xl font-extrabold mt-2">{produit.prix_ttc.toFixed(2)} CHF</div>
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
