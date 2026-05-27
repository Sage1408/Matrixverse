import AIAnalyzerClient from "./AIAnalyzerClient";

export const metadata = {
  title: "AI Trade Analyzer",
  description: "Get instant AI feedback on your trades. Detect emotional mistakes, bad RR and overtrading patterns.",
};

export default function AIAnalyzer() {
  return <AIAnalyzerClient />;
}
