import { useEffect, useState } from "react";
import Sidebar from "../components/SideBar";
import { getActiveCustomers } from "../functions/getActiveCustomers";
import type { ActiveCustomerItem } from "../functions/getActiveCustomers";

import { fetchDashboardData } from "../functions/fetchDashboardData";

function Dashboard() {
  const [totalSales, setTotalSales] = useState(0);
  const [walletTopups, setWalletTopups] = useState(0);
  const [topItems, setTopItems] = useState<string[]>([]);

  // ACTIVE customers
  const [activeCustomersCount, setActiveCustomersCount] = useState<number>(0);
  const [activeCustomersList, setActiveCustomersList] = useState<
    ActiveCustomerItem[]
  >([]);
  const [showActiveTable, setShowActiveTable] = useState<boolean>(false);
  const [daysActiveWindow, setDaysActiveWindow] = useState<number>(7); // last X days

  const [filter, setFilter] = useState("today"); // 'today' | 'week' | 'month'

  // 🧮 Fetch dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // rename fetched activeCustomers to avoid naming collision
        const {
          totalSales: fetchedTotalSales,
          activeCustomers: fetchedActiveCustomers,
          walletTopups: fetchedWalletTopups,
          topItems: fetchedTopItems,
        } = await fetchDashboardData(filter);

        setTotalSales(fetchedTotalSales);
        // Note: we're using getActiveCustomers for the "active customers (last X days)" calc,
        // but we can still keep fetchedActiveCustomers if needed elsewhere.
        setWalletTopups(fetchedWalletTopups);
        setTopItems(fetchedTopItems);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    loadDashboardData();
  }, [filter]);

  // Load active customers (last X days)
  useEffect(() => {
    const loadActive = async () => {
      try {
        const list = await getActiveCustomers(daysActiveWindow);
        setActiveCustomersCount(list.length);
        setActiveCustomersList(list);
      } catch (error) {
        console.error("Error loading active customers:", error);
      }
    };
    loadActive();
  }, [daysActiveWindow]);

  return (
    <>
      <Sidebar />
      <div className="dashboard-container">
        <h1 className="dashboard-title">Dashboard Overview</h1>

        {/* Controls: Filter for sales + Active window selector */}
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          

          <div>
            <label>
              Active window:{" "}
              <select
                value={daysActiveWindow}
                onChange={(e) => setDaysActiveWindow(Number(e.target.value))}
              >
                <option value={1}>Last 1 day</option>
                <option value={3}>Last 3 days</option>
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
              </select>
            </label>
          </div>
        </div>

        {/* 📊 Stats Grid */}
        <div className="stats-grid">
          
          <div className="stat-card">
            <div>
            <label>
              Sales filter:{" "}
              <select
                id="sales-filter"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </label>
          </div>
            <h3>
              🔢 Total Sales{" "}
              {filter === "today"
                ? "Today"
                : filter === "week"
                ? "This Week"
                : "This Month"}
            </h3>
            <p>₱{totalSales.toLocaleString()}</p>
          </div>

          <div className="stat-card">
            <h3>👥 Active Customers (Last {daysActiveWindow} days)</h3>
            <p style={{ fontSize: 22, fontWeight: 700 }}>
              {activeCustomersCount}
            </p>
            <button onClick={() => setShowActiveTable((s) => !s)}>
              {showActiveTable ? "Hide details" : "Show details"}
            </button>
          </div>

          <div className="stat-card">
            <h3>💳 Wallet Top-ups</h3>
            <p>₱{walletTopups.toLocaleString()}</p>
          </div>

          <div className="stat-card">
            <h3> Top 3 Selling Items</h3>
            <ul>
              {topItems.length > 0 ? (
                topItems.map((item, i) => <li key={i}>{item}</li>)
              ) : (
                <li>No data</li>
              )}
            </ul>
          </div>
        </div>

        {/* 📉 Graph Placeholders */}
        <div className="graphs-section">
          <div className="graph-card">
            <h3>📊 Sales Trend</h3>
            <div className="graph-placeholder">[Graph Placeholder]</div>
          </div>

          <div className="graph-card">
            <h3>📈 New vs Returning Customers</h3>
            <div className="graph-placeholder">[Graph Placeholder]</div>
          </div>
        </div>

        {/* Active customers table (expandable) */}
        {showActiveTable && (
          <div className="active-table" style={{ marginTop: 20 }}>
            <h3>Active Customers (Last {daysActiveWindow} days)</h3>
            {activeCustomersList.length === 0 ? (
              <p>No active customers in this period.</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: 8 }}>
                      Name / Email
                    </th>
                    <th style={{ textAlign: "left", padding: 8 }}>
                      Last Transaction
                    </th>
                    <th style={{ textAlign: "left", padding: 8 }}>
                      Total Transactions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {activeCustomersList.map((c) => (
                    <tr key={c.id}>
                      <td style={{ padding: 8 }}>
                        {c.name || c.email || c.id}
                      </td>
                      <td style={{ padding: 8 }}>
                        {c.lastTransaction instanceof Date
                          ? c.lastTransaction.toLocaleString()
                          : String(c.lastTransaction)}
                      </td>
                      <td style={{ padding: 8 }}>{c.totalTransactions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* 🎁 Personalized Offer Section (if you plan to re-add) */}
      </div>
    </>
  );
}

export default Dashboard;
