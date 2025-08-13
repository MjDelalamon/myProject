import React, { useState } from "react";
import { Link } from "react-router-dom";

type MenuItem = {
  id: number;
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
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showPinPrompt, setShowPinPrompt] = useState(false);
  const [pinAction, setPinAction] = useState<"add" | "delete" | null>(null);
  const [pinValue, setPinValue] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setFormData((prev) => ({
        ...prev,
        image: imageUrl,
      }));
    }
  };

  const requestPin = (action: "add" | "delete", id?: number) => {
    setPinAction(action);
    if (action === "delete" && id) {
      setDeleteId(id);
    }
    setShowPinPrompt(true);
  };

  const verifyPin = () => {
    if (pinValue === "admin123") {
      if (pinAction === "add") {
        if (editingId !== null) {
          setMenuItems((prev) =>
            prev.map((item) =>
              item.id === editingId ? { id: editingId, ...formData } : item
            )
          );
          setEditingId(null);
        } else {
          setMenuItems((prev) => [...prev, { id: Date.now(), ...formData }]);
        }
        setFormData({
          name: "",
          description: "",
          price: 0,
          category: "",
          image: "",
          availability: true,
        });
      } else if (pinAction === "delete" && deleteId !== null) {
        setMenuItems((prev) => prev.filter((item) => item.id !== deleteId));
        setDeleteId(null);
      }
      setShowPinPrompt(false);
      setPinValue("");
    } else {
      alert("Incorrect PIN!");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    requestPin("add");
  };

  const handleEdit = (id: number) => {
    const item = menuItems.find((item) => item.id === id);
    if (item) {
      setFormData({ ...item });
      setEditingId(id);
    }
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
      <div className="menu-container">
        <h1>🍽️ Menu Management</h1>
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
            <option value="Burger & Sandwhiches">Burger & Sandwhiches</option>
            <option value="Bento">Bento</option>
            <option value="Package Bundles">Package Bundles</option>
          </select>
          <input type="file" accept="image/*" onChange={handleImageUpload} />
          {formData.image && (
            <img src={formData.image} alt="Preview" className="image-preview" />
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
          <button type="submit">
            {editingId !== null ? "Update" : "Add"} Item
          </button>
        </form>

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

      {showPinPrompt && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: "20px",
              borderRadius: "10px",
              textAlign: "center",
              width: "300px",
            }}
          >
            <h3>Enter Admin PIN</h3>
            <input
              type="password"
              value={pinValue}
              onChange={(e) => setPinValue(e.target.value)}
              placeholder="Enter PIN"
              style={{
                padding: "10px",
                width: "90%",
                borderRadius: "6px",
                border: "1px solid #ccc",
                marginBottom: "10px",
              }}
            />
            <br />
            <button
              onClick={verifyPin}
              style={{
                padding: "8px 12px",
                marginRight: "5px",
                background: "#69481d",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Confirm
            </button>
            <button
              onClick={() => setShowPinPrompt(false)}
              style={{
                padding: "8px 12px",
                background: "#aaa",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default Menu;
