import { useState } from "react";
import { NavLink } from "react-router-dom";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

function Sidebar() {
  const [hidden, setHidden] = useState(false);



  return (
    <>
      {/* Sidebar (slides out/in based on .hidden) */}
      <aside
        className={`sidebar ${hidden ? "hidden" : ""}`}
        aria-hidden={hidden}
      >
        <h2 className="sidebar-title">Admin Panel</h2>

        <nav className="sidebar-nav">
  {/* Main Section */}
  <NavLink to="/dashboard" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>Dashboard</NavLink>
  <div className="sidebar-separator"></div>

  {/* Customers/Orders */}
  <NavLink to="/customers" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>Customers</NavLink>
  <NavLink to="/orders" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>Orders</NavLink>
  
  <div className="sidebar-separator"></div>

  {/* Rewards/Menu */}
  <NavLink to="/rewards" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>Rewards</NavLink>
  <NavLink to="/menu" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>Menu</NavLink>
  <div className="sidebar-separator"></div>

  {/* Wallet/Feedback */}
  <NavLink to="/wallet" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>Wallet Requests</NavLink>
  <NavLink to="/feedback" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>Feedback</NavLink>
  <div className="sidebar-separator"></div>

  {/* Transactions/Notifications/Settings */}
  <NavLink to="/transactions" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>Transactions</NavLink>
  <NavLink to="/notifications" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>Notifications</NavLink>
  <NavLink to="/settings" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>Settings</NavLink>
  <div className="sidebar-separator"></div>

  {/* Logout */}
  <NavLink to="/" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>Logout</NavLink>
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
