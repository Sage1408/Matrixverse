import PricingClient from "./PricingClient";

export const metadata = {
  title: "Pricing — Free & Premium Plans",
  description: "MatrixVerse is free to use. Upgrade to Premium for unlimited AI analysis, advanced stats, unlimited trades and more.",
};

export default function PricingPage() {
  return <PricingClient />;
}
