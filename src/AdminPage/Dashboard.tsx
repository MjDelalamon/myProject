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
import { collection, getDocs, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../Firebase/firebaseConfig";

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
  const [promoTypeData, setPromoTypeData] = useState<any[]>([]);
  const [filter, setFilter] = useState("today");

  // 🟤 Modal states
  const [showModal, setShowModal] = useState(false);
  const [newRequestName, setNewRequestName] = useState("");

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const {
          totalSales,
          topCategories,
          dailyPaymentData,
          paymentBreakdown,
        } = await fetchDashboardData(filter);

        setTotalSales(totalSales || 0);
        setTopCategories(topCategories || []);
        setDailyPaymentData(dailyPaymentData || []);
        setPaymentBreakdown(paymentBreakdown || []);

        // ⭐ Fetch promoType data from Firestore
        const promoSnap = await getDocs(collection(db, "globalTransactions"));
        const promoCounts: Record<string, number> = {};

        promoSnap.forEach((doc) => {
          const data = doc.data();
          if (data.promotype) {
            const type = data.promotype.trim();
            promoCounts[type] = (promoCounts[type] || 0) + 1;
          }
        });

        const promoArray = Object.keys(promoCounts).map((key) => ({
          name: key,
          count: promoCounts[key],
        }));

        setPromoTypeData(promoArray);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };
    loadDashboardData();
  }, [filter]);

  // 🟢 NEW: Realtime listener for wallet request counts
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "walletRequests"), (snapshot) => {
      let pending = 0;
      let approved = 0;
      let rejected = 0;

      snapshot.forEach((doc) => {
        const data = doc.data();
        const status = data.status?.toLowerCase();

        if (status === "pending") pending++;
        else if (status === "approved") approved++;
        else if (status === "rejected") rejected++;
      });

      setTopupChartData([
        { name: "Pending", value: pending },
        { name: "Approved", value: approved },
        { name: "Rejected", value: rejected },
      ]);
    });

    return () => unsubscribe();
  }, []);

  // 🟤 Realtime listener for new pending wallet requests (for modal)
  useEffect(() => {
    const q = query(collection(db, "walletRequests"), where("status", "==", "pending"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const latestDoc = snapshot.docs[0].data();
        if (latestDoc?.email) {
          setNewRequestName(latestDoc.email);
          setShowModal(true);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const COLORS = ["#b17a50", "#d4a373", "#a46a3b", "#c08457", "#8b5e3c", "#e2c29d"];

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

          {/* 🟤 Wallet Request Status Chart */}
          {/* 🟤 Wallet Request Status Chart */}
<div className="graph-card">
  <h3>Wallet Request Status</h3>
  <ResponsiveContainer width="100%" height={280}>
    <BarChart
      data={topupChartData}
      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis allowDecimals={false} />
      <Tooltip />
      <Legend />
      <Bar dataKey="value" barSize={60}>
        {topupChartData.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Bar>
    </BarChart>
  </ResponsiveContainer>
</div>


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

          {/* 🧁 Promo Type Analysis Chart */}
          <div className="graph-card">
            <h3>Most Availed Promos by Type</h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={promoTypeData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#c08457" barSize={40}>
                  {promoTypeData.map((entry, index) => (
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

      {/* 🟤 Modal Notification */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2>🪙 New Pending Wallet Request!</h2>
            <p><strong>{newRequestName}</strong> just submitted a new wallet request.</p>
            <button onClick={() => setShowModal(false)}
             style={{  background:"#763f00ff",color:"white"  }}
              >Close</button>
          </div>
        </div>
      )}
    </>
  );
}

export default Dashboard;
