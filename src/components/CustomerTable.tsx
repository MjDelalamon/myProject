import { QRCodeSVG } from "qrcode.react";
import type { CustomerType } from "../AdminPage/Customer";

interface Props {
  customers: CustomerType[];
  onView: (c: CustomerType) => void;
  onDelete: (id: string) => void;
}

export default function CustomerTable({ customers, onView, onDelete }: Props) {
  return (
    <table className="customer-table">
      <thead>
        <tr>
          <th>QR</th>
          
          <th>Name</th>
          <th>Mobile</th>
          <th>Tier</th>
          <th>Status</th>
          <th>Wallet</th>
          <th>Points</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {customers.map((c) => (
          <tr key={c.id}>
            {/* QR Code based on email */}
            <td>
              {c.email ? (
                <QRCodeSVG value={c.email} size={48} />
              ) : (
                <span>N/A</span>
              )}
            </td>
            
            <td>{c.fullName}</td>
            <td>{c.mobile}</td>
            <td>{c.tier}</td>
            <td>{c.status}</td>
            <td>₱{c.wallet}</td>
            <td>{c.points}</td>
            <td>
              <button className="btn" onClick={() => onView(c)}>View</button>
              <button className="btn danger" onClick={() => onDelete(c.id)}>Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
