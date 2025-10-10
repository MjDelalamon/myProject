import React, { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import Sidebar from "../components/SideBar";
import { updateCustomerStats } from "../functions/updateCustomerStats.ts";
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

type Order = {
  id: string;
  customerEmail: string;
  date: string;
  amount: number;
  status: "Pending" | "Completed" | "Canceled";
  item: string;
  paymentMethod: string;
};

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [filteredCustomer, setFilteredCustomer] = useState<string | null>(null);

  const fetchOrders = async (filterEmail: string | null = null) => {
    try {
      setLoading(true);
      let querySnapshot;
      if (filterEmail) {
        const q = query(
          collection(db, "orders"),
          where("customerEmail", "==", filterEmail)
        );
        querySnapshot = await getDocs(q);
      } else {
        querySnapshot = await getDocs(collection(db, "orders"));
      }

      const fetchedOrders: Order[] = querySnapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        const dateValue = data.date;
        let formattedDate = "";

        if (dateValue?.toDate) {
          formattedDate = dateValue.toDate().toISOString().split("T")[0];
        } else if (typeof dateValue === "string") {
          formattedDate = dateValue;
        }

        return {
          id: docSnap.id,
          customerEmail: data.customerEmail || "N/A",
          date: formattedDate,
          amount: data.amount || 0,
          status: data.status || "Pending",
          item: data.item || "N/A",
          paymentMethod: data.paymentMethod || "N/A",
        };
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

  // ✅ COMPLETE button (with points deduction)
  const handleComplete = async (order: Order) => {
    try {
      const customerRef = doc(db, "customers", order.customerEmail);
      const customerSnap = await getDoc(customerRef);

      if (!customerSnap.exists()) {
        alert("❌ Customer record not found.");
        return;
      }

      const customerData = customerSnap.data();
      const points = customerData.points || 0;
      const pointsToDeduct = order.amount; // points equivalent to order amount

      if (points < pointsToDeduct) {
        alert(
          `❌ Insufficient points. You need ${pointsToDeduct} but only have ${points}.`
        );
        return;
      }

      // 🔹 Deduct points from customer
      await updateDoc(customerRef, {
        points: points - pointsToDeduct,
      });

      // 🔹 Mark order as completed
      await updateDoc(doc(db, "orders", order.id), {
        status: "Completed",
        updatedAt: serverTimestamp(),
      });

      const transactionData = {
        customerEmail: order.customerEmail,
        orderId: order.id,
        item: order.item,
        amount: order.amount,
        paymentMethod: order.paymentMethod,
        status: "Completed",
        date: serverTimestamp(),
      };

      // ✅ 1. Save to global "transactions" collection
      await addDoc(collection(db, "transactions"), transactionData);

      // ✅ 2. Save to customer's subcollection "transactions"
      await addDoc(
        collection(db, "customers", order.customerEmail, "transactions"),
        transactionData
      );

      // ✅ 3. Update customer stats (favoriteCategory + totalSpent)
      await updateCustomerStats(order.customerEmail);

      alert(
        `✅ Order marked as completed!\n-${pointsToDeduct} points deducted.\nTransactions saved and customer stats updated.`
      );

      fetchOrders(filteredCustomer);

      // ✅ 1. Save to global "transactions" collection
      await addDoc(collection(db, "transactions"), transactionData);

      // ✅ 2. Save to customer's subcollection "transactions"
      await addDoc(
        collection(db, "customers", order.customerEmail, "transactions"),
        transactionData
      );

      alert(
        `✅ Order marked as completed!\n-${pointsToDeduct} points deducted.\nTransactions saved globally and under the customer.`
      );

      fetchOrders(filteredCustomer);
    } catch (error) {
      console.error("Error completing order:", error);
      alert("Failed to complete order.");
    }
  };

  // 🗑️ DELETE button
  const handleDelete = async (orderId: string) => {
    if (confirm("Are you sure you want to delete this order?")) {
      try {
        await deleteDoc(doc(db, "orders", orderId));
        alert("🗑️ Order deleted successfully!");
        fetchOrders(filteredCustomer);
      } catch (error) {
        console.error("Error deleting order:", error);
        alert("Failed to delete order.");
      }
    }
  };

  // 📷 QR Scanner (for filtering)
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
      <div className="orders-container">
        <h2 className="orders-title">📦 Orders & Transactions</h2>

        {/* 🔹 QR Filter Controls */}
        <div style={{ marginBottom: "15px" }}>
          <button onClick={startScanner}>📷 Scan QR to Filter Orders</button>
          {filteredCustomer && (
            <button
              style={{ marginLeft: "10px" }}
              onClick={() => {
                setFilteredCustomer(null);
                fetchOrders();
              }}
            >
              🔁 Show All Orders
            </button>
          )}
          {showScanner && (
            <div
              id="reader"
              style={{
                width: 300,
                height: 300,
                marginTop: 10,
                border: "2px solid #ccc",
              }}
            />
          )}
        </div>

        {loading ? (
          <p>Loading orders...</p>
        ) : orders.length === 0 ? (
          <p>No orders found.</p>
        ) : (
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Item</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.customerEmail}</td>
                  <td>{order.date}</td>
                  <td>{order.item}</td>
                  <td>₱{order.amount}</td>
                  <td>{order.paymentMethod}</td>
                  <td
                    className={`status ${
                      order.status === "Completed"
                        ? "completed"
                        : order.status === "Canceled"
                        ? "canceled"
                        : "pending"
                    }`}
                  >
                    {order.status}
                  </td>
                  <td>
                    {order.status !== "Completed" && (
                      <button
                        className="btn complete"
                        onClick={() => handleComplete(order)}
                      >
                        ✅ Complete
                      </button>
                    )}
                    <button
                      className="btn delete"
                      onClick={() => handleDelete(order.id)}
                    >
                      🗑️ Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
};

export default Orders;
