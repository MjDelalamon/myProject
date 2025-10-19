import { useEffect, useState, useMemo } from "react";
import { db } from "../Firebase/firebaseConfig";
import { collection, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import Sidebar from "../components/SideBar";
import CustomerTable from "../components/CustomerTable";
import AddCustomerModal from "../components/AddCustomerModal";
import ViewCustomerModal from "../components/customerModal";
import { addCustomerToFirestore } from "../Firebase/customerService";

export interface CustomerType {
  id: string;
  customerNumber: string;
  fullName: string;
  mobile: string;
  tier: "Bronze" | "Silver" | "Gold";
  status: "Active" | "Inactive";
  email: string;
  wallet: number;
  qrCode: string;
  dateJoined: string;
  points: number;
  favoriteCategory: string;
}

function Customer() {
  const [customers, setCustomers] = useState<CustomerType[]>([]);
  const [filters, setFilters] = useState({ tier: "All", status: "All", mobile: "" });
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerType | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Fetch customers realtime
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "customers"),
      (snapshot) => {
        const list = snapshot.docs.map((doc) => {
          const data = doc.data();
          const dateJoined = data.createdAt
            ? data.createdAt.toDate().toLocaleDateString("en-PH", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : "N/A";
          return { id: doc.id, ...(data as Omit<CustomerType, "id">), dateJoined };
        });
        setCustomers(list);
      },
      (err) => console.error("Error fetching customers:", err)
    );

    return () => unsub();
  }, []);

  // Add customer
  const handleAddCustomer = async (newCustomer: Partial<CustomerType>) => {
    if (!newCustomer.email) {
      alert("Email is required to generate QR code");
      return;
    }
    const result = await addCustomerToFirestore(newCustomer);

    if (result.success) {
      alert(`Customer added successfully!`);
    } else {
      alert("Error adding customer: " + result.error);
    }
  };

  // Delete customer
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this customer?")) return;
    await deleteDoc(doc(db, "customers", id));
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  };

  // Filtered customers
  const filteredCustomers = useMemo(
    () =>
      customers.filter((c) => {
        const tierMatch = filters.tier === "All" || c.tier === filters.tier;
        const statusMatch = filters.status === "All" || c.status === filters.status;
        const mobileMatch = c.mobile.toLowerCase().includes(filters.mobile.toLowerCase());
        return tierMatch && statusMatch && mobileMatch;
      }),
    [customers, filters]
  );

  return (
    <>
      <Sidebar />
      <div className="customer-container">
        <h2 className="title">Customer Management</h2>

        {/* Filters + Add */}
        <div className="filters">
          <select value={filters.tier} onChange={e => setFilters(f => ({ ...f, tier: e.target.value }))}>
            <option value="All">All Tiers</option>
            <option value="Bronze">Bronze</option>
            <option value="Silver">Silver</option>
            <option value="Gold">Gold</option>
          </select>
          <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <input
            type="text"
            placeholder="Search by Mobile"
            value={filters.mobile}
            onChange={e => setFilters(f => ({ ...f, mobile: e.target.value }))}
          />
          <button className="btn add" onClick={() => setShowAddModal(true)}>+ Add Customer</button>
        </div>

        {/* Customer Table */}
        <CustomerTable
          customers={filteredCustomers}
          onView={setSelectedCustomer}
          onDelete={handleDelete}
        />

        {/* View Modal */}
        {selectedCustomer && (
          <ViewCustomerModal customer={selectedCustomer} onClose={() => setSelectedCustomer(null)} />
        )}

        {/* Add Modal */}
        {showAddModal && (
          <AddCustomerModal
            onClose={() => setShowAddModal(false)}
            onAdd={handleAddCustomer}
          />
        )}
      </div>
    </>
  );
}

export default Customer;
