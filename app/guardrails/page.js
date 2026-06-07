import GuardrailsClient from "./GuardrailsClient";

export const metadata = {
  title: "Guardrails",
  description: "Set daily loss limits, trade limits, and cool-down rules to protect your trading",
};

export default function GuardrailsPage() {
  return <GuardrailsClient />;
}
