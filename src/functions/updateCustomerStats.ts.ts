import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../Firebase/firebaseConfig"; // adjust path if needed

export async function updateCustomerStats(customerEmail: string) {
  try {
    const ordersRef = collection(db, "orders");
    const q = query(ordersRef, where("customerEmail", "==", customerEmail));
    const querySnapshot = await getDocs(q);

    const categoryCount: Record<string, number> = {};
    let totalSpent = 0;

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const status = data.status;

      // Only process completed orders
      if (status === "Completed") {
        totalSpent += data.total || data.amount || 0;

        // 🧩 If order contains multiple items, loop through them
        if (Array.isArray(data.items)) {
          data.items.forEach((item: any) => {
            const category = item.category || item.type || item.name;
            if (category) {
              categoryCount[category] = (categoryCount[category] || 0) + 1;
            }
          });
        } else {
          // Fallback for older orders with a single category field
          const category = data.category || data.item || "Uncategorized";
          categoryCount[category] = (categoryCount[category] || 0) + 1;
        }
      }
    });

    // 🏆 Find the favorite category
    let favoriteCategory: string | null = null;
    let maxCount = 0;
    for (const [category, count] of Object.entries(categoryCount)) {
      if (count > maxCount) {
        favoriteCategory = category;
        maxCount = count;
      }
    }

    // 💾 Update the customer's Firestore document
    const customerRef = doc(db, "customers", customerEmail);
    await updateDoc(customerRef, {
      favoriteCategory: favoriteCategory || null,
      totalSpent,
      updatedAt: new Date(),
    });

    console.log(
      `✅ Updated stats for ${customerEmail}: favorite = ${favoriteCategory}, totalSpent = ₱${totalSpent}`
    );
  } catch (error) {
    console.error("❌ Error updating customer stats:", error);
  }
}
