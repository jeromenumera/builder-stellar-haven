import { Produit } from "@shared/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { usePos } from "@/context/PosStore";
import { feedback } from "@/lib/feedback";
import placeholderSvg from "@/assets/placeholder.svg";

export function ProductTile({
  produit,
  qty = 0,
}: {
  produit: Produit;
  qty?: number;
}) {
  const { addToCart, removeFromCart } = usePos();

  const onAdd = () => {
    addToCart(produit.id);
    feedback();
  };
  const onRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeFromCart(produit.id);
  };

  const imgSrc =
    produit.image_url && produit.image_url.length > 0
      ? produit.image_url
      : placeholderSvg;
  const isNegative = produit.prix_ttc < 0;

  return (
    <Card
      role="button"
      onClick={onAdd}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") onAdd();
      }}
      onPointerDown={(e) => {
        const target = e.currentTarget as HTMLDivElement;
        // start long press timer
        (target as any)._lp = window.setTimeout(() => {
          // long press => remove one
          removeFromCart(produit.id);
          feedback();
        }, 600);
      }}
      onPointerUp={(e) => {
        const target = e.currentTarget as HTMLDivElement;
        if ((target as any)._lp) {
          clearTimeout((target as any)._lp);
          (target as any)._lp = null;
        }
      }}
      onPointerLeave={(e) => {
        const target = e.currentTarget as HTMLDivElement;
        if ((target as any)._lp) {
          clearTimeout((target as any)._lp);
          (target as any)._lp = null;
        }
      }}
      className="relative overflow-hidden select-none transition-all duration-200 touch-manipulation rounded-xl border border-border/50 cursor-pointer hover:border-border active:scale-95 group"
      style={{
        minHeight: 'clamp(120px, 15vh, 160px)',
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(0,0,0,0.05))",
        backgroundColor: "hsl(var(--card))",
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        WebkitBackdropFilter: "blur(8px)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div className="flex flex-col h-full p-3 sm:p-4">
        {/* Image Section */}
        <div className="flex-shrink-0 mb-3 w-full aspect-square max-h-20 sm:max-h-24 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgSrc}
            alt={produit.nom}
            className="w-full h-full object-cover rounded-lg bg-center"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = placeholderSvg;
            }}
          />
        </div>

        {/* Content Section */}
        <div className="flex-1 flex flex-col justify-between min-h-0">
          <div className="text-sm sm:text-base font-semibold text-foreground leading-tight line-clamp-2 mb-2">
            {produit.nom}
          </div>
          <div className={(isNegative ? "text-amber-500" : "text-green-600") + " text-sm sm:text-base font-bold"}>
            {produit.prix_ttc.toFixed(2)} CHF
          </div>
        </div>

        {/* Quantity Badge */}
        {qty > 0 && (
          <div className="absolute top-2 right-2">
            <div className="bg-primary text-primary-foreground rounded-full px-2 py-1 font-bold text-xs sm:text-sm min-w-[1.5rem] text-center">
              {qty}
            </div>
          </div>
        )}

        {/* Touch indicator for mobile */}
        <div className="absolute bottom-1 right-1 opacity-30 group-active:opacity-60 transition-opacity">
          <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
        </div>
      </div>
    </Card>
  );
}
