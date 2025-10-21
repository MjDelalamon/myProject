import { useEffect, useState } from "react";
import Sidebar from "../components/SideBar";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../Firebase/firebaseConfig";

interface Promotion {
  id: string;
  title: string;
  description: string;
  price: number; // 💰 changed from discount → price
  startDate: string;
  endDate: string;
  promoType: "global" | "personalized";
  applicableTiers: string[];
  createdAt?: any;
}

function Promotion() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [form, setForm] = useState<Partial<Promotion>>({
    promoType: "global",
    applicableTiers: [],
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  // 🔹 Load promotions from Firestore
  useEffect(() => {
    const fetchPromotions = async () => {
      const snapshot = await getDocs(collection(db, "promotions"));
      const list: Promotion[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Promotion),
      }));
      setPromotions(list);
    };
    fetchPromotions();
  }, []);

  // 🔹 Handle input change
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "price" ? parseFloat(value) : value,
    }));
  };

  // 🔹 Handle tier checkbox
  const handleTierChange = (tier: string) => {
    setForm((prev) => {
      const tiers = prev.applicableTiers || [];
      return tiers.includes(tier)
        ? { ...prev, applicableTiers: tiers.filter((t) => t !== tier) }
        : { ...prev, applicableTiers: [...tiers, tier] };
    });
  };

  // 🔹 Add or update promotion
  const handleSubmit = async () => {
    if (
      !form.title ||
      !form.description ||
      !form.price ||
      !form.startDate ||
      !form.endDate
    ) {
      alert("Please fill in all fields.");
      return;
    }

    if (editingId) {
      const ref = doc(db, "promotions", editingId);
      await updateDoc(ref, { ...form });
      setPromotions((prev) =>
        prev.map((p) =>
          p.id === editingId ? ({ ...p, ...form } as Promotion) : p
        )
      );
      setEditingId(null);
    } else {
      const newDoc = await addDoc(collection(db, "promotions"), {
        ...form,
        createdAt: serverTimestamp(),
      });
      setPromotions((prev) => [
        ...prev,
        { id: newDoc.id, ...(form as Promotion) },
      ]);
    }

    setForm({ promoType: "global", applicableTiers: [] });
  };

  // 🔹 Edit / Delete
  const handleEdit = (promo: Promotion) => {
    setForm(promo);
    setEditingId(promo.id);
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, "promotions", id));
    setPromotions((prev) => prev.filter((p) => p.id !== id));
  };

  // 🔹 Status display
  const getStatus = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    return end >= now ? "🟢 Active" : "🔴 Expired";
  };

  return (
    <>
      <Sidebar />

      <div className="promotion-container">
        {/* Form Section */}
        <div className="promotion-form">
          <h2>{editingId ? "Edit Promotion" : "Add Promotion"}</h2>

          <div className="form-grid">
            <input
              type="text"
              name="title"
              placeholder="Promotion Title"
              value={form.title || ""}
              onChange={handleChange}
            />
            <input
              type="number"
              name="price"
              placeholder="Promo Price (₱)"
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

          {/* Promo Type */}
          <div className="promo-type">
            <label>Promo Type:</label>
            <select
              name="promoType"
              value={form.promoType}
              onChange={handleChange}
            >
              <option value="global">Global (for everyone or tiers)</option>
              <option value="personalized">Personalized (1-time per user)</option>
            </select>
          </div>

          {/* Tier Selection */}
          {form.promoType === "global" && (
            <div className="tier-selection">
              <label>Applicable Tiers:</label>
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
            </div>
          )}

          <textarea
            name="description"
            placeholder="Description"
            value={form.description || ""}
            onChange={handleChange}
            rows={3}
          />

          <button onClick={handleSubmit}>
            {editingId ? "Update Promotion" : "Add Promotion"}
          </button>
        </div>

        {/* Promotion List */}
        <div className="promotion-list">
          <h2>Current Promotions</h2>
          {promotions.length === 0 ? (
            <p>No promotions added yet.</p>
          ) : (
            <ul>
              {promotions.map((promo) => (
                <li key={promo.id} className="promotion-item">
                  <div className="promo-details">
                    <h3>{promo.title}</h3>
                    <p>{promo.description}</p>
                    <p>
  Price:{" "}
  <b>
    ₱
    {promo.price !== undefined && !isNaN(promo.price)
      ? promo.price.toFixed(2)
      : "0.00"}
  </b>
</p>

                    <p>
                      Type: <b>{promo.promoType}</b>{" "}
                      {promo.applicableTiers?.length > 0 &&
                        `| Tiers: ${promo.applicableTiers.join(", ")}`}
                    </p>
                    <p className="promo-status">
                      {promo.startDate} → {promo.endDate} | Status:{" "}
                      <b>{getStatus(promo.endDate)}</b>
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
        </div>
      </div>
    </>
  );
}

export default Promotion;
