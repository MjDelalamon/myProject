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
  where,
  query,
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
  const [showPromoScanner, setShowPromoScanner] = useState(false);
const [promoScanResult, setPromoScanResult] = useState<string | null>(null);
const [promoStatus, setPromoStatus] = useState<string | null>(null);
const [pendingPromo, setPendingPromo] = useState<any>(null);
const [isConfirmVisible, setIsConfirmVisible] = useState(false);
// ✅ Add at the top with useState
// 🔹 State
const [mobileSearch, setMobileSearch] = useState("");
// 🔹 State

const [nonAppCustomer, setNonAppCustomer] = useState<Customer | null>(null);
const [searchStatus, setSearchStatus] = useState<string | null>(null);
const [showNonAppScanner, setShowNonAppScanner] = useState(false);

// 🔹 Search by mobile manually
// 🔹 Search by mobile manually
const searchCustomerByMobile = async () => {
  if (!mobileSearch) return alert("Enter a mobile number to search.");

  try {
    const q = query(
      collection(db, "customers"),
      where("mobile", "==", mobileSearch)
    );
    const snap = await getDocs(q);

    if (!snap.empty) {
      const docSnap = snap.docs[0];
      const data = docSnap.data() as Customer;
      setNonAppCustomer({ id: docSnap.id, ...data });
      setSearchStatus(`✅ Customer found: ${data.fullName}`);
    } else {
      setNonAppCustomer(null);
      setSearchStatus("❌ No customer found with this mobile number.");
    }
  } catch (err) {
    console.error("Error searching customer:", err);
    setNonAppCustomer(null);
    setSearchStatus("❌ Error occurred during search.");
  }
};

// 🔹 Scan QR for Non-App customer
const startNonAppScanner = () => {
  setShowNonAppScanner(true);

  const scanner = new Html5QrcodeScanner(
    "nonapp-reader",
    { fps: 10, qrbox: { width: 250, height: 250 } },
    false
  );

  scanner.render(
    async (decodedText: string) => {
      try {
        // QR contains mobile number
        const q = query(
          collection(db, "customers"),
          where("mobile", "==", decodedText)
        );
        const snap = await getDocs(q);

        if (!snap.empty) {
          const docSnap = snap.docs[0];
          const data = docSnap.data() as Customer;
          setNonAppCustomer({ id: docSnap.id, ...data });
          setSearchStatus(`✅ Customer found: ${data.fullName}`);
        } else {
          setNonAppCustomer(null);
          setSearchStatus("❌ Customer not found!");
        }
      } catch (err) {
        console.error("Error fetching Non-App customer:", err);
        setNonAppCustomer(null);
        setSearchStatus("❌ Error fetching customer.");
      }

      await scanner.clear().catch(() => {});
      setShowNonAppScanner(false);
    },
    (err) => console.warn(err)
  );
};







// 🔹 Start Promo QR Scanner (for verifying claimed promotions)
const startPromoScanner = () => {
  setShowPromoScanner(true);

  const scanner = new Html5QrcodeScanner(
    "promo-reader",
    { fps: 10, qrbox: { width: 250, height: 250 } },
    false
  );

  scanner.render(
    async (decodedText: string) => {
      setPromoScanResult(decodedText);

      try {
        try {
  const data = JSON.parse(decodedText);

  if (data.type !== "PROMO") {
    setPromoStatus("❌ Invalid QR type.");
    return;
  }

  const promoId = data.promoId;
  const email = data.email;

  const promoRef = doc(db, `customers/${email}/claimedPromos/${promoId}`);
  const promoSnap = await getDoc(promoRef);

  if (!promoSnap.exists()) {
    setPromoStatus("❌ Promo not found or invalid.");
  } else {
    const promoData = promoSnap.data();

    if (promoData.isUsed) {
      setPromoStatus("⚠️ Promo already redeemed.");
    } else {
      setPendingPromo({ ...promoData, promoId, email });
      setIsConfirmVisible(true);
      setPromoStatus("✅ Promo valid! Awaiting confirmation...");
    }
  }
} catch (err) {
  console.error("Error verifying promo:", err);
  setPromoStatus("❌ Invalid QR format.");
}

      } catch (err) {
        console.error("Error verifying promo:", err);
        setPromoStatus("❌ Error verifying promo.");
      }

      await scanner.clear().catch(() => {});
      setShowPromoScanner(false);
    },
    (err: string) => console.warn(err)
  );
};




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

  
const redeemPromo = async (method: "wallet" | "counter") => {
  if (!pendingPromo) return;

  try {
    const promoRef = doc(
      db,
      `customers/${pendingPromo.email}/claimedPromos/${pendingPromo.promoId}`
    );
    const promoSnap = await getDoc(promoRef);
    const promoData = promoSnap.data();

    if (!promoData) {
      setPromoStatus("❌ Promo not found.");
      return;
    }

    const promoPrice = Number(promoData.price) || 0;
    const earnedPoints = +(promoPrice * 0.05).toFixed(2);

    const customerRef = doc(db, "customers", pendingPromo.email);
    const customerSnap = await getDoc(customerRef);

    if (!customerSnap.exists()) {
      setPromoStatus("❌ Customer not found in database.");
      return;
    }

    const customerData = customerSnap.data();
    const walletBalance = Number(customerData.wallet || 0);
    const currentPoints = Number(customerData.points || 0);

    // 🔹 Wallet Redeem
    // 🔹 Wallet Redeem
if (method === "wallet") {
  if (walletBalance < promoPrice) {
    setPromoStatus(
      `❌ Insufficient wallet balance. Available: ₱${walletBalance}, Required: ₱${promoPrice}`
    );
    return;
  }

  const newWallet = +(walletBalance - promoPrice).toFixed(2);
  const newPoints = +(currentPoints + earnedPoints).toFixed(2);
  const newTotalSpent = +(Number(customerData.totalSpent || 0) + promoPrice).toFixed(2); // ✅ ADD THIS

  await updateDoc(customerRef, {
    wallet: newWallet,
    points: newPoints,
    totalSpent: newTotalSpent, // ✅ UPDATE
  });

  await addDoc(
    fbCollection(db, "customers", pendingPromo.email, "transactions"),
    {
      transactionId: `PROMO-${Date.now()}`,
      promoTitle: promoData.title,
      promoId: pendingPromo.promoId,
      type: "promo-redemption",
      method: "wallet",
      amount: promoPrice,
      earnedPoints,
      status: "Completed",
      redeemedAt: Timestamp.now(),
    }
  );

  setPromoStatus(
    `🎉 Promo redeemed via Wallet! ₱${promoPrice} deducted. +${earnedPoints} points earned!`
  );
}

// 🔹 Counter Redeem
if (method === "counter") {
  const newPoints = +(currentPoints + earnedPoints).toFixed(2);
  const newTotalSpent = +(Number(customerData.totalSpent || 0) + promoPrice).toFixed(2); // ✅ ADD THIS

  await updateDoc(customerRef, {
    points: newPoints,
    totalSpent: newTotalSpent, // ✅ UPDATE
  });

  await addDoc(
    fbCollection(db, "customers", pendingPromo.email, "transactions"),
    {
      transactionId: `PROMO-${Date.now()}`,
      promoTitle: promoData.title,
      promoId: pendingPromo.promoId,
      type: "promo-redemption",
      method: "counter",
      amount: promoPrice,
      earnedPoints,
      status: "Completed",
      redeemedAt: Timestamp.now(),
    }
  );

  setPromoStatus(
    `🎟️ Promo redeemed Over the Counter! +${earnedPoints} points earned!`
  );
}


    
    // 🔹 Log globally and per-customer
const redeemedPromoData = {
  promoId: pendingPromo.promoId,
  email: pendingPromo.email,
  title: promoData.title,
  price: promoPrice,
  earnedPoints,
  redeemedVia: method,
  redeemedAt: Timestamp.now(),
};

// 🔹 Save to global collection
await addDoc(collection(db, "redeemedPromos"), redeemedPromoData);

// 🔹 Save to the customer's own collection
await addDoc(
  collection(db, `customers/${pendingPromo.email}/redeemedPromos`),
  redeemedPromoData
);
  await updateDoc(promoRef, { isUsed: true });

    setPromoStatus("✅ Promo redeemed and marked as used!");
  } catch (err) {
    console.error("Error redeeming promo:", err);
    setPromoStatus("❌ Error redeeming promo.");
  }

  setPendingPromo(null);
  setIsConfirmVisible(false);
};




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

            



 <hr style={{ margin: "20px 0" }} />
           

            
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
<button onClick={startPromoScanner}>🎟️ Scan Promo QR</button>

{showPromoScanner && (
  <div id="promo-reader" style={{ width: 350, height: 300, marginTop: 10 }} />
)}

{isConfirmVisible && pendingPromo && (
  <div
    style={{
      border: "1px solid #ccc",
      borderRadius: 10,
      padding: 20,
      marginTop: 15,
      background: "#fff8dc",
    }}
  >
    <h3>Confirm Promo Redemption</h3>
    <p><b>Promo:</b> {pendingPromo.title}</p>
    <p><b>Customer:</b> {pendingPromo.email}</p>

    <div style={{ marginTop: 15 }}>
      <button
        onClick={() => redeemPromo("wallet")}
        style={{ marginRight: 10 }}
      >
        💳 Redeem via Wallet
      </button>

      <button
        onClick={() => redeemPromo("counter")}
        style={{ marginRight: 10 }}
      >
        💵 Redeem Over the Counter
      </button>

      <button onClick={() => setIsConfirmVisible(false)}>❌ Cancel</button>
    </div>
  </div>
)}


{promoScanResult && (
  <div style={{ marginTop: 10 }}>
    <b>Scanned QR:</b> {promoScanResult}
    <p style={{ marginTop: 5 }}>{promoStatus}</p>
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
          <div className="columns">
  <h3>Non-App Customer</h3>

  {/* Manual Mobile Input */}
  <input
    type="text"
    placeholder="Enter mobile number"
    value={mobileSearch}
    onChange={(e) => setMobileSearch(e.target.value)}
  />
  <button onClick={searchCustomerByMobile}>🔍 Search</button>

  {/* QR Scan */}
  <button onClick={startNonAppScanner}>📷 Scan QR</button>
  {showNonAppScanner && (
    <div id="nonapp-reader" style={{ width: 350, height: 300, marginTop: 10 }} />
  )}

  {/* Status */}
  {searchStatus && <p style={{ marginTop: 5 }}>{searchStatus}</p>}

  {/* Customer Info + Link Button */}
  {nonAppCustomer && (
    <div style={{ marginTop: 10, border: "1px solid #ccc", padding: 10 }}>
      <p><b>Name:</b> {nonAppCustomer.fullName}</p>
      <p><b>Mobile:</b> {nonAppCustomer.mobile}</p>
      <p><b>Points:</b> {nonAppCustomer.points}</p>
      <button
        onClick={() => {
          setCustomer(nonAppCustomer); // Link to order
          setNonAppCustomer(null);
          setMobileSearch("");
          setSearchStatus(null);
        }}
      >
        🔗 Link Customer
      </button>
    </div>
  )}
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
