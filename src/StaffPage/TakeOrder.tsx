import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function TakeOrder() {
  const [customers, setCustomers] = useState([
    {
      id: "c1",
      name: "Ana Santos",
      phone: "09171234567",
      qr: "QR-ANA-001",
      wallet: 150.0,
      points: 120,
    },
    {
      id: "c2",
      name: "Jun Reyes",
      phone: "09179876543",
      qr: "QR-JUN-002",
      wallet: 25.0,
      points: 30,
    },
    { id: "guest", name: "Guest", phone: "", qr: "", wallet: 0, points: 0 },
  ]);

  const [selectedCustomerId, setSelectedCustomerId] = useState("guest");
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  const [items, setItems] = useState([
    { id: 1, name: "Cappuccino", price: 120.0, qty: 1 },
  ]);

  const [qrInput, setQrInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");

  const [useWallet, setUseWallet] = useState(false);
  const [walletPayment, setWalletPayment] = useState(0);
  const [otherPaymentMethod, setOtherPaymentMethod] = useState("Cash");
  const [cashPayment, setCashPayment] = useState(0);

  const [orders, setOrders] = useState([]);

  const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
  const points = +(subtotal * 0.01).toFixed(2);
  const total = +subtotal.toFixed(2);

  function addItem() {
    const nextId = items.length ? items[items.length - 1].id + 1 : 1;
    setItems([...items, { id: nextId, name: "New Item", price: 50.0, qty: 1 }]);
  }

  function updateItem(id, key, value) {
    setItems(items.map((it) => (it.id === id ? { ...it, [key]: value } : it)));
  }

  function removeItem(id) {
    setItems(items.filter((it) => it.id !== id));
  }

  function lookupByQr(qr) {
    return customers.find((c) => c.qr === qr);
  }

  function lookupByPhone(phone) {
    return customers.find((c) => c.phone === phone);
  }

  function applyQr() {
    if (!qrInput) return alert("Enter QR code.");
    const found = lookupByQr(qrInput.trim());
    if (!found) return alert("QR not found.");
    setSelectedCustomerId(found.id);
  }

  function applyPhone() {
    if (!phoneInput) return alert("Enter phone number.");
    const found = lookupByPhone(phoneInput.trim());
    if (!found) return alert("Phone not found.");
    setSelectedCustomerId(found.id);
  }

  function placeOrder() {
    if (items.length === 0) return alert("Add at least one item.");
    if (useWallet) {
      if (walletPayment <= 0) return alert("Specify wallet amount.");
      if (walletPayment > (selectedCustomer?.wallet || 0))
        return alert("Not enough wallet balance.");
      if (walletPayment > total) return alert("Wallet payment exceeds total.");
    }
    const remaining = +(total - (useWallet ? walletPayment : 0)).toFixed(2);
    if (remaining > 0 && cashPayment < remaining) {
      if (!window.confirm(`Remaining PHP ${remaining} not covered. Proceed?`))
        return;
    }

    const order = {
      id: `ORD-${Date.now()}`,
      customerId: selectedCustomerId,
      items: JSON.parse(JSON.stringify(items)),
      subtotal,
      points,
      total,
      walletPayment: useWallet ? +walletPayment : 0,
      otherPayment: +cashPayment,
      otherPaymentMethod,
      placedAt: new Date().toISOString(),
    };

    if (selectedCustomer && selectedCustomer.id !== "guest") {
      setCustomers((prev) =>
        prev.map((c) => {
          if (c.id !== selectedCustomer.id) return c;
          const newWallet = +(c.wallet - (order.walletPayment || 0)).toFixed(2);
          // Keep decimals for earned points
          const earned = parseFloat(order.points.toFixed(2));
          const newPoints = parseFloat((c.points + earned).toFixed(2));
          return { ...c, wallet: newWallet, points: newPoints };
        })
      );
    }

    setOrders([order, ...orders]);
    setWalletPayment(0);
    setCashPayment(0);
    setUseWallet(false);
  }

  function registerCustomer() {
    const name = prompt("Customer name:");
    if (!name) return;
    const phone = prompt("Phone number:");
    const qr = `QR-${name.toUpperCase().slice(0, 3)}-${
      Math.floor(Math.random() * 900) + 100
    }`;
    const id = `c${Date.now()}`;
    const newCust = { id, name, phone: phone || "", qr, wallet: 0, points: 0 };
    setCustomers([newCust, ...customers]);
    setSelectedCustomerId(id);
  }

  return (
    <>
      <div className="sidebar">
        <h2 className="sidebar-title">Staff Panel</h2>
        <nav className="sidebar-nav">
          <Link to="/dashboard" className="sidebar-link">
            Take Order
          </Link>
          <Link to="/customers" className="sidebar-link">
            Customers
          </Link>
          <Link to="/orders" className="sidebar-link">
            Orders
          </Link>
          <Link to="/rewards" className="sidebar-link">
            Rewards
          </Link>
          <Link to="/menu" className="sidebar-link">
            Menu
          </Link>
          <Link to="/wallet" className="sidebar-link">
            Wallet
          </Link>
          <Link to="/feedback" className="sidebar-link">
            Feedback
          </Link>
          <Link to="/notifications" className="sidebar-link">
            Notifications
          </Link>
          <Link to="/settings" className="sidebar-link">
            Settings
          </Link>
          <Link to="/" className="sidebar-link">
            Logout
          </Link>
        </nav>
      </div>

      <div className="sidebar">
        <h2 className="sidebar-title">Staff Panel</h2>
        <nav className="sidebar-nav">
          {[
            "dashboard",
            "customers",
            "orders",
            "rewards",
            "menu",
            "wallet",
            "feedback",
            "notifications",
            "settings",
          ].map((path) => (
            <Link key={path} to={`/${path}`} className="sidebar-link">
              {path.charAt(0).toUpperCase() + path.slice(1)}
            </Link>
          ))}
          <Link to="/" className="sidebar-link">
            Logout
          </Link>
        </nav>
      </div>

      <div className="assisted-ordering">
        <h2>Assisted Ordering (Admin)</h2>
        <div className="columns">
          {/* Customer */}
          <div className="column">
            <h3>Customer</h3>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.phone && `(${c.phone})`}
                </option>
              ))}
            </select>
            <input
              placeholder="QR code"
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
            />
            <button onClick={applyQr}>Apply QR</button>
            <input
              placeholder="Phone"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
            />
            <button onClick={applyPhone}>Lookup</button>
            <button onClick={registerCustomer}>Register</button>
            <div className="customer-info">
              <p>{selectedCustomer.name}</p>
              <p>Wallet: {selectedCustomer.wallet}</p>
              <p>Points: {selectedCustomer.points.toFixed(2)}</p>
            </div>
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
            <label>
              <input
                type="checkbox"
                checked={useWallet}
                onChange={(e) => setUseWallet(e.target.checked)}
              />{" "}
              Use Wallet
            </label>
            <input
              type="number"
              value={walletPayment}
              min={0}
              disabled={!useWallet}
              onChange={(e) => setWalletPayment(Math.max(0, +e.target.value))}
            />
            <select
              value={otherPaymentMethod}
              onChange={(e) => setOtherPaymentMethod(e.target.value)}
            >
              <option>Cash</option>
              <option>GCash</option>
              <option>Points</option>
            </select>
            <input
              type="number"
              value={cashPayment}
              onChange={(e) => setCashPayment(Math.max(0, +e.target.value))}
            />
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
                  {o.id} - PHP {o.total}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
