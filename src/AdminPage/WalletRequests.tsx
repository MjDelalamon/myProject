import React, { useEffect, useState } from "react";
import Sidebar from "../components/SideBar";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../Firebase/firebaseConfig";
import "../Style/WalletRequests.css";

type WalletRequest = {
  id: string;
  status: string;
};

const WalletRequests: React.FC = () => {
  const [total, setTotal] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchCounts = async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, "walletRequests"));
      let pending = 0;
      let approved = 0;
      let rejected = 0;

      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as WalletRequest;
        const status = (data.status || "").toLowerCase();
        if (status === "pending") pending++;
        else if (status === "approved") approved++;
        else if (status === "rejected") rejected++;
      });

      setTotal(snapshot.size);
      setPendingCount(pending);
      setApprovedCount(approved);
      setRejectedCount(rejected);
    } catch (error) {
      console.error("Error counting wallet requests:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounts();
  }, []);

  return (
    <>
      <Sidebar />
      <div className="wallet-summary-container">
        <h2 className="wallet-summary-title"> Wallet Requests Summary</h2>

        {loading ? (
          <p>Loading summary...</p>
        ) : (
          <div className="summary-grid">
            <div className="summary-card total">
              <h3>Total Requests</h3>
              <p>{total}</p>
            </div>
            <div className="summary-card pending">
              <h3>Pending</h3>
              <p>{pendingCount}</p>
            </div>
            <div className="summary-card approved">
              <h3>Approved</h3>
              <p>{approvedCount}</p>
            </div>
            <div className="summary-card rejected">
              <h3>Rejected</h3>
              <p>{rejectedCount}</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default WalletRequests;
