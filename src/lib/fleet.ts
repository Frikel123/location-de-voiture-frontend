import type { Car } from "@/lib/api";
import clio from "@/assets/car-clio.jpg";
import heroCar from "@/assets/hero-car.jpg";
import i10 from "@/assets/car-i10.jpg";
import logan from "@/assets/car-logan.jpg";

export type Vehicle = Car & {
  slug: string;
  brand: string;
  model: string;
  category: "Economy" | "Compact" | "Sedan" | "SUV" | "Premium";
  transmission: "Automatic" | "Manual";
  fuel: "Petrol" | "Diesel" | "Hybrid";
  seats: number;
  doors: number;
  luggage: number;
  year: number;
  rating: number;
  trips: number;
  popularity: number;
  isNew: boolean;
  offer?: string;
  features: string[];
  specs: Record<string, string>;
  gallery: string[];
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export const demoFleet: Vehicle[] = [
  {
    id: 101,
    name: "Hyundai i10 Urban",
    slug: "hyundai-i10-urban",
    brand: "Hyundai",
    model: "i10 Urban",
    category: "Economy",
    transmission: "Automatic",
    fuel: "Petrol",
    seats: 5,
    doors: 5,
    luggage: 2,
    year: 2025,
    price: 240,
    image: i10,
    images: [i10, heroCar, logan],
    gallery: [i10, heroCar, logan],
    rating: 4.8,
    trips: 184,
    popularity: 96,
    isNew: true,
    offer: "15% weekly offer",
    features: ["Air conditioning", "Bluetooth", "USB-C charging", "Rear camera", "Unlimited support"],
    specs: { Engine: "1.2L", Range: "650 km", Deposit: "1,500 DH", Insurance: "Included" },
  },
  {
    id: 102,
    name: "Renault Clio Techno",
    slug: "renault-clio-techno",
    brand: "Renault",
    model: "Clio Techno",
    category: "Compact",
    transmission: "Automatic",
    fuel: "Diesel",
    seats: 5,
    doors: 5,
    luggage: 3,
    year: 2024,
    price: 320,
    image: clio,
    images: [clio, i10, heroCar],
    gallery: [clio, i10, heroCar],
    rating: 4.9,
    trips: 231,
    popularity: 99,
    isNew: false,
    offer: "Most booked",
    features: ["Cruise control", "CarPlay", "Parking sensors", "Premium interior", "Airport delivery"],
    specs: { Engine: "1.5 dCi", Range: "780 km", Deposit: "2,000 DH", Insurance: "Included" },
  },
  {
    id: 103,
    name: "Dacia Logan Comfort",
    slug: "dacia-logan-comfort",
    brand: "Dacia",
    model: "Logan Comfort",
    category: "Sedan",
    transmission: "Manual",
    fuel: "Diesel",
    seats: 5,
    doors: 4,
    luggage: 4,
    year: 2024,
    price: 280,
    image: logan,
    images: [logan, clio, heroCar],
    gallery: [logan, clio, heroCar],
    rating: 4.7,
    trips: 198,
    popularity: 91,
    isNew: false,
    features: ["Large trunk", "Economy mode", "Bluetooth", "Child seat option", "Cleaned before pickup"],
    specs: { Engine: "1.5 dCi", Range: "820 km", Deposit: "1,800 DH", Insurance: "Included" },
  },
  {
    id: 104,
    name: "Toyota C-HR Hybrid",
    slug: "toyota-c-hr-hybrid",
    brand: "Toyota",
    model: "C-HR Hybrid",
    category: "SUV",
    transmission: "Automatic",
    fuel: "Hybrid",
    seats: 5,
    doors: 5,
    luggage: 3,
    year: 2025,
    price: 590,
    image: heroCar,
    images: [heroCar, clio, logan],
    gallery: [heroCar, clio, logan],
    rating: 4.9,
    trips: 112,
    popularity: 94,
    isNew: true,
    offer: "Premium choice",
    features: ["Hybrid drive", "Adaptive cruise", "Navigation", "Blind spot assist", "Priority delivery"],
    specs: { Engine: "1.8 Hybrid", Range: "760 km", Deposit: "3,500 DH", Insurance: "Premium included" },
  },
];

const inferVehicle = (car: Car, index: number): Vehicle => {
  const name = car.name || "Atlas Cars Vehicle";
  const lower = name.toLowerCase();
  const brand = name.split(" ")[0] || "Atlas";
  const category = lower.includes("suv") || lower.includes("cross") ? "SUV" : lower.includes("logan") ? "Sedan" : lower.includes("i10") ? "Economy" : "Compact";
  const transmission = lower.includes("manual") ? "Manual" : "Automatic";
  const fuel = lower.includes("hybrid") ? "Hybrid" : lower.includes("diesel") ? "Diesel" : "Petrol";
  const base = demoFleet[index % demoFleet.length];
  const gallery = [car.image, ...(car.images ?? [])].filter(Boolean) as string[];

  return {
    ...base,
    ...car,
    slug: slugify(`${name}-${car.id}`),
    brand,
    model: name.replace(brand, "").trim() || name,
    category,
    transmission,
    fuel,
    gallery: gallery.length ? gallery : base.gallery,
    images: gallery.length ? gallery : base.gallery,
    image: car.image ?? base.image,
    price: Number(car.price) || base.price,
    popularity: Math.max(80, base.popularity - index),
    trips: base.trips + index * 7,
    specs: { ...base.specs, Daily: `${Number(car.price) || base.price} DH` },
  };
};

export const buildFleet = (cars?: Car[] | null) => {
  if (!cars?.length) return demoFleet;
  return cars.map(inferVehicle);
};

export const daysBetween = (startDate: string, endDate: string) => {
  if (!startDate || !endDate) return 1;
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86_400_000));
};

export const getVehicleBySlug = (slug: string | undefined, cars?: Car[] | null) =>
  buildFleet(cars).find((vehicle) => vehicle.slug === slug || String(vehicle.id) === slug);
