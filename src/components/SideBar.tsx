import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../Firebase/firebaseConfig";

function Sidebar() {
  const [hidden, setHidden] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [unrepliedCount, setUnrepliedCount] = useState(0); // NEW

  // 🔴 Realtime listener for pending wallet requests
  useEffect(() => {
    const q = query(collection(db, "walletRequests"), where("status", "==", "pending"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPendingCount(snapshot.size);
    });
    return () => unsubscribe();
  }, []);

  // 🟣 Realtime listener for Customer Assistance WITHOUT reply
  useEffect(() => {
    const assistanceRef = collection(db, "CustomerAssistance");

    const unsubscribe = onSnapshot(assistanceRef, (snapshot) => {
      let count = 0;

      snapshot.forEach((doc) => {
        const data = doc.data();
        const reply = data.reply;

        // Count only those with NO reply
        if (!reply || reply.trim() === "") {
          count++;
        }
      });

      setUnrepliedCount(count);
    });

    return () => unsubscribe();
  }, []);

  return (
    <>
      <aside className={`sidebar ${hidden ? "hidden" : ""}`} aria-hidden={hidden}>
        <h2 className="sidebar-title">Admin Panel</h2>

        <nav className="sidebar-nav">

          <NavLink to="/dashboard" className={({ isActive }) => 
            isActive ? "sidebar-link active" : "sidebar-link"
          }>
            Dashboard
          </NavLink>

          <div className="sidebar-separator"></div>

          <NavLink to="/customers" className={({ isActive }) => 
            isActive ? "sidebar-link active" : "sidebar-link"
          }>
            Customers
          </NavLink>

          <div className="sidebar-separator"></div>

          <NavLink to="/rewards" className={({ isActive }) => 
            isActive ? "sidebar-link active" : "sidebar-link"
          }>
            Rewards
          </NavLink>

          <NavLink to="/menu" className={({ isActive }) => 
            isActive ? "sidebar-link active" : "sidebar-link"
          }>
            Menu
          </NavLink>

          <div className="sidebar-separator"></div>

          {/* Wallet Requests */}
          <NavLink to="/wallet" className={({ isActive }) => 
            isActive ? "sidebar-link active wallet-link" : "sidebar-link wallet-link"
          }>
            Wallet Requests
            {pendingCount > 0 && (
              <span className="notification-badge">{pendingCount}</span>
            )}
          </NavLink>

          {/* Customer Assistance Count */}
          <NavLink to="/CustomerAssistance" className={({ isActive }) => 
            isActive ? "sidebar-link active" : "sidebar-link"
          }>
            {unrepliedCount > 0 && (
              <span className="notification-badge-assist">{unrepliedCount}</span>
            )}
            Customer Assistance
            
          </NavLink>

          <NavLink to="/feedback" className={({ isActive }) => 
            isActive ? "sidebar-link active" : "sidebar-link"
          }>
            Ratings
          </NavLink>

          <div className="sidebar-separator"></div>

          <NavLink to="/transactions" className={({ isActive }) => 
            isActive ? "sidebar-link active" : "sidebar-link"
          }>
            Transactions
          </NavLink>

          <div className="sidebar-separator"></div>

          <NavLink to="/" className={({ isActive }) => 
            isActive ? "sidebar-link active" : "sidebar-link"
          }>
            Logout
          </NavLink>
        </nav>
      </aside>

      <button
        className="toggle-btn"
        onClick={() => setHidden((s) => !s)}
        aria-label={hidden ? "Open sidebar" : "Close sidebar"}
      >
        {hidden ? <FiChevronRight size={20} /> : <FiChevronLeft size={20} />}
      </button>
    </>
  );
}

export default Sidebar;
