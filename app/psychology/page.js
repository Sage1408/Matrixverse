import PsychologyClient from "./PsychologyClient";

export const metadata = {
  title: "Psychology Tracker",
  description: "Track your trading emotions daily. Detect revenge trading, fear and greed patterns.",
};

export default function PsychologyPage() {
  return <PsychologyClient />;
}
