import { useState } from "react";

import Sidebar from "../components/SideBar";

interface Promotion {
  id: number;
  rewardName: string;
  minSpend: number;
  pointsRequired: number;
  expiration: string;
  tier: string;
}

function Rewards() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [form, setForm] = useState<Partial<Promotion>>({});
  const [editingId, setEditingId] = useState<number | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        name === "minSpend" || name === "pointsRequired"
          ? parseFloat(value)
          : value,
    }));
  };

  const handleSubmit = () => {
    if (
      !form.rewardName ||
      form.minSpend === undefined ||
      form.pointsRequired === undefined ||
      !form.expiration ||
      !form.tier
    ) {
      alert("Please fill in all fields.");
      return;
    }

    if (editingId !== null) {
      setPromotions((prev) =>
        prev.map((p) =>
          p.id === editingId ? ({ ...p, ...form } as Promotion) : p
        )
      );
      setEditingId(null);
    } else {
      const newPromo: Promotion = {
        id: Date.now(),
        rewardName: form.rewardName!,
        minSpend: form.minSpend!,
        pointsRequired: form.pointsRequired!,
        expiration: form.expiration!,
        tier: form.tier!,
      };
      setPromotions((prev) => [...prev, newPromo]);
    }

    setForm({});
  };

  const handleEdit = (promo: Promotion) => {
    setForm(promo);
    setEditingId(promo.id);
  };

  const handleDelete = (id: number) => {
    setPromotions((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <>
      <Sidebar />

      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">🎁 Rewards & Promotions</h1>

        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-2">
            {editingId ? "Edit Promotion" : "Add Promotion"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              name="rewardName"
              placeholder="Reward Name"
              value={form.rewardName || ""}
              onChange={handleChange}
              className="border px-3 py-2 rounded"
            />
            <input
              type="number"
              name="minSpend"
              placeholder="Minimum Spend"
              value={form.minSpend || ""}
              onChange={handleChange}
              className="border px-3 py-2 rounded"
            />
            <input
              type="number"
              name="pointsRequired"
              placeholder="Points Required"
              value={form.pointsRequired || ""}
              onChange={handleChange}
              className="border px-3 py-2 rounded"
            />
            <input
              type="date"
              name="expiration"
              value={form.expiration || ""}
              onChange={handleChange}
              className="border px-3 py-2 rounded"
            />
            <select
              name="tier"
              value={form.tier || ""}
              onChange={handleChange}
              className="border px-3 py-2 rounded"
            >
              <option value="">Select Tier</option>
              <option value="Bronze">Bronze</option>
              <option value="Silver">Silver</option>
              <option value="Gold">Gold</option>
            </select>
          </div>
          <button
            onClick={handleSubmit}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {editingId ? "Update Promotion" : "Add Promotion"}
          </button>
        </div>

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
                    <h3 className="font-bold">{promo.rewardName}</h3>
                    <p className="text-sm">
                      Min Spend: ₱{promo.minSpend} | Points:{" "}
                      {promo.pointsRequired}
                    </p>
                    <p className="text-xs text-gray-500">
                      Expiration: {promo.expiration} | Tier: {promo.tier}
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

export default Rewards;
