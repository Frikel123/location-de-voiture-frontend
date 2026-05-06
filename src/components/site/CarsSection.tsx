import { useQuery } from "@tanstack/react-query";
import { api, Car } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { waLink } from "@/lib/whatsapp";
import logan from "@/assets/car-logan.jpg";
import clio from "@/assets/car-clio.jpg";
import i10 from "@/assets/car-i10.jpg";
import { resolveCarImage } from "@/lib/car-images";

const fallbackImage = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes("logan")) return logan;
  if (n.includes("clio")) return clio;
  if (n.includes("i10")) return i10;
  return logan;
};

export const CarsSection = () => {
  const { t } = useI18n();
  const { data: cars, isLoading } = useQuery({
    queryKey: ["public-cars"],
    queryFn: () => api.get<Car[]>("/cars"),
  });

  return (
    <section id="voitures" className="py-20 bg-secondary/30">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">{t("cars.title")}</h2>
          <p className="mt-3 text-muted-foreground">{t("cars.subtitle")}</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-80 rounded-xl" />
              ))
            : cars?.map((car) => (
                <Card key={car.id} className="overflow-hidden shadow-card hover:shadow-elegant transition-all hover:-translate-y-1 duration-300 border-border/60">
                  <div className="aspect-[4/3] bg-secondary overflow-hidden">
                    <img
                      src={resolveCarImage(car) || fallbackImage(car.name)}
                      alt={car.name}
                      loading="lazy"
                      width={800}
                      height={600}
                      className="w-full h-full object-cover"
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = fallbackImage(car.name);
                      }}
                    />
                  </div>
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-xl font-semibold">{car.name}</h3>
                      <span className="text-primary font-bold whitespace-nowrap">
                        {Number(car.price)} DH<span className="text-xs text-muted-foreground font-normal">{t("cars.perDay")}</span>
                      </span>
                    </div>
                    <Button asChild className="w-full">
                      <a
                        href={waLink(t("wa.reserveCar", { car: car.name, price: car.price }))}
                        target="_blank"
                        rel="noopener"
                      >
                        <MessageCircle className="mr-2 h-4 w-4" />
                        {t("cars.book")}
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
        </div>
      </div>
    </section>
  );
};
