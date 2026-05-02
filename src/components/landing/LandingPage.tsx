import Navbar           from "./Navbar";
import Hero             from "./Hero";
import KPIs             from "./KPIs";
import Features         from "./Features";
import DashboardPreview from "./DashboardPreview";
import HowItWorks       from "./HowItWorks";
import CTA              from "./CTA";
import Footer           from "./Footer";

export default function LandingPage() {
  return (
    <div className="bg-white text-ink min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <KPIs />
        <Features />
        <DashboardPreview />
        <HowItWorks />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
