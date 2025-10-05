import { Link } from "react-router-dom";

function SidebarStaff() {
  return (
    <>
      <div className="sidebar">
        <h2 className="sidebar-title">Staff Panel</h2>
        <nav className="sidebar-nav">
          <Link to="/take-order" className="sidebar-link">
            Take Order
          </Link>
          <Link to="/orders" className="sidebar-link">
            -
          </Link>
          <Link to="/rewards" className="sidebar-link">
            -
          </Link>
          <Link to="/menu" className="sidebar-link">
            -
          </Link>
          <Link to="/wallet" className="sidebar-link">
            -
          </Link>
          <Link to="/feedback" className="sidebar-link">
            -
          </Link>
          <Link to="/notifications" className="sidebar-link">
            -
          </Link>
          <Link to="/settings" className="sidebar-link">
            Settings
          </Link>
          <Link to="/" className="sidebar-link">
            Logout
          </Link>
        </nav>
      </div>
    </>
  );
}

export default SidebarStaff;
