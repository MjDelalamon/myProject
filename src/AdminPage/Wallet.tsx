import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";

import { db } from "../Firebase/firebaseConfig";
import Sidebar from "../components/SideBar";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";

// ----------------- Types -----------------
type PaymentMethod = "GCash" | "Cash";
type AdjustMethod = "add" | "subtract";

interface TopUpLog {
  id: string;
  method: PaymentMethod;
  amount: number;
  date: string;
}

interface CustomerWallet {
  id: string;
  name: string;
  mobile: string;
  balance: number;
  logs: TopUpLog[];
}

// ----------------- Main Component -----------------
const WalletSystem: React.FC = () => {
  const [searchMobile, setSearchMobile] = useState("");
  const [customer, setCustomer] = useState<CustomerWallet | null>(null);

  const [adjustAmount, setAdjustAmount] = useState<number>(0);
  const [adjustMethod, setAdjustMethod] = useState<AdjustMethod>("add");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("GCash");

  // 🔍 Search customer by mobile number
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
      balance: data.wallet || 0,
      logs: data.logs || [],
    });
  };

  // ⚡ Adjust Wallet
  const handleAdjustment = async () => {
    if (!customer) {
      alert("Search a customer first");
      return;
    }
    if (adjustAmount <= 0) {
      alert("❌ Amount must be greater than 0");
      return;
    }

    const newBalance =
      adjustMethod === "add"
        ? customer.balance + adjustAmount
        : customer.balance - adjustAmount;

    if (newBalance < 0) {
      alert("⚠️ Insufficient balance");
      return;
    }

    const newLog: TopUpLog = {
      id: uuidv4(),
      method: paymentMethod,
      amount: adjustAmount,
      date: new Date().toISOString().split("T")[0],
    };

    // update Firestore
    const custRef = doc(db, "customers", customer.id);
    await updateDoc(custRef, {
      wallet: newBalance,
      logs: adjustMethod === "add" ? [...customer.logs, newLog] : customer.logs, // subtract doesn’t add log
    });

    // update state
    setCustomer({
      ...customer,
      balance: newBalance,
      logs: adjustMethod === "add" ? [...customer.logs, newLog] : customer.logs,
    });

    setAdjustAmount(0);
    alert("✅ Wallet updated successfully!");
  };

  return (
    <>
      <Sidebar />

      <div className="wallet-container">
        <h1 className="wallet-title">💰 Wallet System</h1>

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
                💳 <strong>Wallet Balance:</strong> ₱
                {customer.balance.toFixed(2)}
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
                  <option value="add">Add Balance</option>
                  <option value="subtract">Subtract Balance</option>
                </select>

                <select
                  value={paymentMethod}
                  onChange={(e) =>
                    setPaymentMethod(e.target.value as PaymentMethod)
                  }
                >
                  <option value="GCash">GCash</option>
                  <option value="Cash">Cash</option>
                </select>

                <input
                  type="number"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(Number(e.target.value))}
                  placeholder="Enter amount"
                />

                <button onClick={handleAdjustment} className="adjust-button">
                  Confirm Adjustment
                </button>
              </div>
            </div>

            {/* 📜 Logs */}
            <div className="section">
              <h2>📜 Top-up Logs</h2>
              {customer.logs.length > 0 ? (
                <table className="logs-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Method</th>
                      <th>Amount</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...customer.logs]
                      .sort((a, b) => (a.date < b.date ? 1 : -1))
                      .map((log, index) => (
                        <tr key={log.id}>
                          <td>{index + 1}</td>
                          <td>{log.method}</td>
                          <td>₱{log.amount.toFixed(2)}</td>
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

export default WalletSystem;
