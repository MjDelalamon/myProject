import { collection, getDocs } from "firebase/firestore";
import { db } from "../Firebase/firebaseConfig";
import { isWithinFilter } from "./isWithinFilter";

export const fetchDashboardData = async (filter: string) => {
  const transactionsRef = collection(db, "transactions");
  const snapshot = await getDocs(transactionsRef);

  let total = 0;
  const activeEmails = new Set<string>();
  let totalTopup = 0;
  const itemSales: Record<string, number> = {};

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const dateObj = data.date?.toDate?.() || new Date(data.date || Date.now());
    const status = data.status || "Pending";
    const type = data.type || "";
    const paymentMethod = data.paymentMethod || "";
    const items = data.items || [];
    const amount = Number(data.amount) || 0;

    // ✅ Total Sales (based on filter)
    if (status === "Completed" && isWithinFilter(dateObj, filter)) {
      if (type !== "points-used") total += amount;
    }

    // ✅ Active Customers
    if (status === "Completed" && data.orderId && data.customerId) {
      activeEmails.add(data.customerId);
    }

    // ✅ Wallet Top-ups
    if (type === "wallet-topup" || paymentMethod === "Wallet Top-up") {
      totalTopup += amount;
    }

    // ✅ Count item sales
    if (status === "Completed" && Array.isArray(items)) {
      items.forEach((item) => {
        const itemName = item.name || "Unknown";
        const qty = Number(item.qty) || 1;
        itemSales[itemName] = (itemSales[itemName] || 0) + qty;
      });
    }
  });

  const sortedTopItems = Object.entries(itemSales)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name);

  return {
    totalSales: total,
    activeCustomers: activeEmails.size,
    walletTopups: totalTopup,
    topItems: sortedTopItems,
  };
};
