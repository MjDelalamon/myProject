import Sidebar from "../components/SideBar";

function Dashboard() {
  return (
    <>
      <Sidebar />
      <div className="dashboard-container">
        <h1 className="dashboard-title">Dashboard Overview</h1>

        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Sales Today</h3>
            <p>₱12,430</p>
          </div>
          <div className="stat-card">
            <h3>Active Customers</h3>
            <p>158</p>
          </div>
          <div className="stat-card">
            <h3>Top-up Wallet Stats</h3>
            <p>₱5,200 added</p>
          </div>
          <div className="stat-card">
            <h3>Top 3 Selling Items</h3>
            <ul>
              <li>Caramel Macchiato</li>
              <li>Chocolate Cake</li>
              <li>Ham & Cheese Sandwich</li>
            </ul>
          </div>
        </div>

        <div className="graphs-section">
          <div className="graph-card">
            <h3>Sales Trend</h3>
            <div className="graph-placeholder">[Graph Placeholder]</div>
          </div>
          <div className="graph-card">
            <h3>New vs Returning Customers</h3>
            <div className="graph-placeholder">[Graph Placeholder]</div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Dashboard;
