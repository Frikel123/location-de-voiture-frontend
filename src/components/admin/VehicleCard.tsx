import React from "react";
import { Button } from "@/components/ui/button";

type Car = any;

export const VehicleCard: React.FC<{ car: Car }> = ({ car }) => {
  const name = car?.name || car?.model || "Véhicule";
  const brand = car?.brand || car?.make || "Marque";
  const price = car?.dailyPrice || car?.pricePerDay || car?.price || 0;
  const image = car?.images?.[0] || car?.imageUrl || "/assets/placeholder-car.jpg";
  const available = car?.available ?? true;

  return (
    <div className="vehicle-card glass card-dense flex flex-col gap-3 rounded-lg p-3">
      <div className="relative h-36 w-full overflow-hidden rounded-md bg-[#041226]">
        <img src={image} alt={name} className="h-full w-full object-cover" />
        <div className={`absolute left-3 top-3 rounded-full px-2 py-1 text-xs font-semibold ${available ? "bg-emerald-500/90 text-white" : "bg-rose-600/90 text-white"}`}>
          {available ? "Disponible" : "Indisponible"}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">{name}</p>
          <p className="mt-1 text-xs text-muted-foreground">{brand}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold">{price} �</p>
          <p className="text-xs text-muted-foreground">/jour</p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" className="btn-outline-gold">Voir</Button>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" className="rounded-full">Réserver</Button>
          <Button variant="outline" size="sm" className="rounded-full">Modifier</Button>
        </div>
      </div>
    </div>
  );
};

export default VehicleCard;
