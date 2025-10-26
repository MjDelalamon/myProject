import { useEffect, useState } from "react";
import Sidebar from "../components/SideBar";
import { fetchDashboardData } from "../functions/fetchDashboardData";
import "../Style/Dashboard.css";
import TransactionsList from "./TransactionsList";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  Cell,
  PieChart,
  Pie,
} from "recharts";

function Dashboard() {
  const [totalSales, setTotalSales] = useState(0);
  const [topCategories, setTopCategories] = useState<{ name: string; count: number }[]>([]);
  const [dailyPaymentData, setDailyPaymentData] = useState<any[]>([]);
  const [paymentBreakdown, setPaymentBreakdown] = useState<any[]>([]);
  const [topupChartData, setTopupChartData] = useState<any[]>([
    { name: "Pending", value: 0 },
    { name: "Approved", value: 0 },
    { name: "Rejected", value: 0 },
  ]);
  const [filter, setFilter] = useState("today");

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const {
          totalSales,
          topCategories,
          dailyPaymentData,
          paymentBreakdown,
          topupRequests,
        } = await fetchDashboardData(filter);

        setTotalSales(totalSales || 0);
        setTopCategories(topCategories || []);
        setDailyPaymentData(dailyPaymentData || []);
        setPaymentBreakdown(paymentBreakdown || []);

        // 🧭 Ensure topupRequests is always defined and in correct format
        const formattedTopups = Object.entries(topupRequests || {}).map(([name, value]) => ({
          name,
          value: value ?? 0,
        }));

        // ✅ If no data exists, show placeholder data
        if (formattedTopups.length === 0) {
          setTopupChartData([
            { name: "Pending", value: 0 },
            { name: "Approved", value: 0 },
            { name: "Rejected", value: 0 },
          ]);
        } else {
          setTopupChartData(formattedTopups);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        // 🧩 Show fallback data on error
        setTopupChartData([
          { name: "Pending", value: 0 },
          { name: "Approved", value: 0 },
          { name: "Rejected", value: 0 },
        ]);
      }
    };
    loadDashboardData();
  }, [filter]);

  const COLORS = ["#b17a50", "#d4a373", "#a46a3b", "#c08457", "#8b5e3c", "#e2c29d"];

  // Extract all payment methods dynamically
  const paymentMethods =
    dailyPaymentData.length > 0
      ? Object.keys(
          dailyPaymentData.reduce((acc, cur) => ({ ...acc, ...cur }), {})
        ).filter((key) => key !== "date")
      : [];

  return (
    <>
      <Sidebar />
      <div className="dashboard-container">
        <h1 className="dashboard-title">Dashboard Overview</h1>

        {/* 🔽 Filter Section */}
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
          <label>
            Sales Filter:{" "}
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </label>
        </div>

        {/* 📊 Graphs Section */}
        <div className="graphs-section">

          {/* 📈 Total Sales Chart */}
          <div className="graph-card">
            
            <h3>Total Sales Overview: <strong>{totalSales}</strong></h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart
                data={[
                  {
                    name:
                      filter === "today"
                        ? "Today"
                        : filter === "week"
                        ? "This Week"
                        : "This Month",
                    sales: totalSales,
                  },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="sales" stroke="#b17a50" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 🍩 Payment Method Breakdown */}
          <div className="graph-card">
            <h3>Payment Method Breakdown</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={paymentBreakdown}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  label
                >
                  {paymentBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* 💸 Wallet Top-up Requests Status */}
         

          {/* 🏆 Top Selling Categories */}
          <div className="graph-card">
            <h3>Top Selling Categories: {filter}</h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                layout="vertical"
                data={topCategories}
                margin={{ top: 20, right: 30, left: 50, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={140}
                  tick={{ fontSize: 14, fill: "#4b2e16" }}
                />
                <Tooltip />
                <Bar dataKey="count" fill="#a46a3b" barSize={25}>
                  {topCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 📊 Daily Payment Method Breakdown */}
          <div className="graph-card">
            <h3>Daily Payment Method Breakdown</h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={dailyPaymentData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                {paymentMethods.map((method, index) => (
                  <Bar
                    key={method}
                    dataKey={method}
                    stackId="a"
                    fill={COLORS[index % COLORS.length]}
                    barSize={40}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <TransactionsList />
    </>
  );
}

export default Dashboard;
