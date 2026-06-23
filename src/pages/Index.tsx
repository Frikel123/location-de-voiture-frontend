import { useEffect } from "react";
import { Navbar } from "@/components/site/Navbar";
import { Hero } from "@/components/site/Hero";
import { CarsSection } from "@/components/site/CarsSection";
import { Testimonials } from "@/components/site/Testimonials";
import { TrustSection } from "@/components/site/TrustSection";
import { WhyUs } from "@/components/site/WhyUs";
import { ConversionSection } from "@/components/site/ConversionSection";
import { BlogSection } from "@/components/site/BlogSection";
import { FAQ } from "@/components/site/FAQ";
import { Contact } from "@/components/site/Contact";
import { Footer } from "@/components/site/Footer";
import { FloatingWhatsApp } from "@/components/site/FloatingWhatsApp";
import { setSeo } from "@/lib/seo";

const Index = () => {
  useEffect(() => {
    setSeo({
      title: "Service LLD - Premium car rental experience in Morocco",
      description: "Premium luxury car rental platform in Morocco with live availability, instant booking, WhatsApp reservations, airport delivery and insured vehicles.",
      canonical: "/fr",
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "AutoRental",
        name: "Service LLD",
        areaServed: "Morocco",
        telephone: "+212650958675",
        url: "https://service-lld.ma",
      },
    });
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <TrustSection />
        <CarsSection />
        <WhyUs />
        <ConversionSection />
        <Testimonials />
        <BlogSection />
        <FAQ />
        <Contact />
      </main>
      <Footer />
      <FloatingWhatsApp />
    </div>
  );
};

export default Index;
