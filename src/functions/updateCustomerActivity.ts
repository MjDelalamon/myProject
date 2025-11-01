import { db } from "../Firebase/firebaseConfig";
import {
  doc,
  collection,
  getDocs,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

/**
 * Updates all customers' totalTransactions, totalVisits, lastVisit, and status.
 * Status is "Active" only if the customer has at least one transaction today.
 */
export const updateCustomerActivity = async (customerId?: string) => {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0]; // "YYYY-MM-DD"

    if (customerId) {
      // ✅ Update only a single customer
      await updateSingleCustomer(customerId, todayStr);
    } else {
      // 🔄 Update all customers
      const customersRef = collection(db, "customers");
      const allCustomersSnap = await getDocs(customersRef);

      const updatePromises = allCustomersSnap.docs.map((docSnap) =>
        updateSingleCustomer(docSnap.id, todayStr)
      );

      await Promise.all(updatePromises);
    }

    console.log("✅ Customer activity update complete.");
  } catch (error) {
    console.error("❌ Error updating customer activities:", error);
  }
};

const updateSingleCustomer = async (customerId: string, todayStr: string) => {
  try {
    const transactionsRef = collection(db, "customers", customerId, "transactions");
    const transactionsSnap = await getDocs(transactionsRef);

    const totalTransactions = transactionsSnap.size;
    const customerRef = doc(db, "customers", customerId);
    const customerSnap = await getDoc(customerRef);

    let totalVisits = 0;
    let lastVisitDate = "";
    let status = "Inactive"; // default

    if (customerSnap.exists()) {
      const data = customerSnap.data();
      totalVisits = data.totalVisits || 0;
      lastVisitDate = data.lastVisitDate || "";
    }

    // 🟢 Check if there’s a transaction today
    let hasTransactionToday = false;
    transactionsSnap.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.date) {
        // ✅ Handle Firestore Timestamp or string
        const transactionDate = data.date.toDate ? data.date.toDate() : new Date(data.date);
        const transactionStr = transactionDate.toISOString().split("T")[0];
        if (transactionStr === todayStr) hasTransactionToday = true;
      }
    });

    // 🟡 Update based on today’s activity
    if (hasTransactionToday) {
      status = "Active";
      if (lastVisitDate !== todayStr) totalVisits += 1;
    } else {
      status = "Inactive";
    }

    // 🧾 Save updates
    await setDoc(
      customerRef,
      {
        totalTransactions,
        totalVisits,
        lastVisit: hasTransactionToday ? serverTimestamp() : null,
        lastVisitDate: hasTransactionToday ? todayStr : lastVisitDate,
        status,
      },
      { merge: true }
    );

    console.log(
      `🟤 Updated ${customerId}: Tx=${totalTransactions}, Visits=${totalVisits}, Status=${status}`
    );
  } catch (err) {
    console.error(`❌ Error updating ${customerId}:`, err);
  }
};
