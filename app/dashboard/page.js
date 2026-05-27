import DashboardClient from "./DashboardClient";

export const metadata = {
  title: "Dashboard",
  description: "Your trading overview — stats, recent trades, psychology score and more.",
};

export default function Dashboard() {
  return <DashboardClient />;
}
