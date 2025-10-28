import React, { useEffect, useState, useMemo } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../Firebase/firebaseConfig";
import Sidebar from "../components/SideBar";
import "../Style/FeedbackList.css";
import { Star } from "lucide-react"; // npm install lucide-react
import "../Style/FeedbackList.css"

type Feedback = {
  id: string;
  customerId: string;
  orderId: string;
  rating: number;
  comment: string;
  createdAt: Date;
};

const FeedbackList: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRating, setFilterRating] = useState<number | "All">("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeedbacks = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, "feedbacks"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        const data = snap.docs.map((doc) => {
          const d = doc.data();
          return {
            id: doc.id,
            customerId: d.customerId ?? "N/A",
            orderId: d.orderId ?? "N/A",
            rating: d.rating ?? 0,
            comment: d.comment ?? "",
            createdAt: d.createdAt?.toDate() ?? new Date(),
          };
        });
        setFeedbacks(data);
      } catch (err) {
        console.error("Error loading feedbacks:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeedbacks();
  }, []);

  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter((f) => {
      const matchesSearch =
        f.customerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.comment.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRating = filterRating === "All" || f.rating === filterRating;
      return matchesSearch && matchesRating;
    });
  }, [feedbacks, searchTerm, filterRating]);

  return (
    <>
      <Sidebar />
      <div className="feedback-container">
        <h2 className="feedback-header">Customer Feedbacks</h2>

        <div className="feedback-controls">
          <input
            type="text"
            placeholder="Search by customer, order, or comment..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="feedback-search"
          />
          <select
            value={filterRating}
            onChange={(e) =>
              setFilterRating(
                e.target.value === "All" ? "All" : parseInt(e.target.value)
              )
            }
            className="feedback-filter"
          >
            <option value="All">All Ratings</option>
            {[5, 4, 3, 2, 1].map((r) => (
              <option key={r} value={r}>
                {r} Stars
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <p>Loading feedback...</p>
        ) : filteredFeedbacks.length === 0 ? (
          <p>No feedback found.</p>
        ) : (
          <div className="feedback-table-wrapper">
            <table className="feedback-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  
                  <th>Rating</th>
                  <th>Comment</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredFeedbacks.map((f) => (
                  <tr key={f.id}>
                    <td>{f.customerId}</td>
                   
                    <td>
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={18}
                          color={i < f.rating ? "#f9a825" : "#ccc"}
                          fill={i < f.rating ? "#f9a825" : "none"}
                        />
                      ))}
                    </td>
                    <td>{f.comment || <em>No comment</em>}</td>
                    <td>{f.createdAt.toLocaleString()}</td>
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

export default FeedbackList;
