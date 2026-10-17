import type { Metadata } from "next";
import { Features } from "@/components/landing/features";
import { Footer } from "@/components/landing/footer";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { LandingNav } from "@/components/landing/landing-nav";
import { ProductPreview } from "@/components/landing/product-preview";

export const metadata: Metadata = {
  title: "Pixora · Your memories, beautifully organized",
  description:
    "Pixora is a private cloud photo library. Upload photos, organize them into albums, and rediscover your memories.",
};

export default function HomePage() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <LandingNav />
      <main className="flex-1">
        <Hero />
        <Features />
        <HowItWorks />
        <ProductPreview />
      </main>
      <Footer />
    </div>
  );
}
