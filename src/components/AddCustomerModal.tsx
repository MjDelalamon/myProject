import { useState } from "react";
import type { CustomerType } from "../AdminPage/Customer";

interface Props {
  onAdd: (c: Partial<CustomerType>) => void;
  onClose: () => void;
}

export default function AddCustomerModal({ onAdd, onClose }: Props) {
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  
  const [gender, setGender] = useState("");

  const handleSave = () => {
    if (!lastName.trim() || !firstName.trim() || !mobile.trim()) {
      alert("Last Name, First Name, and Mobile are required");
      return;
    }

    

    // Optional email validation
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      alert("Please enter a valid email address");
      return;
    }

    const customerData: Partial<CustomerType> = {
      lastName: lastName.trim(),
      firstName: firstName.trim(),
      mobile: mobile.trim(),
      wallet: 0,
      gender: gender || undefined, // optional
    };

    if (email.trim() !== "") customerData.email = email.trim();
    

    onAdd(customerData);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Add Customer</h3>

        <input
          type="text"
          placeholder="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className="input"
        />
        <input
          type="text"
          placeholder="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="input"
        />
        <input
          type="email"
          placeholder="Email (optional)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input"
        />
        <input
          type="text"
          placeholder="Mobile Number"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
          className="input"
        />
        

        <select
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          className="picker"
        >
          <option value="">Select Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>

        <div className="modal-actions">
          <button className="btn" onClick={handleSave}>
            Save
          </button>
          <button className="btn danger" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
