import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

type Language = "fr" | "en" | "de";

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

const supportedLanguages: Language[] = ["fr", "en", "de"];

const translations: Record<Language, Record<TranslationKey, string>> = {
  fr: {
    "nav.home": "Accueil",
    "nav.cars": "Voitures",
    "nav.why": "Pourquoi nous",
    "nav.contact": "Contact",
    "nav.bookWhatsapp": "Réserver via WhatsApp",
    "hero.imageAlt": "Location de voiture à Fès",
    "hero.badge": "Bienvenue chez Atlas Cars",
    "hero.titlePrefix": "Location de voiture à",
    "hero.subtitle": "Louez votre voiture facilement et au meilleur prix.",
    "hero.viewCars": "Voir nos voitures",
    "cars.title": "Notre flotte",
    "cars.subtitle": "Des voitures fiables à des prix imbattables",
    "cars.perDay": " / jour",
    "cars.book": "Réserver",
    "why.title": "Pourquoi nous choisir",
    "why.subtitle": "Une expérience de location simple et transparente",
    "why.priceTitle": "Prix compétitifs",
    "why.priceDesc": "Les meilleurs tarifs de location à Fès, sans frais cachés.",
    "why.fastTitle": "Service rapide",
    "why.fastDesc": "Réservation et livraison rapides via WhatsApp.",
    "why.availableTitle": "Disponible 24/7",
    "why.availableDesc": "Notre équipe est à votre écoute jour et nuit.",
    "contact.title": "Contact",
    "contact.subtitle": "Contactez-nous",
    "contact.phone": "Téléphone",
    "contact.address": "Adresse",
    "contact.city": "Atlas Cars, Fès",
    "contact.whatsapp": "Discuter sur WhatsApp",
    "footer.tagline": "Location de voiture haut de gamme - Fès, Maroc",
    "footer.welcome": "Bienvenue chez Atlas Cars",
    "footer.rights": "Tous droits réservés.",
    "wa.reserve": "Bonjour Atlas Cars, je souhaite réserver une voiture.",
    "wa.reserveCar": "Bonjour Atlas Cars, je souhaite réserver la {car} ({price} DH/jour).",
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
    "footer.tagline": "Premium car rental - Fez, Morocco",
    "footer.welcome": "Welcome to Atlas Cars",
    "footer.rights": "All rights reserved.",
    "wa.reserve": "Hello Atlas Cars, I would like to book a car.",
    "wa.reserveCar": "Hello Atlas Cars, I would like to book the {car} ({price} DH/day).",
    "wa.moreInfo": "Hello Atlas Cars, I would like more information.",
    "wa.info": "Hello Atlas Cars, I would like some information.",
    "aria.language": "Change language",
  },
  de: {
    "nav.home": "Startseite",
    "nav.cars": "Fahrzeuge",
    "nav.why": "Warum uns",
    "nav.contact": "Kontakt",
    "nav.bookWhatsapp": "Per WhatsApp buchen",
    "hero.imageAlt": "Autovermietung in Fes",
    "hero.badge": "Willkommen bei Atlas Cars",
    "hero.titlePrefix": "Autovermietung in",
    "hero.subtitle": "Mieten Sie Ihr Auto einfach zum besten Preis.",
    "hero.viewCars": "Unsere Fahrzeuge ansehen",
    "cars.title": "Unsere Flotte",
    "cars.subtitle": "Zuverlässige Autos zu unschlagbaren Preisen",
    "cars.perDay": " / Tag",
    "cars.book": "Buchen",
    "why.title": "Warum uns wählen",
    "why.subtitle": "Ein einfaches und transparentes Miet­erlebnis",
    "why.priceTitle": "Wettbewerbsfähige Preise",
    "why.priceDesc": "Die besten Mietpreise in Fes, ohne versteckte Kosten.",
    "why.fastTitle": "Schneller Service",
    "why.fastDesc": "Schnelle Buchung und Lieferung über WhatsApp.",
    "why.availableTitle": "24/7 verfügbar",
    "why.availableDesc": "Unser Team ist Tag und Nacht für Sie da.",
    "contact.title": "Kontakt",
    "contact.subtitle": "Nehmen Sie Kontakt auf",
    "contact.phone": "Telefon",
    "contact.address": "Adresse",
    "contact.city": "Atlas Cars, Fes",
    "contact.whatsapp": "WhatsApp chatten",
    "footer.tagline": "Premium-Autovermietung - Fes, Marokko",
    "footer.welcome": "Willkommen bei Atlas Cars",
    "footer.rights": "Alle Rechte vorbehalten.",
    "wa.reserve": "Hallo Atlas Cars, ich möchte ein Auto buchen.",
    "wa.reserveCar": "Hallo Atlas Cars, ich möchte den {car} ({price} DH/Tag) buchen.",
    "wa.moreInfo": "Hallo Atlas Cars, ich möchte mehr Informationen.",
    "wa.info": "Hallo Atlas Cars, ich möchte Informationen.",
    "aria.language": "Sprache ändern",
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

  const pathLanguage = window.location.pathname.split("/")[1] as Language;
  if (supportedLanguages.includes(pathLanguage)) return pathLanguage;

  const storageLanguage = window.localStorage.getItem("language") as Language | null;
  if (storageLanguage && supportedLanguages.includes(storageLanguage)) return storageLanguage;

  return "fr";
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
      toggleLanguage: () => setLanguage((current) => {
        const nextIndex = (supportedLanguages.indexOf(current) + 1) % supportedLanguages.length;
        return supportedLanguages[nextIndex];
      }),
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
