import { db } from "../Firebase/firebaseConfig";
import {
  collection,
  getDocs,
  orderBy,
  limit,
  query,
  setDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";

/**
 * Save a promotion and automatically assign it to Top 10 customers
 */
export const savePromotionForTopCustomers = async (promotionData: any) => {
  try {
    // 1️⃣ Fetch Top 10 customers ranked 1–10
    const topCustomersRef = collection(db, "topCustomers");
    const q = query(topCustomersRef, orderBy("rank", "asc"), limit(10));
    const snapshot = await getDocs(q);

    const eligibleCustomers = snapshot.docs.map((doc) => doc.id);

    // 2️⃣ Create a new promo document with eligible customers
    const promoRef = doc(collection(db, "promotions"));
    await setDoc(promoRef, {
      ...promotionData,
      eligibleCustomers, // ⬅️ store top 10 customer IDs
      createdAt: serverTimestamp(),
    });

    console.log("🎯 Promotion created and assigned to Top 10 customers.");
  } catch (error) {
    console.error("❌ Error creating promotion for top customers:", error);
  }
};
