import { useEffect, useState } from "react";
import Sidebar from "../components/SideBar";
import { getActiveCustomers } from "../functions/getActiveCustomers";
import type { ActiveCustomerItem } from "../functions/getActiveCustomers";
import TransactionsList from "./TransactionsList";
import { listenToWalletRequestStats } from "../functions/getWalletRequestStats";
import { fetchDashboardData } from "../functions/fetchDashboardData";

function Dashboard() {
  const [totalSales, setTotalSales] = useState(0);
  const [walletTopups, setWalletTopups] = useState(0);
  const [topItems, setTopItems] = useState<string[]>([]);

  // 🧮 Wallet stats (real-time)
  const [walletStats, setWalletStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });

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
        const {
          totalSales: fetchedTotalSales,
          activeCustomers: fetchedActiveCustomers,
          walletTopups: fetchedWalletTopups,
          topItems: fetchedTopItems,
        } = await fetchDashboardData(filter);

        setTotalSales(fetchedTotalSales);
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

  // 💰 Real-time wallet request listener
  useEffect(() => {
    const unsubscribe = listenToWalletRequestStats((stats) => {
      setWalletStats(stats);
    });

    return () => unsubscribe(); // cleanup listener
  }, []);

  return (
    <>
      <Sidebar />
      <div className="dashboard-container">
        <h1 className="dashboard-title">Dashboard Overview</h1>

        {/* Controls */}
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
            <h3>
              Total Sales{" "}
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

          {/* 💰 Wallet Top-ups (real-time) */}
          <div className="stat-card">
            <h3>💸 Wallet Top-ups</h3>
            <p>Total Requests: {walletStats.total}</p>
            <p>✅ Approved: {walletStats.approved}</p>
            <p>🕒 Pending: {walletStats.pending}</p>
            <p>❌ Rejected: {walletStats.rejected}</p>
          </div>

          <div className="stat-card">
            <h3>🏆 Top 3 Selling Items</h3>
            <ul>
              {topItems.length > 0 ? (
                topItems.map((item, i) => <li key={i}>{item}</li>)
              ) : (
                <li>No data</li>
              )}
            </ul>
          </div>
        </div>

        <TransactionsList />
      </div>
    </>
  );
}

export default Dashboard;
