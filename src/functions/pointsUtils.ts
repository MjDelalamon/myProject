import { collection, getDocs } from "firebase/firestore";
import { db } from "../Firebase/firebaseConfig";

// Function to get total earned points of a customer
export const getTotalEarnedPoints = async (customerEmail: string): Promise<number> => {
  try {
    const transactionsRef = collection(db, "customers", customerEmail, "transactions");
    const transactionsSnap = await getDocs(transactionsRef);

    let totalPoints = 0;

    transactionsSnap.forEach((doc) => {
      const data = doc.data();
      if (data.pointsEarned) {
        totalPoints += data.pointsEarned;
      }
    });

    return totalPoints;
  } catch (error) {
    console.error("Error fetching total earned points:", error);
    return 0;
  }
};
