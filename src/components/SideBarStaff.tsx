import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../Firebase/firebaseConfig";



function SidebarStaff() {
  const [hidden, setHidden] = useState(false);
  const [pendingWalletCount, setPendingWalletCount] = useState(0);
  const [pendingOrderCount, setPendingOrderCount] = useState(0);

  // 🔴 Realtime listener for pending wallet requests
  useEffect(() => {
    const q = query(collection(db, "walletRequests"), where("status", "==", "pending"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPendingWalletCount(snapshot.size);
    });
    return () => unsubscribe();
  }, []);

  // 🟢 Realtime listener for pending orders
  useEffect(() => {
    const q = query(collection(db, "orders"), where("status", "==", "Pending"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPendingOrderCount(snapshot.size);
    });
    return () => unsubscribe();
  }, []);

  return (
    <>
      {/* Sidebar */}
      <aside className={`sidebar ${hidden ? "hidden" : ""}`} aria-hidden={hidden}>
        <h2 className="sidebar-title">Staff Panel</h2>

        <nav className="sidebar-nav">
          {/* Take Order */}
          <NavLink
            to="/take-order"
            className={({ isActive }) =>
              isActive ? "sidebar-link active" : "sidebar-link"
            }
          >
            Take-Order
          </NavLink>
          <div className="sidebar-separator"></div>

          {/* Promo */}
          <NavLink
            to="/promo-redemption"
            className={({ isActive }) =>
              isActive ? "sidebar-link active" : "sidebar-link"
            }
          >
            Promo
          </NavLink>

          {/* Orders (with pending badge) */}
          <NavLink
            to="/orders-staff"
            className={({ isActive }) =>
              isActive ? "sidebar-link active order-link" : "sidebar-link order-link"
            }
          >
            Orders
            {pendingOrderCount > 0 && (
              <span className="notification-badge">{pendingOrderCount}</span>
            )}
          </NavLink>

          <div className="sidebar-separator"></div>

          {/* Wallet Requests (with badge) */}
          <NavLink
            to="/wallet-staff"
            className={({ isActive }) =>
              isActive ? "sidebar-link active wallet-link" : "sidebar-link wallet-link"
            }
          >
            Wallet Requests
            {pendingWalletCount > 0 && (
              <span className="notification-badge">{pendingWalletCount}</span>
            )}
          </NavLink>

          <div className="sidebar-separator"></div>

          {/* Logout */}
          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive ? "sidebar-link active" : "sidebar-link"
            }
          >
            Logout
          </NavLink>
        </nav>
      </aside>

      {/* Toggle Button */}
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

export default SidebarStaff;
