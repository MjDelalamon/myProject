import { useEffect, useState } from "react";
import Sidebar from "../components/SideBar";
import "../Style/Promotion.css";
import { savePromotionForTopCustomers } from "../functions/savePromotionForTopCustomers";

import {
  collection,
  updateDoc,
  deleteDoc,
  doc,
  addDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  getDocs,
} from "firebase/firestore";
import { db } from "../Firebase/firebaseConfig";

interface Promotion {
  id?: string;
  title: string;
  description: string;
  price: number;
  startDate: string;
  endDate: string;
  promoType: "global" | "personalized";
  applicableTiers: string[];
  specificCustomerId?: string;
  personalizedOption?: "specific";
  createdAt?: any;
}

function Promotion() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [form, setForm] = useState<Partial<Promotion>>({
    promoType: "global",
    applicableTiers: [],
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [topCustomers, setTopCustomers] = useState<{ id: string; fullName: string; tier: string }[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "expired">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load promotions in real-time
  useEffect(() => {
    const q = query(collection(db, "promotions"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const promos = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as Promotion[];
      setPromotions(promos);
    });
    return () => unsubscribe();
  }, []);

  // Load Top 10 customers
  useEffect(() => {
    const fetchTopCustomers = async () => {
      try {
        const snap = await getDocs(query(collection(db, "topCustomers"), orderBy("rank")));
        const top = snap.docs.map((doc) => ({
          id: doc.id,
          fullName: doc.data().fullName,
          tier: doc.data().tier,
        }));
        setTopCustomers(top);
      } catch (err) {
        console.error("Error fetching top customers:", err);
      }
    };
    fetchTopCustomers();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "price" ? parseFloat(value) : value,
    }));
  };

  const handleTierChange = (tier: string) => {
    if (form.promoType !== "global") return;
    setForm((prev) => {
      const tiers = prev.applicableTiers || [];
      return tiers.includes(tier)
        ? { ...prev, applicableTiers: tiers.filter((t) => t !== tier) }
        : { ...prev, applicableTiers: [...tiers, tier] };
    });
  };

  const handleSubmit = async () => {
  if (!form.title || !form.description || !form.price || !form.startDate || !form.endDate) {
    alert("Please fill in all required fields.");
    return;
  }

  if (form.promoType === "personalized" && !form.specificCustomerId) {
    alert("Please select a Top 10 customer.");
    return;
  }

  try {
    // Build promo data dynamically
    const promoData: Partial<Promotion> = {
      ...form,
      price: Number(form.price),
      createdAt: serverTimestamp(),
    };

    // Add personalizedOption only for personalized promos
    if (form.promoType === "personalized") {
      promoData.personalizedOption = "specific";
    }

    // Save / update
    if (editingId) {
      await updateDoc(doc(db, "promotions", editingId), {
        ...promoData,
        updatedAt: serverTimestamp(),
      });
      setEditingId(null);
      alert("Promotion updated successfully!");
    } else {
      if (form.promoType === "personalized") {
        await savePromotionForTopCustomers(promoData);
      } else {
        await addDoc(collection(db, "promotions"), promoData);
      }
      alert("Promotion created successfully!");
    }

    setForm({ promoType: "global", applicableTiers: [] });
    setIsModalOpen(false);
  } catch (err) {
    console.error("Error saving promotion:", err);
    alert("Error saving promotion. Please try again.");
  }
};


  const handleEdit = (promo: Promotion) => {
    setForm(promo);
    setEditingId(promo.id || null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this promotion?")) {
      await deleteDoc(doc(db, "promotions", id));
    }
  };

  const getStatus = (endDate: string) => (new Date(endDate) >= new Date() ? "active" : "expired");

  const filteredPromos = promotions.filter((promo) => {
    const matchesSearch =
      promo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      promo.description.toLowerCase().includes(searchTerm.toLowerCase());
    const status = getStatus(promo.endDate);
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && status === "active") ||
      (filterStatus === "expired" && status === "expired");
    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <Sidebar />
      <div className="promotion-container">
        <div className="promo-header">
          <h2>Current Promotions</h2>
          <button
            className="add-btn"
            onClick={() => setIsModalOpen(true)}
            style={{ background: "#5b1818ff", color: "white" }}
          >
            + Add Promotion
          </button>
        </div>

        <div className="filter-controls">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)}>
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
          </select>
        </div>

        {filteredPromos.length === 0 ? (
          <p>No promotions found.</p>
        ) : (
          <ul className="promo-list">
            {filteredPromos.map((promo) => (
              <li key={promo.id} className="promo-item">
                <div className="promo-details">
                  <h3>{promo.title}</h3>
                  <p>{promo.description}</p>
                  <p>Price: ₱{promo.price?.toFixed(2)}</p>
                  <p>
                    Type: <b>{promo.promoType}</b>{" "}
                    {promo.applicableTiers?.length > 0 &&
                      `| Tiers: ${promo.applicableTiers.join(", ")}`}
                  </p>
                  {promo.specificCustomerId && (
                    <p>
                      Customer: <b>{promo.specificCustomerId}</b>
                    </p>
                  )}
                  <p className={`promo-status ${getStatus(promo.endDate)}`}>
                    {promo.startDate} → {promo.endDate} |{" "}
                    <b
                      style={{
                        color: getStatus(promo.endDate) === "active" ? "green" : "red",
                      }}
                    >
                      {getStatus(promo.endDate).toUpperCase()}
                    </b>
                  </p>
                </div>

                <div className="promo-actions">
                  <button
                    onClick={() => handleEdit(promo)}
                    style={{ background: "#67ad42ff", color: "white" }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(promo.id!)}
                    style={{ background: "#f13e1fff", color: "white" }}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>{editingId ? "Edit Promotion" : "Add Promotion"}</h2>
              <div className="promo-input-grid">
                <input
                  type="text"
                  name="title"
                  placeholder="Title"
                  value={form.title || ""}
                  onChange={handleChange}
                />
                <input
                  type="number"
                  name="price"
                  placeholder="Price (₱)"
                  value={form.price || ""}
                  onChange={handleChange}
                />
                <input
                  type="date"
                  name="startDate"
                  value={form.startDate || ""}
                  onChange={handleChange}
                />
                <input
                  type="date"
                  name="endDate"
                  value={form.endDate || ""}
                  onChange={handleChange}
                />
              </div>

              <div className="promo-type">
                <label>Promo Type:</label>
                <select
                  name="promoType"
                  value={form.promoType}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      promoType: e.target.value as "global" | "personalized",
                      applicableTiers: [],
                      specificCustomerId: e.target.value === "personalized" ? "" : undefined,
                    }))
                  }
                >
                  <option value="global">Global</option>
                  <option value="personalized">Personalized</option>
                </select>
              </div>

              {form.promoType === "global" && (
                <div className="tier-options">
                  {["Bronze", "Silver", "Gold"].map((tier) => (
                    <label key={tier}>
                      <input
                        type="checkbox"
                        checked={form.applicableTiers?.includes(tier) || false}
                        onChange={() => handleTierChange(tier)}
                      />
                      {tier}
                    </label>
                  ))}
                </div>
              )}

              {form.promoType === "personalized" && (
                <select
                  name="specificCustomerId"
                  value={form.specificCustomerId || ""}
                  onChange={handleChange}
                >
                  <option value="">Select Customer</option>
                  {topCustomers.map((cust) => (
                    <option key={cust.id} value={cust.id}>
                      {cust.fullName} ({cust.tier})
                    </option>
                  ))}
                </select>
              )}

              <textarea
                name="description"
                
                placeholder="Description"
                value={form.description || ""}
                onChange={handleChange}
                rows={3}
              />

              <div className="modal-actions">
                <button onClick={handleSubmit} style={{ background: "#50d635ff", color: "white" }}>
                  {editingId ? "Update" : "Add"}
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  style={{ background: "#f13e1fff", color: "white" }}
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

export default Promotion;
