import React, { useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import SidebarStaff from "../components/SideBarStaff";
import "../Style/PromoRedemption.css";
import { v4 as uuidv4 } from "uuid"; // npm install uuid
import { updateFavoriteCategory } from "../functions/updateFavoriteCategory";
import { getTotalEarnedPoints } from "../functions/pointsUtils";

import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  addDoc, 
  updateDoc,
  serverTimestamp
} from "firebase/firestore";
import { db } from "../Firebase/firebaseConfig";

interface Promotion {
  id: string;
  title: string;
  description: string;
  price: number;
  startDate: string;
  endDate: string;
  promoType: "global" | "personalized";
  applicableTiers: string[];
  category?: string;
}

interface Customer {
  email: string;
  fullName: string;
  mobile: string;
  tier: string;
  favoriteCategory: string;
  points: number;
  wallet?: number;
  totalSpent?: number; // 🟢 added optional field
}

const PromoRedemption: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [selectedPromo, setSelectedPromo] = useState<Promotion | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [scannerVisible, setScannerVisible] = useState<boolean>(false);
  const [promoScannerVisible, setPromoScannerVisible] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [totalEarnedPoints, setTotalEarnedPoints] = useState<number>(0);


  // Fetch customer by name or mobile
  const handleSearch = async () => {
    setMessage("");
    setCustomer(null);
    setPromos([]);
    setSelectedPromo(null);

    if (!searchTerm.trim()) {
      setMessage("Please enter a name or mobile number.");
      return;
    }

    try {
      const customersRef = collection(db, "customers");

      const nameQuery = query(customersRef, where("fullName", "==", searchTerm));
      const mobileQuery = query(customersRef, where("mobile", "==", searchTerm));

      const [nameSnap, mobileSnap] = await Promise.all([
        getDocs(nameQuery),
        getDocs(mobileQuery),
      ]);

      let customerDoc = null;

      if (!nameSnap.empty) customerDoc = nameSnap.docs[0];
      else if (!mobileSnap.empty) customerDoc = mobileSnap.docs[0];

      if (!customerDoc) {
        setMessage("Customer not found.");
        return;
      }

      const data = customerDoc.data() as Customer;
      setCustomer(data);
      fetchEligiblePromos(data);

      // ✅ Get total earned points
      const totalPoints = await getTotalEarnedPoints(data.email);
      setTotalEarnedPoints(totalPoints);

      setMessage("✅ Customer loaded successfully.");
    } catch (error) {
      console.error("Error fetching customer:", error);
      setMessage("Error loading customer.");
    }
  };


  // QR Scanner for Customer
  const startCustomerScanner = () => {
    setScannerVisible(true);
    const scanner = new Html5QrcodeScanner("customerReader", { fps: 10, qrbox: 250 }, false);

    scanner.render(async (decodedText: string) => {
      try {
        const email = decodedText.trim();
        const customerRef = doc(db, "customers", email);
        const customerSnap = await getDoc(customerRef);

        if (!customerSnap.exists()) {
          setMessage("Customer not found via QR.");
          scanner.clear();
          setScannerVisible(false);
          return;
        }

        const data = customerSnap.data() as Customer;
        setCustomer(data);
        fetchEligiblePromos(data);
        const totalPoints = await getTotalEarnedPoints(data.email);
        setTotalEarnedPoints(totalPoints);
        setMessage("✅ Customer loaded via QR successfully.");

        scanner.clear();
        setScannerVisible(false);
      } catch (error) {
        console.error("QR error:", error);
        setMessage("Error scanning customer QR.");
        scanner.clear();
        setScannerVisible(false);
      }
    });
  };

  // Fetch eligible promos
  const fetchEligiblePromos = async (customerData: Customer) => {
    try {
      const promosSnap = await getDocs(collection(db, "promotions"));
      const now = new Date();

      const allPromos: Promotion[] = promosSnap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Promotion),
      }));

      const eligiblePromos = allPromos.filter((p) => {
        const startOk = !p.startDate || new Date(p.startDate) <= now;
        const endOk = !p.endDate || new Date(p.endDate) >= now;
        const tierOk =
          p.applicableTiers?.length === 0 ||
          p.applicableTiers?.includes(customerData.tier);
        const categoryOk =
          p.promoType === "global" ||
          (p.promoType === "personalized" &&
            p.category === customerData.favoriteCategory);

        return startOk && endOk && tierOk && categoryOk;
      });

      setPromos(eligiblePromos);
    } catch (error) {
      console.error("Error fetching promos:", error);
      setMessage("Error loading promotions.");
    }
  };

  // QR Scanner for Promo
  const startPromoScanner = () => {
    setPromoScannerVisible(true);
    const scanner = new Html5QrcodeScanner("promoReader", { fps: 10, qrbox: 250 }, false);

    scanner.render(async (decodedText: string) => {
      try {
        let qrData;

        try {
          qrData = JSON.parse(decodedText);
        } catch {
          setMessage("Invalid promo QR format.");
          scanner.clear();
          setPromoScannerVisible(false);
          return;
        }

        if (qrData.type !== "PROMO" || !qrData.promoId) {
          setMessage("Unrecognized promo QR.");
          scanner.clear();
          setPromoScannerVisible(false);
          return;
        }

        const promoRef = doc(db, "promotions", qrData.promoId);
        const promoSnap = await getDoc(promoRef);

        if (!promoSnap.exists()) {
          setMessage("Promo not found.");
          scanner.clear();
          setPromoScannerVisible(false);
          return;
        }

        const promo = promoSnap.data() as Promotion;

        const eligible =
          promo.applicableTiers?.includes(customer?.tier || "") &&
          (promo.promoType === "global" ||
            (promo.promoType === "personalized" &&
              promo.category === customer?.favoriteCategory));

        if (eligible) {
          setSelectedPromo({ id: qrData.promoId, ...promo });
          setMessage(`✅ Promo "${promo.title}" is valid for this customer.`);
        } else {
          setMessage("❌ Customer not eligible for this promo.");
        }

        scanner.clear();
        setPromoScannerVisible(false);
      } catch (error) {
        console.error("Promo QR error:", error);
        setMessage("Error scanning promo QR.");
        scanner.clear();
        setPromoScannerVisible(false);
      }
    });
  };

  // Redeem function with totalSpent update
  const handleRedeem = async () => {
    if (!selectedPromo || !paymentMethod || !customer) {
      setMessage("Please select a promo and payment method.");
      return;
    }

    try {
      const customerRef = doc(db, "customers", customer.email);
      const updatedCustomer = { ...customer };
      let pointsEarned = 0;

      // 🟢 Add totalSpent accumulation
      const newTotalSpent = (updatedCustomer.totalSpent || 0) + selectedPromo.price;
      updatedCustomer.totalSpent = newTotalSpent;

      await updateDoc(customerRef, {
        totalSpent: newTotalSpent,
      });

      // Points payment
      if (paymentMethod === "Points") {
        if (customer.points < selectedPromo.price) {
          setMessage("❌ Not enough points for this promo.");
          return;
        }
        updatedCustomer.points -= selectedPromo.price; 
        await updateDoc(customerRef, {
          points: updatedCustomer.points,
        });
      }

      // Wallet payment
      if (paymentMethod === "Wallet") {
        const walletBalance = customer.wallet || 0;
        if (walletBalance < selectedPromo.price) {
          setMessage("❌ Not enough wallet balance.");
          return;
        }
        updatedCustomer.wallet = walletBalance - selectedPromo.price;
        pointsEarned = Math.floor(selectedPromo.price * 0.05);
        updatedCustomer.points = (updatedCustomer.points || 0) + pointsEarned;

        await updateDoc(customerRef, {
          wallet: updatedCustomer.wallet,
          points: updatedCustomer.points,
        });
        setTotalEarnedPoints((prev) => prev + pointsEarned);
      }

      // Cash payment
      if (paymentMethod === "Cash") {
        pointsEarned = Math.floor(selectedPromo.price * 0.05);
        updatedCustomer.points = (updatedCustomer.points || 0) + pointsEarned;

        await updateDoc(customerRef, {
          points: updatedCustomer.points,
        });
        setTotalEarnedPoints((prev) => prev + pointsEarned);
      }

      setCustomer(updatedCustomer);

      // Save transaction
      const transactionData = {
        orderId: uuidv4(),
        customerId: customer.email,
        fullName: customer.fullName,
        items: [
          {
            name: selectedPromo.title,
            category: "Promo",
            price: selectedPromo.price,
            qty: 1,
          },
        ],
        amount: selectedPromo.price,
        paymentMethod,
        promotype: selectedPromo.promoType,
        status: "Completed",
        pointsEarned,
        date: serverTimestamp(),
      };

      await addDoc(collection(db, "transactions"), transactionData);
      await addDoc(collection(db, "globalTransactions"), transactionData);
      await addDoc(
        collection(db, "customers", customer.email, "transactions"),
        transactionData
      );
      await updateFavoriteCategory(customer.email);

      setMessage(
        `✅ Promo "${selectedPromo.title}" redeemed successfully using ${paymentMethod.toUpperCase()}. Points earned: ${pointsEarned}`
      );
      setSelectedPromo(null);
      setPaymentMethod("");
    } catch (error) {
      console.error("Redeem error:", error);
      setMessage("❌ Error processing transaction.");
    }
  };


  return (
    <>
      <SidebarStaff />
      <div className="promo-container">
        <h2>Promo Redemption</h2>

        {/* Customer Search */}
        <div className="search-section">
          <input
            type="text"
            placeholder="Search by name or mobile"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button onClick={handleSearch}
          style={{  background:"#693500ff",color:"white"  }}
          >Search</button>
          <button onClick={startCustomerScanner}
          style={{  background:"#693500ff",color:"white"  }}
          > Scan Customer QR</button>
          {scannerVisible && (
            <div id="customerReader" className="qr-scanner active"></div>
          )}
        </div>

        {/* Customer Info */}
        {customer && (
          <div className="customer-info">
            <h3>Customer Info</h3>
            <p><strong>Name:</strong> {customer.fullName}</p>
            <p><strong>Email:</strong> {customer.email}</p>
            <p><strong>Mobile:</strong> {customer.mobile}</p>
            <p><strong>Tier:</strong> {customer.tier}</p>
            <p><strong>Favorite Category:</strong> {customer.favoriteCategory}</p>
            <p><strong>Points:</strong> {customer.points}</p>
            <p><strong>Wallet Balance:</strong> ₱{customer.wallet || 0}</p>
            <p><strong>Total Spent:</strong> ₱{customer.totalSpent || 0}</p> {/* 🟢 display added */}
          </div>
        )}

        {/* Promo Section */}
        {customer && (
          <div>
            <h3>Eligible Promos</h3>
            <button onClick={startPromoScanner}
            style={{  background:"#693500ff",color:"white"  }}
            > Scan Promo QR</button>
            {promoScannerVisible && (
              <div id="promoReader" className="qr-scanner active"></div>
            )}
            {promos.length > 0 ? (
              promos.map((promo) => (
                <div
                  key={promo.id}
                  className={`promo-card ${
                    selectedPromo?.id === promo.id ? "selected" : ""
                  }`}
                  onClick={() => setSelectedPromo(promo)}
                >
                  <h4>{promo.title}</h4>
                  <p>{promo.description}</p>
                  <small>
                    ₱{promo.price} | Type: {promo.promoType}
                  </small>
                </div>
              ))
            ) : (
              <p>No eligible promos found.</p>
            )}
          </div>
        )}

        {/* Payment Method */}
        {selectedPromo && (
          <div className="payment-section">
            <h3>Payment Method</h3>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="">-- Select Payment --</option>
              <option value="Points">Points</option>
              <option value="Wallet">Wallet</option>
              <option value="Cash">Over the Counter</option>
            </select>
            <button onClick={handleRedeem}
            style={{  background:"#693500ff",color:"white"  }}
            >Confirm</button>
          </div>
        )}

        {message && <p className="message">{message}</p>}
      </div>
    </>
  );
};

export default PromoRedemption;
