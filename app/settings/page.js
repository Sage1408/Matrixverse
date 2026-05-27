import SettingsClient from "./SettingsClient";

export const metadata = {
  title: "Settings",
  description: "Manage your MatrixVerse account, profile and preferences.",
};

export default function SettingsPage() {
  return <SettingsClient />;
}
