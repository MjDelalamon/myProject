import { useState } from "react";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { addCustomerToFirestore } from "../Firebase/customerService";

interface CustomerType {
  id: number;
  name: string;
  mobile: string;
  tier: "Bronze" | "Silver" | "Gold";
  status: "Active" | "Inactive";
  email: string;
  wallet: number;
  qrCode: string; // store QR code data
  dateJoined: string; // new
  points: number; // new
}

const initialCustomers: CustomerType[] = [];

function Customer() {
  const [customers, setCustomers] = useState<CustomerType[]>(initialCustomers);
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

  // Add new customer

  const handleAddCustomer = async () => {
    const result = await addCustomerToFirestore(
      newCustomer.name,
      newCustomer.email,
      newCustomer.mobile,
      newCustomer.wallet
    );

    if (result.success) {
      alert("Customer added successfully!");

      // Update local state para lumabas agad sa table
      setCustomers((prev) => [
        ...prev,
        {
          id: prev.length > 0 ? Math.max(...prev.map((c) => c.id)) + 1 : 1,
          name: newCustomer.name,
          email: newCustomer.email,
          mobile: newCustomer.mobile,
          wallet: newCustomer.wallet,
          tier: "Bronze",
          status: "Active",
          qrCode: result.qrUrl!, // galing sa Firestore update
          dateJoined: new Date().toISOString().split("T")[0],
          points: 0,
        },
      ]);
    } else {
      alert("Error adding customer: " + result.error);
    }

    setShowAddModal(false);
    setNewCustomer({ name: "", email: "", mobile: "", wallet: 0 });
  };

  const filteredCustomers = customers
    .filter((customer) => {
      const tierMatch = filterTier === "All" || customer.tier === filterTier;
      const statusMatch =
        filterStatus === "All" || customer.status === filterStatus;
      return tierMatch && statusMatch;
    })
    .sort((a, b) => a.id - b.id);

  const handleView = (customer: CustomerType) => setSelectedCustomer(customer);
  const handleCloseModal = () => setSelectedCustomer(null);

  const handleChangeTier = (id: number) => {
    setCustomers((prev) =>
      prev.map((cust) => {
        if (cust.id === id) {
          const tiers: CustomerType["tier"][] = ["Bronze", "Silver", "Gold"];
          const currentIndex = tiers.indexOf(cust.tier);
          const nextTier = tiers[(currentIndex + 1) % tiers.length];
          return { ...cust, tier: nextTier };
        }
        return cust;
      })
    );
  };

  const handleUpdateWallet = (id: number) => {
    const amountStr = prompt("Enter amount to add to wallet:");
    if (amountStr === null) return;

    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid positive number.");
      return;
    }

    setCustomers((prev) =>
      prev.map((cust) =>
        cust.id === id ? { ...cust, wallet: cust.wallet + amount } : cust
      )
    );
  };

  const handleSuspend = (id: number) => {
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

  return (
    <>
      {/* Sidebar */}
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

      {/* Customer Container */}
      <div className="customer-container">
        <h2 className="title">Customer Management</h2>

        <div className="filters">
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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map((customer) => (
              <tr key={customer.id}>
                <td>{customer.id}</td>
                <td>{customer.name}</td>
                <td>{customer.mobile}</td>
                <td>{customer.email}</td>
                <td>{customer.tier}</td>
                <td>{customer.status}</td>
                <td>₱{customer.wallet}</td>
                <td>{customer.points}</td>
                <td>{customer.dateJoined}</td>
                <td>
                  <button className="btn" onClick={() => handleView(customer)}>
                    View
                  </button>
                  <button
                    className="btn"
                    onClick={() => handleChangeTier(customer.id)}
                  >
                    Tier
                  </button>
                  <button
                    className="btn"
                    onClick={() => handleUpdateWallet(customer.id)}
                  >
                    Wallet
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

        {/* View Modal */}
        {selectedCustomer && (
          <div className="modal">
            <div className="modal-content">
              <h3>Customer Details</h3>
              <p>
                <strong>ID:</strong> {selectedCustomer.id}
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
              <p>
                <strong>QR Code:</strong>
              </p>
              <QRCodeSVG value={selectedCustomer.qrCode} size={128} />

              <br />
              <button className="btn" onClick={handleCloseModal}>
                Close
              </button>
            </div>
          </div>
        )}

        {/* Add Customer Modal */}
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
