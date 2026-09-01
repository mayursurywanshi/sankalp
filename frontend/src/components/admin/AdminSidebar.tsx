import { useState } from "react";
import logo from "../../assets/sankalp-logo.png";
import "./AdminSidebar.css";

const menuItems = [
  ["▦", "Dashboard"], ["▣", "Appointments"], ["♙", "Patients"], ["⚕", "Doctors"],
  ["★", "Success Stories"], ["☵", "Feedback"], ["✉", "Contact Requests"],
  ["⌁", "Performance"], ["♚", "Users & Roles"], ["⚙", "Settings"],
] as const;

type Props = { onLogout: () => void; loggingOut: boolean };

export const AdminSidebar = ({ onLogout, loggingOut }: Props) => {
  const [open, setOpen] = useState(false);
  return <>
    <button className="admin-menu-toggle" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="admin-sidebar">{open ? "×" : "☰"}<span>Menu</span></button>
    {open && <button className="admin-sidebar-shade" type="button" aria-label="Close menu" onClick={() => setOpen(false)} />}
    <aside id="admin-sidebar" className={`admin-sidebar${open ? " is-open" : ""}`}>
      <div className="admin-sidebar__brand"><img src={logo} alt="Sankalp" /></div>
      <nav aria-label="Admin navigation">
        {menuItems.map(([icon, label], index) => (
          <button className={index === 0 ? "is-active" : ""} type="button" key={label} disabled={index !== 0} title={index !== 0 ? `${label} will be available in the next development stage` : undefined}>
            <span aria-hidden="true">{icon}</span>{label}{label === "Contact Requests" && <b>!</b>}
          </button>
        ))}
      </nav>
      <button className="admin-sidebar__logout" type="button" onClick={onLogout} disabled={loggingOut}><span aria-hidden="true">↪</span>{loggingOut ? "Logging out…" : "Logout"}</button>
    </aside>
  </>;
};
