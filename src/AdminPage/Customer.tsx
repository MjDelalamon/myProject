import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { addCustomerToFirestore } from "../Firebase/customerService";
import { db } from "../Firebase/firebaseConfig";
import { collection, onSnapshot, deleteDoc, doc } from "firebase/firestore"; // <-- add deleteDoc, doc
import Sidebar from "../components/SideBar";

interface CustomerType {
  id: string; // Firestore document ID
  customerNumber: string; // e.g., 0001, 0002, etc.
  fullName: string;
  mobile: string;
  tier: "Bronze" | "Silver" | "Gold";
  status: "Active" | "Inactive";
  email: string;
  wallet: number;
  qrCode: string;
  dateJoined: string;
  points: number;
}

function Customer() {
  const [customers, setCustomers] = useState<CustomerType[]>([]);
  const [filterTier, setFilterTier] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchMobile, setSearchMobile] = useState(""); // 🔍 search input
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
    const list = snapshot.docs.map((doc) => {
      const data = doc.data();

      // 🧠 convert Firestore Timestamp to readable date
      const dateJoined = data.createdAt
        ? data.createdAt.toDate().toLocaleDateString("en-PH", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "N/A";

      return {
        id: doc.id,
        ...(data as Omit<CustomerType, "id">),
        dateJoined,
      };
    });

    setCustomers(list);
  });

  return () => unsub();
}, []);





  // ➕ Add new customer
  const handleAddCustomer = async () => {
    const result = await addCustomerToFirestore(
      newCustomer.name,
      newCustomer.email,
      newCustomer.mobile,
      newCustomer.wallet
    );

    if (result.success) {
      alert("Customer added successfully with QR code!");
    } else {
      alert("Error adding customer: " + result.error);
    }

    setShowAddModal(false);
    setNewCustomer({ name: "", email: "", mobile: "", wallet: 0 });
  };

  // 🗑️ Delete customer
  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this customer?")) {
      await deleteDoc(doc(db, "customers", id));
      setCustomers((prev) => prev.filter((cust) => cust.id !== id));
    }
  };

  // ✅ Filtered customers list
  const filteredCustomers = customers.filter((customer) => {
    const tierMatch = filterTier === "All" || customer.tier === filterTier;
    const statusMatch =
      filterStatus === "All" || customer.status === filterStatus;
    const mobileMatch = customer.mobile
      .toLowerCase()
      .includes(searchMobile.toLowerCase());

    return tierMatch && statusMatch && mobileMatch;
  });

  return (
    <>
      <Sidebar />

      <div className="customer-container">
        <h2 className="title">Customer Management</h2>

        {/* Filters */}
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

          {/* 🔍 Search input */}
          <input
            type="text"
            placeholder="Search by Mobile Number"
            value={searchMobile}
            onChange={(e) => setSearchMobile(e.target.value)}
          />

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
              <th>Tier</th>
              <th>Status</th>
              <th>Wallet</th>
              <th>Points</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map((customer) => (
              <tr key={customer.id}>
                <td>{customer.customerNumber}</td>
                <td>{customer.fullName}</td>
                <td>{customer.mobile}</td>
                <td>{customer.tier}</td>
                <td>{customer.status}</td>
                <td>₱{customer.wallet}</td>
                <td>{customer.points}</td>
                <td>
                  <button
                    className="btn"
                    onClick={() => setSelectedCustomer(customer)}
                  >
                    View
                  </button>
                  <button
                    className="btn danger"
                    onClick={() => handleDelete(customer.id)}
                  >
                    Delete
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
                <strong>Name:</strong> {selectedCustomer.fullName}
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
  <strong>Date Joined:</strong> {selectedCustomer.dateJoined || "N/A"}
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
