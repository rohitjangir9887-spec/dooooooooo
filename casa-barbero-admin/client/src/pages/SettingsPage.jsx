import "../assets/styles/settings.css";
import { LogOut } from "lucide-react";
import { Input, PageHeader, PanelTitle } from "../components/ui/index.jsx";

export default function SettingsPage({ settings, user, onLogout }) {
  const shopProfile = settings?.shopProfile;
  const initials = (user?.name || "").split(" ").map((w) => w[0]).join("").toUpperCase() || "?";

  return (
    <section className="center-page">
      <PageHeader title="Settings" />
      <PanelTitle title="Shop Profile" />
      <section className="panel settings-form" key={shopProfile?.name}>
        <Input label="Shop Name"><input defaultValue={shopProfile?.name ?? ""} /></Input>
        <Input label="Branch"><input defaultValue={shopProfile?.branch ?? ""} /></Input>
        <Input label="Contact Number"><input defaultValue={shopProfile?.phone ?? ""} /></Input>
        <Input label="Currency"><input defaultValue={shopProfile?.currency ?? ""} /></Input>
      </section>
      <PanelTitle title="Account" />
      <section className="panel account-card">
        <div className="avatar">{initials}</div>
        <div><strong>{user?.name ?? ""}</strong><p className="mono">{user?.email ?? ""} · {user?.role ?? ""}</p></div>
        <button className="ghost-danger" type="button" onClick={onLogout}><LogOut size={16} /> Log out</button>
      </section>
    </section>
  );
}
