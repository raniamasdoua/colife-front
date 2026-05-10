import { AdminLayout } from "../../components/admin/AdminLayout";
import { ProfilePage } from "../ProfilePage";

export function AdminProfilePage() {
  return (
    <AdminLayout
      title="Mon profil"
      subtitle="Gérez vos informations personnelles et la sécurité de votre compte"
    >
      <ProfilePage adminShell />
    </AdminLayout>
  );
}
