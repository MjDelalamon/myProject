import { collection, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { db } from "../Firebase/firebaseConfig";

export async function updateFavoriteCategory(customerEmail: string): Promise<void> {
  try {
    const transactionsRef = collection(db, "transactions");
    const q = query(
      transactionsRef,
      where("customerEmail", "==", customerEmail),
      where("Status", "==", "Completed")
    );

    const querySnapshot = await getDocs(q);
    const categoryCount: Record<string, number> = {};

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const items = data.items || [];

      items.forEach((item: any) => {
        const category = item.category;
        if (category) {
          categoryCount[category] = (categoryCount[category] || 0) + item.qty;
        }
      });
    });

    const sortedCategories = Object.entries(categoryCount).sort((a, b) => b[1] - a[1]);
    const favoriteCategory = sortedCategories[0]?.[0] || null;
    const secondaryCategory = sortedCategories[1]?.[0] || null;

    if (favoriteCategory) {
      const customerDoc = doc(db, "customers", customerEmail);
      await updateDoc(customerDoc, {
        favoriteCategory,
        secondaryCategory: secondaryCategory || null
      });

      console.log("✅ Favorite category updated:", favoriteCategory);
    } else {
      console.log("⚠️ No favorite category found for this customer.");
    }
  } catch (error) {
    console.error("❌ Error updating favorite category:", error);
  }
}
