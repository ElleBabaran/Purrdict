// src/app/page.tsx
import LandingNav from "@/components/landing/LandingNav";
import Hero from "@/components/landing/Hero";
import Levels from "@/components/landing/Levels";
import Showcase from "@/components/landing/Showcase";
import States from "@/components/landing/States";
import CTA from "@/components/landing/CTA";

export default function Home() {
  return (
    <main className="flex-1">
      <LandingNav />
      <Hero />
      <Levels />
      <Showcase />
      <States />
      <CTA />
    </main>
  );
}
