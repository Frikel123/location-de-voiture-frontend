export const WHATSAPP_NUMBER = "212650958675";
export const PHONE_DISPLAY = "06 50 95 86 75";

export const waLink = (message: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
