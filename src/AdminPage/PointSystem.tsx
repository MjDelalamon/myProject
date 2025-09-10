import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Link } from "react-router-dom";
import { db } from "../Firebase/firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";

// ----------------- Types -----------------
type AdjustMethod = "add" | "subtract";

interface PointsLog {
  id: string;
  action: AdjustMethod;
  amount: number;
  date: string;
}

interface CustomerPoints {
  id: string;
  name: string;
  mobile: string;
  points: number;
  pointsLogs: PointsLog[];
}

// ----------------- Main Component -----------------
const PointsSystem: React.FC = () => {
  const [searchMobile, setSearchMobile] = useState("");
  const [customer, setCustomer] = useState<CustomerPoints | null>(null);

  const [adjustAmount, setAdjustAmount] = useState<number>(0);
  const [adjustMethod, setAdjustMethod] = useState<AdjustMethod>("add");

  // 🔍 Search customer by mobile
  const handleSearch = async () => {
    if (!searchMobile.trim()) {
      alert("Enter a mobile number to search");
      return;
    }

    const q = query(
      collection(db, "customers"),
      where("mobile", "==", searchMobile.trim())
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      alert("❌ Customer not found");
      setCustomer(null);
      return;
    }

    const docData = snapshot.docs[0];
    const data = docData.data();

    setCustomer({
      id: docData.id,
      name: data.name,
      mobile: data.mobile,
      points: data.points || 0,
      pointsLogs: data.pointsLogs || [],
    });
  };

  // ⚡ Adjust Points
  const handleAdjustment = async () => {
    if (!customer) {
      alert("Search a customer first");
      return;
    }
    if (adjustAmount <= 0) {
      alert("❌ Points must be greater than 0");
      return;
    }

    const newPoints =
      adjustMethod === "add"
        ? customer.points + adjustAmount
        : customer.points - adjustAmount;

    if (newPoints < 0) {
      alert("⚠️ Not enough points to subtract");
      return;
    }

    const newLog: PointsLog = {
      id: uuidv4(),
      action: adjustMethod,
      amount: adjustAmount,
      date: new Date().toISOString().split("T")[0],
    };

    // Update Firestore
    const custRef = doc(db, "customers", customer.id);
    await updateDoc(custRef, {
      points: newPoints,
      pointsLogs: [...customer.pointsLogs, newLog],
    });

    // Update local state
    setCustomer({
      ...customer,
      points: newPoints,
      pointsLogs: [...customer.pointsLogs, newLog],
    });

    setAdjustAmount(0);
    alert("✅ Points updated successfully!");
  };

  return (
    <>
      <div className="sidebar">
        <h2 className="sidebar-title">Admin Panel</h2>
        <nav className="sidebar-nav">
          {[
            { path: "/dashboard", label: "Dashboard" },
            { path: "/customers", label: "Customers" },
            { path: "/orders", label: "Orders" },
            { path: "/rewards", label: "Rewards" },
            { path: "/menu", label: "Menu" },
            { path: "/wallet", label: "Wallet" },
            { path: "/points", label: "Points" },
            { path: "/feedback", label: "Feedback" },
            { path: "/notifications", label: "Notifications" },
            { path: "/settings", label: "Settings" },
            { path: "/", label: "Logout" },
          ].map((item) => (
            <Link to={item.path} key={item.label} className="sidebar-link">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="points-container">
        <h1 className="points-title">⭐ Points System</h1>

        {/* 🔍 Search Customer */}
        <div className="section">
          <h2>Search Customer</h2>
          <input
            type="text"
            value={searchMobile}
            onChange={(e) => setSearchMobile(e.target.value)}
            placeholder="Enter mobile number"
          />
          <button onClick={handleSearch}>Search</button>
        </div>

        {/* 👤 Customer Info */}
        {customer && (
          <>
            <div className="section customer-info">
              <h2>Customer Info</h2>
              <p>
                👤 <strong>Name:</strong> {customer.name}
              </p>
              <p>
                📱 <strong>Mobile:</strong> {customer.mobile}
              </p>
              <p>
                ⭐ <strong>Points:</strong> {customer.points.toFixed(2)}
              </p>
            </div>

            {/* 🔧 Adjustment */}
            <div className="section">
              <h2>🔧 Manual Adjustment (Admin)</h2>
              <div className="form-group">
                <select
                  value={adjustMethod}
                  onChange={(e) =>
                    setAdjustMethod(e.target.value as AdjustMethod)
                  }
                >
                  <option value="add">Add Points</option>
                  <option value="subtract">Subtract Points</option>
                </select>

                <input
                  type="number"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(Number(e.target.value))}
                  placeholder="Enter points"
                />

                <button onClick={handleAdjustment} className="adjust-button">
                  Confirm Adjustment
                </button>
              </div>
            </div>

            {/* 📜 Logs */}
            <div className="section">
              <h2>📜 Points Logs</h2>
              {customer.pointsLogs.length > 0 ? (
                <table className="logs-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Action</th>
                      <th>Amount</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...customer.pointsLogs]
                      .sort((a, b) => (a.date < b.date ? 1 : -1))
                      .map((log, index) => (
                        <tr key={log.id}>
                          <td>{index + 1}</td>
                          <td>
                            {log.action === "add"
                              ? "➕ Added"
                              : "➖ Subtracted"}
                          </td>
                          <td>{log.amount}</td>
                          <td>{log.date}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              ) : (
                <p className="empty-log">No logs available.</p>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default pointsSystem;
