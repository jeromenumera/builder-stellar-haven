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
      className="relative overflow-hidden select-none transition-transform touch-manipulation rounded-[14px] border border-[#2A2A2A] cursor-pointer"
      style={{
        minHeight: 140,
        background: "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(0,0,0,0.12))",
        backgroundColor: "rgba(44,44,46,0.8)",
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        WebkitBackdropFilter: "blur(6px)",
        backdropFilter: "blur(6px)",
        transition: "transform 120ms ease, background-color 120ms ease",
      }}
      onMouseDown={(e) => {
        (e.currentTarget as HTMLDivElement).style.backgroundColor = "#3A3A3C";
        (e.currentTarget as HTMLDivElement).style.transform = "scale(0.98)";
      }}
      onMouseUp={(e) => {
        (e.currentTarget as HTMLDivElement).style.backgroundColor = "rgba(44,44,46,0.8)";
        (e.currentTarget as HTMLDivElement).style.transform = "scale(1)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.backgroundColor = "rgba(44,44,46,0.8)";
        (e.currentTarget as HTMLDivElement).style.transform = "scale(1)";
      }}
      onTouchStart={(e) => {
        (e.currentTarget as HTMLDivElement).style.backgroundColor = "#3A3A3C";
        (e.currentTarget as HTMLDivElement).style.transform = "scale(0.98)";
      }}
      onTouchEnd={(e) => {
        (e.currentTarget as HTMLDivElement).style.backgroundColor = "rgba(44,44,46,0.8)";
        (e.currentTarget as HTMLDivElement).style.transform = "scale(1)";
      }}
    >
      <div className="flex items-center h-full px-3 py-3">
        <div className="flex-shrink-0 mr-4 w-10 h-10 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgSrc}
            alt={produit.nom}
            className="h-8 w-8 object-cover rounded-md bg-center"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = iconSrc;
            }}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-[18px] font-bold text-white leading-tight line-clamp-2">{produit.nom}</div>
          <div className="text-[#34C759] text-[16px] font-semibold mt-1">{produit.prix_ttc.toFixed(2)} CHF</div>
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
