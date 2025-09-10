import React, { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Link } from "react-router-dom";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyDxosd6yCZCVd2NGLlIiAthRoCfxAEUrdA",
  authDomain: "systemproject-de072.firebaseapp.com",
  projectId: "systemproject-de072",
  storageBucket: "systemproject-de072.appspot.com",
  messagingSenderId: "427445110062",
  appId: "1:427445110062:web:3a870fac07be2b369326bf",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function QRScanner() {
  const [customer, setCustomer] = useState<any>(null);
  const [amount, setAmount] = useState<number>(0);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    scanner.render(
      async (decodedText) => {
        try {
          const userRef = doc(db, "customers", decodedText);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            setCustomer({ id: decodedText, ...userSnap.data() });
            setShowModal(true);
          } else {
            alert("Customer not found!");
          }
        } catch (err) {
          console.error("Error fetching customer:", err);
        }
        scanner.clear().catch((err) => console.error("Clear failed:", err));
      },
      (error) => {
        console.warn(error);
      }
    );

    return () => {
      scanner.clear().catch((err) => console.error("Clear failed:", err));
    };
  }, []);

  // Function to update points
  const handleUpdatePoints = async () => {
    if (!customer) return;

    const earnedPoints = amount * 0.01;
    const newPoints = (customer.points || 0) + earnedPoints;

    try {
      await updateDoc(doc(db, "customers", customer.id), {
        points: newPoints,
      });

      alert(`Updated! ${customer.name} earned ${earnedPoints} points.`);
      setCustomer({ ...customer, points: newPoints });
      setShowModal(false);
      setAmount(0);
    } catch (err) {
      console.error("Error updating points:", err);
    }
  };

  return (
    <>
      <div className="sidebar">
        <h2 className="sidebar-title">Staff Panel</h2>
        <nav className="sidebar-nav">
          <Link to="/qr-scanner" className="sidebar-link">
            Scan QR
          </Link>
          <Link to="/take-order" className="sidebar-link">
            Take Order
          </Link>
          <Link to="/orders" className="sidebar-link">
            -
          </Link>
          <Link to="/rewards" className="sidebar-link">
            -
          </Link>
          <Link to="/menu" className="sidebar-link">
            -
          </Link>
          <Link to="/wallet" className="sidebar-link">
            -
          </Link>
          <Link to="/feedback" className="sidebar-link">
            -
          </Link>
          <Link to="/notifications" className="sidebar-link">
            -
          </Link>
          <Link to="/settings" className="sidebar-link">
            Settings
          </Link>
          <Link to="/" className="sidebar-link">
            Logout
          </Link>
        </nav>
      </div>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <div id="reader" style={{ width: "600px", height: "500px" }}></div>
      </div>

      {/* Modal */}
      {showModal && customer && (
        <div className="modal">
          <div className="modal-content">
            <h3>Customer Details</h3>
            <p>
              <strong>ID:</strong> {customer.customerNumber}
            </p>
            <p>
              <strong>Name:</strong> {customer.name}
            </p>
            <p>
              <strong>Email:</strong> {customer.email}
            </p>
            <p>
              <strong>Wallet:</strong> ₱{customer.wallet}
            </p>
            <p>
              <strong>Current Points:</strong> {customer.points}
            </p>

            <input
              type="number"
              placeholder="Enter purchase amount"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
            <p>Earned Points: {amount * 0.01}</p>

            <div className="modal-actions">
              <button className="btn" onClick={handleUpdatePoints}>
                Save
              </button>
              <button
                className="btn danger"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
