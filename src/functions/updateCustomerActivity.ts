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
 * Determine customer tier based on total points earned
 * Bronze: 0–99
 * Silver: 100–299
 * Gold: 300+
 */
const determineTier = (points: number): string => {
  if (points >= 300) return "Gold";
  if (points >= 100) return "Silver";
  return "Bronze";
};

/**
 * Updates all customers' totalTransactions, totalVisits, totalSpent, lastVisit, status,
 * and ensures topCustomers collection is up-to-date.
 */
export const updateCustomerActivity = async (customerId?: string) => {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0]; // "YYYY-MM-DD"

    if (customerId) {
      await updateSingleCustomer(customerId, todayStr);
      await updateTopCustomers();
    } else {
      const customersRef = collection(db, "customers");
      const allCustomersSnap = await getDocs(customersRef);

      const updatePromises = allCustomersSnap.docs.map((docSnap) =>
        updateSingleCustomer(docSnap.id, todayStr)
      );

      await Promise.all(updatePromises);
      await updateTopCustomers();
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
    let totalPointsEarned = 0; // cumulative earned points
    let currentPoints = 0; // current remaining balance
    let totalSpent = 0; // <-- only from customer document
    let status = "Inactive";
    let tier = "Bronze";
    let favoriteCategory = "N/A";

    if (customerSnap.exists()) {
      const data = customerSnap.data();
      totalVisits = data.totalVisits || 0;
      lastVisitDate = data.lastVisitDate || "";
      favoriteCategory = data.favoriteCategory || "N/A";
      tier = data.tier || "Bronze";
      currentPoints = data.points || 0;
      totalSpent = data.totalSpent || 0; // <-- only use the saved totalSpent
    }

    let hasTransactionToday = false;

    transactionsSnap.forEach((docSnap) => {
      const data = docSnap.data();
      // sum pointsEarned only
      if (data.pointsEarned) totalPointsEarned += Number(data.pointsEarned) || 0;

      if (data.date) {
        const transactionDate = data.date.toDate ? data.date.toDate() : new Date(data.date);
        const transactionStr = transactionDate.toISOString().split("T")[0];
        if (transactionStr === todayStr) hasTransactionToday = true;
      }
    });

    // Determine new tier
    const newTier = determineTier(totalPointsEarned);
    const tierHierarchy = { Bronze: 1, Silver: 2, Gold: 3 };
    if (tierHierarchy[newTier] > tierHierarchy[tier]) {
      tier = newTier;
    }

    // Update visit + status
    if (hasTransactionToday) {
      status = "Active";
      if (lastVisitDate !== todayStr) totalVisits += 1;
    } else {
      status = "Inactive";
    }

    await setDoc(
      customerRef,
      {
        totalTransactions,
        totalVisits,
        totalPointsEarned: Math.round(totalPointsEarned * 100) / 100,
        points: Math.round(currentPoints * 100) / 100,
        totalSpent: Math.round(totalSpent * 100) / 100, // <-- do NOT recompute
        lastVisit: hasTransactionToday ? serverTimestamp() : null,
        lastVisitDate: hasTransactionToday ? todayStr : lastVisitDate,
        status,
        tier,
        favoriteCategory,
      },
      { merge: true }
    );

    console.log(
      `🟤 Updated ${customerId}: Tx=${totalTransactions}, Visits=${totalVisits}, ` +
      `PointsEarned=${totalPointsEarned.toFixed(2)}, Balance=${currentPoints.toFixed(2)}, ` +
      `TotalSpent=${totalSpent.toFixed(2)}, Status=${status}, Tier=${tier}, FavoriteCategory=${favoriteCategory}`
    );
  } catch (err) {
    console.error(`❌ Error updating ${customerId}:`, err);
  }
};

/**
 * Updates "topCustomers" collection based on stats and includes tier & favoriteCategory.
 * Uses totalSpent directly from the customer document.
 */
const updateTopCustomers = async () => {
  try {
    const customersRef = collection(db, "customers");
    const customersSnap = await getDocs(customersRef);

    const customersData = customersSnap.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        fullName: data.fullName || "Unnamed",
        totalPointsEarned: data.totalPointsEarned || 0,
        totalTransactions: data.totalTransactions || 0,
        totalVisits: data.totalVisits || 0,
        totalSpent: data.totalSpent || 0, // <-- from customer document only
        tier: data.tier || "Bronze",
        favoriteCategory: data.favoriteCategory || "N/A",
      };
    });

    const sorted = customersData.sort((a, b) => {
      if (b.totalPointsEarned !== a.totalPointsEarned)
        return b.totalPointsEarned - a.totalPointsEarned;
      if (b.totalTransactions !== a.totalTransactions)
        return b.totalTransactions - a.totalTransactions;
      return b.totalVisits - a.totalVisits;
    });

    const top10 = sorted.slice(0, 10);

    const topRef = collection(db, "topCustomers");
    const savePromises = top10.map((cust, index) =>
      setDoc(
        doc(topRef, cust.id),
        {
          rank: index + 1,
          fullName: cust.fullName,
          totalPointsEarned: Math.round(cust.totalPointsEarned * 100) / 100,
          totalTransactions: cust.totalTransactions,
          totalVisits: cust.totalVisits,
          totalSpent: Math.round(cust.totalSpent * 100) / 100, // <-- from document only
          tier: cust.tier,
          favoriteCategory: cust.favoriteCategory,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )
    );

    await Promise.all(savePromises);
    console.log("🏅 Top customers updated successfully.");
  } catch (error) {
    console.error("❌ Error updating top customers:", error);
  }
};
