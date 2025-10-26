import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import SidebarStaff from "../components/SideBarStaff";
import { db } from "../Firebase/firebaseConfig";
import "../Style/Wallet.css";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  onSnapshot,
  deleteDoc,
} from "firebase/firestore";

// ----------------- Types -----------------
type PaymentMethod = "GCash" | "Cash";

interface TopUpLog {
  id: string;
  method: PaymentMethod | "Over The Counter";
  amount: number;
  date: string;
  type: string; // "manual" or "request"
}

interface CustomerWallet {
  id: string;
  email: string;
  mobile: string;
  balance: number;
  logs: TopUpLog[];
}

interface WalletRequest {
  id: string;
  email: string;
  referenceNo: string;
  status: string;
  createdAt?: any;
}

// ----------------- Main Component -----------------
const WalletPageStaff: React.FC = () => {
  const [searchMobile, setSearchMobile] = useState("");
  const [customer, setCustomer] = useState<CustomerWallet | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("GCash");
  const [walletRequests, setWalletRequests] = useState<WalletRequest[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalAmount, setModalAmount] = useState<number>(0);
  const [selectedRequest, setSelectedRequest] = useState<WalletRequest | null>(null);
  const [filterStatus, setFilterStatus] = useState<"pending" | "approved">("pending"); // default filter

  // Load all wallet requests
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "walletRequests"), (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as WalletRequest[];
      setWalletRequests(list);
    });
    return () => unsubscribe();
  }, []);

  // ----------------- Customer Search -----------------
  const handleSearch = async () => {
    if (!searchMobile.trim()) {
      alert("Enter a mobile number to search");
      return;
    }
    const q = query(collection(db, "customers"), where("mobile", "==", searchMobile.trim()));
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
      email: data.email,
      mobile: data.mobile,
      balance: data.wallet || 0,
      logs: data.logs || [],
    });
  };

  // ----------------- Manual Wallet Adjustment -----------------
  const handleAdjustment = async () => {
    if (!customer) {
      alert("Search a customer first");
      return;
    }
    if (adjustAmount <= 0) {
      alert("❌ Amount must be greater than 0");
      return;
    }

    const newBalance = customer.balance + adjustAmount;
    const newLog: TopUpLog = {
      id: uuidv4(),
      method: paymentMethod,
      amount: adjustAmount,
      date: new Date().toISOString().split("T")[0],
      type: "Over The Counter",
    };

    await updateDoc(doc(db, "customers", customer.id), {
      wallet: newBalance,
      logs: [...customer.logs, newLog],
    });

    setCustomer({
      ...customer,
      balance: newBalance,
      logs: [...customer.logs, newLog],
    });

    setAdjustAmount(0);
    alert("✅ Wallet updated successfully!");
  };

  // ----------------- Wallet Requests Actions -----------------
  const openApproveModal = (request: WalletRequest) => {
    setSelectedRequest(request);
    setModalAmount(0);
    setShowModal(true);
  };

  const confirmApproveRequest = async () => {
    if (!selectedRequest) return;
    if (modalAmount <= 0) {
      alert("Enter valid amount");
      return;
    }

    try {
      const q = query(collection(db, "customers"), where("email", "==", selectedRequest.email));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        alert("❌ Customer not found for this request.");
        return;
      }

      const custDoc = snapshot.docs[0];
      const data = custDoc.data();

      const newBalance = (data.wallet || 0) + modalAmount;
      const newLog: TopUpLog = {
        id: uuidv4(),
        method: "GCash",
        amount: modalAmount,
        date: new Date().toISOString().split("T")[0],
        type: "request",
      };

      await updateDoc(doc(db, "customers", custDoc.id), {
        wallet: newBalance,
        logs: [...(data.logs || []), newLog],
      });

      await updateDoc(doc(db, "walletRequests", selectedRequest.id), {
        status: "approved",
      });

      setShowModal(false);
      setSelectedRequest(null);
      setModalAmount(0);
      alert("✅ Wallet request approved!");
    } catch (err) {
      console.error(err);
      alert("❌ Failed to approve request.");
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await updateDoc(doc(db, "walletRequests", requestId), {
        status: "rejected",
      });
      alert("❌ Request rejected.");
    } catch (err) {
      console.error(err);
      alert("Failed to reject request.");
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    try {
      await deleteDoc(doc(db, "walletRequests", requestId));
      alert("🗑️ Request deleted!");
    } catch (err) {
      console.error(err);
      alert("Failed to delete request.");
    }
  };

  // ----------------- Filtered Requests -----------------
  const filteredRequests = walletRequests.filter((req) => req.status === filterStatus);

  return (
    <>
      <SidebarStaff />
      <div className="wallet-container">
        <h1 className="wallet-title">Wallet System & Requests</h1>

        {/* Search Customer */}
        <div className="section">
          <h2>Search Customer</h2>
          <input
            type="text"
            value={searchMobile}
            onChange={(e) => setSearchMobile(e.target.value)}
            placeholder="Enter mobile number"
          />
          <button onClick={handleSearch}
          style={{ background: "#6d3500ff", color: "white" }}>Search</button>
        </div>

        {/* Customer Info & Manual Adjustment */}
        {customer && (
          <>
            <div className="section customer-info">
              <h2>Customer Info</h2>
              <p>👤 <strong>Name:</strong> {customer.email}</p>
              <p>📱 <strong>Mobile:</strong> {customer.mobile}</p>
              <p>💳 <strong>Wallet Balance:</strong> ₱{customer.balance.toFixed(2)}</p>
            </div>

            <div className="section">
              <h2>🔧 Manual Adjustment</h2>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
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
              <button onClick={handleAdjustment}>Confirm Adjustment</button>
            </div>

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
                      <th>Type</th>
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
                          <td>{log.type}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              ) : <p className="empty-log">No logs available.</p>}
            </div>
          </>
        )}

        {/* Wallet Requests */}
        <div className="section">
          <h2> Wallet Requests</h2>
          
          {/* Filter */}
          <div style={{ marginBottom: "10px" }}>
            <label>
              <strong>Filter:</strong>{" "}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as "pending" | "approved")}
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
              </select>
            </label>
          </div>

          {filteredRequests.length > 0 ? (
            <table className="logs-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Reference No.</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((req) => (
                  <tr key={req.id}>
                    <td>{req.email}</td>
                    <td>{req.referenceNo}</td>
                    <td>{req.status}</td>
                    <td>
                      {req.status === "pending" ? (
                        <>
                          <button
                            onClick={() => openApproveModal(req)}
                            style={{ background: "#6dff50ff", color: "black" }}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectRequest(req.id)}
                            style={{ background: "#ff6150ff", color: "white" }}
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleDeleteRequest(req.id)}
                          style={{ background: "#ff5b5bff", color: "white" }}
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p>No {filterStatus} requests found.</p>}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2>Approve Wallet Request</h2>
            <p>Enter amount to add for <strong>{selectedRequest?.email}</strong></p>
            <input
              type="number"
              value={modalAmount}
              onChange={(e) => setModalAmount(Number(e.target.value))}
              placeholder="Enter amount"
            />
            <div className="modal-actions">
              <button
                onClick={confirmApproveRequest}
                style={{ background: "#cfffc6ff", color: "black" }}
              >
                Confirm
              </button>
              <button onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WalletPageStaff;
