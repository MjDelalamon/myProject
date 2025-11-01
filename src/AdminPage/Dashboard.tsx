import { useEffect, useState } from "react";
import Sidebar from "../components/SideBar";
import { fetchDashboardData } from "../functions/fetchDashboardData";
import "../Style/Dashboard.css";

import { updateCustomerActivity } from "../functions/updateCustomerActivity";
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

  const [topCustomers, setTopCustomers] = useState<any[]>([]); // 🏆 Top Customers

  // 🟤 Modal states
  const [showModal, setShowModal] = useState(false);
  const [newRequestName, setNewRequestName] = useState("");

  // 🟢 Main Dashboard Loader
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

        // ✅ Loop through all customers and update each one's activity
        const customersSnap = await getDocs(collection(db, "customers"));
        for (const customerDoc of customersSnap.docs) {
          await updateCustomerActivity(customerDoc.id);
        }

        console.log("✅ All customer activities updated successfully!");

        // 🏆 Fetch and compute Top Customers
        const topCustomersData = customersSnap.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((cust: any) => cust.totalTransactions > 0)
          .sort((a: any, b: any) => b.totalTransactions - a.totalTransactions)
          .slice(0, 5); // top 5

        setTopCustomers(topCustomersData);

      } catch (error) {
        console.error("❌ Error fetching dashboard data:", error);
      }
    };

    loadDashboardData();
  }, [filter]);

  // 🟢 Realtime listener for wallet request counts
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

  const COLORS = ["#f84f00ff", "#f2ff00ff", "#f30010ff", "#00e1ffff", "#0008fdff", "#ff00f2ff"];

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
            <h3>
              Total Sales Overview: <strong>{totalSales.toLocaleString()}</strong>
            </h3>
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
                <YAxis tickFormatter={(value) => value.toLocaleString()} />
                <Tooltip formatter={(value) => value.toLocaleString()} />
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
                <Tooltip formatter={(value) => value.toLocaleString()} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

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
                <YAxis tickFormatter={(value) => value.toLocaleString()} allowDecimals={false} />
                <Tooltip formatter={(value) => value.toLocaleString()} />
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
                data={topCategories}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 14, fill: "#4b2e16" }} />
                <YAxis tickFormatter={(value) => value.toLocaleString()} />
                <Tooltip formatter={(value) => value.toLocaleString()} />
                <Bar dataKey="count" fill="#a46a3b" barSize={40}>
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
                <YAxis tickFormatter={(value) => value.toLocaleString()} />
                <Tooltip formatter={(value) => value.toLocaleString()} />
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
                <YAxis tickFormatter={(value) => value.toLocaleString()} />
                <Tooltip formatter={(value) => value.toLocaleString()} />
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
        <br />
        {/* 🏆 Top Customers Table */}
          <div className="graph-card">
            <h3>🏆 Top Customers</h3>
            <table className="top-customers-table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#e7d5c3" }}>
                  <th style={{ padding: "8px" }}>#</th>
                  <th style={{ padding: "8px" }}>Name</th>
                  <th style={{ padding: "8px" }}>Tier</th>
                  <th style={{ padding: "8px" }}>Total Transactions</th>
                  <th style={{ padding: "8px" }}>Last Visit</th>
                  <th style={{ padding: "8px" }}>favorite Category</th>
                  <th style={{ padding: "8px" }}>Total Visit </th>

                </tr>
              </thead>
              <tbody>
  {topCustomers.length > 0 ? (
    topCustomers.map((cust, index) => {
      let medal: string | number = "";
      if (index === 0) medal = "🥇";
      else if (index === 1) medal = "🥈";
      else if (index === 2) medal = "🥉";
      else medal = index + 1;

      return (
        <tr key={cust.id}>
          <td style={{ textAlign: "center", fontSize: "1.3rem" }}>
            {medal} 
          </td>
          <td>{cust.fullName || "N/A"}</td>
          <td>{cust.tier || "N/A"}</td>
          <td style={{ textAlign: "center" }}>
            {cust.totalTransactions?.toLocaleString() || 0}
          </td>
          <td>
            {cust.lastVisit
              ? new Date(cust.lastVisit.seconds * 1000).toLocaleDateString()
              : "—"}
          </td>
          <td>{cust.favoriteCategory || "N/A"}</td>
          <td style={{ textAlign: "center" }}>
            {cust.totalVisits?.toLocaleString() || 0}
          </td>
        </tr>
      );
    })
  ) : (
    <tr>
      <td colSpan={7} style={{ textAlign: "center", padding: "10px" }}>
        No data available
      </td>
    </tr>
  )}
</tbody>

            </table>
          </div>
      </div>

      {/* 🟤 Modal Notification */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2>🪙 New Pending Wallet Request!</h2>
            <p>{newRequestName}</p>
            <button
              onClick={() => setShowModal(false)}
              style={{ background: "#763f00ff", color: "white" }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default Dashboard;
