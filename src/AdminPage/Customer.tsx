import { useState } from "react";
import { Link } from "react-router-dom";

// Type definition for customer objects
interface CustomerType {
  id: number;
  name: string;
  tier: "Bronze" | "Silver" | "Gold";
  status: "Active" | "Inactive";
  email: string;
  wallet: number;
}

const initialCustomers: CustomerType[] = [
  {
    id: 1,
    name: "John Doe",
    tier: "Silver",
    status: "Active",
    email: "john@example.com",
    wallet: 100,
  },
  {
    id: 2,
    name: "Jane Smith",
    tier: "Gold",
    status: "Inactive",
    email: "jane@example.com",
    wallet: 50,
  },
  {
    id: 3,
    name: "Carlos Reyes",
    tier: "Bronze",
    status: "Active",
    email: "carlos@example.com",
    wallet: 75,
  },
];

function Customer() {
  const [customers, setCustomers] = useState<CustomerType[]>(initialCustomers);
  const [filterTier, setFilterTier] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerType | null>(
    null
  );

  const filteredCustomers = customers.filter((customer) => {
    const tierMatch = filterTier === "All" || customer.tier === filterTier;
    const statusMatch =
      filterStatus === "All" || customer.status === filterStatus;
    return tierMatch && statusMatch;
  });

  const handleView = (customer: CustomerType) => {
    setSelectedCustomer(customer);
  };

  const handleCloseModal = () => {
    setSelectedCustomer(null);
  };

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

    if (amountStr === null) return; // User cancelled

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
        </div>

        <table className="customer-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Tier</th>
              <th>Status</th>
              <th>Email</th>
              <th>Wallet</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map((customer) => (
              <tr key={customer.id}>
                <td>{customer.name}</td>
                <td>{customer.tier}</td>
                <td>{customer.status}</td>
                <td>{customer.email}</td>
                <td>₱{customer.wallet}</td>
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
                    onClick={() => handleSuspend(customer.id)}
                  >
                    {customer.status === "Active" ? "Suspend" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {selectedCustomer && (
          <div className="modal">
            <div className="modal-content">
              <h3>Customer Details</h3>
              <p>
                <strong>Name:</strong> {selectedCustomer.name}
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
              <button className="btn" onClick={handleCloseModal}>
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default Customer;
