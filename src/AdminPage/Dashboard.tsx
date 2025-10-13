import React, { useEffect, useState } from "react";
import Sidebar from "../components/SideBar";
import { collection, getDocs, getDoc, doc } from "firebase/firestore";
import { db } from "../Firebase/firebaseConfig";
import { updateFavoriteCategory } from "../functions/updateFavoriteCategory.ts";
import { generatePersonalizedOffer } from "../functions/generatePersonalizedOffer";

function Dashboard() {
  const [topCustomer, setTopCustomer] = useState<string | null>(null);
  const [favoriteCategory, setFavoriteCategory] = useState<string | null>(null);
  const [personalizedOffer, setPersonalizedOffer] = useState<string | null>(
    null
  );

  useEffect(() => {
    const fetchFavoriteCategory = async () => {
      try {
        // ✅ Step 1: kunin lahat ng customers
        const customersRef = collection(db, "customers");
        const snapshot = await getDocs(customersRef);

        if (snapshot.empty) return;

        // ✅ Step 2: kunin isa (example lang, pwede mong palitan logic)
        const firstCustomer = snapshot.docs[0];
        const email = firstCustomer.id;

        // ✅ Step 3: update their favorite category based on recent transactions
        await updateFavoriteCategory(email);

        // ✅ Step 4: get updated favoriteCategory
        const customerRef = doc(db, "customers", email);
        const customerSnap = await getDoc(customerRef);
        const favCat = customerSnap.data()?.favoriteCategory || null;

        // ✅ Step 5: generate personalized offer text
        const offerText = generatePersonalizedOffer(favCat);

        setTopCustomer(email);
        setFavoriteCategory(favCat);
        setPersonalizedOffer(offerText);
      } catch (error) {
        console.error("Error fetching personalized offer:", error);
      }
    };

    fetchFavoriteCategory();
  }, []);

  return (
    <>
      <Sidebar />
      <div className="dashboard-container">
        <h1 className="dashboard-title">Dashboard Overview</h1>

        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Sales Today</h3>
            <p>₱12,430</p>
          </div>
          <div className="stat-card">
            <h3>Active Customers</h3>
            <p>158</p>
          </div>
          <div className="stat-card">
            <h3>Top-up Wallet Stats</h3>
            <p>₱5,200 added</p>
          </div>
          <div className="stat-card">
            <h3>Top 3 Selling Items</h3>
            <ul>
              <li>Caramel Macchiato</li>
              <li>Chocolate Cake</li>
              <li>Ham & Cheese Sandwich</li>
            </ul>
          </div>
        </div>

        {/* 🧠 Personalized Offer Section */}
        <div className="graphs-section">
          <div className="graph-card">
            <h3>Sales Trend</h3>
            <div className="graph-placeholder">[Graph Placeholder]</div>
          </div>
          <div className="graph-card">
            <h3>New vs Returning Customers</h3>
            <div className="graph-placeholder">[Graph Placeholder]</div>
          </div>
        </div>

        {personalizedOffer && (
          <div className="offer-section" style={{ marginTop: "30px" }}>
            <h2>🎁 Personalized Promotion</h2>
            <p>
              <strong>Customer:</strong> {topCustomer}
            </p>
            <p>
              <strong>Favorite Category:</strong>{" "}
              {favoriteCategory || "Not Available"}
            </p>
            <p>
              <strong>Offer:</strong> {personalizedOffer}
            </p>
          </div>
        )}
      </div>
    </>
  );
}

export default Dashboard;
