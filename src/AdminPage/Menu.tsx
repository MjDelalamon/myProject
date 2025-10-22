import React, { useEffect, useState } from "react";
import Sidebar from "../components/SideBar";
import { db } from "../Firebase/firebaseConfig";
import "../Style/Menu.css";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  availability: boolean;
};

function Menu() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [formData, setFormData] = useState<Omit<MenuItem, "id">>({
    name: "",
    description: "",
    price: 0,
    category: "",
    image: "",
    availability: true,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showPinPrompt, setShowPinPrompt] = useState(false);
  const [pinAction, setPinAction] = useState<"add" | "delete" | null>(null);
  const [pinValue, setPinValue] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // 🔹 Fetch menu from Firestore
  useEffect(() => {
    const fetchMenu = async () => {
      const snapshot = await getDocs(collection(db, "menu"));
      const items = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<MenuItem, "id">),
      }));
      setMenuItems(items);
    };
    fetchMenu();
  }, []);

  // 🔹 Handle input change
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // 🔹 Image preview only
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setFormData((prev) => ({ ...prev, image: imageUrl }));
    }
  };

  // 🔹 Request PIN
  const requestPin = (action: "add" | "delete", id?: string) => {
    setPinAction(action);
    if (action === "delete" && id) setDeleteId(id);
    setShowPinPrompt(true);
  };

  // 🔹 Verify PIN
  const verifyPin = async () => {
    if (pinValue === "admin123") {
      if (pinAction === "add") {
        if (editingId) {
          const ref = doc(db, "menu", editingId);
          await updateDoc(ref, formData);
          setMenuItems((prev) =>
            prev.map((item) =>
              item.id === editingId ? { id: editingId, ...formData } : item
            )
          );
          setEditingId(null);
        } else {
          const docRef = await addDoc(collection(db, "menu"), formData);
          setMenuItems((prev) => [...prev, { id: docRef.id, ...formData }]);
        }
        resetForm();
      } else if (pinAction === "delete" && deleteId) {
        await deleteDoc(doc(db, "menu", deleteId));
        setMenuItems((prev) => prev.filter((item) => item.id !== deleteId));
        setDeleteId(null);
      }
      setShowPinPrompt(false);
      setPinValue("");
    } else {
      alert("❌ Incorrect PIN!");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    requestPin("add");
  };

  const handleEdit = (id: string) => {
    const item = menuItems.find((i) => i.id === id);
    if (item) {
      setFormData({ ...item });
      setEditingId(id);
      setShowModal(true);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: 0,
      category: "",
      image: "",
      availability: true,
    });
    setShowModal(false);
  };

  return (
    <>
      <Sidebar />

      <div className="menu-container">
        <h1> Menu Management</h1>

        {/* Add Menu Button */}
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          style={{
            padding: "10px 20px",
            background: "#69481d",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            marginBottom: "20px",
          }}
        >
           Add Menu Item
        </button>

        {/* Menu List */}
        <div className="menu-list">
          {menuItems.map((item) => (
            <div className="menu-card" key={item.id}>
              <img src={item.image} alt={item.name} />
              <h3>{item.name}</h3>
              <p>{item.description}</p>
              <p>
                <strong>₱{item.price}</strong>
              </p>
              <p>Category: {item.category}</p>
              <p>Status: {item.availability ? "Available" : "Unavailable"}</p>
              <div className="menu-buttons">
                <button onClick={() => handleEdit(item.id)}>Edit</button>
                <button onClick={() => requestPin("delete", item.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 🔹 Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{editingId ? "Edit Menu Item" : "Add Menu Item"}</h2>
            <form onSubmit={handleSubmit} className="menu-form">
              <input
                name="name"
                placeholder="Item Name"
                value={formData.name}
                onChange={handleChange}
                required
              />
              <textarea
                name="description"
                placeholder="Description"
                value={formData.description}
                onChange={handleChange}
                required
              />
              <input
                name="price"
                type="number"
                placeholder="Price"
                value={formData.price}
                onChange={handleChange}
                required
              />
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="">Category</option>
                <option value="Pork">Pork</option>
                <option value="Beef">Beef</option>
                <option value="Chicken">Chicken</option>
                <option value="Sea Food">Sea Food</option>
                <option value="Appetizer">Appetizer</option>
                <option value="Soup">Soup</option>
                <option value="Pasta">Pasta</option>
                <option value="Vegetable">Vegetable</option>
                <option value="Burger & Sandwiches">Burger & Sandwiches</option>
                <option value="Bento">Bento</option>
                <option value="Package Bundles">Package Bundles</option>
              </select>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
              />
              {formData.image && (
                <img
                  src={formData.image}
                  alt="Preview"
                  className="image-preview"
                />
              )}
              <label>
                <input
                  name="availability"
                  type="checkbox"
                  checked={formData.availability}
                  onChange={handleChange}
                />
                Available
              </label>
              <button type="submit">{editingId ? "Update" : "Add"} Item</button>
              <button
                type="button"
                onClick={resetForm}
                style={{ background: "#aaa", color: "#fff" }}
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 🔹 PIN Modal */}
      {showPinPrompt && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Enter Admin PIN</h3>
            <input
              type="password"
              value={pinValue}
              onChange={(e) => setPinValue(e.target.value)}
              placeholder="Enter PIN"
            />
            <br />
            <button onClick={verifyPin}>Confirm</button>
            <button onClick={() => setShowPinPrompt(false)}>Cancel</button>
          </div>
        </div>
      )}
    </>
  );
}

export default Menu;
