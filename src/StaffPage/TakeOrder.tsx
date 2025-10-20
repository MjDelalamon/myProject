import React, { useState, useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import SidebarStaff from "../components/SideBarStaff";
import { updateFavoriteCategory } from "../functions/updateFavoriteCategory";

import {
  getFirestore,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  collection,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { initializeApp } from "firebase/app";
import { collection as fbCollection } from "firebase/firestore";
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

// ✅ Interfaces
interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  availability?: boolean;
}

interface OrderItem {
  id: number;
  name: string;
  price: number;
  qty: number;
  category?: string;
}

interface Customer {
  id: string;
  fullName: string;
  mobile?: string;
  points?: number;
  wallet?: number;
  totalSpent?: number;
  logs?: any[];
}

interface Order {
  id: string;
  items: OrderItem[];
  subtotal: number;
  total: number;
  pointsEarned: number;
  customerId: string;
  placedAt: string;
  paidByWallet: boolean;
}



export default function TakeOrderWithQR() {
  const [items, setItems] = useState<OrderItem[]>([
    { id: 1, name: "", price: 0, qty: 1 },
  ]);
  const [menuData, setMenuData] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [walletScanResult, setWalletScanResult] = useState<string | null>(null);
  const [walletCustomer, setWalletCustomer] = useState<Customer | null>(null);
  const [showWalletScanner, setShowWalletScanner] = useState(false);

  // 🔹 Start Wallet QR Scanner
  const startWalletScanner = () => {
    setShowWalletScanner(true);
    const scanner = new Html5QrcodeScanner(
      "wallet-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    scanner.render(
      async (decodedText: string) => {
        setWalletScanResult(decodedText);
        try {
          const ref = doc(db, "customers", decodedText);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            const data = snap.data() as Omit<Customer, "id">;
            setWalletCustomer({ id: decodedText, ...data });
          } else {
            setWalletCustomer(null);
          }
        } catch {
          setWalletCustomer(null);
        }
        await scanner.clear().catch(() => {});
        setShowWalletScanner(false);
      },
      (err: string) => console.warn(err)
    );
  };

  // 🔹 Computations
  const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
  const total = +subtotal.toFixed(2);
  const points = +(subtotal * 0.05).toFixed(2);

  // 🔹 Fetch menu from Firestore
  useEffect(() => {
    const fetchMenu = async () => {
      const querySnapshot = await getDocs(collection(db, "menu"));
      const menuList: MenuItem[] = [];
      const catSet = new Set<string>();

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data() as MenuItem;
        const cleanPrice = Number(data.price) || 0;
        menuList.push({ id: docSnap.id, ...data, price: cleanPrice });
        if (data.category) catSet.add(data.category.trim());
      });

      setMenuData(menuList);
      setCategories(Array.from(catSet));
    };
    fetchMenu();
  }, []);

  // 🔹 Add / Update / Remove Items
  const addItem = () => {
    const nextId = items.length ? items[items.length - 1].id + 1 : 1;
    const newItem: OrderItem = { id: nextId, name: "", price: 0, qty: 1 };
    setItems((prev) => [...prev, newItem]);
  };

  const updateItem = (id: number, key: keyof OrderItem, value: unknown) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [key]: value } : it))
    );
  };

  const removeItem = (id: number) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
  };

  // 🔹 QR Scanner for Customer
  const startScanner = () => {
    setShowScanner(true);
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    scanner.render(
      async (decodedText: string) => {
        try {
          const ref = doc(db, "customers", decodedText);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            const data = snap.data() as Omit<Customer, "id">;
            setCustomer({ id: decodedText, ...data });
            alert("✅ Customer found and linked!");
          } else {
            alert("❌ Customer not found!");
          }
        } catch (err) {
          console.error("Error fetching customer:", err);
        }
        await scanner.clear().catch(() => {});
        setShowScanner(false);
      },
      (err: string) => console.warn(err)
    );
  };

  

  
  // 🔹 Place Order
  // 🔹 Place Order
const placeOrder = async () => {
  if (items.length === 0) return alert("Add at least one item.");

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timestamp = Timestamp.fromDate(now);
  const transactionId = `ORD-${Date.now()}`;

  // 🏦 If Wallet Customer
  if (walletCustomer) {
    if ((walletCustomer.wallet || 0) < total) {
      alert(
        `❌ Insufficient wallet balance. Available: ₱${walletCustomer.wallet}, Required: ₱${total}`
      );
      return;
    }

    const ref = doc(db, "customers", walletCustomer.id);
    const newWallet = +(Number(walletCustomer.wallet) - total).toFixed(2);
    const newPoints = (walletCustomer.points || 0) + points;
    const newTotalSpent = (walletCustomer.totalSpent || 0) + total;

    const logEntry = {
      transactionId,
      amount: total,
      date: dateStr,
      earnedPoints: points,
      items,
      type: "wallet",
      method: "Wallet",
      status: "Completed",
      paymentMethod: "Wallet",
    };

    // 🔸 Update customer wallet, points, and totalSpent
    await updateDoc(ref, {
      wallet: newWallet,
      points: +newPoints.toFixed(2),
      totalSpent: +newTotalSpent.toFixed(2),
    });

    // 🔸 Save inside customer's subcollection
    await addDoc(
      fbCollection(db, "customers", walletCustomer.id, "transactions"),
      {
        orderId: transactionId,
        amount: total,
        paymentMethod: "Wallet",
        type: "wallet",
        status: "Completed",
        date: timestamp,
        items,
      }
    );

    // 🔸 Also save in global `transactions`
    await addDoc(collection(db, "transactions"), {
      customerId: walletCustomer.id,
      fullName: walletCustomer.fullName,
      orderId: transactionId,
      amount: total,
      paymentMethod: "Wallet",
      type: "wallet",
      status: "Completed",
      date: timestamp,
      items,
    });
    await updateFavoriteCategory(walletCustomer.id); // ✅ update favorite category here
    alert(
      `✅ Order placed! ₱${total} deducted from wallet. ${points} points added to ${walletCustomer.fullName}.`
    );

    setOrders((prev) => [
      {
        id: transactionId,
        items,
        subtotal,
        total,
        pointsEarned: points,
        customerId: walletCustomer.id,
        placedAt: now.toISOString(),
        paidByWallet: true,
      },
      ...prev,
    ]);

    setWalletCustomer({
      ...walletCustomer,
      wallet: newWallet,
      points: +newPoints.toFixed(2),
      logs: walletCustomer.logs
        ? [...walletCustomer.logs, logEntry]
        : [logEntry],
    });

    // Reset forms
    setItems([{ id: 1, name: "", price: 0, qty: 1 }]);
    setCustomer(null);
    setWalletScanResult(null);
    setWalletCustomer(null);
    return;
  }

  // 🧾 If Customer scanned via “Scan QR for Points”
  if (customer) {
    const ref = doc(db, "customers", customer.id);
    const earnedPoints = +(subtotal * 0.05).toFixed(2);
    const newPoints = +(Number(customer.points || 0) + earnedPoints).toFixed(2);
    const newTotalSpent = (customer.totalSpent || 0) + total;

    await updateDoc(ref, {
      points: newPoints,
      totalSpent: +newTotalSpent.toFixed(2),
    });

    // 🔸 Save to customer's transactions
    await addDoc(fbCollection(db, "customers", customer.id, "transactions"), {
      orderId: transactionId,
      amount: total,
      paymentMethod: "Over the Counter",
      type: "points-earned",
      status: "Completed",
      date: timestamp,
      items,
    });

    // 🔸 Also save globally
    await addDoc(collection(db, "transactions"), {
      customerId: customer.id,
      fullName: customer.fullName,
      orderId: transactionId,
      amount: total,
      paymentMethod: "Over the Counter",
      type: "points-earned",
      status: "Completed",
      date: timestamp,
      items,
    });

    await updateFavoriteCategory(customer.id);


    alert(
      `✅ Order placed (Over the Counter)! ${earnedPoints} points added to ${customer.fullName}.`
    );

    setOrders((prev) => [
      {
        id: transactionId,
        items,
        subtotal,
        total,
        pointsEarned: earnedPoints,
        customerId: customer.id,
        placedAt: now.toISOString(),
        paidByWallet: false,
      },
      ...prev,
    ]);

    setItems([{ id: 1, name: "", price: 0, qty: 1 }]);
    setCustomer(null);
    setWalletCustomer(null);
    setWalletScanResult(null);
    return;
  }

  // 🚶 Walk-in Customer
  await addDoc(collection(db, "transactions"), {
    customerId: "WALK-IN",
    fullName: "Walk-in Customer",
    orderId: transactionId,
    amount: total,
    paymentMethod: "Cash",
    type: "walk-in",
    status: "Completed",
    date: timestamp,
    items,
  });

  alert("✅ Order placed for Walk-in Customer (No points earned).");
  setItems([{ id: 1, name: "", price: 0, qty: 1 }]);
};


  // ✅ UI
  return (
    <>
      <SidebarStaff />
      <div className="assisted-ordering">
        <h2>Take Order</h2>

        <div className="columns">
          {/* LEFT COLUMN */}
          <div className="column">
            <h3>Order Items</h3>

            <label>Category:</label>
            <select value={selectedCategory} onChange={handleCategoryChange}>
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {items.map((it) => (
              <div key={it.id} className="order-item">
                <select
                  value={it.name}
                  onChange={(e) => {
                    const nameInput = e.target.value;
                    const selectedItem = menuData.find(
                      (m) =>
                        m.name === nameInput &&
                        (selectedCategory
                          ? m.category.trim().toLowerCase() ===
                            selectedCategory.trim().toLowerCase()
                          : true)
                    );
                    if (selectedItem) {
                      updateItem(it.id, "name", selectedItem.name);
                      updateItem(it.id, "price", Number(selectedItem.price));
                      updateItem(it.id, "category", selectedItem.category); // ✅ add category
                    } else {
                      updateItem(it.id, "name", nameInput);
                      updateItem(it.id, "price", 0);
                      updateItem(
                        it.id,
                        "category",
                        selectedCategory || "Uncategorized"
                      );
                    }
                  }}
                  disabled={!selectedCategory}
                >
                  <option value="">
                    {selectedCategory
                      ? "Select Item"
                      : "Select a category first"}
                  </option>
                  {selectedCategory &&
                    menuData
                      .filter(
                        (m) =>
                          m.category.trim().toLowerCase() ===
                          selectedCategory.trim().toLowerCase()
                      )
                      .map((m) => (
                        <option
                          key={m.id}
                          value={m.name}
                          disabled={!m.availability}
                        >
                          {m.name} {m.availability ? "" : "(Unavailable)"}
                        </option>
                      ))}
                </select>

                <input
                  type="number"
                  value={it.qty}
                  onChange={(e) =>
                    updateItem(it.id, "qty", Number(e.target.value))
                  }
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

            <div className="order-summary-list" style={{ marginTop: "18px" }}>
              <h3>Current Items:</h3>
              <ul>
                {items.map((it, idx) => (
                  <li key={it.id || idx}>
                    <b>{it.name || <i>No item selected</i>}</b> (
                    {it.category || "—"}) × {it.qty} — ₱
                    {(it.price * it.qty).toFixed(2)}
                  </li>
                ))}
              </ul>
            </div>

            <div className="summary">
              <p>Subtotal: ₱{subtotal}</p>
              <p>Total: ₱{total}</p>
              <p>Earnable Points: {points}</p>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="column">
            <h3>Action</h3>

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

            <button onClick={startWalletScanner} style={{ marginTop: 10 }}>
              📱 Scan QR for Pay Wallet
            </button>
            {showWalletScanner && (
              <div
                id="wallet-reader"
                style={{ width: 350, height: 300, marginTop: 10 }}
              />
            )}
            {walletScanResult && (
              <div style={{ marginTop: 10 }}>
                <b>Wallet QR Result:</b>
                {walletCustomer ? (
                  <div>
                    <div>
                      <b>Full Name:</b> {walletCustomer.fullName}
                    </div>
                    <div>
                      <b>Mobile:</b> {walletCustomer.mobile}
                    </div>
                    <div>
                      <b>Wallet Balance:</b> {walletCustomer.wallet}
                    </div>
                  </div>
                ) : (
                  <div>
                    <i>No customer found for this QR.</i>
                  </div>
                )}
              </div>
            )}

            <button onClick={placeOrder} style={{ marginTop: 20 }}>
              🧾 Place Order
            </button>
          </div>
        </div>

        {/* RECENT ORDERS */}
        <div className="column" style={{ marginTop: 20 }}>
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
