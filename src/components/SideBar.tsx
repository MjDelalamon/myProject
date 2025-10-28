import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../Firebase/firebaseConfig";


function Sidebar() {
  const [hidden, setHidden] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // 🔴 Realtime listener for pending wallet requests
  useEffect(() => {
    const q = query(collection(db, "walletRequests"), where("status", "==", "pending"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPendingCount(snapshot.size);
    });
    return () => unsubscribe();
  }, []);

  return (
    <>
      {/* Sidebar (slides out/in based on .hidden) */}
      <aside className={`sidebar ${hidden ? "hidden" : ""}`} aria-hidden={hidden}>
        <h2 className="sidebar-title">Admin Panel</h2>

        <nav className="sidebar-nav">
          {/* Main Section */}
          <NavLink to="/dashboard" className={({ isActive }) => (isActive ? "sidebar-link active" : "sidebar-link")}>
            Dashboard
          </NavLink>
          <div className="sidebar-separator"></div>

          {/* Customers/Orders */}
          <NavLink to="/customers" className={({ isActive }) => (isActive ? "sidebar-link active" : "sidebar-link")}>
            Customers
          </NavLink>

          <div className="sidebar-separator"></div>

          {/* Rewards/Menu */}
          <NavLink to="/rewards" className={({ isActive }) => (isActive ? "sidebar-link active" : "sidebar-link")}>
            Rewards
          </NavLink>
          <NavLink to="/menu" className={({ isActive }) => (isActive ? "sidebar-link active" : "sidebar-link")}>
            Menu
          </NavLink>

          <div className="sidebar-separator"></div>

          {/* Wallet/Feedback */}
          <NavLink to="/wallet" className={({ isActive }) => (isActive ? "sidebar-link active wallet-link" : "sidebar-link wallet-link")}>
            Wallet Requests
            {pendingCount > 0 && (
              <span className="notification-badge">{pendingCount}</span>
            )}
          </NavLink>

          <NavLink to="/feedback" className={({ isActive }) => (isActive ? "sidebar-link active" : "sidebar-link")}>
            Feedback
          </NavLink>
          <div className="sidebar-separator"></div>

          {/* Transactions */}
          <NavLink to="/transactions" className={({ isActive }) => (isActive ? "sidebar-link active" : "sidebar-link")}>
            Transactions
          </NavLink>

          <div className="sidebar-separator"></div>

          {/* Logout */}
          <NavLink to="/" className={({ isActive }) => (isActive ? "sidebar-link active" : "sidebar-link")}>
            Logout
          </NavLink>
        </nav>
      </aside>

      {/* Toggle button */}
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
