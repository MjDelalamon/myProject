import { useEffect, useState } from "react";
import Sidebar from "../components/SideBar";
import "../Style/Promotion.css"
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  getDocs,
} from "firebase/firestore";
import { db } from "../Firebase/firebaseConfig";

interface Promotion {
  id: string;
  title: string;
  description: string;
  price: number;
  startDate: string;
  endDate: string;
  promoType: "global" | "personalized";
  applicableTiers: string[];
  category?: string;
  createdAt?: any;
}

function Promotion() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [form, setForm] = useState<Partial<Promotion>>({
    promoType: "global",
    applicableTiers: [],
    category: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "expired">("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false); // ✅ modal state

  // 🔹 Load promotions in real-time
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

  // 🔹 Load categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const snapshot = await getDocs(collection(db, "menu"));
        const categorySet = new Set<string>();
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.category) categorySet.add(data.category);
        });
        setCategories(Array.from(categorySet));
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetchCategories();
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

    const promoData = { ...form, createdAt: serverTimestamp() };
    try {
      if (editingId) {
        await updateDoc(doc(db, "promotions", editingId), promoData);
        setEditingId(null);
      } else {
        await addDoc(collection(db, "promotions"), promoData);
      }

      setForm({ promoType: "global", applicableTiers: [], category: "" });
      setIsModalOpen(false); // ✅ close modal after submit
    } catch (err) {
      console.error("Error saving promotion:", err);
    }
  };

  const handleEdit = (promo: Promotion) => {
    setForm(promo);
    setEditingId(promo.id);
    setIsModalOpen(true); // ✅ open modal for edit
  };

  const handleDelete = async (id: string) => await deleteDoc(doc(db, "promotions", id));

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
    const matchesCategory = filterCategory === "all" || promo.category === filterCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <>
      <Sidebar />
      <div className="promotion-container">
        <div className="promo-header">
          <h2>Current Promotions</h2>
          <button className="add-btn" onClick={() => setIsModalOpen(true)}>
            + Add Promotion
          </button>
        </div>

        {/* 🔍 Filters */}
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
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Promotion List */}
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
                    {promo.applicableTiers?.length > 0 && `| Tiers: ${promo.applicableTiers.join(", ")}`}
                  </p>
                  {promo.category && (
                    <p>
                      Category: <b>{promo.category}</b>
                    </p>
                  )}
                  <p className={`promo-status ${getStatus(promo.endDate)}`}>
                    {promo.startDate} → {promo.endDate} |{" "}
                    <b style={{ color: getStatus(promo.endDate) === "active" ? "green" : "red" }}>
                      {getStatus(promo.endDate).toUpperCase()}
                    </b>
                  </p>
                </div>

                <div className="promo-actions">
                  <button onClick={() => handleEdit(promo)}>Edit</button>
                  <button onClick={() => handleDelete(promo.id)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Modal */}
        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>{editingId ? "Edit Promotion" : "Add Promotion"}</h2>
              <div className="promo-input-grid">
                <input type="text" name="title" placeholder="Title" value={form.title || ""} onChange={handleChange} />
                <input type="number" name="price" placeholder="Price (₱)" value={form.price || ""} onChange={handleChange} />
                <input type="date" name="startDate" value={form.startDate || ""} onChange={handleChange} />
                <input type="date" name="endDate" value={form.endDate || ""} onChange={handleChange} />
              </div>
              <div className="promo-type">
                <label>Promo Type:</label>
                <select name="promoType" value={form.promoType} onChange={handleChange}>
                  <option value="global">Global (all tiers)</option>
                  <option value="personalized">Personalized (category + tier)</option>
                </select>
              </div>
              {form.promoType === "personalized" && (
                <select name="category" value={form.category || ""} onChange={handleChange}>
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              )}
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
              <textarea name="description" placeholder="Description" value={form.description || ""} onChange={handleChange} rows={3} />
              <div className="modal-actions">
                <button onClick={handleSubmit}>{editingId ? "Update" : "Add"}</button>
                <button onClick={() => setIsModalOpen(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default Promotion;
