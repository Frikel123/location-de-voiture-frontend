import type { Car } from "@/lib/api";

const STORAGE_PREFIX = "car-image:";

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

export const setStoredCarImage = (carId: number, image: string) => {
  if (!canUseStorage()) return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${carId}`, image);
  } catch {
    // Storage can be unavailable or full; the API save should still succeed.
  }
};

export const removeStoredCarImage = (carId: number) => {
  if (!canUseStorage()) return;
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${carId}`);
  } catch {
    // Ignore storage cleanup failures.
  }
};

export const resolveCarImage = (car: Car) => getStoredCarImage(car.id) || car.image || null;
