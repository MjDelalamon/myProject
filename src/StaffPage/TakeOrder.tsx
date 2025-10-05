import React, { useState, useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import SidebarStaff from "../components/SideBarStaff";
import {
  getFirestore,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  collection,
  getDocs,
} from "firebase/firestore";
import { initializeApp } from "firebase/app";
import "../Style/TakeOrder.css";

// ✅ Firebase Config
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

export default function TakeOrderWithQR() {
  const [items, setItems] = useState([{ id: 1, name: "", price: 0, qty: 1 }]);
  const [menuData, setMenuData] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [customer, setCustomer] = useState<any>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);

  const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
  const total = +subtotal.toFixed(2);
  const points = +(subtotal * 0.01).toFixed(2);

  // 🔹 Fetch menu from Firestore
  useEffect(() => {
    const fetchMenu = async () => {
      const querySnapshot = await getDocs(collection(db, "menu"));
      const menuList: any[] = [];
      const catSet = new Set();

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        menuList.push({ id: doc.id, ...data });
        if (data.category) catSet.add(data.category);
      });

      setMenuData(menuList);
      setCategories(Array.from(catSet));
    };
    fetchMenu();
  }, []);

  // 🔹 Add / Update / Remove Items
  const addItem = () => {
    const nextId = items.length ? items[items.length - 1].id + 1 : 1;
    setItems([...items, { id: nextId, name: "", price: 0, qty: 1 }]);
  };

  const updateItem = (id: number, key: string, value: any) => {
    setItems(items.map((it) => (it.id === id ? { ...it, [key]: value } : it)));
  };

  const removeItem = (id: number) => {
    setItems(items.filter((it) => it.id !== id));
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
  };

  // 🔹 QR Scanner
  const startScanner = () => {
    setShowScanner(true);

    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    scanner.render(
      async (decodedText) => {
        try {
          const ref = doc(db, "customers", decodedText);
          const snap = await getDoc(ref);

          if (snap.exists()) {
            setCustomer({ id: decodedText, ...snap.data() });
            alert("✅ Customer found and linked!");
          } else {
            alert("❌ Customer not found!");
          }
        } catch (err) {
          console.error("Error fetching customer:", err);
        }

        scanner.clear().catch(() => {});
        setShowScanner(false);
      },
      (err) => console.warn(err)
    );
  };

  // 🔹 Place Order
  const placeOrder = async () => {
    if (items.length === 0) return alert("Add at least one item.");

    const order = {
      id: `ORD-${Date.now()}`,
      items,
      subtotal,
      total,
      pointsEarned: points,
      customerId: customer ? customer.id : "WALK-IN",
      placedAt: new Date().toISOString(),
    };

    await addDoc(collection(db, "orders"), order);

    if (customer) {
      const ref = doc(db, "customers", customer.id);
      const newPoints = (customer.points || 0) + points;
      await updateDoc(ref, { points: +newPoints.toFixed(2) });
      alert(`✅ Order placed! ${points} points added to ${customer.fullName}.`);
    } else {
      alert("✅ Order placed (Walk-in Customer).");
    }

    setOrders([order, ...orders]);
    setItems([{ id: 1, name: "", price: 0, qty: 1 }]);
    setCustomer(null);
  };

  return (
    <>
      <SidebarStaff />
      <div className="assisted-ordering">
        <h2>Take Order</h2>

        <div className="columns">
          {/* 🔹 Left Column */}
          <div className="column">
            <h3>Order Items</h3>

            {/* 🔸 Category Dropdown */}
            <label>Category:</label>
            <select value={selectedCategory} onChange={handleCategoryChange}>
              <option value=""> Select Category </option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* 🔸 Items Dropdown */}
            {items.map((it) => (
              <div key={it.id} className="order-item">
                <select
                  value={it.name}
                  onChange={(e) => {
                    const selectedItem = menuData.find(
                      (m) => m.name === e.target.value
                    );
                    if (selectedItem) {
                      updateItem(it.id, "name", selectedItem.name);
                      updateItem(it.id, "price", selectedItem.price);
                    }
                  }}
                >
                  <option value=""> Select Item </option>
                  {menuData
                    .filter((m) => m.category === selectedCategory)
                    .map((m) => (
                      <option
                        key={m.id}
                        value={m.name}
                        disabled={!m.availability} // 🚫 disable if unavailable
                      >
                        {m.name} {m.availability ? "" : "(Unavailable)"}
                      </option>
                    ))}
                </select>

                <input
                  type="number"
                  value={it.qty}
                  onChange={(e) => updateItem(it.id, "qty", +e.target.value)}
                  placeholder="Qty"
                />
                <input
                  type="number"
                  value={it.price}
                  readOnly
                  placeholder="Price"
                />
                <button onClick={() => removeItem(it.id)}>✖</button>
              </div>
            ))}

            <button onClick={addItem}>+ Add Item</button>

            <div className="summary">
              <p>Subtotal: ₱{subtotal}</p>
              <p>Total: ₱{total}</p>
              <p>Earnable Points: {points}</p>
            </div>
          </div>

          {/* 🔹 Right Column */}
          <div className="column">
            <h3>Customer Info</h3>

            {!customer ? (
              <>
                <button onClick={startScanner}>📷 Scan QR for Points</button>
                {showScanner && (
                  <div
                    id="reader"
                    style={{ width: 350, height: 300, marginTop: 10 }}
                  />
                )}
              </>
            ) : (
              <div className="customer-info">
                <p>
                  <b>Linked Customer:</b> {customer.fullName}
                </p>
                <p>Current Points: {customer.points}</p>
              </div>
            )}

            <button onClick={placeOrder} style={{ marginTop: "20px" }}>
              🧾 Place Order
            </button>
          </div>
        </div>

        {/* 🔹 Recent Orders */}
        <div className="column" style={{ marginTop: "20px" }}>
          <h3>Recent Orders</h3>
          {orders.length === 0 ? (
            <p>No recent orders.</p>
          ) : (
            orders.map((o) => (
              <p key={o.id}>
                <b>{o.id}</b> — ₱{o.total} ({o.customerId})
              </p>
            ))
          )}
        </div>
      </div>
    </>
  );
}
