import React, { useEffect, useState } from "react";
import SidebarStaff from "../components/SideBarStaff";
import { Link } from "react-router-dom";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  getDoc,
  query,
  where,
} from "firebase/firestore";
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

export default function TakeOrder() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [items, setItems] = useState([
    { id: 1, name: "Cappuccino", price: 120.0, qty: 1 },
  ]);
  const [useWallet, setUseWallet] = useState(false);
  const [walletPayment, setWalletPayment] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [orders, setOrders] = useState<any[]>([]);
  const [mobileSearch, setMobileSearch] = useState("");

  const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
  const points = +(subtotal * 0.01).toFixed(2);
  const total = +subtotal.toFixed(2);

  // 🔹 Fetch customers for reference
  useEffect(() => {
    const fetchCustomers = async () => {
      const querySnapshot = await getDocs(collection(db, "customers"));
      const list: any[] = [];
      querySnapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      setCustomers(list);
    };
    fetchCustomers(); 
  }, []);

  // 🔹 Search by mobile
  async function searchByMobile() {
    if (!mobileSearch) return alert("Enter mobile number");
    const q = query(
      collection(db, "customers"),
      where("mobile", "==", mobileSearch)
    );
    const snap = await getDocs(q);
    if (snap.empty) {
      alert("Customer not found!");
      setSelectedCustomer(null);
    } else {
      const docData = { id: snap.docs[0].id, ...snap.docs[0].data() };
      setSelectedCustomer(docData);
    }
  }

  // 🔹 Scan QR
  async function scanQR() {
    const scannedId = prompt("Enter scanned QR docId for demo:");
    if (!scannedId) return;

    const ref = doc(db, "customers", scannedId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      setSelectedCustomer({ id: snap.id, ...snap.data() });
    } else {
      alert("Customer not found!");
    }
  }

  // 🔹 Items logic
  function addItem() {
    const nextId = items.length ? items[items.length - 1].id + 1 : 1;
    setItems([...items, { id: nextId, name: "New Item", price: 50.0, qty: 1 }]);
  }
  function updateItem(id: number, key: string, value: any) {
    setItems(items.map((it) => (it.id === id ? { ...it, [key]: value } : it)));
  }
  function removeItem(id: number) {
    setItems(items.filter((it) => it.id !== id));
  }

  // 🔹 Place order
  // 🔹 Place order
  async function placeOrder() {
    if (items.length === 0) return alert("Add at least one item.");
    if (!selectedCustomer) return alert("Search or scan a customer first.");

    // 1. Compute wallet usage
    let appliedWallet = 0;
    if (useWallet) {
      appliedWallet = Math.min(
        walletPayment,
        selectedCustomer.wallet || 0,
        total
      );
    }

    // 2. Compute remaining balance
    const remaining = +(total - appliedWallet).toFixed(2);

    // 3. Validate payments
    if (remaining > 0) {
      if (!paymentMethod) {
        return alert("Please select a payment method.");
      }
      if (paymentAmount < remaining) {
        return alert(
          `Insufficient ${paymentMethod} payment. Remaining PHP ${remaining} required.`
        );
      }
      if (paymentMethod === "Points" && selectedCustomer.points < remaining) {
        return alert("Not enough points to use for payment.");
      }
    }

    // 4. Build order object
    const order = {
      id: `ORD-${Date.now()}`,
      customerId: selectedCustomer.id,
      items: JSON.parse(JSON.stringify(items)),
      subtotal,
      pointsEarned: points,
      total,
      walletUsed: appliedWallet,
      otherPayment: remaining > 0 ? remaining : 0,
      paymentMethod: remaining > 0 ? paymentMethod : "Wallet Only",
      placedAt: new Date().toISOString(),
    };

    await addDoc(collection(db, "orders"), order);

    // 5. Update customer wallet & points
    let newWallet = selectedCustomer.wallet || 0;
    let newPoints = selectedCustomer.points || 0;

    // Deduct wallet
    newWallet -= appliedWallet;

    // Deduct points if ginamit pambayad
    if (paymentMethod === "Points") {
      newPoints -= remaining;
    }

    // Add earned points from purchase
    newPoints += points;

    const custRef = doc(db, "customers", selectedCustomer.id);
    await updateDoc(custRef, {
      wallet: +newWallet.toFixed(2),
      points: +newPoints.toFixed(2),
    });

    // 6. Reset state
    setOrders([order, ...orders]);
    setWalletPayment(0);
    setPaymentAmount(0);
    setUseWallet(false);
    setPaymentMethod("Cash");
    alert("Order placed successfully!");
  }

  return (
    <>
      <SidebarStaff />

      <div className="assisted-ordering">
        <h2>Assisted Ordering</h2>
        <div className="columns">
          {/* Customer */}
          <div className="column">
            <h3>Customer</h3>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Enter Mobile No."
                value={mobileSearch}
                onChange={(e) => setMobileSearch(e.target.value)}
              />
              <button onClick={searchByMobile}>Search</button>
              <button onClick={scanQR}>Scan QR</button>
            </div>

            {selectedCustomer && (
              <div className="customer-info border p-2 rounded">
                <p>
                  <b>{selectedCustomer.name}</b>
                </p>
                <p>Mobile: {selectedCustomer.mobile}</p>
                <p>Wallet: {selectedCustomer.wallet}</p>
                <p>Points: {selectedCustomer.points?.toFixed(2)}</p>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="column">
            <h3>Items</h3>
            {items.map((it) => (
              <div key={it.id}>
                <input
                  value={it.name}
                  onChange={(e) => updateItem(it.id, "name", e.target.value)}
                />
                <input
                  type="number"
                  value={it.qty}
                  min={1}
                  onChange={(e) =>
                    updateItem(it.id, "qty", Math.max(1, +e.target.value))
                  }
                />
                <input
                  type="number"
                  value={it.price}
                  min={0}
                  onChange={(e) =>
                    updateItem(it.id, "price", Math.max(0, +e.target.value))
                  }
                />
                <button onClick={() => removeItem(it.id)}>Remove</button>
              </div>
            ))}
            <button onClick={addItem}>Add Item</button>
            <p>Subtotal: {subtotal}</p>
            <p>Total: {total}</p>
            <p>Points Earned: {points}</p>
          </div>

          {/* Payments */}
          <div className="column">
            <h3>Payments</h3>

            {/* Wallet payment */}
            <label>
              <input
                type="checkbox"
                checked={useWallet}
                onChange={(e) => setUseWallet(e.target.checked)}
              />{" "}
              Use Wallet
            </label>
            {useWallet && (
              <input
                type="number"
                value={walletPayment}
                min={0}
                max={selectedCustomer?.wallet || 0}
                onChange={(e) => setWalletPayment(Math.max(0, +e.target.value))}
              />
            )}

            {/* Other payment */}
            <div>
              <label>Payment Method:</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option>Cash</option>
                <option>GCash</option>
                <option>Points</option>
              </select>
              <input
                type="number"
                value={paymentAmount}
                min={0}
                onChange={(e) => setPaymentAmount(Math.max(0, +e.target.value))}
              />
            </div>

            <button onClick={placeOrder}>Place Order</button>
          </div>
        </div>

        {/* Orders */}
        <div>
          <h3>Recent Orders</h3>
          {orders.length === 0 ? (
            <p>No orders yet</p>
          ) : (
            orders.map((o) => (
              <div key={o.id}>
                <p>
                  {o.id} - PHP {o.total} ({o.paymentMethod})
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
