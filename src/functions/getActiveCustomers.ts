// src/functions/getActiveCustomers.ts
import { collection, getDocs } from "firebase/firestore";
import { db } from "../Firebase/firebaseConfig";
import type { Timestamp } from "firebase/firestore";

// Define the shape of returned customer item
export type ActiveCustomerItem = {
  id: string;
  name: string | null;
  email?: string | null;
  lastTransaction: Date;
  totalTransactions: number;
};

export const getActiveCustomers = async (days = 7): Promise<ActiveCustomerItem[]> => {
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(now.getDate() - days); // last X days

  const customersRef = collection(db, "customers");
  const snapshot = await getDocs(customersRef);
  const active: ActiveCustomerItem[] = [];

  snapshot.forEach((docSnap) => {
    const data = docSnap.data() as Record<string, any>;
    // Accept different field names but prefer `lastTransaction` stored as Firestore Timestamp
    const rawLast = data.lastTransaction;
    let lastDate: Date | null = null;

    if (rawLast && typeof (rawLast as Timestamp).toDate === "function") {
      lastDate = (rawLast as Timestamp).toDate();
    } else if (rawLast instanceof Date) {
      lastDate = rawLast;
    } else if (rawLast) {
      // fallback: try parse
      lastDate = new Date(rawLast);
      if (isNaN(lastDate.getTime())) lastDate = null;
    }

    if (lastDate && lastDate >= cutoff) {
      active.push({
        id: docSnap.id,
        name: data.name || data.displayName || null,
        email: data.email || null,
        lastTransaction: lastDate,
        totalTransactions: Number(data.totalTransactions || data.txCount || 0),
      });
    }
  });

  // optional: sort by most recent
  active.sort((a, b) => b.lastTransaction.getTime() - a.lastTransaction.getTime());

  return active;
};
