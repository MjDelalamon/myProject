import { useState } from "react";
import { NavLink } from "react-router-dom";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

function Sidebar() {
  const [hidden, setHidden] = useState(false);

  const links = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/customers", label: "Customers" },
    { to: "/orders", label: "Orders" },
    { to: "/rewards", label: "Rewards" },
    { to: "/menu", label: "Menu" },
    { to: "/wallet", label: "Wallet Requests" },
    { to: "/feedback", label: "Feedback" },
    { to: "/notifications", label: "Notifications" },
    { to: "/settings", label: "Settings" },
    { to: "/", label: "Logout" },
  ];

  return (
    <>
      {/* Sidebar (slides out/in based on .hidden) */}
      <aside
        className={`sidebar ${hidden ? "hidden" : ""}`}
        aria-hidden={hidden}
      >
        <h2 className="sidebar-title">Admin Panel</h2>

        <nav className="sidebar-nav">
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                isActive ? "sidebar-link active" : "sidebar-link"
              }
              tabIndex={hidden ? -1 : 0}
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Toggle button with icons */}
      <button
        className="toggle-btn"
        onClick={() => setHidden((s) => !s)}
        aria-pressed={!hidden}
        aria-label={hidden ? "Open sidebar" : "Close sidebar"}
      >
        {hidden ? <FiChevronRight size={20} /> : <FiChevronLeft size={20} />}
      </button>
    </>
  );
}

export default Sidebar;
