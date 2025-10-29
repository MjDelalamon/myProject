  import React, { useState, useEffect } from "react";
  import { Html5QrcodeScanner } from "html5-qrcode";
  import SidebarStaff from "../components/SideBarStaff";
  import { updateFavoriteCategory } from "../functions/updateFavoriteCategory";

  import {
    getFirestore,
    doc,
    getDoc,
    addDoc,
    updateDoc,
    collection,
    getDocs,
    Timestamp,
    where,
    query,
  } from "firebase/firestore";
  import { initializeApp } from "firebase/app";
  import "../Style/TakeOrder.css";

  // ✅ Firebase Config
  const firebaseConfig = {
    apiKey: "AIzaSyDxosd6yCZCVd2NGLlIiAthRoCfxAEUrdA",
    authDomain: "systemproject-de072.firebaseapp.com",
    projectId: "systemproject-de072",
    storageBucket: "systemproject-de072.appspot.com",
    messagingSenderId: "427445110062",
    appId: "1:427445110062:web:3a870fac07be2b369326bf",
  };

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  // ✅ Interfaces
  interface MenuItem {
    id: string;
    name: string;
    price: number;
    category: string;
    availability?: boolean;
  }

  interface OrderItem {
    id: number;
    name: string;
    price: number;
    qty: number;
    category?: string;
  }

  interface Customer {
    id: string;
    fullName: string;
    mobile?: string;
    points?: number;
    wallet?: number;
    totalSpent?: number;
    favoriteCategory?: string;
    tier?: string;
    logs?: any[];
  }

  interface Order {
    id: string;
    items: OrderItem[];
    subtotal: number;
    total: number;
    pointsEarned: number;
    customerId: string;
    placedAt: string;
    paidByWallet: boolean;
  }

  export default function TakeOrderWithQR() {
    const [items, setItems] = useState<OrderItem[]>([
      { id: 1, name: "", price: 0, qty: 1 },
    ]);
    const [menuData, setMenuData] = useState<MenuItem[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [showScanner, setShowScanner] = useState(false);
    const [orders, setOrders] = useState<Order[]>([]);
    const [walletScanResult, setWalletScanResult] = useState<string | null>(null);
    const [walletCustomer, setWalletCustomer] = useState<Customer | null>(null);
    const [showWalletScanner, setShowWalletScanner] = useState(false);
    const [showPromoScanner, setShowPromoScanner] = useState(false);

    const [promos, setPromos] = useState<any[]>([]); // list of all promos
  const [selectedPromoId, setSelectedPromoId] = useState<string | null>(null); // selected from dropdown

    // 🔹 Payment method states
  // 🔹 Payment method states
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "ewallet" | null>(null);
  const [referenceNo, setReferenceNo] = useState("");



    const [showPointsScanner, setShowPointsScanner] = useState(false);
    const [pointsScanResult, setPointsScanResult] = useState<string | null>(null);
    const [pointsCustomer, setPointsCustomer] = useState<Customer | null>(null);
    const [promoScanResult, setPromoScanResult] = useState<string | null>(null);
    const [promoStatus, setPromoStatus] = useState<string | null>(null);
    const [pendingPromo, setPendingPromo] = useState<any>(null);
    const [isConfirmVisible, setIsConfirmVisible] = useState(false);
    const [promoDetails, setPromoDetails] = useState<any | null>(null);

    // ✅ Add at the top with useState
    // 🔹 State
    const [mobileSearch, setMobileSearch] = useState("");
    // 🔹 State

    const [nonAppCustomer, setNonAppCustomer] = useState<Customer | null>(null);
    const [searchStatus, setSearchStatus] = useState<string | null>(null);
    const [showNonAppScanner, setShowNonAppScanner] = useState(false);


    useEffect(() => {
    if (!customer) return;

    const fetchPromos = async () => {
      try {
        const promoCol = collection(db, "promotions");
        const snap = await getDocs(promoCol);
        const allPromos: any[] = [];

        snap.forEach((docSnap) => {
          allPromos.push({ promoId: docSnap.id, ...docSnap.data() });
        });

        // ✅ Filter promos based on eligibility
        const eligiblePromos = allPromos.filter((promo) => {
          const tierEligible = !promo.tier || promo.tier === customer.tier;
          const categoryEligible =
            !promo.favoriteCategory ||
            promo.favoriteCategory === customer.favoriteCategory;
          return tierEligible && categoryEligible;
        });

        setPromos(eligiblePromos);
      } catch (err) {
        console.error("Error fetching promos:", err);
        setPromos([]);
      }
    };

    fetchPromos();
  }, [customer]);


    // 🔹 Search by mobile manually
    const searchCustomerByMobile = async () => {
    if (!mobileSearch) return alert("Enter a mobile number to search.");

    

    try {
      const q = query(collection(db, "customers"), where("mobile", "==", mobileSearch));
      const snap = await getDocs(q);

      if (!snap.empty) {
        const docSnap = snap.docs[0];
        const data = docSnap.data() as Customer;
        setNonAppCustomer({ id: docSnap.id, ...data });
        setCustomer({ id: docSnap.id, ...data }); // ✅ link the customer to show payment buttons
        setSearchStatus(`✅ Customer found: ${data.fullName}`);
      } else {
        setNonAppCustomer(null);
        setCustomer(null);
        setSearchStatus("❌ No customer found with this mobile number.");
      }
    } catch (err) {
      console.error("Error searching customer:", err);
      setNonAppCustomer(null);
      setCustomer(null);
      setSearchStatus("❌ Error occurred during search.");
    }
  };

  // 🔹 Start Promo QR Scanner (for verifying claimed promotions)
  // 🔹 Start Promo QR Scanner
  const startPromoScanner = () => {
    setShowPromoScanner(true);

    const scanner = new Html5QrcodeScanner(
      "promo-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    scanner.render(
      async (decodedText: string) => {
        setPromoScanResult(decodedText);

        try {
          const data = JSON.parse(decodedText);

          // 🔸 Validate QR type
          if (data.type !== "PROMO") {
            setPromoStatus("❌ Invalid QR type.");
            setPromoDetails(null);
            return;
          }

          // 🔸 Validate customer
          if (data.email !== customer.id) {
            setPromoStatus("❌ Promo QR not applicable for this customer.");
            setPromoDetails(null);
            return;
          }

          // 🔹 Get promo details from main promotions collection
          const promoRef = doc(db, "promotions", data.promoId);
          const promoSnap = await getDoc(promoRef);

          if (!promoSnap.exists()) {
            setPromoStatus("❌ Promo not found.");
            setPromoDetails(null);
            return;
          }

          const promoData = promoSnap.data();

          // ✅ Show promo details for verification
          setPromoDetails(promoData);
          setPendingPromo({
            promoId: data.promoId,
            email: data.email,
          });
          setIsConfirmVisible(true);
          setPromoStatus("✅ Promo valid! Awaiting confirmation...");

        } catch (err) {
          console.error("Error verifying promo:", err);
          setPromoStatus("❌ Invalid QR format or verification error.");
          setPromoDetails(null);
        }

        // Stop scanner after successful read
        await scanner.clear().catch(() => {});
        setShowPromoScanner(false);
      },
      (err: string) => console.warn(err)
    );
  };




    const startPointsScanner = () => {
      setShowPointsScanner(true);
      const scanner = new Html5QrcodeScanner("points-reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false);

      scanner.render(
        async (decodedText: string) => {
          setPointsScanResult(decodedText);
          try {
            const ref = doc(db, "customers", decodedText);
            const snap = await getDoc(ref);
            if (snap.exists()) {
              const data = snap.data() as Omit<Customer, "id">;
              setPointsCustomer({ id: decodedText, ...data });
            } else {
              setPointsCustomer(null);
            }
          } catch {
            setPointsCustomer(null);
          }
          await scanner.clear().catch(() => {});
          setShowPointsScanner(false);
        },
        (err: string) => console.warn(err)
      );
    };

    // 
    



    // 🔹 Start Wallet QR Scanner
  
    // 🔹 Computations
    const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
    const total = +subtotal.toFixed(2);
    const points = +(subtotal * 0.02).toFixed(2);

    // 🔹 Fetch menu from Firestore
    useEffect(() => {
      const fetchMenu = async () => {
        const querySnapshot = await getDocs(collection(db, "menu"));
        const menuList: MenuItem[] = [];
        const catSet = new Set<string>();

        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data() as MenuItem;
          const cleanPrice = Number(data.price) || 0;
          menuList.push({ id: docSnap.id, ...data, price: cleanPrice });
          if (data.category) catSet.add(data.category.trim());
        });

        setMenuData(menuList);
        setCategories(Array.from(catSet));
      };
      fetchMenu();
    }, []);

    // 🔹 Add / Update / Remove Items
    const addItem = () => {
      const nextId = items.length ? items[items.length - 1].id + 1 : 1;
      const newItem: OrderItem = { id: nextId, name: "", price: 0, qty: 1 };
      setItems((prev) => [...prev, newItem]);
    };

    const updateItem = (id: number, key: keyof OrderItem, value: unknown) => {
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, [key]: value } : it)));
    };

    const removeItem = (id: number) => {
      setItems((prev) => prev.filter((it) => it.id !== id));
    };

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setSelectedCategory(e.target.value);
    };

    // 🔹 QR Scanner for Customer
    const startScanner = () => {
      setShowScanner(true);
      const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false);

      scanner.render(
        async (decodedText: string) => {
          try {
            const ref = doc(db, "customers", decodedText);
            const snap = await getDoc(ref);
            if (snap.exists()) {
              const data = snap.data() as Omit<Customer, "id">;
              setCustomer({ id: decodedText, ...data });
              alert("✅ Customer found and linked!");
            } else {
              alert("❌ Customer not found!");
            }
          } catch (err) {
            console.error("Error fetching customer:", err);
          }
          await scanner.clear().catch(() => {});
          setShowScanner(false);
        },
        (err: string) => console.warn(err)
      );
    };

    const redeemPromo = async (method: "wallet" | "counter") => {
      if (!pendingPromo) return;

      try {
        const promoRef = doc(db, `customers/${pendingPromo.email}/claimedPromos/${pendingPromo.promoId}`);
        const promoSnap = await getDoc(promoRef);
        const promoData = promoSnap.data();

        if (!promoData) {
          setPromoStatus("❌ Promo not found.");
          return;
        }

        const promoPrice = Number((promoData as any).price) || 0;
        const earnedPoints = +(promoPrice * 0.02).toFixed(2);

        const customerRef = doc(db, "customers", pendingPromo.email);
        const customerSnap = await getDoc(customerRef);

        if (!customerSnap.exists()) {
          setPromoStatus("❌ Customer not found in database.");
          return;
        }

        const customerData = customerSnap.data();
        const walletBalance = Number(customerData.wallet || 0);
        const currentPoints = Number(customerData.points || 0);

        // 🔹 Wallet Redeem
        if (method === "wallet") {
          if (walletBalance < promoPrice) {
            setPromoStatus(
              `❌ Insufficient wallet balance. Available: ₱${walletBalance}, Required: ₱${promoPrice}`
            );
            return;
          }

          const newWallet = +(walletBalance - promoPrice).toFixed(2);
          const newPoints = +(currentPoints + earnedPoints).toFixed(2);
          const newTotalSpent = +(Number(customerData.totalSpent || 0) + promoPrice).toFixed(2);

          await updateDoc(customerRef, {
            wallet: newWallet,
            points: newPoints,
            totalSpent: newTotalSpent,
          });

          await addDoc(collection(db, "customers", pendingPromo.email, "transactions"), {
            transactionId: `PROMO-${Date.now()}`,
            promoTitle: (promoData as any).title || "Promo",
            promoId: pendingPromo.promoId,
            type: "promo-redemption",
            method: "wallet",
            amount: promoPrice,
            earnedPoints,
            status: "Completed",
            redeemedAt: Timestamp.now(),
          });

          setPromoStatus(`🎉 Promo redeemed via Wallet! ₱${promoPrice} deducted. +${earnedPoints} points earned!`);
        }

        // 🔹 Counter Redeem
        if (method === "counter") {
          const newPoints = +(currentPoints + earnedPoints).toFixed(2);
          const newTotalSpent = +(Number(customerData.totalSpent || 0) + promoPrice).toFixed(2);

          await updateDoc(customerRef, {
            points: newPoints,
            totalSpent: newTotalSpent,
          });

          await addDoc(collection(db, "customers", pendingPromo.email, "transactions"), {
            transactionId: `PROMO-${Date.now()}`,
            promoTitle: (promoData as any).title || "Promo",
            promoId: pendingPromo.promoId,
            type: "promo-redemption",
            method: "counter",
            amount: promoPrice,
            earnedPoints,
            status: "Completed",
            redeemedAt: Timestamp.now(),
          });

          setPromoStatus(`🎟️ Promo redeemed Over the Counter! +${earnedPoints} points earned!`);
        }

        // 🔹 Log globally and per-customer
        const redeemedPromoData = {
          promoId: pendingPromo.promoId,
          email: pendingPromo.email,
          title: (promoData as any).title || "",
          price: promoPrice,
          earnedPoints,
          redeemedVia: method,
          redeemedAt: Timestamp.now(),
        };

        // 🔹 Save to global collection
        await addDoc(collection(db, "redeemedPromos"), redeemedPromoData);

        // 🔹 Save to the customer's own collection
        await addDoc(collection(db, `customers/${pendingPromo.email}/redeemedPromos`), redeemedPromoData);

        await updateDoc(promoRef, { isUsed: true });

        setPromoStatus("✅ Promo redeemed and marked as used!");
      } catch (err) {
        console.error("Error redeeming promo:", err);
        setPromoStatus("❌ Error redeeming promo.");
      }

      setPendingPromo(null);
      setIsConfirmVisible(false);
      setPromoDetails(null);
    };

    // 🔹 Place Order
    const placeOrder = async () => {
      if (items.length === 0) return alert("Add at least one item.");

      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10);
      const timestamp = Timestamp.fromDate(now);
      const transactionId = `ORD-${Date.now()}`;

      // 🏦 If Wallet Customer
      if (walletCustomer) {
        if ((walletCustomer.wallet || 0) < total) {
          alert(`❌ Insufficient wallet balance. Available: ₱${walletCustomer.wallet}, Required: ₱${total}`);
          return;
        }

        const ref = doc(db, "customers", walletCustomer.id);
        const newWallet = +(Number(walletCustomer.wallet) - total).toFixed(2);
        const newPoints = +(Number(walletCustomer.points || 0) + points).toFixed(2);
        const newTotalSpent = +(Number(walletCustomer.totalSpent || 0) + total).toFixed(2);

        const logEntry = {
          transactionId,
          amount: total,
          date: dateStr,
          earnedPoints: points,
          items,
          type: "wallet",
          method: "Wallet",
          status: "Completed",
          paymentMethod: "Wallet",
        };

        // 🔸 Update customer wallet, points, and totalSpent
        await updateDoc(ref, {
          wallet: newWallet,
          points: +newPoints.toFixed(2),
          totalSpent: +newTotalSpent.toFixed(2),
        });

        // 🔸 Save inside customer's subcollection
        await addDoc(collection(db, "customers", walletCustomer.id, "transactions"), {
          orderId: transactionId,
          amount: total,
          paymentMethod: "Wallet",
          type: "wallet",
          status: "Completed",
          date: timestamp,
          items,
        });

        // 🔸 Also save in global `transactions`
        await addDoc(collection(db, "transactions"), {
          customerId: walletCustomer.id,
          fullName: walletCustomer.fullName,
          orderId: transactionId,
          amount: total,
          paymentMethod: "Wallet",
          type: "wallet",
          status: "Completed",
          date: timestamp,
          items,
        });
        await updateFavoriteCategory(walletCustomer.id);
        alert(`✅ Order placed! ₱${total} deducted from wallet. ${points} points added to ${walletCustomer.fullName}.`);

        setOrders((prev) => [
          {
            id: transactionId,
            items,
            subtotal,
            total,
            pointsEarned: points,
            customerId: walletCustomer.id,
            placedAt: now.toISOString(),
            paidByWallet: true,
          },
          ...prev,
        ]);

        setWalletCustomer({
          ...walletCustomer,
          wallet: newWallet,
          points: +newPoints.toFixed(2),
          logs: walletCustomer.logs ? [...walletCustomer.logs, logEntry] : [logEntry],
        });

        // Reset forms
        setItems([{ id: 1, name: "", price: 0, qty: 1 }]);
        setCustomer(null);
        setWalletScanResult(null);
        setWalletCustomer(null);
        return;
      }

      // 🧾 If Customer scanned via “Scan QR for Points” (Over the Counter)
      if (customer) {
        const ref = doc(db, "customers", customer.id);
        const earnedPoints = +(subtotal * 0.02).toFixed(2);
        const newPoints = +(Number(customer.points || 0) + earnedPoints).toFixed(2);
        const newTotalSpent = +(Number(customer.totalSpent || 0) + total).toFixed(2);

        await updateDoc(ref, {
          points: newPoints,
          totalSpent: +newTotalSpent.toFixed(2),
        });

        // 🔸 Save to customer's transactions
        await addDoc(collection(db, "customers", customer.id, "transactions"), {
          orderId: transactionId,
          amount: total,
          paymentMethod: "Over the Counter",
          type: "points-earned",
          status: "Completed",
          date: timestamp,
          items,
        });

        // 🔸 Also save globally
        await addDoc(collection(db, "transactions"), {
          customerId: customer.id,
          fullName: customer.fullName,
          orderId: transactionId,
          amount: total,
          paymentMethod: "Over the Counter",
          type: "points-earned",
          status: "Completed",
          date: timestamp,
          items,
        });

        await updateFavoriteCategory(customer.id);

        alert(`✅ Order placed (Over the Counter)! ${earnedPoints} points added to ${customer.fullName}.`);

        setOrders((prev) => [
          {
            id: transactionId,
            items,
            subtotal,
            total,
            pointsEarned: earnedPoints,
            customerId: customer.id,
            placedAt: now.toISOString(),
            paidByWallet: false,
          },
          ...prev,
        ]);

        setItems([{ id: 1, name: "", price: 0, qty: 1 }]);
        setCustomer(null);
        setWalletCustomer(null);
        setWalletScanResult(null);
        return;
      }

      // 🪙 If Points Payment Customer (pointsCustomer previously scanned)
      if (pointsCustomer) {
        const pointsValue = pointsCustomer.points || 0;
        const totalPointsRequired = total; // 1 point = ₱1
        if (pointsValue < totalPointsRequired) {
          alert(`❌ Insufficient points. Available: ${pointsValue}, Required: ${totalPointsRequired}`);
          return;
        }

        const newPoints = +(pointsValue - totalPointsRequired).toFixed(2);
        const newTotalSpent = +(Number(pointsCustomer.totalSpent || 0) + total).toFixed(2);

        const ref = doc(db, "customers", pointsCustomer.id);
        await updateDoc(ref, {
          points: newPoints,
          totalSpent: +newTotalSpent.toFixed(2),
        });

        const orderId = `ORD-${Date.now()}`;
        await addDoc(collection(db, "transactions"), {
          customerId: pointsCustomer.id,
          fullName: pointsCustomer.fullName,
          orderId,
          amount: total,
          paymentMethod: "Points",
          type: "points-payment",
          status: "Completed",
          date: Timestamp.now(),
          items,
          pointsEarned:0
        });

        await addDoc(collection(db, "customers", pointsCustomer.id, "transactions"), {
          customerId: pointsCustomer.id,
          fullName: pointsCustomer.fullName,
          orderId,
          amount: total,
          paymentMethod: "Points",
          type: "points-payment",
          status: "Completed",
          date: Timestamp.now(),
          items,
          pointsEarned: 0
        });

        await updateFavoriteCategory(pointsCustomer.id);

        alert(`✅ Order placed! ${total} points deducted from ${pointsCustomer.fullName}.`);

        setPointsCustomer(null);
        setPointsScanResult(null);
        setItems([{ id: 1, name: "", price: 0, qty: 1 }]);
        return;
      }

      

      alert("✅ Order placed for Walk-in Customer (No points earned).");
      setItems([{ id: 1, name: "", price: 0, qty: 1 }]);
    };

    // Handle paying over the counter for a linked customer (cash)
    // ✅ Handle Cash or GCash Payment

  // ✅ Handle Cash or E-Wallet Payment
  const handlePayment = async () => {
  if (items.length === 0 || items.every((it) => it.name === "")) {
    return alert("❌ Add at least one item before proceeding with payment.");
  }
  if (!customer) return alert("❌ No customer selected.");
  if (!paymentMethod) return alert("❌ Select a payment method first.");

  // 🔹 Require reference number for E-Wallet
  if (paymentMethod === "ewallet" && referenceNo.trim() === "") {
    return alert("❌ Please enter a valid E-Wallet Reference Number before proceeding.");
  }

  try {
    const ref = doc(db, "customers", customer.id);

    // 🔹 Compute earned points (5% of subtotal)
    const earnedPoints = +(subtotal * 0.02).toFixed(2);
    const newPoints = +(Number(customer.points || 0) + earnedPoints).toFixed(2);
    const newTotalSpent = +(Number(customer.totalSpent || 0) + total).toFixed(2);

    // 🔹 Update customer record
    await updateDoc(ref, {
      points: newPoints,
      totalSpent: newTotalSpent,
    });

    // 🔹 Prepare transaction details
    const orderId = `ORD-${Date.now()}`;
    const paymentLabel = paymentMethod === "cash" ? "Cash" : "E-Wallet"; // ✅ Simplified label

    // 🔹 Save to main transactions collection
    await addDoc(collection(db, "transactions"), {
      customerId: customer.id,
      fullName: customer.fullName,
      orderId,
      amount: total,
      paymentMethod: paymentLabel,
      type: paymentMethod,
      status: "Completed",
      date: Timestamp.now(),
      items,
      pointsEarned: earnedPoints,
      ...(paymentMethod === "ewallet" ? { referenceNo } : {}),
    });

    // 🔹 Save to customer's transaction subcollection
    await addDoc(collection(db, "customers", customer.id, "transactions"), {
      orderId,
      amount: total,
      paymentMethod: paymentLabel,
      type: paymentMethod,
      status: "Completed",
      date: Timestamp.now(),
      items,
      pointsEarned: earnedPoints,
      ...(paymentMethod === "ewallet" ? { referenceNo } : {}),
    });

    // 🔹 Update favorite category if needed
    await updateFavoriteCategory(customer.id);

    alert(
      `✅ Paid using ${paymentMethod === "cash" ? "Cash" : "E-Wallet"}${
        paymentMethod === "ewallet" ? `\nReference No: ${referenceNo}` : ""
      }\n${earnedPoints} points added to ${customer.fullName}.`
    );

    // 🔹 Reset states after payment
    setCustomer({ ...customer, points: newPoints });
    setItems([{ id: 1, name: "", price: 0, qty: 1 }]);
    setReferenceNo("");
    setPaymentMethod(null);
  } catch (error) {
    console.error("Payment Error:", error);
    alert("❌ Something went wrong while processing payment.");
  }
};



    const handlePointsPayment = async () => {
      if (items.length === 0 || items.every((it) => it.name === "")) {
      return alert("❌ Add at least one item before proceeding with payment.");
    }
      if (!customer) return alert("No customer selected.");
      if ((customer.points || 0) < total) return alert(`❌ Not enough points. Required: ${total}`);

      const ref = doc(db, "customers", customer.id);
      const newPoints = +(Number(customer.points) - total).toFixed(2);
      const newTotalSpent = +(Number(customer.totalSpent || 0) + total).toFixed(2);

      const orderId = `ORD-${Date.now()}`;

      await updateDoc(ref, {
        points: newPoints,
        totalSpent: +newTotalSpent.toFixed(2),
      });

      await addDoc(collection(db, "transactions"), {
        customerId: customer.id,
        fullName: customer.fullName,
        orderId,
        amount: total,
        paymentMethod: "Points",
        status: "Completed",
        date: Timestamp.now(),
        items,
        pointsEarned: 0
      });

      // also save under customer's transaction subcollection
      await addDoc(collection(db, "customers", customer.id, "transactions"), {
        customerId: customer.id,
        fullName: customer.fullName,
        orderId,
        amount: total,
        paymentMethod: "Points",
        status: "Completed",
        date: Timestamp.now(),
        items,
        pointsEarned: 0 
      });

      alert(`✅ Paid using Points! ${total} points deducted.`);
      setCustomer({ ...customer, points: newPoints });
      setItems([{ id: 1, name: "", price: 0, qty: 1 }]);
    };

    const handleWalletPayment = async () => {

    if (items.length === 0 || items.every((it) => it.name === "")) {
      return alert("❌ Add at least one item before proceeding with payment.");
    }
      if (!customer) return alert("No customer selected.");
      if ((customer.wallet || 0) < total) return alert(`❌ Not enough wallet balance. Required: ₱${total}`);

      const ref = doc(db, "customers", customer.id);
      const newWallet = +(Number(customer.wallet) - total).toFixed(2);
      const newPoints = +(Number(customer.points || 0) + points).toFixed(2);
      const newTotalSpent = +(Number(customer.totalSpent || 0) + total).toFixed(2);

      const orderId = `ORD-${Date.now()}`;

      await updateDoc(ref, {
        wallet: newWallet,
        points: newPoints,
        totalSpent: +newTotalSpent.toFixed(2),
      });

      await addDoc(collection(db, "transactions"), {
        customerId: customer.id,
        fullName: customer.fullName,
        orderId,
        amount: total,
        paymentMethod: "Wallet",
        status: "Completed",
        date: Timestamp.now(),
        items,
        pointsEarned: points 
      });

      await addDoc(collection(db, "customers", customer.id, "transactions"), {
        customerId: customer.id,
        fullName: customer.fullName,
        orderId,
        amount: total,
        paymentMethod: "Wallet",
        status: "Completed",
        date: Timestamp.now(),
        items,
        pointsEarned: points
      });

      await updateFavoriteCategory(customer.id);

      alert(`✅ Paid using Wallet! ₱${total} deducted. ${points} points earned.`);
      setCustomer({ ...customer, wallet: newWallet, points: newPoints });
      setItems([{ id: 1, name: "", price: 0, qty: 1 }]);
    };

    // ✅ UI
    return (
      <>
        <SidebarStaff />
        <div className="assisted-ordering">
          <h2>Take Order</h2>

          <div className="columns">
            {/* LEFT COLUMN */}
            <div className="column">
              <h3>Order Items</h3>

              <label>Category:</label>
              <select value={selectedCategory} onChange={handleCategoryChange}>
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              {items.map((it) => (
                <div key={it.id} className="order-item">
                  <select
                    value={it.name}
                    onChange={(e) => {
                      const nameInput = e.target.value;
                      const selectedItem = menuData.find(
                        (m) =>
                          m.name === nameInput &&
                          (selectedCategory
                            ? m.category.trim().toLowerCase() === selectedCategory.trim().toLowerCase()
                            : true)
                      );
                      if (selectedItem) {
                        updateItem(it.id, "name", selectedItem.name);
                        updateItem(it.id, "price", Number(selectedItem.price));
                        updateItem(it.id, "category", selectedItem.category); // ✅ add category
                      } else {
                        updateItem(it.id, "name", nameInput);
                        updateItem(it.id, "price", 0);
                        updateItem(it.id, "category", selectedCategory || "Uncategorized");
                      }
                    }}
                    disabled={!selectedCategory}
                  >
                    <option value="">{selectedCategory ? "Select Item" : "Select a category first"}</option>
                    {selectedCategory &&
                      menuData
                        .filter((m) => m.category.trim().toLowerCase() === selectedCategory.trim().toLowerCase())
                        .map((m) => (
                          <option key={m.id} value={m.name} disabled={!m.availability}>
                            {m.name} {m.availability ? "" : "(Unavailable)"}
                          </option>
                        ))}
                  </select>

                  <input type="number" value={it.qty} onChange={(e) => updateItem(it.id, "qty", Number(e.target.value))} placeholder="Qty" />
                  <input type="number" value={it.price} readOnly placeholder="Price" />
                  <button onClick={() => removeItem(it.id)}>✖</button>
                </div>
              ))}

              <button onClick={addItem}
              style={{ marginLeft: 10, background:"#673000ff",color:"white  "  }}
              >+ Add Item</button>

              <div className="order-summary-list" style={{ marginTop: "18px" }}>
                <h3>Current Items:</h3>
                <ul>
                  {items.map((it, idx) => (
                    <li key={it.id || idx}>
                      <b>{it.name || <i>No item selected</i>}</b> ({it.category || "—"}) × {it.qty} — ₱{(it.price * it.qty).toFixed(2)}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="summary">
                <p>Subtotal: ₱{subtotal.toFixed(2)}</p>
                <p>Total: ₱{total.toFixed(2)}</p>
                <p>Earnable Points: {points}</p>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="column">
              <h3>Action</h3>
              <hr style={{ margin: "20px 0" }} />

              {/* STEP 1 — Search by Mobile Number */}
              <div>
                <input type="text" placeholder="Enter mobile number" value={mobileSearch} onChange={(e) => setMobileSearch(e.target.value)} />
                <button onClick={searchCustomerByMobile}
                style={{ marginLeft: 10, background:"#ffffffff",color:"black"  }}
                >🔍 Search</button>
              </div>

              {/* STEP 2 — Optional Scan QR for Customer */}
              <button onClick={startScanner} style={{ marginTop: 10, background:"#673000ff",color:"white  "  }}>
                📷 Scan Customer QR (Optional)
              </button>
              {showScanner && <div id="reader" style={{ width: 350, height: 300, marginTop: 10 }} />}

              {/* STEP 3 — Show Customer Details */}
              {customer && (
                <div style={{ marginTop: 15, padding: 15, border: "1px solid #ccc", borderRadius: 8, background: "#fafafa" }}>
                  
                  <p>
                    <b>Name:</b> {customer.fullName}
                  </p>
                  <p>
                    <b>Tier:</b> {customer.tier || "—"}
                  </p>
                  <p>
                    <b>Points:</b> {customer.points ?? 0}
                  </p>
                  <p>
                    <b>Wallet:</b> ₱{customer.wallet ?? 0}
                  </p>
                </div>
              )}

              

              {/* STEP 4 — Payment Options */}
              {customer && (
                <div style={{ marginTop: 15 }}>
                  
  <div className="payment-section">
    <h3>Choose Payment Method</h3>
    <div className="payment-buttons">
      <button onClick={handlePointsPayment} style={{  background:"#ffc34bff",color:"#383838ff"  }}> Points Balance</button>
                  <button onClick={handleWalletPayment} style={{  background:"#14d7caff",color:"#383838ff"  }}>
                    Wallet Balance
                  </button>
      <button
        onClick={() => setPaymentMethod("cash")}
        className={paymentMethod === "cash" ? "active" : ""}
      style={{  background:"#ae6a0cff",color:"#ffffffff"  }}
      >
        Cash
      </button>

      <button
        onClick={() => setPaymentMethod("ewallet")}
        className={paymentMethod === "ewallet" ? "active" : ""}
        style={{  background:"#1cc451ff",color:"white"  }}
      >
        Pay using E-Wallet
      </button>
    </div>

    {paymentMethod === "ewallet" && (
      <div className="ewallet-input">
        <label>E-Wallet Reference No.:</label>
        <input
          type="text"
          value={referenceNo}
          onChange={(e) => setReferenceNo(e.target.value)}
          placeholder="Enter Reference No."
        />
      </div>
    )}

    {/* 🔹 Proceed Button */}
    {paymentMethod && (
      <button onClick={handlePayment} className="proceed-btn"
      style={{  background:"#f1bf48ff",color:"#383838ff"  }}>
        
        Proceed Payment
      </button>
    )}
  </div>

                </div>
              )}

              {/* STEP 5 — Scan Promo QR (ONLY if customer exists) */}




              {searchStatus && <p style={{ marginTop: 10 }}>{searchStatus}</p>}
            </div>
          </div>

          
        </div>
      </>
    );
  }
