import React, { useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

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
    <div style={{ display: "flex", justifyContent: "center" }}>
      <div id="reader" style={{ width: "300px" }}></div>
    </div>
  );
}
