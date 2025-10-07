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
  arrayUnion,
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

export default function TakeOrderWithQR() {
  const [items, setItems] = useState<any>([
    { id: 1, name: "", price: 0, qty: 1 },
  ]);
  const [menuData, setMenuData] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [customer, setCustomer] = useState<any>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [walletScanResult, setWalletScanResult] = useState<string | null>(null);
  const [walletCustomer, setWalletCustomer] = useState<any>(null);
  const [showWalletScanner, setShowWalletScanner] = useState(false);

  const startWalletScanner = () => {
    setShowWalletScanner(true);
    const scanner = new Html5QrcodeScanner(
      "wallet-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    scanner.render(
      async (decodedText) => {
        setWalletScanResult(decodedText);
        try {
          const ref = doc(db, "customers", decodedText);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            setWalletCustomer({ id: decodedText, ...snap.data() });
          } else {
            setWalletCustomer(null);
          }
        } catch {
          setWalletCustomer(null);
        }
        scanner.clear().catch(() => {});
        setShowWalletScanner(false);
      },
      (err) => console.warn(err)
    );
  };

  const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
  const total = +subtotal.toFixed(2);
  const points = +(subtotal * 0.05).toFixed(2);

  // 🔹 Fetch menu from Firestore
  useEffect(() => {
    const fetchMenu = async () => {
      const querySnapshot = await getDocs(collection(db, "menu"));
      const menuList: any[] = [];
      const catSet = new Set();

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        // Convert price to number
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
    console.log("🟢 [AddItem] Button clicked!");

    const nextId = items.length ? items[items.length - 1].id + 1 : 1;
    console.log("📦 Next ID to be added:", nextId);

    const newItem = { id: nextId, name: "", price: 0, qty: 1 };
    console.log("🧾 Item to add:", newItem);

    const updatedItems = [...items, newItem];
    console.log("📋 Updated items list:", updatedItems);

    setItems(updatedItems);
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

  // 🔹 QR Scanner for Customer
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

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timestamp = Timestamp.fromDate(now);
    const transactionId = `ORD-${Date.now()}`;

    // Helper to add to global transactions collection with items as subcollection
    const addGlobalTransaction = async ({
      customerEmail,
      orderId,
      amount,
      paymentMethod,
      type,
      status,
      date,
      items,
    }: any) => {
      // Create the main transaction document
      const transRef = await addDoc(collection(db, "transactions"), {
        customerEmail,
        orderId,
        amount,
        paymentMethod,
        type,
        status,
        date,
      });
      // Add each item as a subcollection document under this transaction
      for (const item of items) {
        await addDoc(fbCollection(db, "transactions", transRef.id, "items"), {
          name: item.name,
          qty: item.qty,
          price: item.price,
        });
      }
    };

    if (walletCustomer) {
      if (walletCustomer.wallet < total) {
        alert(
          `❌ Insufficient wallet balance. Available: ₱${walletCustomer.wallet}, Required: ₱${total}`
        );
        return;
      }
      const ref = doc(db, "customers", walletCustomer.id);
      const newWallet = +(walletCustomer.wallet - total).toFixed(2);
      const newPoints = (walletCustomer.points || 0) + points;
      const logEntry = {
        transactionId,
        amount: total,
        date: dateStr,
        earnedPoints: points,
        items: items.map((it: any) => ({
          name: it.name,
          qty: it.qty,
          price: it.price,
        })),
        type: "wallet",
        method: "Wallet",
        status: "Completed",
        paymentMethod: "Wallet",
      };
      await updateDoc(ref, {
        wallet: newWallet,
        points: +newPoints.toFixed(2),
      });
      // Store in subcollection
      await addDoc(
        fbCollection(db, "customers", walletCustomer.id, "transactions"),
        {
          orderId: transactionId,
          amount: total,
          paymentMethod: "Wallet",
          type: "wallet",
          status: "Completed",
          date: timestamp,
          items: items.map((it: any) => ({
            name: it.name,
            qty: it.qty,
            price: it.price,
          })),
        }
      );
      // Store in global transactions collection (with items subcollection)
      await addGlobalTransaction({
        customerEmail: walletCustomer.id,
        orderId: transactionId,
        amount: total,
        paymentMethod: "Wallet",
        type: "wallet",
        status: "Completed",
        date: timestamp,
        items,
      });
      alert(
        `✅ Order placed! ₱${total} deducted from wallet. ${points} points added to ${walletCustomer.fullName}.`
      );
      setWalletCustomer({
        ...walletCustomer,
        wallet: newWallet,
        points: +newPoints.toFixed(2),
        logs: walletCustomer.logs
          ? [...walletCustomer.logs, logEntry]
          : [logEntry],
      });
    } else if (customer) {
      const pointsBalance = customer.points || 0;
      const pointsToUse = Math.min(pointsBalance, total);
      const remainingToPay = +(total - pointsToUse).toFixed(2);
      const ref = doc(db, "customers", customer.id);
      const newPoints =
        remainingToPay > 0
          ? +(pointsBalance - pointsToUse + points).toFixed(2)
          : +(pointsBalance - pointsToUse).toFixed(2);

      const logEntry = {
        transactionId,
        amount: pointsToUse,
        date: dateStr,
        earnedPoints: remainingToPay > 0 ? points : 0,
        items: items.map((it: any) => ({
          name: it.name,
          qty: it.qty,
          price: it.price,
        })),
        type: "points-used",
        method: "Points",
        status: "Completed",
        paymentMethod: "Points",
        note: `Used ${pointsToUse} points as discount for order.`,
      };

      await updateDoc(ref, {
        points: newPoints,
      });

      // Store in subcollection
      await addDoc(fbCollection(db, "customers", customer.id, "transactions"), {
        orderId: transactionId,
        amount: pointsToUse,
        paymentMethod: "Points",
        type: "points-used",
        status: "Completed",
        date: timestamp,
        items: items.map((it: any) => ({
          name: it.name,
          qty: it.qty,
          price: it.price,
        })),
      });
      // Store in global transactions collection (with items subcollection)
      await addGlobalTransaction({
        customerEmail: customer.id,
        orderId: transactionId,
        amount: pointsToUse,
        paymentMethod: "Points",
        type: "points-used",
        status: "Completed",
        date: timestamp,
        items,
      });

      alert(
        `✅ Order placed! Used ${pointsToUse} points as discount. Remaining to pay: ₱${remainingToPay}. ${
          remainingToPay > 0
            ? `New points: ${points}.`
            : "No new points awarded."
        }`
      );
    } else {
      alert("✅ Order placed (Walk-in Customer).");
    }

    const order = {
      id: transactionId,
      items,
      subtotal,
      total,
      pointsEarned: points,
      customerId: walletCustomer
        ? walletCustomer.id
        : customer
        ? customer.id
        : "WALK-IN",
      placedAt: now.toISOString(),
      paidByWallet: !!walletCustomer,
    };

    await addDoc(collection(db, "orders"), order);

    setOrders([order, ...orders]);
    setItems([{ id: 1, name: "", price: 0, qty: 1 }]);
    setCustomer(null);
    setWalletScanResult(null);
    setWalletCustomer(null);
  };

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

            {/* ITEM SELECTION */}
            {items.map((it) => (
              <div key={it.id} className="order-item">
                <select
                  value={it.name}
                  onChange={(e) => {
                    const nameInput = e.target.value;
                    // Find by name and category, but fallback to just name if category is not set
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
                    } else {
                      updateItem(it.id, "name", nameInput); // set to value even if not found
                      updateItem(it.id, "price", 0);
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

            {/* ORDER SUMMARY */}
            <div className="order-summary-list" style={{ marginTop: "18px" }}>
              <h4>Current Items:</h4>
              <ul>
                {items.map((it, idx) => (
                  <li key={it.id || idx}>
                    {it.name && it.name !== "" ? (
                      it.name
                    ) : (
                      <i>No item selected</i>
                    )}{" "}
                    × {it.qty} — ₱{(it.price * it.qty).toFixed(2)}
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

            <button onClick={startWalletScanner} style={{ marginTop: "10px" }}>
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

            <button onClick={placeOrder} style={{ marginTop: "20px" }}>
              🧾 Place Order
            </button>
          </div>
        </div>

        {/* RECENT ORDERS */}
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
