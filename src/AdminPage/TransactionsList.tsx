import React, { useEffect, useState, useMemo } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../Firebase/firebaseConfig";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/SideBar";

type Item = {
  category: string;
  id: number;
  name: string;
  price: number;
  qty: number;
};

type Transaction = {
  id: string;
  amount: number;
  customerId: string;
  date: string;
  fullName: string;
  items: Item[];
  rawDate: Date;
  paymentMethod: string;
};

const parseFirestoreDate = (ts: any) => {
  let dateObj = new Date();
  let dateStr = "";
  if (ts) {
    try {
      dateObj = typeof ts?.toDate === "function" ? ts.toDate() : new Date(ts);
      dateStr = dateObj.toLocaleString();
    } catch {
      dateStr = String(ts);
    }
  }
  return { dateStr, rawDate: dateObj };
};

const TransactionsList: React.FC = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<"Newest" | "Oldest">("Newest");
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<"All" | "Points" | "Wallet"| "Over the Counter">("All");

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, "transactions"),
          orderBy("date", sortOrder === "Newest" ? "desc" : "asc")
        );
        const snap = await getDocs(q);

        const data: Transaction[] = snap.docs.map((docSnap) => {
          const d = docSnap.data();
          const { dateStr, rawDate } = parseFirestoreDate(d.date);

          return {
            id: docSnap.id,
            amount: d.amount ?? 0,
            customerId: d.customerId ?? "Unknown",
            date: dateStr,
            fullName: d.fullName ?? "N/A",
            items: Array.isArray(d.items) ? d.items : [],
            rawDate,
            paymentMethod: d.paymentMethod ?? "Cash",
          };
        });

        setTransactions(data);
      } catch (err) {
        console.error("Error fetching transactions:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [sortOrder]);

  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      const dateA = a.rawDate.getTime();
      const dateB = b.rawDate.getTime();
      return sortOrder === "Newest" ? dateB - dateA : dateA - dateB;
    });
  }, [transactions, sortOrder]);

  const filteredTransactions = useMemo(() => {
    return sortedTransactions.filter((t) => {
      const matchesSearch =
        t.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.customerId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPayment =
        paymentFilter === "All" || t.paymentMethod === paymentFilter;
      return matchesSearch && matchesPayment;
    });
  }, [sortedTransactions, searchTerm, paymentFilter]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(amount);

  return (
    <>
      <Sidebar />
      <div className="transactions-container">
        <h2 className="transactions-header">All Transactions</h2>

        <div className="controls">
          

          <input
            type="text"
            placeholder="Search by customer or ID..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select
            className="filter-select"
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value as any)}
          >
            <option value="All">All Payment Methods</option>
            
            <option value="Wallet">Wallet</option>
            <option value="Points">Points</option>
            <option value="Over the Counter">Over the Counter</option>  
          </select>
        </div>

        {loading ? (
          <p className="loading">Loading transactions...</p>
        ) : filteredTransactions.length === 0 ? (
          <p className="no-data">No transactions found</p>
        ) : (
          <div className="table-wrapper">
            <table className="transactions-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Customer ID</th>
                  <th>Amount</th>
                  <th>Payment Method</th>
                  <th>Date</th>
                  <th>Items</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => navigate(`/transaction/${item.id}`)}
                  >
                    <td>{item.fullName}</td>
                    <td>{item.customerId}</td>
                    <td>{formatCurrency(item.amount)}</td>
                    <td
                      className={`payment-method ${
                        item.paymentMethod === "Cash" ? "cash" : "wallet"
                      }`}
                    >
                      {item.paymentMethod}
                    </td>
                    <td>{item.date}</td>
                    <td>
  <ul style={{ paddingLeft: "15px", margin: 0 }}>
    {item.items.map((itm, idx) => (
      <li key={idx} style={{ marginBottom: "4px" }}>
        <strong>{itm.name}</strong> {/* Item name */}
        {itm.category && <span> — <em>{itm.category}</em></span>} {/* Category */}
        <span> | Qty: {itm.qty}</span>
        <span> | ₱{itm.price}</span>
      </li>
    ))}
  </ul>
</td>


                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

export default TransactionsList;
