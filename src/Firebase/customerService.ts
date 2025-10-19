// src/services/addCustomerToFirestore.ts
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc 
} from "firebase/firestore";
import { db } from "../Firebase/firebaseConfig";  

export const addCustomerToFirestore = async (
  name: string,
  email: string,
  mobile: string,
  wallet: number
) => {
  try {
    // 📌 Bilangin existing customers
    const snapshot = await getDocs(collection(db, "customers"));
    const count = snapshot.size + 1;

    // 📌 Auto-generate customer number (ex: 0001, 0002...)
    const customerNumber = count.toString().padStart(4, "0");

    // 📌 Create initial customer document
    const customerRef = await addDoc(collection(db, "customers"), {
      customerNumber,
      name,
      email,
      mobile,
      wallet,
      tier: "Bronze",
      status: "Active",
      points: 0,
      qrCode: "", // placeholder muna
      dateJoined: new Date().toISOString(),
    });

    // 📌 Gamitin ang doc ID bilang QR value
    const qrValue = customerRef.id;

    // 📌 Update Firestore with QR value (NOT base64)
    await updateDoc(doc(db, "customers", customerRef.id), {
      qrCode: qrValue,
    });

    return { 
      success: true, 
      id: customerRef.id, 
      customerNumber,
      qrValue // 👉 Pareho sa mobile, use this to generate QR on frontend
    };
  } catch (error) {
    console.error("❌ Error adding customer:", error);
    return { success: false, error };
  }
};
