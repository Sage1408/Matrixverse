import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Features from "./components/Features";
import Testimonials from "./components/Testimonials";
import Pricing from "./components/Pricing";
import FAQ from "./components/FAQ";
import Footer from "./components/Footer";

export const metadata = {
  title: "MatrixVerse — Track. Improve. Dominate the Markets.",
  description: "Join thousands of traders using MatrixVerse to journal trades, get AI feedback, compete on leaderboards, and build a trading community.",
};

export default function Home() {
  return (
    <main className="bg-[var(--bg-primary)] min-h-screen">
      <Navbar />
      <Hero />
      <Features />
      <Testimonials />
      <Pricing />
      <FAQ />
      <Footer />
    </main>
  );
}