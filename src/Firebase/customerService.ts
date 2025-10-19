// src/Firebase/customerService.ts
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebaseConfig";
import type { CustomerType } from "../AdminPage/Customer";

export const addCustomerToFirestore = async (customer: Partial<CustomerType>) => {
  try {
    if (!customer.email) throw new Error("Email is required");

    const qrValue = customer.email.trim(); // QR based on email
    const customerNumber = Date.now().toString().slice(-4); // unique customer number

    const docRef = await addDoc(collection(db, "customers"), {
      customerNumber,
      fullName: customer.fullName,
      
      email: customer.email,
      mobile: customer.mobile,
      wallet: customer.wallet || 0,
      tier: "Bronze",
      status: "Active",
      points: 0,
      qrCode: qrValue,
      dateJoined: serverTimestamp(),
      favoriteCategory: customer.favoriteCategory || "",
     
    });

    return { success: true, id: docRef.id, qrValue };
  } catch (error: any) {
    console.error("❌ Error adding customer:", error);
    return { success: false, error: error.message };
  }
};
