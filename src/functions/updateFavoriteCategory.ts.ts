import { doc, updateDoc } from "firebase/firestore";
import { db } from "../Firebase/firebaseConfig";
import { getTopCategory } from "./getTopCategory";

export const updateFavoriteCategory = async (customerEmail: string) => {
  try {
    const topCategory = await getTopCategory(customerEmail);
    if (topCategory) {
      const customerRef = doc(db, "customers", customerEmail);
      await updateDoc(customerRef, { favoriteCategory: topCategory });
      console.log(`Updated favorite category for ${customerEmail}: ${topCategory}`);
    } else {
      console.log(`No favorite category found for ${customerEmail}`);
    }
  } catch (error) {
    console.error("Error updating favorite category:", error);
  }
};
