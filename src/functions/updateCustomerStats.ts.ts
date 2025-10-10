import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../Firebase/firebaseConfig";

// 🧠 Weighted category logic: frequency + recency + amount
export async function updateCustomerStats(customerEmail: string) {
  try {
    const ordersRef = collection(db, "orders");
    const q = query(ordersRef, where("customerEmail", "==", customerEmail));
    const querySnapshot = await getDocs(q);

    const categoryScores: Record<string, number> = {};
    let totalSpent = 0;

    const now = new Date().getTime();

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const category = data.category || data.item || "Unknown";
      const amount = data.amount || 0;
      const status = data.status;

      if (status === "Completed" && category) {
        totalSpent += amount;

        // 🔹 Weight based on frequency
        let score = 1;

        // 🔹 Weight based on recency (newer = higher weight)
        const dateValue = data.date?.toDate
          ? data.date.toDate().getTime()
          : new Date(data.date).getTime();
        const daysAgo = (now - dateValue) / (1000 * 60 * 60 * 24);
        const recencyWeight = Math.max(0.5, 1 - daysAgo / 30); // degrades after ~1 month

        // 🔹 Weight based on spending
        const amountWeight = amount / 100; // 1 point per ₱100

        // Combine all
        score += recencyWeight + amountWeight;

        categoryScores[category] = (categoryScores[category] || 0) + score;
      }
    });

    // 🏆 Find highest scoring category
    const favoriteCategory =
      Object.entries(categoryScores).sort((a, b) => b[1] - a[1])[0]?.[0] ||
      "None";

    // 🔹 Update Firestore customer document
    const customerRef = doc(db, "customers", customerEmail);
    await updateDoc(customerRef, {
      favoriteCategory,
      totalSpent,
      updatedAt: new Date(),
    });

    console.log(
      `✅ Updated stats for ${customerEmail}: favorite = ${favoriteCategory}, totalSpent = ₱${totalSpent.toFixed(
        2
      )}`
    );
  } catch (error) {
    console.error("❌ Error updating customer stats:", error);
  }
}
