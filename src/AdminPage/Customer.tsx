interface CustomerType {
  id: string; // Firestore document ID
  customerNumber: string; // 🔹 ID na 0001, 0002, etc.
  name: string;
  mobile: string;
  tier: "Bronze" | "Silver" | "Gold";
  status: "Active" | "Inactive";
  email: string;
  wallet: number;
  qrCode: string;
  dateJoined: string;
  points: number;
}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { addCustomerToFirestore } from "../Firebase/customerService";
import { db } from "../Firebase/firebaseConfig";
import { collection, onSnapshot } from "firebase/firestore";

function Customer() {
  const [customers, setCustomers] = useState<CustomerType[]>([]);
  const [filterTier, setFilterTier] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerType | null>(
    null
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    email: "",
    mobile: "",
    wallet: 0,
  });

  // 🔥 Fetch customers from Firestore in realtime
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "customers"), (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id, // Firestore auto id
        ...(doc.data() as Omit<CustomerType, "id">),
      }));
      setCustomers(list);
    });

    return () => unsub();
  }, []);

  // Add new customer to Firestore
  const handleAddCustomer = async () => {
    const result = await addCustomerToFirestore(
      newCustomer.name,
      newCustomer.email,
      newCustomer.mobile,
      newCustomer.wallet
    );

    if (result.success) {
      alert("Customer added successfully!");
    } else {
      alert("Error adding customer: " + result.error);
    }

    setShowAddModal(false);
    setNewCustomer({ name: "", email: "", mobile: "", wallet: 0 });
  };

  const handleSuspend = (id: string) => {
    setCustomers((prev) =>
      prev.map((cust) =>
        cust.id === id
          ? {
              ...cust,
              status: cust.status === "Active" ? "Inactive" : "Active",
            }
          : cust
      )
    );
  };

  const filteredCustomers = customers.filter((customer) => {
    const tierMatch = filterTier === "All" || customer.tier === filterTier;
    const statusMatch =
      filterStatus === "All" || customer.status === filterStatus;
    return tierMatch && statusMatch;
  });

  return (
    <>
      <div className="sidebar">
        <h2 className="sidebar-title">Admin Panel</h2>
        <nav className="sidebar-nav">
          <Link to="/dashboard" className="sidebar-link">
            Dashboard
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

      <div className="customer-container">
        <h2 className="title">Customer Management</h2>

        <div className="filters">
          {/* Filters */}
          <select
            value={filterTier}
            onChange={(e) => setFilterTier(e.target.value)}
          >
            <option value="All">All Tiers</option>
            <option value="Bronze">Bronze</option>
            <option value="Silver">Silver</option>
            <option value="Gold">Gold</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          <button className="btn add" onClick={() => setShowAddModal(true)}>
            + Add Customer
          </button>
        </div>

        {/* Table */}
        <table className="customer-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Mobile</th>
              <th>Email</th>
              <th>Tier</th>
              <th>Status</th>
              <th>Wallet</th>
              <th>Points</th>
              <th>Date Joined</th>
              <th>QR</th>
              <th>Actions</th> {/* 🔹 Add Actions column */}
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map((customer) => (
              <tr key={customer.id}>
                <td>{customer.customerNumber}</td>
                <td>{customer.name}</td>
                <td>{customer.mobile}</td>
                <td>{customer.email}</td>
                <td>{customer.tier}</td>
                <td>{customer.status}</td>
                <td>₱{customer.wallet}</td>
                <td>{customer.points}</td>
                <td>{customer.dateJoined}</td>
                <td>
                  {customer.qrCode && (
                    <QRCodeSVG value={customer.qrCode} size={64} />
                  )}
                </td>
                <td>
                  <button
                    className="btn"
                    onClick={() => setSelectedCustomer(customer)}
                  >
                    View
                  </button>

                  <button
                    className="btn danger"
                    style={
                      customer.status === "Inactive"
                        ? { backgroundColor: "#5cb85c" }
                        : {}
                    }
                    onClick={() => handleSuspend(customer.id)}
                  >
                    {customer.status === "Active" ? "Suspend" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* View Customer Modal */}
        {selectedCustomer && (
          <div className="modal">
            <div className="modal-content">
              <h3>Customer Details</h3>
              <p>
                <strong>ID:</strong> {selectedCustomer.customerNumber}
              </p>
              <p>
                <strong>Name:</strong> {selectedCustomer.name}
              </p>
              <p>
                <strong>Mobile:</strong> {selectedCustomer.mobile}
              </p>
              <p>
                <strong>Email:</strong> {selectedCustomer.email}
              </p>
              <p>
                <strong>Tier:</strong> {selectedCustomer.tier}
              </p>
              <p>
                <strong>Status:</strong> {selectedCustomer.status}
              </p>
              <p>
                <strong>Wallet:</strong> ₱{selectedCustomer.wallet}
              </p>
              <p>
                <strong>Points:</strong> {selectedCustomer.points}
              </p>
              <p>
                <strong>Date Joined:</strong> {selectedCustomer.dateJoined}
              </p>
              {selectedCustomer.qrCode && (
                <QRCodeSVG value={selectedCustomer.qrCode} size={128} />
              )}
              <br />
              <button className="btn" onClick={() => setSelectedCustomer(null)}>
                Close
              </button>
            </div>
          </div>
        )}

        {showAddModal && (
          <div className="modal">
            <div className="modal-content">
              <h3>Add Customer</h3>
              <input
                type="text"
                placeholder="Name"
                value={newCustomer.name}
                onChange={(e) =>
                  setNewCustomer({ ...newCustomer, name: e.target.value })
                }
              />
              <input
                type="text"
                placeholder="Mobile Number"
                value={newCustomer.mobile}
                onChange={(e) =>
                  setNewCustomer({ ...newCustomer, mobile: e.target.value })
                }
              />
              <input
                type="email"
                placeholder="Email"
                value={newCustomer.email}
                onChange={(e) =>
                  setNewCustomer({ ...newCustomer, email: e.target.value })
                }
              />
              <input
                type="number"
                placeholder="Wallet"
                value={newCustomer.wallet}
                onChange={(e) =>
                  setNewCustomer({
                    ...newCustomer,
                    wallet: Number(e.target.value),
                  })
                }
              />
              <div className="modal-actions">
                <button className="btn" onClick={handleAddCustomer}>
                  Save
                </button>
                <button
                  className="btn danger"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
export default Customer;
