import React, { useEffect, useState } from "react";
import Sidebar from "../components/SideBar";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../Firebase/firebaseConfig";

// Define the shape of an order
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
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [updateMode, setUpdateMode] = useState<boolean>(false);
  const [newStatus, setNewStatus] = useState<Order["status"]>("Pending");

  // 🔹 Fetch orders from Firestore
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "orders"));
        const fetchedOrders: Order[] = [];

        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          fetchedOrders.push({
            id: docSnap.id,
            customerEmail: data.customerEmail,
            date: data.date?.toDate().toISOString().split("T")[0] || "", // format date
            amount: data.amount,
            status: data.status,
            item: data.item,
            paymentMethod: data.paymentMethod,
          });
        });

        setOrders(fetchedOrders);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // 🔎 Filters
  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order.customerEmail
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesStatus = statusFilter === "" || order.status === statusFilter;
    const matchesStartDate =
      startDate === "" || new Date(order.date) >= new Date(startDate);
    const matchesEndDate =
      endDate === "" || new Date(order.date) <= new Date(endDate);
    return matchesSearch && matchesStatus && matchesStartDate && matchesEndDate;
  });

  const handleView = (order: Order) => {
    setSelectedOrder(order);
    setUpdateMode(false);
    setShowModal(true);
  };

  const handleUpdateClick = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setUpdateMode(true);
    setShowModal(true);
  };

  // 🔹 Update Firestore order status
  const handleStatusUpdate = async () => {
    if (selectedOrder) {
      try {
        const orderRef = doc(db, "orders", selectedOrder.id);
        await updateDoc(orderRef, {
          status: newStatus,
          updatedAt: serverTimestamp(),
        });

        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.id === selectedOrder.id
              ? { ...order, status: newStatus }
              : order
          )
        );
      } catch (err) {
        console.error("Error updating order:", err);
      }
    }
    setShowModal(false);
  };

  return (
    <>
      <Sidebar />

      <div className="orders-container">
        <h2 className="orders-title">📦 Orders & Transactions</h2>

        {/* 🔎 Filters */}
        <div className="filters">
          <input
            type="text"
            placeholder="Search customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
            <option value="Canceled">Canceled</option>
          </select>
        </div>

        {/* 📋 Orders Table */}
        {loading ? (
          <p>Loading orders...</p>
        ) : (
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.customerEmail}</td>
                  <td>{order.date}</td>
                  <td>₱{order.amount}</td>
                  <td>{order.status}</td>
                  <td>
                    <button
                      onClick={() => handleView(order)}
                      className="btn view"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleUpdateClick(order)}
                      className="btn update"
                    >
                      Update
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 🔹 Modal */}
      {showModal && selectedOrder && (
        <div className="modal">
          <div className="modal-content">
            <h3>{updateMode ? "Update Order Status" : "Order Details"}</h3>
            <p>
              <strong>Order ID:</strong> {selectedOrder.id}
            </p>
            <p>
              <strong>Customer:</strong> {selectedOrder.customerEmail}
            </p>
            <p>
              <strong>Date:</strong> {selectedOrder.date}
            </p>
            <p>
              <strong>Amount:</strong> ₱{selectedOrder.amount}
            </p>
            <p>
              <strong>Item:</strong> {selectedOrder.item}
            </p>
            <p>
              <strong>Payment Method:</strong> {selectedOrder.paymentMethod}
            </p>
            {updateMode ? (
              <>
                <label>Status:</label>
                <select
                  value={newStatus}
                  onChange={(e) =>
                    setNewStatus(e.target.value as Order["status"])
                  }
                >
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                  <option value="Canceled">Canceled</option>
                </select>
                <button className="btn confirm" onClick={handleStatusUpdate}>
                  Confirm Update
                </button>
              </>
            ) : (
              <p>
                <strong>Status:</strong> {selectedOrder.status}
              </p>
            )}
            <button className="btn close" onClick={() => setShowModal(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Orders;
