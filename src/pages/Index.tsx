import { Navbar } from "@/components/site/Navbar";
import { Hero } from "@/components/site/Hero";
import { CarsSection } from "@/components/site/CarsSection";
import { Testimonials } from "@/components/site/Testimonials";
import { TrustSection } from "@/components/site/TrustSection";
import { WhyUs } from "@/components/site/WhyUs";
import { BlogSection } from "@/components/site/BlogSection";
import { FAQ } from "@/components/site/FAQ";
import { Contact } from "@/components/site/Contact";
import { Footer } from "@/components/site/Footer";
import { FloatingWhatsApp } from "@/components/site/FloatingWhatsApp";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <TrustSection />
        <CarsSection />
        <WhyUs />
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
