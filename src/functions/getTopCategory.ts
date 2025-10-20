import { collection, getDocs } from "firebase/firestore";
import { db } from "../Firebase/firebaseConfig";

interface TransactionItem {
  category: string;
  qty?: number;
}

interface TransactionData {
  items?: TransactionItem[];
}

/**
 * Retrieves the customer's top category based on all transactions.
 * Counts total items per category and returns the most frequent one.
 * 
 * @param customerEmail - The customer's document ID (email)
 * @returns The most frequently purchased category or null if none found
 */
export const getTopCategory = async (customerEmail: string): Promise<string | null> => {
  try {
    const transactionsRef = collection(db, "customers", customerEmail, "transactions");
    const querySnapshot = await getDocs(transactionsRef);

    const categoryCount: Record<string, number> = {};

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() as TransactionData;
      if (data.items && Array.isArray(data.items)) {
        data.items.forEach((item) => {
          const category = item.category;
          const qty = item.qty ?? 1;
          categoryCount[category] = (categoryCount[category] || 0) + qty;
        });
      }
    });

    // Find top category
    const topCategory = Object.entries(categoryCount).reduce(
      (max, [category, count]) => (count > max.count ? { category, count } : max),
      { category: "", count: 0 }
    ).category;

    return topCategory || null;
  } catch (error) {
    console.error(`❌ Error getting top category for ${customerEmail}:`, error);
    return null;
  }
};
