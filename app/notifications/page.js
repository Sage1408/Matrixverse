import NotificationsClient from "./NotificationsClient";

export const metadata = {
  title: "Notifications",
  description: "Your MatrixVerse notifications — likes, comments, follows and more.",
};

export default function Notifications() {
  return <NotificationsClient />;
}
