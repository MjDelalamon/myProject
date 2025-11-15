import { collection, getDocs } from "firebase/firestore";
import { db } from "../Firebase/firebaseConfig";

export const fetchDashboardData = async (range?: {
  startDate?: string | Date;
  endDate?: string | Date;
}) => {
  const transactionsRef = collection(db, "transactions");
  const snapshot = await getDocs(transactionsRef);

  // normalize range to Date objects (start at 00:00:00, end at 23:59:59.999)
  let start: Date | null = null;
  let end: Date | null = null;
  if (range?.startDate) {
    start = new Date(range.startDate);
    start.setHours(0, 0, 0, 0);
  }
  if (range?.endDate) {
    end = new Date(range.endDate);
    end.setHours(23, 59, 59, 999);
  }

  const withinRange = (d: Date) => {
    if (!start && !end) return true;
    if (start && d < start) return false;
    if (end && d > end) return false;
    return true;
  };

  let total = 0;
  let totalTopup = 0;
  const categorySales: Record<string, number> = {};
  const dailyPaymentSummary: Record<string, Record<string, number>> = {};
  const paymentMethodTotals: Record<string, number> = {}; // 🍩 for donut chart
  const topupRequests: Record<string, number> = {
    Requested: 0,
    Approved: 0,
    Rejected: 0,
    Total: 0,
  }; // 💸 for status counts
  const topupWalletRecords: any[] = []; // 🧾 full list of wallet top-up transactions

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const dateObj = data.date?.toDate?.() || new Date(data.date || Date.now());
    const status = data.status || "pending";
    const type = data.type || "";
    const paymentMethod = data.paymentMethod || "Unknown";
    const items = data.items || [];
    const amount = Number(data.amount) || 0;

    // 💸 Collect wallet-topup records (by range)
    if (type === "wallet-topup" && withinRange(dateObj)) {
      topupWalletRecords.push({
        id: docSnap.id,
        amount,
        status,
        paymentMethod,
        date: dateObj.toLocaleDateString(),
        customerName: data.customerName || "N/A",
      });

      // Count wallet top-up requests by status
      if (topupRequests[status] !== undefined) {
        topupRequests[status] += 1;
      }
      topupRequests.Total += 1;
    }

    // ✅ Only count completed transactions for sales summary (by range)
    if (status === "Completed" && withinRange(dateObj)) {
      const dayKey = dateObj.toISOString().split("T")[0];

      // 💰 Total Sales (exclude wallet-topups)
      if (type !== "wallet-topup") total += amount;

      // 💳 Wallet Top-ups total
      if (type === "wallet-topup" || paymentMethod === "Wallet Top-up") {
        totalTopup += amount;
      }

      // 🧁 Category Sales Count
      if (Array.isArray(items)) {
        items.forEach((item) => {
          const category = item.category || "Uncategorized";
          categorySales[category] = (categorySales[category] || 0) + 1;
        });
      }

      // 📅 Daily Payment Breakdown
      if (!dailyPaymentSummary[dayKey]) dailyPaymentSummary[dayKey] = {};
      dailyPaymentSummary[dayKey][paymentMethod] =
        (dailyPaymentSummary[dayKey][paymentMethod] || 0) + amount;

      // 🍩 Total Payment Breakdown (for donut chart)
      if (type !== "wallet-topup") {
        paymentMethodTotals[paymentMethod] =
          (paymentMethodTotals[paymentMethod] || 0) + amount;
      }
    }
  });

  // 🏆 Sort categories (show top 6)
  const topCategories = Object.entries(categorySales)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({ name, count }));

  // 📊 Format daily data for stacked bar chart
  const dailyPaymentData = Object.entries(dailyPaymentSummary).map(
    ([date, methods]) => ({
      date,
      ...methods,
    })
  );

  // 🍩 Format total payment breakdown for donut chart
  const paymentBreakdown = Object.entries(paymentMethodTotals).map(
    ([name, value]) => ({
      name,
      value,
    })
  );

  return {
    totalSales: total,
    walletTopups: totalTopup,
    topCategories,
    dailyPaymentData, // 📊 for BarChart
    paymentBreakdown, // 🍩 for Donut Chart
    topupRequests, // 💸 counts for Requested, Approved, Rejected, Total
    topupWalletRecords, // 🧾 full details of top-up wallet transactions
  };
};
