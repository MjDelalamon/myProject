import { doc, updateDoc } from "firebase/firestore";
import { db } from "../Firebase/firebaseConfig";
import { getTopCategory } from "./getTopCategory";

/**
 * Updates the customer's favoriteCategory field in Firestore
 * based on their most purchased category.
 * 
 * @param customerEmail - The customer's Firestore document ID (email)
 */
export const updateFavoriteCategory = async (customerEmail: string): Promise<void> => {
  try {
    // Get the customer's top category from helper function
    const topCategory = await getTopCategory(customerEmail);

    if (!topCategory) {
      console.log(`⚠️ No favorite category found for ${customerEmail}`);
      return;
    }

    // Reference to the customer document
    const customerRef = doc(db, "customers", customerEmail);

    // Update the favoriteCategory field
    await updateDoc(customerRef, { favoriteCategory: topCategory });

    console.log(`✅ Updated favorite category for ${customerEmail}: ${topCategory}`);
  } catch (error) {
    console.error(`❌ Error updating favorite category for ${customerEmail}:`, error);
  }
};
