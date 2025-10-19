import React, { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import Sidebar from "../components/SideBar";

import {
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  query,
  where,
  addDoc,
} from "firebase/firestore";
import { db } from "../Firebase/firebaseConfig";
import "../Style/Order.css";

type Order = {
  id: string;
  customerEmail: string;
  date: string;
  amount: number;
  status: "Pending" | "Completed" | "Canceled";
  items: any[]; // full items array
  paymentMethod: string;
  paidByWallet?: boolean;
  pointsEarned?: number;
};

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [filteredCustomer, setFilteredCustomer] = useState<string | null>(null);

  // new: selected order for details modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  const fetchOrders = async (filterEmail: string | null = null) => {
    try {
      setLoading(true);
      let querySnapshot;
      if (filterEmail) {
        const q = query(
          collection(db, "orders"),
          where("customerId", "==", filterEmail)
        );
        querySnapshot = await getDocs(q);
      } else {
        querySnapshot = await getDocs(collection(db, "orders"));
      }

      const fetchedOrders: Order[] = querySnapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        // placedAt may be timestamp or string
        const placedAt = data.placedAt || data.date || "";
        let formattedDate = "";
        if (placedAt?.toDate) {
          formattedDate = placedAt.toDate().toISOString().split("T")[0];
        } else if (typeof placedAt === "string") {
          formattedDate = placedAt.split("T")[0];
        }

        // items array
        const items = Array.isArray(data.items) ? data.items : [];

        // payment method inference
        const paymentMethod = data.paidByWallet
          ? "Wallet"
          : data.paymentMethod ||
            (data.type === "points-used" ? "Points" : "Cash");

        return {
          id: docSnap.id,
          customerEmail: data.customerId || "N/A",
          date: formattedDate,
          amount: data.subtotal || data.total || data.amount || 0,

          status: data.status || "Pending",
          items,
          paymentMethod,
          paidByWallet: !!data.paidByWallet,
          pointsEarned: data.pointsEarned || 0,
        } as Order;
      });
      setOrders(fetchedOrders);
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // new helper: create transaction documents (global & customer subcollection)
  // new helper: create transaction documents (global & customer subcollection)
  const createTransactionRecords = async ({
    customerEmail,
    orderId,
    amount,
    paymentMethod,
    type,
    status,
    date,
    items,
  }: any) => {
    // create global transaction document
    await addDoc(collection(db, "transactions"), {
      orderId,
      amount,
      paymentMethod,
      type,
      status,
      date,
      items, // ← dito na mismo nakasama lahat ng items
    });

    // also create one under customer's transactions subcollection
    await addDoc(collection(db, "customers", customerEmail, "transactions"), {
      orderId,
      amount,
      paymentMethod,
      type,
      status,
      date,
      items,
    });
  };

  // Complete order: mark Completed and create transaction records + update customer stats
  const handleComplete = async (order: Order) => {
  try {
    const customerRef = doc(db, "customers", order.customerEmail);
    const customerSnap = await getDoc(customerRef);

    if (!customerSnap.exists()) {
      alert("❌ Customer not found.");
      return;
    }

    const customerData = customerSnap.data();
    const currentPoints = customerData.points || 0;
    const orderCost = order.amount;

    if (currentPoints < orderCost) {
      alert("⚠️ Not enough points to complete this order!");
      return;
    }

    // Deduct points and add to totalSpent
    await updateDoc(customerRef, {
      points: currentPoints - orderCost,
      totalSpent: (customerData.totalSpent || 0) + orderCost,
      updatedAt: serverTimestamp(),
    });

    // Mark order completed
    await updateDoc(doc(db, "orders", order.id), {
      status: "Completed",
      paymentMethod: "Points",
      updatedAt: serverTimestamp(),
    });

    // Create transaction records (global + customer subcollection)
    await createTransactionRecords({
      customerEmail: order.customerEmail,
      orderId: order.id,
      amount: order.amount,
      paymentMethod: "Points",
      type: "points-used",
      status: "Completed",
      date: serverTimestamp(),
      items: order.items || [],
    });

    alert("✅ Order completed and points deducted successfully.");
    fetchOrders(filteredCustomer);
  } catch (error) {
    console.error("Error completing order:", error);
    alert("❌ Failed to complete order.");
  }
};



  // Delete order: remove order and related transactions (global and customer's subcollection)
  const handleDelete = async (orderId: string, customerEmail: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this order and related transactions?"
      )
    )
      return;
    try {
      // delete order doc
      await deleteDoc(doc(db, "orders", orderId));

      // delete global transactions where orderId == orderId
      const q = query(
        collection(db, "transactions"),
        where("orderId", "==", orderId)
      );
      const snap = await getDocs(q);
      for (const t of snap.docs) {
        // delete items subcollection under transaction
        const itemsSnap = await getDocs(
          collection(db, "transactions", t.id, "items")
        );
        for (const it of itemsSnap.docs) {
          await deleteDoc(doc(db, "transactions", t.id, "items", it.id));
        }
        await deleteDoc(doc(db, "transactions", t.id));
      }

      // delete customer's transactions with orderId
      const q2 = query(
        collection(db, "customers", customerEmail, "transactions"),
        where("orderId", "==", orderId)
      );
      const snap2 = await getDocs(q2);
      for (const t of snap2.docs) {
        await deleteDoc(
          doc(db, "customers", customerEmail, "transactions", t.id)
        );
      }

      alert("🗑️ Order and related transactions deleted successfully.");
      fetchOrders(filteredCustomer);
    } catch (error) {
      console.error("Error deleting order:", error);
      alert("Failed to delete order.");
    }
  };

  // View details
  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };
  const closeOrderDetails = () => {
    setSelectedOrder(null);
    setShowOrderModal(false);
  };

  const startScannerQR = () => {
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
            setFilteredCustomer(decodedText);
            alert(`✅ Showing orders for: ${snap.data().fullName}`);
            fetchOrders(decodedText);
          } else {
            alert("❌ Customer not found!");
          }
        } catch (err) {
          console.error("Error scanning QR:", err);
        }
        scanner.clear().catch(() => {});
        setShowScanner(false);
      },
      (err) => console.warn(err)
    );
  };

  return (
    <>
      <Sidebar />
      <div className="p-6 ml-64">
        <h2 className="text-2xl font-semibold mb-4">Redeem Orders</h2>

        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={startScannerQR}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            📷 Scan QR to Filter
          </button>
          {filteredCustomer && (
            <button
              className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 transition"
              onClick={() => {
                setFilteredCustomer(null);
                fetchOrders();
              }}
            >
              🔁 Show All
            </button>
          )}
        </div>

        {showScanner && (
          <div
            id="reader"
            className="w-[300px] h-[300px] border-2 border-gray-300 mb-4"
          />
        )}

        {loading ? (
          <p>Loading orders...</p>
        ) : orders.length === 0 ? (
          <p>No orders found.</p>
        ) : (
          <div className="orders-grid">
  {orders.map((order) => {
    const isFlipped = selectedOrder?.id === order.id;
    return (
      <div
        key={order.id}
        className={`flip-card ${isFlipped ? "flipped" : ""}`}
      >
        <div className="flip-card-inner">
          {/* Front */}
          <div className="flip-card-front order-card">
            <div>
              <h3>🧾 Order ID: {order.id}</h3>
              
              <p><strong>Date:</strong> {order.date}</p>
              <p><strong>Items:</strong>{" "}
                {order.items && order.items.length
                  ? order.items.map((i) => i.name).join(", ")
                  : "N/A"}
              </p>
              <p><strong>Amount:</strong> ₱{order.amount}</p>
              <span className={`order-status ${order.status.toLowerCase()}`}>
                {order.status}
              </span>
            </div>
            <div className="card-actions">
              <button
                className="view-btn"
                onClick={() => setSelectedOrder(isFlipped ? null : order)}
              >
                View Details
              </button>
              {order.status !== "Completed" && (
                <button
                  className="complete-btn"
                  onClick={() => handleComplete(order)}
                >
                  ✅ Complete
                </button>
              )}
              <button
                className="delete-btn"
                onClick={() => handleDelete(order.id, order.customerEmail)}
              >
                🗑️ Delete
              </button>
            </div>
          </div>

          {/* Back */}
          <div className="flip-card-back order-card">
            <div>
              <h3>Order Details — {order.id}</h3>
              <p><strong>Customer:</strong> {order.customerEmail}</p>
              <p><strong>Payment:</strong> {order.paymentMethod} {order.paidByWallet ? "(Wallet)" : ""}</p>
              
              <hr />
              <h4>Items</h4>
              <table className="items-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((it, idx) => (
                    <tr key={idx}>
                      <td>{it.name || "N/A"}</td>
                      <td>{it.category || "N/A"}</td>
                      <td>{it.qty}</td>
                      <td>₱{Number(it.price).toFixed(2)}</td>
                      <td>₱{(it.qty * Number(it.price)).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <hr />
              <p className="total">Total: ₱{order.amount}</p>
            </div>
            <div className="card-actions">
              <button className="back-btn" onClick={() => setSelectedOrder(null)}>
                🔙 Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  })}
</div>

        )}

    


      </div>
    </>
  );
};

export default Orders;
