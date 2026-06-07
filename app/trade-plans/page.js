import PlansClient from "./PlansClient";

export const metadata = {
  title: "Trade Plans",
  description: "Build and manage your trading plans. Set entry criteria, stop loss, take profit and invalidation rules.",
};

export default function TradePlansPage() {
  return <PlansClient />;
}
