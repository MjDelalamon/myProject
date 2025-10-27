import { useState } from "react";
import type { CustomerType } from "../AdminPage/Customer";
import { checkMobileExists } from "../functions/checkMobileExists";
import { checkEmailExists } from "../functions/checkEmailExists"; // ✅ You need to create this function

interface Props {
  onAdd: (c: Partial<CustomerType>) => Promise<{ success: boolean; error?: string }>;
  onClose: () => void;
}

export default function AddCustomerModal({ onAdd, onClose }: Props) {
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [gender, setGender] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    // ✅ Required fields check
    if (!lastName.trim() || !firstName.trim() || !email.trim()) {
      alert("Last Name, First Name, and Email are required");
      return;
    }

    const formattedEmail = email.trim();
    const formattedMobile = mobile.trim();

    // ✅ Email format validation
    if (!/^\S+@\S+\.\S+$/.test(formattedEmail)) {
      alert("Please enter a valid email address");
      return;
    }

    // ✅ Mobile validation (optional but format enforced if entered)
    if (formattedMobile) {
      const mobilePattern = /^09\d{9}$/;
      if (!mobilePattern.test(formattedMobile)) {
        alert("Please enter a valid mobile number (11 digits starting with 09)");
        return;
      }
    }

    setLoading(true);
    try {
      // ✅ Check if email already exists
      const emailExists = await checkEmailExists(formattedEmail);
      if (emailExists) {
        alert("This email is already registered.");
        setLoading(false);
        return;
      }

      // ✅ Check if mobile already exists (only if mobile was entered)
      if (formattedMobile) {
        const mobileExists = await checkMobileExists(formattedMobile);
        if (mobileExists) {
          alert("This mobile number is already registered.");
          setLoading(false);
          return;
        }
      }

      // Prepare customer data
      const customerData: Partial<CustomerType> = {
        fullName: `${firstName.trim()} ${lastName.trim()}`,
        lastName: lastName.trim(),
        firstName: firstName.trim(),
        email: formattedEmail,
        mobile: formattedMobile,
        wallet: 0,
        gender: gender || undefined,
      };

      // Save to Firestore using email as ID
      const result = await onAdd({ ...customerData, id: formattedEmail });
      if (result.success) {
        alert("Customer added successfully!");
        onClose();
      } else {
        alert("Error adding customer: " + result.error);
      }
    } catch (error: any) {
      console.error("❌ Error saving customer:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
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
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input"
        />
        <input
          type="text"
          placeholder="Mobile Number (optional)"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
          className="input"
          maxLength={11}
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
          <button className="btn" onClick={handleSave} disabled={loading}
          style={{ marginLeft: 10, background:"#92e846ff",color:"#010000ff"  }}>
            {loading ? "Saving..." : "Save"}
          </button>
          <button className="btn danger" onClick={onClose} disabled={loading}
          style={{ marginLeft: 10, background:"#ff2c2cff",color:"white"  }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
