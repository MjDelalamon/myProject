import React, { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Link } from "react-router-dom";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import { QRCodeSVG } from "qrcode.react"; // 🔹 para ma-display ulit QR

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

interface CustomerType {
  customerNumber: string;
  name: string;
  mobile: string;
  email: string;
  tier: string;
  status: string;
  wallet: number;
  points: number;
  dateJoined: string;
  qrCode: string;
}

export default function QRScanner() {
  const [scannedCustomer, setScannedCustomer] = useState<CustomerType | null>(
    null
  );

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
            const userData = userSnap.data() as CustomerType;
            setScannedCustomer(userData);
          } else {
            setScannedCustomer(null);
            alert("Customer not found!");
          }
        } catch (err) {
          console.error("Error fetching customer:", err);
        }

        // wag muna i-clear agad para makita ulit scanner sa page
        // scanner.clear().catch((err) => console.error("Clear failed:", err));
      },
      (error) => {
        console.warn(error);
      }
    );

    return () => {
      scanner.clear().catch((err) => console.error("Clear failed:", err));
    };
  }, []);

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

      {/* 🔹 Customer Details Card */}
      {scannedCustomer && (
        <div
          className="modal"
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: "20px",
          }}
        >
          <div
            className="modal-content"
            style={{ padding: "20px", maxWidth: "400px" }}
          >
            <h3>Customer Details</h3>
            <p>
              <strong>ID:</strong> {scannedCustomer.customerNumber}
            </p>
            <p>
              <strong>Name:</strong> {scannedCustomer.name}
            </p>
            <p>
              <strong>Mobile:</strong> {scannedCustomer.mobile}
            </p>
            <p>
              <strong>Email:</strong> {scannedCustomer.email}
            </p>
            <p>
              <strong>Tier:</strong> {scannedCustomer.tier}
            </p>
            <p>
              <strong>Status:</strong> {scannedCustomer.status}
            </p>
            <p>
              <strong>Wallet:</strong> ₱{scannedCustomer.wallet}
            </p>
            <p>
              <strong>Points:</strong> {scannedCustomer.points}
            </p>
            <p>
              <strong>Date Joined:</strong> {scannedCustomer.dateJoined}
            </p>

            {scannedCustomer.qrCode && (
              <div style={{ marginTop: "10px" }}>
                <QRCodeSVG value={scannedCustomer.qrCode} size={128} />
              </div>
            )}

            <button
              className="btn"
              style={{ marginTop: "10px" }}
              onClick={() => setScannedCustomer(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
