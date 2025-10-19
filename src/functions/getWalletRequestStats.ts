import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../Firebase/firebaseConfig";

export type WalletRequestStats = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
};

/**
 * Sets up a real-time listener for wallet requests.
 * Calls the callback every time the collection changes.
 */
export function listenToWalletRequestStats(
  callback: (stats: WalletRequestStats) => void
) {
  const colRef = collection(db, "walletRequests");

  const unsubscribe = onSnapshot(
    colRef,
    (snapshot) => {
      let pending = 0;
      let approved = 0;
      let rejected = 0;

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const status = (data.status || "").toLowerCase();

        if (status === "pending") pending++;
        else if (status === "approved") approved++;
        else if (status === "rejected") rejected++;
      });

      callback({
        total: snapshot.size,
        pending,
        approved,
        rejected,
      });
    },
    (error) => {
      console.error("Error listening to walletRequests:", error);
      callback({ total: 0, pending: 0, approved: 0, rejected: 0 });
    }
  );

  // Return unsubscribe function to stop listening
  return unsubscribe;
}
