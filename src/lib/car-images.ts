import type { Car } from "@/lib/api";

const STORAGE_PREFIX = "car-image:";
const STORAGE_MULTI_PREFIX = "car-images:";

const canUseStorage = () => {
  try {
    return typeof window !== "undefined" && !!window.localStorage;
  } catch {
    return false;
  }
};

export const getStoredCarImage = (carId: number) => {
  if (!canUseStorage()) return null;
  try {
    return localStorage.getItem(`${STORAGE_PREFIX}${carId}`);
  } catch {
    return null;
  }
};

export const getStoredCarImages = (carId: number) => {
  if (!canUseStorage()) return [];
  try {
    const storedImages = localStorage.getItem(`${STORAGE_MULTI_PREFIX}${carId}`);
    if (storedImages) {
      const parsed = JSON.parse(storedImages);
      if (Array.isArray(parsed)) return parsed.filter((image): image is string => typeof image === "string" && image.length > 0);
    }

    const storedImage = getStoredCarImage(carId);
    return storedImage ? [storedImage] : [];
  } catch {
    return [];
  }
};

export const setStoredCarImage = (carId: number, image: string) => {
  if (!canUseStorage()) return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${carId}`, image);
  } catch {
    // Storage can be unavailable or full; the API save should still succeed.
  }
};

export const setStoredCarImages = (carId: number, images: string[]) => {
  if (!canUseStorage()) return;
  try {
    const cleanImages = images.filter((image) => image.trim().length > 0);
    if (cleanImages.length === 0) {
      removeStoredCarImage(carId);
      return;
    }

    localStorage.setItem(`${STORAGE_MULTI_PREFIX}${carId}`, JSON.stringify(cleanImages));
    localStorage.setItem(`${STORAGE_PREFIX}${carId}`, cleanImages[0]);
  } catch {
    // Storage can be unavailable or full; the API save should still succeed.
  }
};

export const removeStoredCarImage = (carId: number) => {
  if (!canUseStorage()) return;
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${carId}`);
    localStorage.removeItem(`${STORAGE_MULTI_PREFIX}${carId}`);
  } catch {
    // Ignore storage cleanup failures.
  }
};

export const resolveCarImages = (car: Car) => {
  if (Array.isArray(car.images) && car.images.length > 0) return car.images;
  if (car.image) return [car.image];

  const storedImages = getStoredCarImages(car.id);
  return storedImages;
};

export const resolveCarImage = (car: Car) => resolveCarImages(car)[0] ?? null;
