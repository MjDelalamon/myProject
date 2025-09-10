import React, { useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Link } from "react-router-dom";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyDxosd6yCZCVd2NGLlIiAthRoCfxAEUrdA",
  authDomain: "systemproject-de072.firebaseapp.com",
  projectId: "systemproject-de072",
  storageBucket: "systemproject-de072.appspot.com", // dapat .appspot.com
  messagingSenderId: "427445110062",
  appId: "1:427445110062:web:3a870fac07be2b369326bf",
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

export default function QRScanner() {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
      },
      false
    );

    scanner.render(
      async (decodedText) => {
        try {
          // decodedText = userId (dapat ito nilagay mo sa QR code nung nag-generate ka)
          const userRef = doc(db, "users", decodedText);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const userData = userSnap.data();
            alert(`Name: ${userData.name}\nEmail: ${userData.email}`);
          } else {
            alert("User not found!");
          }
        } catch (err) {
          console.error("Error fetching user:", err);
        }

        // clear scanner after scan
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
    </>
  );
}
