import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

type Language = "fr" | "en";

type TranslationKey =
  | "nav.home"
  | "nav.cars"
  | "nav.why"
  | "nav.contact"
  | "nav.bookWhatsapp"
  | "hero.imageAlt"
  | "hero.badge"
  | "hero.titlePrefix"
  | "hero.subtitle"
  | "hero.viewCars"
  | "cars.title"
  | "cars.subtitle"
  | "cars.perDay"
  | "cars.book"
  | "why.title"
  | "why.subtitle"
  | "why.priceTitle"
  | "why.priceDesc"
  | "why.fastTitle"
  | "why.fastDesc"
  | "why.availableTitle"
  | "why.availableDesc"
  | "contact.title"
  | "contact.subtitle"
  | "contact.phone"
  | "contact.address"
  | "contact.city"
  | "contact.whatsapp"
  | "footer.tagline"
  | "footer.welcome"
  | "footer.rights"
  | "wa.reserve"
  | "wa.reserveCar"
  | "wa.moreInfo"
  | "wa.info"
  | "aria.language";

const translations: Record<Language, Record<TranslationKey, string>> = {
  fr: {
    "nav.home": "Accueil",
    "nav.cars": "Voitures",
    "nav.why": "Pourquoi nous",
    "nav.contact": "Contact",
    "nav.bookWhatsapp": "Reserver via WhatsApp",
    "hero.imageAlt": "Location de voiture a Fes",
    "hero.badge": "Bienvenue chez Atlas Cars",
    "hero.titlePrefix": "Location de voiture a",
    "hero.subtitle": "Louez votre voiture facilement et au meilleur prix.",
    "hero.viewCars": "Voir nos voitures",
    "cars.title": "Notre flotte",
    "cars.subtitle": "Des voitures fiables a des prix imbattables",
    "cars.perDay": " / jour",
    "cars.book": "Reserver",
    "why.title": "Pourquoi nous choisir",
    "why.subtitle": "Une experience de location simple et transparente",
    "why.priceTitle": "Prix competitifs",
    "why.priceDesc": "Les meilleurs tarifs de location a Fes, sans frais caches.",
    "why.fastTitle": "Service rapide",
    "why.fastDesc": "Reservation et livraison rapides via WhatsApp.",
    "why.availableTitle": "Disponible 24/7",
    "why.availableDesc": "Notre equipe est a votre ecoute jour et nuit.",
    "contact.title": "Contact",
    "contact.subtitle": "Contactez-nous",
    "contact.phone": "Telephone",
    "contact.address": "Adresse",
    "contact.city": "Atlas Cars, Fes",
    "contact.whatsapp": "Discuter sur WhatsApp",
    "footer.tagline": "Location de voiture - Fes, Maroc",
    "footer.welcome": "Bienvenue chez Atlas Cars",
    "footer.rights": "Tous droits reserves.",
    "wa.reserve": "Bonjour Atlas Cars, je souhaite reserver une voiture.",
    "wa.reserveCar": "Bonjour Atlas Cars, je souhaite reserver la {car} ({price} DH/jour).",
    "wa.moreInfo": "Bonjour Atlas Cars, je souhaite plus d'informations.",
    "wa.info": "Bonjour Atlas Cars, je souhaite des informations.",
    "aria.language": "Changer la langue",
  },
  en: {
    "nav.home": "Home",
    "nav.cars": "Cars",
    "nav.why": "Why us",
    "nav.contact": "Contact",
    "nav.bookWhatsapp": "Book on WhatsApp",
    "hero.imageAlt": "Car rental in Fez",
    "hero.badge": "Welcome to Atlas Cars",
    "hero.titlePrefix": "Car rental in",
    "hero.subtitle": "Rent your car easily at the best price.",
    "hero.viewCars": "View our cars",
    "cars.title": "Our fleet",
    "cars.subtitle": "Reliable cars at unbeatable prices",
    "cars.perDay": " / day",
    "cars.book": "Book",
    "why.title": "Why choose us",
    "why.subtitle": "A simple and transparent rental experience",
    "why.priceTitle": "Competitive prices",
    "why.priceDesc": "The best rental rates in Fez, with no hidden fees.",
    "why.fastTitle": "Fast service",
    "why.fastDesc": "Quick booking and delivery through WhatsApp.",
    "why.availableTitle": "Available 24/7",
    "why.availableDesc": "Our team is here for you day and night.",
    "contact.title": "Contact",
    "contact.subtitle": "Get in touch",
    "contact.phone": "Phone",
    "contact.address": "Address",
    "contact.city": "Atlas Cars, Fez",
    "contact.whatsapp": "Chat on WhatsApp",
    "footer.tagline": "Car rental - Fez, Morocco",
    "footer.welcome": "Welcome to Atlas Cars",
    "footer.rights": "All rights reserved.",
    "wa.reserve": "Hello Atlas Cars, I would like to book a car.",
    "wa.reserveCar": "Hello Atlas Cars, I would like to book the {car} ({price} DH/day).",
    "wa.moreInfo": "Hello Atlas Cars, I would like more information.",
    "wa.info": "Hello Atlas Cars, I would like some information.",
    "aria.language": "Change language",
  },
};

type I18nContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey, values?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

const getInitialLanguage = (): Language => {
  if (typeof window === "undefined") return "fr";
  return window.localStorage.getItem("language") === "en" ? "en" : "fr";
};

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>(getInitialLanguage);

  useEffect(() => {
    window.localStorage.setItem("language", language);
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      setLanguage,
      toggleLanguage: () => setLanguage((current) => (current === "fr" ? "en" : "fr")),
      t: (key, values) => {
        let text = translations[language][key];
        if (!values) return text;

        Object.entries(values).forEach(([name, value]) => {
          text = text.replace(`{${name}}`, String(value));
        });

        return text;
      },
    }),
    [language],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used inside I18nProvider");
  return context;
};
