import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Link } from "react-router-dom";
// ----------------- Types -----------------
type PaymentMethod = "GCash" | "Cash";

interface TopUpLog {
  id: string;
  method: PaymentMethod;
  amount: number;
  date: string;
}

interface CustomerWallet {
  id: string;
  name: string;
  balance: number;
  logs: TopUpLog[];
}

// ----------------- Component -----------------
const WalletSystem: React.FC = () => {
  const [wallet, setWallet] = useState<CustomerWallet>({
    id: "cust-001",
    name: "Juan Dela Cruz",
    balance: 1200,
    logs: [
      { id: "log-1", method: "GCash", amount: 500, date: "2025-08-05" },
      { id: "log-2", method: "Cash", amount: 700, date: "2025-08-06" },
    ],
  });

  const [adjustAmount, setAdjustAmount] = useState<number>(0);
  const [adjustMethod, setAdjustMethod] = useState<"add" | "subtract">("add");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("GCash");

  const handleAdjustment = () => {
    if (adjustAmount <= 0) {
      alert("Amount must be greater than 0");
      return;
    }

    const newBalance =
      adjustMethod === "add"
        ? wallet.balance + adjustAmount
        : wallet.balance - adjustAmount;

    if (newBalance < 0) {
      alert("Insufficient balance");
      return;
    }

    const newLog: TopUpLog = {
      id: uuidv4(),
      method: paymentMethod,
      amount: adjustAmount,
      date: new Date().toISOString().split("T")[0],
    };

    setWallet({
      ...wallet,
      balance: newBalance,
      logs:
        adjustMethod === "add" ? [...wallet.logs, newLog] : [...wallet.logs],
    });

    setAdjustAmount(0);
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

      <div className="wallet-container">
        <h1 className="wallet-title">💰 Wallet System</h1>

        <div className="section customer-info">
          <h2>Customer Info</h2>
          <p>
            👤 <strong>Name:</strong> {wallet.name}
          </p>
          <p>
            💳 <strong>Wallet Balance:</strong> ₱{wallet.balance.toFixed(2)}
          </p>
        </div>

        <div className="section">
          <h2>🔧 Manual Adjustment (Admin)</h2>
          <div className="form-group">
            <select
              value={adjustMethod}
              onChange={(e) =>
                setAdjustMethod(e.target.value as "add" | "subtract")
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

        <div className="section">
          <h2>📜 Top-up Logs</h2>
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
              {wallet.logs.map((log, index) => (
                <tr key={log.id}>
                  <td>{index + 1}</td>
                  <td>{log.method}</td>
                  <td>₱{log.amount.toFixed(2)}</td>
                  <td>{log.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {wallet.logs.length === 0 && (
            <p className="empty-log">No logs available.</p>
          )}
        </div>
      </div>
    </>
  );
};

export default WalletSystem;
