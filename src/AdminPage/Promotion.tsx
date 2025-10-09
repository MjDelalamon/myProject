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
  discount: number;
  startDate: string;
  endDate: string;
  createdAt?: any;
}

function Promotion() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [form, setForm] = useState<Partial<Promotion>>({});
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

  // 🔹 Handle form input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "discount" ? parseFloat(value) : value,
    }));
  };

  // 🔹 Add or update promotion
  const handleSubmit = async () => {
    if (
      !form.title ||
      !form.description ||
      !form.discount ||
      !form.startDate ||
      !form.endDate
    ) {
      alert("Please fill in all fields.");
      return;
    }

    if (editingId) {
      // 🔸 Update
      const ref = doc(db, "promotions", editingId);
      await updateDoc(ref, {
        title: form.title,
        description: form.description,
        discount: form.discount,
        startDate: form.startDate,
        endDate: form.endDate,
      });
      setPromotions((prev) =>
        prev.map((p) =>
          p.id === editingId ? ({ ...p, ...form } as Promotion) : p
        )
      );
      setEditingId(null);
    } else {
      // 🔸 Add
      const newDoc = await addDoc(collection(db, "promotions"), {
        title: form.title,
        description: form.description,
        discount: form.discount,
        startDate: form.startDate,
        endDate: form.endDate,
        createdAt: serverTimestamp(),
      });
      setPromotions((prev) => [
        ...prev,
        { id: newDoc.id, ...(form as Promotion) },
      ]);
    }

    setForm({});
  };

  // 🔹 Edit existing promo
  const handleEdit = (promo: Promotion) => {
    setForm(promo);
    setEditingId(promo.id);
  };

  // 🔹 Delete promo
  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, "promotions", id));
    setPromotions((prev) => prev.filter((p) => p.id !== id));
  };

  // 🔹 Check if promo is active
  const getStatus = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    return end >= now ? "🟢 Active" : "🔴 Expired";
  };

  return (
    <>
      <Sidebar />

      <div className="p-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">📢 Promotion Management</h1>

        {/* Add/Edit Form */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-2">
            {editingId ? "Edit Promotion" : "Add Promotion"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              name="title"
              placeholder="Promotion Title"
              value={form.title || ""}
              onChange={handleChange}
              className="border px-3 py-2 rounded"
            />
            <input
              type="number"
              name="discount"
              placeholder="Discount (%)"
              value={form.discount || ""}
              onChange={handleChange}
              className="border px-3 py-2 rounded"
            />
            <input
              type="date"
              name="startDate"
              value={form.startDate || ""}
              onChange={handleChange}
              className="border px-3 py-2 rounded"
            />
            <input
              type="date"
              name="endDate"
              value={form.endDate || ""}
              onChange={handleChange}
              className="border px-3 py-2 rounded"
            />
          </div>
          <textarea
            name="description"
            placeholder="Description"
            value={form.description || ""}
            onChange={handleChange}
            className="border px-3 py-2 rounded mt-3 w-full"
            rows={3}
          />
          <button
            onClick={handleSubmit}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {editingId ? "Update Promotion" : "Add Promotion"}
          </button>
        </div>

        {/* Promotion List */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Current Promotions</h2>
          {promotions.length === 0 ? (
            <p className="text-gray-500">No promotions added yet.</p>
          ) : (
            <ul className="space-y-3">
              {promotions.map((promo) => (
                <li
                  key={promo.id}
                  className="border p-3 rounded flex justify-between items-center"
                >
                  <div>
                    <h3 className="font-bold text-lg">{promo.title}</h3>
                    <p className="text-sm text-gray-700">{promo.description}</p>
                    <p className="text-sm">
                      Discount: <b>{promo.discount}%</b>
                    </p>
                    <p className="text-xs text-gray-500">
                      {promo.startDate} → {promo.endDate} | Status:{" "}
                      <b>{getStatus(promo.endDate)}</b>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(promo)}
                      className="text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(promo.id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
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
