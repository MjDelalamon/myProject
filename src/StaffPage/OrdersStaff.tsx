import React, { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import SidebarStaff from "../components/SideBarStaff";
import { updateFavoriteCategory } from "../functions/updateFavoriteCategory";

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
  items: any[];
  paymentMethod: string;
  paidByWallet?: boolean;
  pointsEarned?: number;
  instructions?: string;
  
};

const OrdersStaff: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [filteredCustomer, setFilteredCustomer] = useState<string | null>(null);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"Pending" | "Completed">("Pending");

  const filteredOrders = orders.filter((order) => order.status === statusFilter);

  // Payment modal states
  const [pendingOrder, setPendingOrder] = useState<Order | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentChoice, setPaymentChoice] = useState<"Cash" | "Wallet" | "Mix" | null>(null);
  const [pointsToUse, setPointsToUse] = useState<number>(0);

  const fetchOrders = async (filterEmail: string | null = null) => {
    try {
      setLoading(true);
      let querySnapshot;
      if (filterEmail) {
        const q = query(collection(db, "orders"), where("customerId", "==", filterEmail));
        querySnapshot = await getDocs(q);
      } else {
        querySnapshot = await getDocs(collection(db, "orders"));
      }

      const fetchedOrders: Order[] = querySnapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        const placedAt = data.placedAt || data.date || "";
        let formattedDate = "";
        if (placedAt?.toDate) {
          formattedDate = placedAt.toDate().toISOString().split("T")[0];
        } else if (typeof placedAt === "string") {
          formattedDate = placedAt.split("T")[0];
        }
        const items = Array.isArray(data.items) ? data.items : [];
        const paymentMethod = data.paidByWallet
          ? "Wallet"
          : data.paymentMethod || (data.type === "points-used" ? "Points" : "Cash");

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
          instructions: data.instructions || "",
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

  const createTransactionRecords = async ({
    customerEmail,
    customerName,
    orderId,
    amount,
    paymentMethod,
    type,
    status,
    date,
    items,
    pointsEarned = 0,
  }: any) => {
    await addDoc(collection(db, "transactions"), {
      orderId,
      amount,
      paymentMethod,
      type,
      status,
      date,
      items,
      customerId: customerEmail,
      fullName: customerName,
      pointsEarned
    });
    await addDoc(collection(db, "customers", customerEmail, "transactions"), {
      orderId,
      amount,
      paymentMethod,
      type,
      status,
      date,
      items,
      customerId: customerEmail,
      fullName: customerName,
      pointsEarned
    });
  };

  const completeOrderWithPoints = async (
    order: Order,
    fullName: string,
    pointsUsed: number
  ) => {
    const customerRef = doc(db, "customers", order.customerEmail);
    const customerSnap = await getDoc(customerRef);
    const customerData = customerSnap.data();

    await updateDoc(customerRef, {
      points: (customerData.points || 0) - pointsUsed,
      totalSpent: (customerData.totalSpent || 0) + order.amount,
      updatedAt: serverTimestamp(),
    });

    await updateDoc(doc(db, "orders", order.id), {
      status: "Completed",
      paymentMethod: pointsUsed === order.amount ? "Points" : "Mix",
      updatedAt: serverTimestamp(),
    });

    await createTransactionRecords({
      customerEmail: order.customerEmail,
      customerName: fullName,
      orderId: order.id,
      amount: order.amount,
      paymentMethod: pointsUsed === order.amount ? "Points" : "Mix",
      type: pointsUsed === order.amount ? "points-used" : "mixed-payment",
      status: "Completed",
      date: serverTimestamp(),
      items: order.items,
    });

    await updateFavoriteCategory(order.customerEmail);
    alert("✅ Order completed successfully.");
    fetchOrders(filteredCustomer);
  };

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
    const walletBalance = customerData.wallet || 0;
    const orderCost = order.amount;

    // If customer has enough points
    if (currentPoints >= orderCost) {
      await completeOrderWithPoints(order, customerData.fullName || "N/A", orderCost);
      return;
    }

    // Open modal if not enough points
    setPendingOrder(order);
    setPointsToUse(currentPoints);
    setShowPaymentModal(true);

  } catch (error) {
    console.error("Error completing order:", error);
    alert("❌ Failed to complete order.");
  }
};

const handlePaymentChoice = async (choice: "Cash" | "Wallet") => {
  if (!pendingOrder) return;

  const customerRef = doc(db, "customers", pendingOrder.customerEmail);
  const customerSnap = await getDoc(customerRef);
  const customerData = customerSnap.data();
  const customerName = customerData.fullName || "N/A";

  const pointsBalance = customerData.points || 0;
  const walletBalance = customerData.wallet || 0;
  const orderCost = pendingOrder.amount;

  let pointsUsed = Math.min(pointsBalance, orderCost);
  let remainingAmount = orderCost - pointsUsed;

  if (choice === "Cash") {
    // Cash covers the remaining after points
    await updateDoc(customerRef, {
      points: pointsBalance - pointsUsed,
      totalSpent: (customerData.totalSpent || 0) + orderCost,
      updatedAt: serverTimestamp(),
    });

    await updateDoc(doc(db, "orders", pendingOrder.id), {
      status: "Completed",
      paymentMethod: pointsUsed > 0 ? "Points + Cash" : "Cash",
      updatedAt: serverTimestamp(),
    });

    await createTransactionRecords({
      customerEmail: pendingOrder.customerEmail,
      customerName,
      orderId: pendingOrder.id,
      amount: orderCost,
      paymentMethod: pointsUsed > 0 ? "Points + Cash" : "Cash",
      type: pointsUsed > 0 ? "points-cash" : "cash",
      status: "Completed",
      date: serverTimestamp(),
      items: pendingOrder.items,
    });

    alert(`✅ Order completed using ${pointsUsed} points + ₱${remainingAmount} cash.`);

  } else if (choice === "Wallet") {
    // Wallet covers the remaining after points
    if (walletBalance < remainingAmount) {
      alert("❌ Not enough wallet balance to complete payment!");
      return;
    }

    await updateDoc(customerRef, {
      points: pointsBalance - pointsUsed,
      wallet: walletBalance - remainingAmount,
      totalSpent: (customerData.totalSpent || 0) + orderCost,
      updatedAt: serverTimestamp(),
    });

    await updateDoc(doc(db, "orders", pendingOrder.id), {
      status: "Completed",
      paymentMethod: pointsUsed > 0 ? "Points + Wallet" : "Wallet",
      paidByWallet: true,
      updatedAt: serverTimestamp(),
    });

    await createTransactionRecords({
      customerEmail: pendingOrder.customerEmail,
      customerName,
      orderId: pendingOrder.id,
      amount: orderCost,
      paymentMethod: pointsUsed > 0 ? "Points + Wallet" : "Wallet",
      type: pointsUsed > 0 ? "points-wallet" : "wallet",
      status: "Completed",
      date: serverTimestamp(),
      items: pendingOrder.items,
    });

    alert(`✅ Order completed using ${pointsUsed} points + ₱${remainingAmount} from wallet.`);
  }

  // Reset modal
  setShowPaymentModal(false);
  setPendingOrder(null);
  fetchOrders(filteredCustomer);
};


  const handleCancel = async (orderId: string, customerEmail: string) => {
  if (!confirm("Are you sure you want to cancel this order?")) return;
  try {
    const orderRef = doc(db, "orders", orderId);
    await updateDoc(orderRef, {
      status: "Canceled",
      updatedAt: serverTimestamp(),
    });

    // Optional: also reflect the cancellation in transactions
    const q = query(collection(db, "transactions"), where("orderId", "==", orderId));
    const snap = await getDocs(q);
    for (const t of snap.docs) {
      await updateDoc(doc(db, "transactions", t.id), {
        status: "Canceled",
        updatedAt: serverTimestamp(),
      });
    }

    const q2 = query(collection(db, "customers", customerEmail, "transactions"), where("orderId", "==", orderId));
    const snap2 = await getDocs(q2);
    for (const t of snap2.docs) {
      await updateDoc(doc(db, "customers", customerEmail, "transactions", t.id), {
        status: "Canceled",
        updatedAt: serverTimestamp(),
      });
    }

    alert("🚫 Order has been marked as Canceled.");
    fetchOrders(filteredCustomer);
  } catch (error) {
    console.error("Error canceling order:", error);
    alert("❌ Failed to cancel order.");
  }
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
  <SidebarStaff />
  <div className="p-6 ml-64">
    <h2 className="text-2xl font-semibold mb-4">Redeem Orders</h2>

    {/* Filters */}
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

      {/* Status Filter */}
      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value as "Pending" | "Completed")}
        className="px-3 py-2 border rounded-lg"
      >
        <option value="Pending">Pending</option>
        <option value="Completed">Completed</option>
      </select>
    </div>

    {showScanner && (
      <div
        id="reader"
        className="w-[300px] h-[300px] border-2 border-gray-300 mb-4"
      />
    )}

    {loading ? (
      <p>Loading orders...</p>
    ) : orders.filter(o => o.status === statusFilter).length === 0 ? (
      <p>No orders found.</p>
    ) : (
      <div className="table-wrapper">
        <table className="orders-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Items</th>
              <th>Amount</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders
              .filter(order => order.status === statusFilter)
              .map((order) => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{order.customerEmail}</td>
                <td>{order.date}</td>
                <td>{order.items.length ? order.items.map(i => i.name).join(", ") : "N/A"}</td>
                <td>{order.amount.toFixed(2)} pts.</td>
                <td>Points</td>
                <td>
                  <span className={`order-status ${order.status.toLowerCase()}`}>
                    {order.status}
                  </span>
                </td>
                <td>
  {order.status === "Pending" ? (
    <>
      <button
        className="complete-btn"
        onClick={() => handleComplete(order)}
        style={{ background: "#ffca61", color: "white", marginRight: "6px" }}
      >
        Complete
      </button>
      <button
        className="cancel-btn"
        onClick={() => handleCancel(order.id, order.customerEmail)}
        style={{ background: "#ff2600", color: "white" }}
      >
        Cancel
      </button>
    </>
  ) : order.status === "Completed" ? (
    <button
      className="delete-btn"
      onClick={async () => {
        if (!confirm("🗑️ Are you sure you want to delete this completed order?")) return;
        try {
          await deleteDoc(doc(db, "orders", order.id));
          alert("✅ Order deleted successfully!");
          fetchOrders(filteredCustomer);
        } catch (error) {
          console.error("Error deleting order:", error);
          alert("❌ Failed to delete order.");
        }
      }}
      style={{ background: "#d32f2f", color: "white" }}
    >
      Delete
    </button>
  ) : null}
</td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}

    {/* Payment Modal */}
    {showPaymentModal && pendingOrder && (
      <div className="payment-modal">
        <div className="payment-modal-content">
          <h3>Not enough points</h3>
          <p>
            Customer has only {pointsToUse} points, order costs ₱{pendingOrder.amount}.<br/>
            Choose how to pay:
          </p>
          <div className="payment-options">
            <button onClick={() => handlePaymentChoice("Cash")}> Cash</button>
            <button onClick={() => handlePaymentChoice("Wallet")}> Wallet</button>
          </div>
          <button
            className="cancel-btn"
            onClick={() => {
              setShowPaymentModal(false);
              setPendingOrder(null);
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    )}
  </div>
</>

  );
};

export default OrdersStaff;
