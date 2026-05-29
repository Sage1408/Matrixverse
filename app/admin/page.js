import AdminClient from "./AdminClient";

export const metadata = {
  title: "Admin Panel — MatrixVerse",
  description: "Manage users, posts, and site statistics.",
};

export default function AdminPage() {
  return <AdminClient />;
}
