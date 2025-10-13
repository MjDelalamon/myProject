import { collection, getDocs } from "firebase/firestore";
import { db } from "../Firebase/firebaseConfig"; // adjust path kung iba

export const getTopCategory = async (customerEmail: string) => {
  try {
    const transactionsRef = collection(db, "customers", customerEmail, "transactions");
    const snapshot = await getDocs(transactionsRef);

    const categoryCount: Record<string, number> = {};

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.items && Array.isArray(data.items)) {
        data.items.forEach((item: any) => {
          const category = item.category;
          if (category) {
            categoryCount[category] = (categoryCount[category] || 0) + item.qty;
          }
        });
      }
    });

    const topCategory = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0]?.[0];
    return topCategory || null;
  } catch (error) {
    console.error("Error getting top category:", error);
    return null;
  }
};
