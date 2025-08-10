import React, { useState } from "react";
import { Link } from "react-router-dom";

type MenuItem = {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string; // image URL from uploaded file
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
  };

  const handleEdit = (id: number) => {
    const item = menuItems.find((item) => item.id === id);
    if (item) {
      setFormData({ ...item });
      setEditingId(id);
    }
  };

  const handleDelete = (id: number) => {
    setMenuItems((prev) => prev.filter((item) => item.id !== id));
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
          <input
            name="category"
            placeholder="Category"
            value={formData.category}
            onChange={handleChange}
            required
          />
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
                <button onClick={() => handleDelete(item.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default Menu;
