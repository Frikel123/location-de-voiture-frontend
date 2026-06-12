import React from "react";
import VehicleCard from "./VehicleCard";

type Car = any;

export const FleetOverview: React.FC<{ cars: Car[]; loading?: boolean }> = ({ cars = [], loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-44 animate-pulse rounded-lg bg-gray-200 dark:bg-[#071229]" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {cars.slice(0, 12).map((car) => (
        <VehicleCard key={car.id ?? car._id ?? car.name} car={car} />
      ))}
      {cars.length === 0 && (
        <div className="col-span-full rounded-lg border border-white/10 p-6 text-center text-sm text-muted-foreground">Aucun véhicule trouvé.</div>
      )}
    </div>
  );
};

export default FleetOverview;
