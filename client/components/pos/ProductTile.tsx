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
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") onAdd();
      }}
      className="relative overflow-hidden select-none bg-card transition-all transform hover:scale-[1.01] active:scale-95 touch-manipulation rounded-lg shadow-sm border border-[#2A2A2A] hover:border-[#3a82f6]/40 hover:bg-[rgba(58,130,246,0.04)] focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
      style={{ minHeight: 140 }}
    >
      <div className="flex items-center h-full px-3 py-2">
        <div className="flex-shrink-0 mr-4 w-16 h-16 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgSrc}
            alt={produit.nom}
            className="h-12 w-12 object-cover rounded-md bg-center"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = iconSrc;
            }}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-lg font-bold text-white leading-tight line-clamp-2">{produit.nom}</div>
          <div className="text-green-400 text-sm font-semibold mt-1">{produit.prix_ttc.toFixed(2)} CHF</div>
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
      </div>
    </Card>
  );
}
