import { useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import type { CustomerType } from "../AdminPage/Customer";
import { toPng } from "html-to-image";
import "../Style/Customer.css";

interface Props {
  customers: CustomerType[];
  onView: (c: CustomerType) => void;
  onDelete: (id: string) => void;
}

export default function CustomerTable({ customers, onView, onDelete }: Props) {
  const [modalQR, setModalQR] = useState<string | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);

  const downloadQR = () => {
    if (!qrRef.current) return;
    toPng(qrRef.current, { cacheBust: true })
      .then((dataUrl) => {
        const link = document.createElement("a");
        link.download = "qr-code.png";
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => console.error("Error downloading QR:", err));
  };

  return (
    <>
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
              <td>
                {c.email ? (
                  <div
                    style={{ cursor: "pointer" }}
                    onClick={() => setModalQR(c.email)}
                  >
                    {/* Smaller table QR */}
                    <QRCodeSVG
                      value={c.email}
                      size={48}
                      bgColor="#ffffff"
                      fgColor="#000000"
                      level="H"
                    />
                  </div>
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
                <button className="btn view" onClick={() => onView(c)}>View</button>
                <button className="btn delete" onClick={() => onDelete(c.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* QR Modal */}
      {modalQR && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.6)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
          onClick={() => setModalQR(null)}
        >
          <div
            style={{
              background: "#fff",
              padding: 20,
              borderRadius: 10,
              textAlign: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div ref={qrRef}>
              {/* Larger modal QR to match React Native */}
              <QRCodeSVG
                value={modalQR}
                size={180}
                bgColor="#ffffff"
                fgColor="#000000"
                level="H"
              />
            </div>
            <div style={{ marginTop: 15 }}>
              <button onClick={downloadQR} style={{ marginRight: 10 }}>
                💾 Download
              </button>
              <button onClick={() => setModalQR(null)}>❌ Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
