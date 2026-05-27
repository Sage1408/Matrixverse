import JournalClient from "./JournalClient";

export const metadata = {
  title: "Trading Journal",
  description: "Log and track all your trades. Export as CSV, Excel or PDF.",
};

export default function Journal() {
  return <JournalClient />;
}
