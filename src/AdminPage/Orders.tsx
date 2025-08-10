import React, { useState } from "react";
import { Link } from "react-router-dom";

// Define the shape of an order
type Order = {
  id: string;
  customer: string;
  date: string;
  amount: string;
  status: "Pending" | "Completed" | "Canceled";
  items: string[];
  walletUsed: number;
};

const Orders: React.FC = () => {
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const [orders, setOrders] = useState<Order[]>([
    {
      id: "ORD001",
      customer: "Jane Smith",
      date: "2025-07-30",
      amount: "₱1200",
      status: "Pending",
      items: ["Latte", "Donut"],
      walletUsed: 100,
    },
    {
      id: "ORD002",
      customer: "John Doe",
      date: "2025-07-29",
      amount: "₱750",
      status: "Completed",
      items: ["Americano"],
      walletUsed: 0,
    },
  ]);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [updateMode, setUpdateMode] = useState<boolean>(false);
  const [newStatus, setNewStatus] = useState<Order["status"]>("Pending");

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order.customer
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

  const handleStatusUpdate = () => {
    if (selectedOrder) {
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === selectedOrder.id
            ? { ...order, status: newStatus }
            : order
        )
      );
    }
    setShowModal(false);
  };

  return (
    <>
      <div className="sidebar">
        <h2 className="sidebar-title">Admin Panel</h2>
        <nav className="sidebar-nav">
          {[
            { path: "/dashboard", label: "Dashboard" },
            { path: "/customers", label: "Customers" },
            { path: "/orders", label: "Orders" },
            { path: "/rewards", label: "Rewards" },
            { path: "/menu", label: "Menu" },
            { path: "/wallet", label: "Wallet" },
            { path: "/feedback", label: "Feedback" },
            { path: "/notifications", label: "Notifications" },
            { path: "/settings", label: "Settings" },
            { path: "/", label: "Logout" },
          ].map((item) => (
            <Link to={item.path} key={item.label} className="sidebar-link">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="orders-container">
        <h2 className="orders-title">📦 Orders & Transactions</h2>

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
                <td>{order.customer}</td>
                <td>{order.date}</td>
                <td>{order.amount}</td>
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
      </div>

      {showModal && selectedOrder && (
        <div className="modal">
          <div className="modal-content">
            <h3>{updateMode ? "Update Order Status" : "Order Details"}</h3>
            <p>
              <strong>Order ID:</strong> {selectedOrder.id}
            </p>
            <p>
              <strong>Customer:</strong> {selectedOrder.customer}
            </p>
            <p>
              <strong>Date:</strong> {selectedOrder.date}
            </p>
            <p>
              <strong>Amount:</strong> {selectedOrder.amount}
            </p>
            <p>
              <strong>Items:</strong> {selectedOrder.items.join(", ")}
            </p>
            <p>
              <strong>Wallet Used:</strong> ₱{selectedOrder.walletUsed}
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
