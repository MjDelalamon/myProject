// src/services/checkMobileExists.ts
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../Firebase/firebaseConfig";

/**
 * Checks if a mobile number already exists in Firestore under "customers" collection.
 * @param mobile - The mobile number to check
 * @returns Promise<boolean> - true if mobile exists, false otherwise
 */
export const checkMobileExists = async (mobile: string): Promise<boolean> => {
  try {
    // Normalize mobile (remove spaces)
    const formattedMobile = mobile.trim();

    // Query only the matching documents
    const q = query(collection(db, "customers"), where("mobile", "==", formattedMobile));
    const snapshot = await getDocs(q);

    // Return true if found, false if not
    return !snapshot.empty;
  } catch (error) {
    console.error("Error checking mobile number:", error);
    throw error;
  }
};
