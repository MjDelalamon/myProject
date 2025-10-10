import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../Firebase/firebaseConfig";

export async function getPersonalizedPromotions(favoriteCategory: string) {
  try {
    // 🔹 Fetch promotions that match user's favorite category
    const q = query(
      collection(db, "promotions"),
      where("category", "==", favoriteCategory),
      where("isActive", "==", true)
    );

    const snapshot = await getDocs(q);
    const promos = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log("🎯 Personalized promos for", favoriteCategory, promos);
    return promos;
  } catch (error) {
    console.error("❌ Error fetching personalized promotions:", error);
    return [];
  }
}
