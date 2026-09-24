import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import logo from "../../assets/sankalp-logo.webp";
import { searchAdminRecords } from "../../pages/admin/admin-dashboard.service";
import { AdminSearchResults } from "../../pages/admin/admin-dashboard.types";
import "./AdminSidebar.css";

const menuItems = [
  ["▦", "Dashboard", "/admin/dashboard"],
  ["▣", "Appointments", "/admin/appointments"],
  ["♙", "Patients", "/admin/patients"],
  ["⚕", "Doctors", "/admin/doctors"],
  ["★", "Success Stories", "/admin/success-stories"],
  ["☵", "Feedback", "/admin/feedback"],
  ["✉", "Contact Requests", "/admin/contact-requests"],
  ["⌁", "Performance", "/admin/performance"],
  ["♚", "Users & Roles", "/admin/users-roles"],
  ["⚙", "Settings", "/admin/settings"],
] as const;

type Props = { onLogout: () => void; loggingOut: boolean };

export const AdminSidebar = ({ onLogout, loggingOut }: Props) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<AdminSearchResults | null>(null);
  const [searching, setSearching] = useState(false);
  const requestNumber = useRef(0);
  useEffect(() => {
    const query = search.trim();
    const current = ++requestNumber.current;
    if (query.length < 2) {
      setResults(null);
      setSearching(false);
      return;
    }
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const value = await searchAdminRecords(query);
        if (current === requestNumber.current) setResults(value);
      } catch {
        if (current === requestNumber.current) setResults(null);
      } finally {
        if (current === requestNumber.current) setSearching(false);
      }
    }, 400);
    return () => window.clearTimeout(timer);
  }, [search]);
  const go = (path: string) => {
    setSearch("");
    setResults(null);
    navigate(path);
  };
  return (
    <>
      <header className="admin-global-header">
        <div className="admin-global-header__brand">
          <img src={logo} alt="Sankalp Child Development Center" />
        </div>
        <div className="admin-global-header__search">
          <label>
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search patients, appointments, doctors…"
              aria-label="Search Admin records"
            />
          </label>
          {search.trim().length >= 2 && (
            <section className="admin-global-header__results">
              {searching ? (
                <p>Searching clinic records…</p>
              ) : results && results.totalResults ? (
                <>
                  {results.patients.map((item) => (
                    <button
                      type="button"
                      key={item.patientId}
                      onClick={() =>
                        go(
                          `/admin/patients?search=${encodeURIComponent(item.patientId)}`,
                        )
                      }
                    >
                      🧒{" "}
                      <span>
                        {item.patientName}
                        <small>
                          {item.patientId} · {item.parentName}
                        </small>
                      </span>
                    </button>
                  ))}
                  {results.appointments.map((item) => (
                    <button
                      type="button"
                      key={item.referenceId}
                      onClick={() =>
                        go(
                          `/admin/appointments?search=${encodeURIComponent(item.referenceId)}`,
                        )
                      }
                    >
                      📅{" "}
                      <span>
                        {item.childName}
                        <small>
                          {item.referenceId} · {item.status}
                        </small>
                      </span>
                    </button>
                  ))}
                  {results.doctors.map((item) => (
                    <button
                      type="button"
                      key={item.doctorId}
                      onClick={() =>
                        go(
                          `/admin/doctors?search=${encodeURIComponent(item.doctorId)}`,
                        )
                      }
                    >
                      🩺{" "}
                      <span>
                        Dr. {item.firstName} {item.lastName}
                        <small>
                          {item.doctorId} · {item.designation}
                        </small>
                      </span>
                    </button>
                  ))}
                </>
              ) : (
                <p>No matching clinic records.</p>
              )}
            </section>
          )}
        </div>
        <div className="admin-global-header__profile">
          <span
            className="admin-global-header__notification"
            role="img"
            aria-label="Notifications"
            title="Notifications"
          >
            🔔
          </span>
          <i aria-hidden="true">👩‍💼</i>
          <p>
            <b>Sankalp Administrator</b>
            <small>Super Admin</small>
          </p>
        </div>
      </header>
      <button
        className="admin-menu-toggle"
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="admin-sidebar"
      >
        {open ? "×" : "☰"}
        <span>Menu</span>
      </button>
      {open && (
        <button
          className="admin-sidebar-shade"
          type="button"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        id="admin-sidebar"
        className={`admin-sidebar${open ? " is-open" : ""}`}
      >
        <nav aria-label="Admin navigation">
          {menuItems.map(([icon, label, path]) =>
            path ? (
              <NavLink
                className={({ isActive }) => (isActive ? "is-active" : "")}
                to={path}
                key={label}
                onClick={() => setOpen(false)}
              >
                <span className="admin-sidebar__icon" aria-hidden="true">
                  {icon}
                </span>
                <span className="admin-sidebar__label">{label}</span>
              </NavLink>
            ) : (
              <button
                type="button"
                key={label}
                disabled
                title={`${label} will be available in the next development stage`}
              >
                <span className="admin-sidebar__icon" aria-hidden="true">
                  {icon}
                </span>
                <span className="admin-sidebar__label">{label}</span>
              </button>
            ),
          )}
        </nav>
        <button
          className="admin-sidebar__logout"
          type="button"
          onClick={onLogout}
          disabled={loggingOut}
        >
          <span className="admin-sidebar__icon" aria-hidden="true">
            ↪
          </span>
          <span>{loggingOut ? "Logging out…" : "Logout"}</span>
        </button>
      </aside>
    </>
  );
};
