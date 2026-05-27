import LeaderboardClient from "./LeaderboardClient";

export const metadata = {
  title: "Leaderboard",
  description: "Compete with traders worldwide. Rankings by PnL, win rate, RR ratio and more.",
};

export default function Leaderboard() {
  return <LeaderboardClient />;
}
