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
    "nav.bookWhatsapp": "Reserver via WhatsApp",
    "hero.imageAlt": "Location premium de voitures a Meknes",
    "hero.badge": "Bienvenue chez Service LLD",
    "hero.titlePrefix": "Location premium de voitures a",
    "hero.subtitle": "Decouvrez notre flotte de vehicules premium avec reservation rapide et service professionnel.",
    "hero.viewCars": "Reserver maintenant",
    "cars.title": "Notre flotte",
    "cars.subtitle": "Des voitures premium, fiables et pretes pour vos trajets a Meknes",
    "cars.perDay": " / jour",
    "cars.book": "Reserver",
    "why.title": "Pourquoi nous choisir",
    "why.subtitle": "Une experience de location longue duree simple, elegante et transparente",
    "why.priceTitle": "Tarifs clairs",
    "why.priceDesc": "Des offres de location a Meknes, sans frais caches.",
    "why.fastTitle": "Service rapide",
    "why.fastDesc": "Reservation et confirmation rapides via WhatsApp.",
    "why.availableTitle": "Disponible 24/7",
    "why.availableDesc": "Notre equipe est a votre ecoute jour et nuit.",
    "contact.title": "Contact",
    "contact.subtitle": "Contactez Service LLD pour reserver votre vehicule a Meknes.",
    "contact.phone": "Telephone",
    "contact.address": "Adresse",
    "contact.city": "VC98+6G Meknes",
    "contact.whatsapp": "Discuter sur WhatsApp",
    "footer.tagline": "Location de voiture - Meknes, Maroc",
    "footer.welcome": "Bienvenue chez Service LLD",
    "footer.rights": "Tous droits reserves.",
    "wa.reserve": "Bonjour Service LLD, je souhaite reserver une voiture.",
    "wa.reserveCar": "Bonjour Service LLD, je souhaite reserver la {car} ({price} DH/jour).",
    "wa.moreInfo": "Bonjour Service LLD, je souhaite plus d'informations.",
    "wa.info": "Bonjour Service LLD, je souhaite des informations.",
    "aria.language": "Changer la langue",
  },
  en: {
    "nav.home": "Home",
    "nav.cars": "Cars",
    "nav.why": "Why us",
    "nav.contact": "Contact",
    "nav.bookWhatsapp": "Book on WhatsApp",
    "hero.imageAlt": "Premium car rental in Meknes",
    "hero.badge": "Welcome to Service LLD",
    "hero.titlePrefix": "Premium car rental in",
    "hero.subtitle": "Discover our premium fleet with fast booking and professional service.",
    "hero.viewCars": "Book now",
    "cars.title": "Our fleet",
    "cars.subtitle": "Premium, reliable cars ready for your trips in Meknes",
    "cars.perDay": " / day",
    "cars.book": "Book",
    "why.title": "Why choose us",
    "why.subtitle": "A simple, elegant and transparent long-term rental experience",
    "why.priceTitle": "Clear rates",
    "why.priceDesc": "Rental offers in Meknes with no hidden fees.",
    "why.fastTitle": "Fast service",
    "why.fastDesc": "Quick booking and confirmation through WhatsApp.",
    "why.availableTitle": "Available 24/7",
    "why.availableDesc": "Our team is here for you day and night.",
    "contact.title": "Contact",
    "contact.subtitle": "Contact Service LLD to reserve your vehicle in Meknes.",
    "contact.phone": "Phone",
    "contact.address": "Address",
    "contact.city": "VC98+6G Meknes",
    "contact.whatsapp": "Chat on WhatsApp",
    "footer.tagline": "Car rental - Meknes, Morocco",
    "footer.welcome": "Welcome to Service LLD",
    "footer.rights": "All rights reserved.",
    "wa.reserve": "Hello Service LLD, I would like to book a car.",
    "wa.reserveCar": "Hello Service LLD, I would like to book the {car} ({price} DH/day).",
    "wa.moreInfo": "Hello Service LLD, I would like more information.",
    "wa.info": "Hello Service LLD, I would like some information.",
    "aria.language": "Change language",
  },
  de: {
    "nav.home": "Startseite",
    "nav.cars": "Fahrzeuge",
    "nav.why": "Warum uns",
    "nav.contact": "Kontakt",
    "nav.bookWhatsapp": "Per WhatsApp buchen",
    "hero.imageAlt": "Premium-Autovermietung in Meknes",
    "hero.badge": "Willkommen bei Service LLD",
    "hero.titlePrefix": "Premium-Autovermietung in",
    "hero.subtitle": "Entdecken Sie unsere Premium-Flotte mit schneller Buchung und professionellem Service.",
    "hero.viewCars": "Jetzt buchen",
    "cars.title": "Unsere Flotte",
    "cars.subtitle": "Premium-Fahrzeuge fuer Ihre Fahrten in Meknes",
    "cars.perDay": " / Tag",
    "cars.book": "Buchen",
    "why.title": "Warum uns waehlen",
    "why.subtitle": "Eine einfache, elegante und transparente Langzeitmiete",
    "why.priceTitle": "Klare Preise",
    "why.priceDesc": "Mietangebote in Meknes ohne versteckte Kosten.",
    "why.fastTitle": "Schneller Service",
    "why.fastDesc": "Schnelle Buchung und Bestaetigung ueber WhatsApp.",
    "why.availableTitle": "24/7 verfuegbar",
    "why.availableDesc": "Unser Team ist Tag und Nacht fuer Sie da.",
    "contact.title": "Kontakt",
    "contact.subtitle": "Kontaktieren Sie Service LLD, um Ihr Fahrzeug in Meknes zu reservieren.",
    "contact.phone": "Telefon",
    "contact.address": "Adresse",
    "contact.city": "VC98+6G Meknes",
    "contact.whatsapp": "WhatsApp chatten",
    "footer.tagline": "Autovermietung - Meknes, Marokko",
    "footer.welcome": "Willkommen bei Service LLD",
    "footer.rights": "Alle Rechte vorbehalten.",
    "wa.reserve": "Hallo Service LLD, ich moechte ein Auto buchen.",
    "wa.reserveCar": "Hallo Service LLD, ich moechte den {car} ({price} DH/Tag) buchen.",
    "wa.moreInfo": "Hallo Service LLD, ich moechte mehr Informationen.",
    "wa.info": "Hallo Service LLD, ich moechte Informationen.",
    "aria.language": "Sprache aendern",
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
