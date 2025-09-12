// Layout.tsx
import { useState } from "react";
import Sidebar from "./SideBar";
import { Outlet } from "react-router-dom";
import { FiMenu } from "react-icons/fi"; // hamburger icon

function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="layout">
      {/* Header with burger */}
      <header className="header">
        <button
          className="burger-btn"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <FiMenu size={24} />
        </button>
      </header>

      {/* Sidebar */}
      {isSidebarOpen && <Sidebar />}

      {/* Page content */}
      <main className={`page-content ${isSidebarOpen ? "shifted" : ""}`}>
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
