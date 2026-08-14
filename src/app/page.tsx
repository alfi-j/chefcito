import { GuestOnly } from "@/components/landing/guest-only";
import { LandingNav } from "@/components/landing/landing-nav";
import { Hero } from "@/components/landing/hero";
import { Journey } from "@/components/landing/journey";
import { Features } from "@/components/landing/features";
import { CtaBand } from "@/components/landing/cta-band";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <>
      <GuestOnly />
      <div className="min-h-screen bg-[#FAF5EA] text-[#201D15]">
        <LandingNav />
        <main>
          <Hero />
          <Journey />
          <Features />
          <CtaBand />
        </main>
        <Footer />
      </div>
    </>
  );
}