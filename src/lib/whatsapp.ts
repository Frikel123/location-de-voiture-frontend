export const WHATSAPP_NUMBER = "212665253565";
export const PHONE_DISPLAY = "+212 665-253565";

export const waLink = (message: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
