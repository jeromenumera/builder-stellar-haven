import { useState } from "react";
import { usePos } from "@/context/PosStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProductForm } from "@/components/admin/ProductForm";
import { EventForm } from "@/components/admin/EventForm";
import { categoryIconDataUrl } from "@/lib/avatar";

export default function Admin() {
  const { state, deleteProduit, deleteEvenement, selectEvent } = usePos();
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  const editingProduct =
    state.produits.find((p) => p.id === editingProductId) || null;
  const editingEvent =
    state.evenements.find((e) => e.id === editingEventId) || null;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Administration</h1>
      <Tabs defaultValue="produits">
        <TabsList>
          <TabsTrigger value="produits">Produits</TabsTrigger>
          <TabsTrigger value="evenements">Événements</TabsTrigger>
        </TabsList>
        <TabsContent value="produits" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <h2 className="text-xl font-semibold mb-2">Liste (max 20)</h2>
              <Card className="p-2">
                <ul className="divide-y">
                  {state.produits.map((p) => {
                    const thumb =
                      p.image_url && p.image_url.length > 0
                        ? p.image_url
                        : "/public/placeholder.svg";
                    return (
                      <li key={p.id} className="flex items-center gap-2 p-2">
                        <img
                          src={thumb}
                          alt={p.nom}
                          className="h-10 w-10 object-cover rounded bg-muted"
                        />
                        <div className="flex-1">
                          <div className="font-medium">{p.nom}</div>
                          <div className="text-xs text-muted-foreground">
                            {p.prix_ttc.toFixed(2)} CHF · TVA {p.tva}%
                          </div>
                        </div>
                        <Button
                          variant="secondary"
                          onClick={() => setEditingProductId(p.id)}
                        >
                          Éditer
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => deleteProduit(p.id)}
                        >
                          Supprimer
                        </Button>
                      </li>
                    );
                  })}
                  {state.produits.length === 0 && (
                    <li className="p-4 text-muted-foreground">Aucun produit</li>
                  )}
                </ul>
              </Card>
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">
                {editingProduct ? "Éditer" : "Nouveau produit"}
              </h2>
              <ProductForm
                initial={editingProduct}
                onDone={() => setEditingProductId(null)}
              />
            </div>
          </div>
        </TabsContent>
        <TabsContent value="evenements" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <h2 className="text-xl font-semibold mb-2">Liste</h2>
              <Card className="p-2">
                <ul className="divide-y">
                  {state.evenements.map((e) => (
                    <li key={e.id} className="flex items-center gap-2 p-2">
                      <div className="flex-1">
                        <div className="font-medium">{e.nom}</div>
                        <div className="text-xs text-muted-foreground">
                          {e.date_debut} → {e.date_fin} · {e.lieu} · {e.statut}
                        </div>
                      </div>
                      <Button
                        variant="secondary"
                        onClick={() => setEditingEventId(e.id)}
                      >
                        Éditer
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => deleteEvenement(e.id)}
                      >
                        Supprimer
                      </Button>
                      <Button onClick={() => selectEvent(e.id)}>
                        Sélectionner
                      </Button>
                    </li>
                  ))}
                  {state.evenements.length === 0 && (
                    <li className="p-4 text-muted-foreground">
                      Aucun événement
                    </li>
                  )}
                </ul>
              </Card>
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">
                {editingEvent ? "Éditer" : "Nouvel événement"}
              </h2>
              <EventForm
                initial={editingEvent}
                onDone={() => setEditingEventId(null)}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
