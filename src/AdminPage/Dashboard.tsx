import { useEffect, useState, useMemo } from "react";
import Sidebar from "../components/SideBar";
import { fetchDashboardData } from "../functions/fetchDashboardData";
import "../Style/Dashboard.css";

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
  const [filteredTopCustomers, setFilteredTopCustomers] = useState<any[]>([]);
  const [salesTrendData, setSalesTrendData] = useState<any[]>([]); // 📈 NEW

  const [topupChartData, setTopupChartData] = useState<any[]>([
    { name: "Pending", value: 0 },
    { name: "Approved", value: 0 },
    { name: "Rejected", value: 0 },
  ]);
  const [promoTypeData, setPromoTypeData] = useState<any[]>([]);
  // filter replaced by start/end date range
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));

  const [topCustomers, setTopCustomers] = useState<any[]>([]); // 🏆 Top Customers

  // 🟤 Modal states
  const [showModal, setShowModal] = useState(false);
  const [newRequestName, setNewRequestName] = useState("");

  // 🟢 Main Dashboard Loader (now depends on startDate & endDate)
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const {
          totalSales,
          topCategories,
          dailyPaymentData,
          paymentBreakdown,
        } = await fetchDashboardData({ startDate, endDate });

        setTotalSales(totalSales || 0);
        setTopCategories(topCategories || []);
        setDailyPaymentData(dailyPaymentData || []);
        setPaymentBreakdown(paymentBreakdown || []);

        // --- NEW: Compute sales trend data (like TransactionsList) ---
        const aggregateSalesTrend = async () => {
          const txSnap = await getDocs(collection(db, "transactions"));

          // normalize range to Date objects (start at 00:00:00, end at 23:59:59.999)
          let s: Date | null = startDate ? new Date(startDate) : null;
          let e: Date | null = endDate ? new Date(endDate) : null;
          if (s) s.setHours(0, 0, 0, 0);
          if (e) e.setHours(23, 59, 59, 999);

          const withinRange = (d: Date) => {
            if (!s && !e) return true;
            if (s && d < s) return false;
            if (e && d > e) return false;
            return true;
          };

          const grouped: Record<string, number> = {};
          txSnap.forEach((docSnap) => {
            const d = docSnap.data();
            const dateObj = d.date?.toDate?.() || new Date(d.date || Date.now());
            if (!withinRange(dateObj)) return;
            
            const status = d.status || "Completed";
            if (status !== "Completed") return;

            const date = dateObj.toLocaleDateString();
            const amount = Number(d.amount || 0);
            grouped[date] = (grouped[date] || 0) + amount;
          });

          const trendArray = Object.keys(grouped)
            .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
            .map((date) => ({
              date,
              totalSales: grouped[date],
            }));

          setSalesTrendData(trendArray);
        };

        await aggregateSalesTrend();
        // --- END NEW ---

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

        // ✅ Fetch Top Customers directly from topCustomers collection
        const topSnap = await getDocs(collection(db, "topCustomers"));
        const topData = topSnap.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => a.rank - b.rank); // ensure correct order

        setTopCustomers(topData);

        // --- NEW: compute top customers based on selected date range ---
        const aggregateTopCustomersByRange = async () => {
          const txSnap = await getDocs(collection(db, "transactions"));
          const customersSnap = await getDocs(collection(db, "customers")); // 🆕 fetch customer docs

          // Create a map of customerId -> customer data for enrichment
          const customerMap = new Map();
          customersSnap.forEach((doc) => {
            customerMap.set(doc.id, doc.data());
          });

          // normalize range to Date objects (start at 00:00:00, end at 23:59:59.999)
          let s: Date | null = startDate ? new Date(startDate) : null;
          let e: Date | null = endDate ? new Date(endDate) : null;
          if (s) s.setHours(0, 0, 0, 0);
          if (e) e.setHours(23, 59, 59, 999);

          const withinRange = (d: Date) => {
            if (!s && !e) return true;
            if (s && d < s) return false;
            if (e && d > e) return false;
            return true;
          };

          const map = new Map<string, any>();

          txSnap.forEach((docSnap) => {
            const d = docSnap.data();
            const dateObj = d.date?.toDate?.() || new Date(d.date || Date.now());
            const status = d.status || "Completed";
            if (!withinRange(dateObj)) return;
            if (status !== "Completed") return;

            const customerId = d.customerId || d.customerUid || null;
            const customerKey = customerId || (d.customerEmail || d.customerName || `guest:${docSnap.id}`);

            const entry = map.get(customerKey) || {
              id: customerId || null,
              fullName: d.customerName || d.customerEmail || "Unknown",
              totalTransactions: 0,
              totalPointsEarned: 0,
              totalSpent: 0,
              categories: {},
              visitDates: new Set<string>(),
            };

            entry.totalTransactions += 1;
            entry.totalPointsEarned += Number(d.pointsEarned || 0);
            entry.totalSpent += Number(d.amount || 0);

            if (Array.isArray(d.items)) {
              d.items.forEach((it: any) => {
                const cat = it.category || "Uncategorized";
                entry.categories[cat] = (entry.categories[cat] || 0) + 1;
              });
            } else if (d.category) {
              entry.categories[d.category] = (entry.categories[d.category] || 0) + 1;
            }

            const day = dateObj.toISOString().split("T")[0];
            entry.visitDates.add(day);

            map.set(customerKey, entry);
          });

          const arr = Array.from(map.values()).map((e: any) => {
            // 🆕 Enrich with customer doc data if available
            const customerData = e.id ? customerMap.get(e.id) : null;
            const fullName = customerData?.fullName || e.fullName || "Unknown";

            const favCat = Object.entries(e.categories)
              .sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || "N/A";
            const points = Math.round(e.totalPointsEarned * 100) / 100;
            const spent = Math.round(e.totalSpent * 100) / 100;
            const tier = points >= 300 ? "Gold" : points >= 100 ? "Silver" : "Bronze";

            return {
              id: e.id,
              fullName,
              totalTransactions: e.totalTransactions,
              totalPointsEarned: points,
              totalVisits: e.visitDates.size,
              totalSpent: spent,
              favoriteCategory: favCat,
              tier,
            };
          });

          arr.sort((a, b) => {
            if (b.totalPointsEarned !== a.totalPointsEarned)
              return b.totalPointsEarned - a.totalPointsEarned;
            return b.totalSpent - a.totalSpent;
          });

          setFilteredTopCustomers(arr.slice(0, 10));
        };

        await aggregateTopCustomersByRange();
        // --- END NEW ---
      } catch (error) {
        console.error("❌ Error fetching dashboard data:", error);
      }
    };

    loadDashboardData();
  }, [startDate, endDate]);

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

  // 🟢 Sales description with color (NEW)
  const salesDescription = useMemo(() => {
    const total = salesTrendData.reduce((sum, t) => sum + t.totalSales, 0);
    if (total > 10000) return { text: "🔥 Excellent sales! Keep up the momentum.", color: "green" };
    if (total > 5000) return { text: "📊 Moderate sales, consider boosting promotions.", color: "orange" };
    if (total > 0) return { text: "⚠️ Sales are low, consider running promotions.", color: "red" };
    return { text: "No sales data available for the selected period.", color: "gray" };
  }, [salesTrendData]);

  const COLORS = ["#f83200ff", "#f2ff00ff", "#00ff48ff", "#00e1ffff", "#0008fdff", "#ff00f2ff"];

  const paymentMethods =
    dailyPaymentData.length > 0
      ? Object.keys(
          dailyPaymentData.reduce((acc, cur) => ({ ...acc, ...cur }), {})
        ).filter((key) => key !== "date")
      : [];

  // choose filtered results if available, otherwise fallback to precomputed topCustomers
  const displayCustomers = filteredTopCustomers.length > 0 ? filteredTopCustomers : topCustomers;

  return (
    <>
      <Sidebar />
      <div className="dashboard-container">
        <h1 className="dashboard-title">Dashboard Overview</h1>

        {/* 🔽 Date Range Filter Section */}
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
          <label>
            Start:{" "}
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </label>
          <label>
            End:{" "}
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </label>
        </div>

        {/* 📊 Graphs Section */}
        <div className="graphs-section">

          {/* 📈 Total Sales Chart - FULL WIDTH */}
          <div className="graph-card" style={{ gridColumn: "1 / -1" }}>
            <h3>
              Total Sales Overview: <strong>{totalSales.toLocaleString()}</strong>
            </h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={salesTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(value) => value.toLocaleString()} />
                <Tooltip formatter={(value) => value.toLocaleString()} />
                <Line type="monotone" dataKey="totalSales" stroke="#b17a50" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
            <p style={{ marginTop: "10px", fontStyle: "italic", color: salesDescription.color }}>
              {salesDescription.text}
            </p>
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
            <h3>Top Selling Categories: {startDate} - {endDate}</h3>
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
                <th style={{ padding: "8px" }}>Total Points Earned</th>
                <th style={{ padding: "8px" }}>favorite Category</th>
                <th style={{ padding: "8px" }}>Total Visit </th>
              </tr>
            </thead>
            <tbody>
              {displayCustomers.length > 0 ? (
                displayCustomers.map((cust, index) => {
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
                        {cust.totalPointsEarned?.toLocaleString() || 0}
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
