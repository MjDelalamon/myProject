import React, { useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Link } from "react-router-dom";

export default function QRScanner() {
  useEffect(() => {
    // Create scanner instance
    const scanner = new Html5QrcodeScanner(
      "reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
      },
      false
    );

    // Render the scanner
    scanner.render(
      (decodedText) => {
        alert(`Scanned: ${decodedText}`);
        scanner.clear().catch((err) => console.error("Clear failed:", err));
      },
      (error) => {
        console.warn(error);
      }
    );

    // Cleanup when component unmounts
    return () => {
      scanner.clear().catch((err) => console.error("Clear failed:", err));
    };
  }, []);

  return (
    <>
      <div className="sidebar">
        <h2 className="sidebar-title">Staff Panel</h2>
        <nav className="sidebar-nav">
          <Link to="/qr-scanner" className="sidebar-link">
            Scan QR
          </Link>
          <Link to="/take-order" className="sidebar-link">
            Take Order
          </Link>
          <Link to="/orders" className="sidebar-link">
            -
          </Link>
          <Link to="/rewards" className="sidebar-link">
            -
          </Link>
          <Link to="/menu" className="sidebar-link">
            -
          </Link>
          <Link to="/wallet" className="sidebar-link">
            -
          </Link>
          <Link to="/feedback" className="sidebar-link">
            -
          </Link>
          <Link to="/notifications" className="sidebar-link">
            -
          </Link>
          <Link to="/settings" className="sidebar-link">
            Settings
          </Link>
          <Link to="/" className="sidebar-link">
            Logout
          </Link>
        </nav>
      </div>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <div id="reader" style={{ width: "600px", height: "500px" }}></div>
      </div>
    </>
  );
}
