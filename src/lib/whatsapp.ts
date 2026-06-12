export const WHATSAPP_NUMBER = "212646494968";
export const PHONE_DISPLAY = "0646494968";

export const waLink = (message: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
