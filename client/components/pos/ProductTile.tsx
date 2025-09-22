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
      ? `${produit.image_url}?v=${Date.now()}`
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
        minHeight: '100px',
        height: '100px',
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(0,0,0,0.05))",
        backgroundColor: "hsl(var(--card))",
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        WebkitBackdropFilter: "blur(8px)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div className="flex items-center h-full p-3">
        {/* Image Section - Fixed size on left */}
        <div className="flex-shrink-0 mr-3 w-16 h-16 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgSrc}
            alt={produit.nom}
            className="w-full h-full object-cover rounded-lg bg-center"
            onLoad={() => {
              console.log(`✅ Image loaded successfully: ${imgSrc}`);
            }}
            onError={(e) => {
              console.error(`❌ Image failed to load: ${imgSrc}`);
              (e.currentTarget as HTMLImageElement).src = placeholderSvg;
            }}
          />
        </div>

        {/* Content Section - Flexible width */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="text-sm font-semibold text-foreground leading-tight line-clamp-2 mb-1">
            {produit.nom}
          </div>
          <div className={(isNegative ? "text-amber-500" : "text-green-600") + " text-sm font-bold"}>
            {produit.prix_ttc.toFixed(2)} CHF
          </div>
        </div>

        {/* Quantity Badge */}
        {qty > 0 && (
          <div className="absolute top-2 right-2">
            <div className="bg-primary text-primary-foreground rounded-full px-2 py-1 font-bold text-xs min-w-[1.5rem] text-center">
              {qty}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
