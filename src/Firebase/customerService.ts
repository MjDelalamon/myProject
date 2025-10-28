// src/Firebase/customerService.ts
import { doc, setDoc, serverTimestamp, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "./firebaseConfig";
import type { CustomerType } from "../AdminPage/Customer";

// ✅ Function to check if email exists
const checkEmailExists = async (email: string) => {
  const q = query(collection(db, "customers"), where("email", "==", email));
  const snapshot = await getDocs(q);
  return !snapshot.empty;
};

// ✅ Function to check if mobile exists
const checkMobileExists = async (mobile: string) => {
  if (!mobile) return false;
  const q = query(collection(db, "customers"), where("mobile", "==", mobile));
  const snapshot = await getDocs(q);
  return !snapshot.empty;
};

export const addCustomerToFirestore = async (customer: Partial<CustomerType>) => {
  try {
    if (!customer.email) throw new Error("Email is required");

    const formattedEmail = customer.email.trim();
    const formattedMobile = customer.mobile?.trim() || "";

    // ✅ Check if email already exists
    const emailExists = await checkEmailExists(formattedEmail);
    if (emailExists) throw new Error("This email is already registered.");

    // ✅ Check if mobile already exists
    if (formattedMobile) {
      const mobileExists = await checkMobileExists(formattedMobile);
      if (mobileExists) throw new Error("This mobile number is already registered.");
    }

    // 🔹 Generate QR value using email
    const qrValue = formattedEmail;

    // 🔹 Generate customer number
    const customerNumber = Date.now().toString().slice(-4);

    // 🔥 Save customer using email as document ID
    await setDoc(doc(db, "customers", formattedEmail), {
      customerNumber,
      fullName: customer.fullName,
      email: formattedEmail,
      mobile: formattedMobile,
      wallet: customer.wallet || 0,
      tier: "Bronze",
      status: "Inactive",
      points: 0,
      qrCode: qrValue,
      createdAt: serverTimestamp(),
      favoriteCategory: customer.favoriteCategory || "",
      gender: customer.gender || "",
    });

    return { success: true, id: formattedEmail, qrValue };
  } catch (error: any) {
    console.error("❌ Error adding customer:", error);
    return { success: false, error: error.message };
  }
};
