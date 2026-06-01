import * as Accordion from "@radix-ui/react-accordion";
import { motion } from "framer-motion";
import { ChevronDown, ShieldCheck, Truck, CreditCard, Phone, Info } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const FAQ = () => {
  const { language } = useI18n();
  const isFr = language === "fr";
  const faqs = [
    {
      question: isFr ? "L'assurance est-elle incluse ?" : language === "de" ? "Ist die Versicherung inklusive?" : "Is insurance included?",
      answer: isFr
        ? "Oui, toutes nos locations incluent une assurance responsabilité civile de base. Un renfort optionnel peut être ajouté lors de la confirmation.": language === "de"
        ? "Ja, alle unsere Vermietungen beinhalten eine Basis-Haftpflichtversicherung. Eine zusätzliche Deckung kann bei der Bestätigung hinzugefügt werden."
        : "Yes, all rentals include basic liability insurance. Optional additional coverage can be added during booking.",
    },
    {
      question: isFr ? "Quel est le montant de la caution ?" : language === "de" ? "Wie hoch ist die Kaution?" : "What is the deposit amount?",
      answer: isFr
        ? "La caution est précisée dans votre devis. Elle est bloquée sur votre carte et libérée après inspection du véhicule.": language === "de"
        ? "Die Kaution wird in Ihrem Angebot angegeben. Sie wird auf Ihrer Karte reserviert und nach Fahrzeugprüfung freigegeben."
        : "The deposit is shown in your quote. It is held on your card and released after vehicle inspection.",
    },
    {
      question: isFr ? "Quel âge minimum pour louer ?" : language === "de" ? "Wie alt muss ich sein?" : "What is the minimum age to rent?",
      answer: isFr
        ? "L'âge minimum est de 21 ans. Un jeune conducteur peut être accepté avec des frais supplémentaires.": language === "de"
        ? "Das Mindestalter beträgt 21 Jahre. Junge Fahrer können gegen Aufpreis akzeptiert werden."
        : "Minimum age is 21. Young drivers may be accepted with an extra fee.",
    },
    {
      question: isFr ? "Livrez-vous à l'aéroport ?" : language === "de" ? "Liefern Sie zum Flughafen?" : "Do you provide airport delivery?",
      answer: isFr
        ? "Oui, nous proposons la livraison et la reprise à l'aéroport, à la gare ou à l'hôtel, avec confirmation par WhatsApp.": language === "de"
        ? "Ja, wir bieten Lieferung und Abholung am Flughafen, Bahnhof oder Hotel an, mit Bestätigung per WhatsApp."
        : "Yes, we provide delivery and pickup at the airport, station, or hotel, confirmed via WhatsApp.",
    },
    {
      question: isFr ? "Quels modes de paiement acceptez-vous ?" : language === "de" ? "Welche Zahlungsmethoden akzeptieren Sie?" : "What payment methods do you accept?",
      answer: isFr
        ? "Nous acceptons le paiement par carte, virement bancaire et paiement mobile. Le paiement final se fait lors de la remise du véhicule."
        : language === "de"
        ? "Wir akzeptieren Kartenzahlung, Banküberweisung und mobile Zahlung. Die finale Zahlung erfolgt bei Fahrzeugübergabe."
        : "We accept card, bank transfer and mobile payment. Final payment is made when the car is handed over.",
    },
  ];

  return (
    <section id="faq" className="bg-[#070d16] py-24 text-white">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          className="mx-auto mb-10 max-w-3xl text-center"
        >
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-primary">{isFr ? "FAQ Premium" : language === "de" ? "Premium FAQ" : "Premium FAQ"}</p>
          <h2 className="text-balance text-3xl font-bold tracking-tight md:text-5xl">
            {isFr ? "Questions fréquentes sur votre location" : language === "de" ? "Häufig gestellte Fragen zur Anmietung" : "Frequently asked questions about your rental"}
          </h2>
          <p className="mt-4 text-base leading-7 text-white/70 md:text-lg">
            {isFr
              ? "Réponses claires pour louer en toute confiance."
              : language === "de"
              ? "Klare Antworten für eine sorgenfreie Anmietung."
              : "Clear answers for renting with confidence."}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          className="grid gap-4 lg:grid-cols-2"
        >
          {faqs.map((faq, index) => (
            <Accordion.Root key={faq.question} type="single" collapsible className="rounded-3xl border border-white/10 bg-white/5 p-1">
              <Accordion.Item value={`faq-${index}`} className="overflow-hidden rounded-3xl bg-background/80">
                <Accordion.Header>
                  <Accordion.Trigger className="flex w-full items-center justify-between gap-3 px-6 py-5 text-left text-base font-semibold text-white transition hover:text-primary">
                    <span>{faq.question}</span>
                    <ChevronDown className="h-5 w-5 transition-transform duration-300 data-[state=open]:rotate-180" />
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content className="border-t border-white/10 px-6 pb-6 text-sm leading-7 text-white/70 data-[state=open]:animate-accordion-down">
                  <p>{faq.answer}</p>
                </Accordion.Content>
              </Accordion.Item>
            </Accordion.Root>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
