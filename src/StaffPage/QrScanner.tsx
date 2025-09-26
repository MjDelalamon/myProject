import React, { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

import { getFirestore, doc, getDoc } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import SidebarStaff from "../components/SideBarStaff";

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

  return (
    <>
      <SidebarStaff />

      <div style={{ display: "flex", justifyContent: "center" }}>
        <div id="reader" style={{ width: "600px", height: "500px" }}></div>
      </div>

      {/* Modal */}
      {showModal && customer && (
        <div className="modal">
          <div className="modal-content">
            <h3>Customer Details</h3>
            <p>
              <strong>Email:</strong> {customer.email}
            </p>
            <p>
              <strong>Name:</strong> {customer.fullName}
            </p>
            <p>
              <strong>Mobile:</strong> {customer.mobile}
            </p>
            <p>
              <strong>Wallet:</strong> ₱{customer.wallet}
            </p>
            <p>
              <strong>Points:</strong> {customer.points}
            </p>
            <p>
              <strong>Status:</strong> {customer.status}
            </p>
            <p>
              <strong>Tier:</strong> {customer.tier}
            </p>
            <p>
              <strong>Date Joined:</strong>{" "}
              {customer.createdAt?.toDate
                ? customer.createdAt.toDate().toLocaleDateString()
                : customer.createdAt}
            </p>

            <div className="modal-actions">
              <button
                className="btn danger"
                onClick={() => setShowModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
