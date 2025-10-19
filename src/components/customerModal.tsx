import { QRCodeSVG } from "qrcode.react";
import type { CustomerType } from "../AdminPage/Customer";

interface Props {
  customer: CustomerType;
  onClose: () => void;
}

export default function ViewCustomerModal({ customer, onClose }: Props) {
  return (
    <div className="modal-overlay">
      <div className="modal-content">   
        <h3>Customer Details</h3>
        <p><strong>ID:</strong> {customer.customerNumber}</p>
        <p><strong>Name:</strong> {customer.fullName}</p>
        <p><strong>Mobile:</strong> {customer.mobile}</p>
        <p><strong>Email:</strong> {customer.email}</p>
        <p><strong>Tier:</strong> {customer.tier}</p>
        <p><strong>Status:</strong> {customer.status}</p>
        <p><strong>Points:</strong> {customer.points}</p>
        <p><strong>Favorite Category:</strong> {customer.favoriteCategory}</p>
        <p><strong>Wallet:</strong> ₱{customer.wallet}</p>
        <p><strong>Date Joined:</strong> {customer.dateJoined || "N/A"}</p>

        {/* QR Code based on email */}
        {customer.email && <QRCodeSVG value={customer.email} size={128} />}

        <br />
        <button className="btn" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
