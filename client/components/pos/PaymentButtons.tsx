import { Button } from "@/components/ui/button";
import { usePos } from "@/context/PosStore";
import { toast } from "sonner";

export function PaymentButtons() {
  const { checkout, state } = usePos();

  const pay = (mode: "carte" | "cash") => {
    const res = checkout(mode);
    if (!res.ok) toast.error(res.error || "Erreur");
    else toast.success(`Vente enregistrée (${mode})`);
  };

  const disabled = Object.keys(state.cart).length === 0 || !state.selectedEventId;

  return (
    <div className="grid grid-cols-2 gap-3 mt-3">
      <Button className="h-16 text-2xl" onClick={() => pay("carte")} disabled={disabled}>
        Carte
      </Button>
      <Button variant="secondary" className="h-16 text-2xl" onClick={() => pay("cash")} disabled={disabled}>
        Cash
      </Button>
    </div>
  );
}
