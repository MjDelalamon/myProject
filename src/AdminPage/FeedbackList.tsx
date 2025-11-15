import React, { useEffect, useState, useMemo } from "react";
import {
  collection,
  getDocs,
  orderBy,
  query,
  updateDoc,
  doc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../Firebase/firebaseConfig";
import Sidebar from "../components/SideBar";
import "../Style/FeedbackList.css";
import { Star } from "lucide-react";

type Feedback = {
  id: string;
  customerId: string;
  orderId: string;
  rating: number;
  comment: string;
  reply?: string;
  createdAt: Date;
};

const FeedbackList: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRating, setFilterRating] = useState<number | "All">("All");
  const [loading, setLoading] = useState(true);

  // Modal controls
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [replying, setReplying] = useState(false);

  // Fetch all feedback entries
  useEffect(() => {
    const fetchFeedbacks = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, "feedbacks"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);

        const data = snap.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            customerId: d.customerId ?? "N/A",
            orderId: d.orderId ?? "N/A",
            rating: d.rating ?? 0,
            comment: d.comment ?? "",
            reply: d.reply ?? "",
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

  // Filtering logic
  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter((f) => {
      const matchesSearch =
        f.customerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.reply?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRating = filterRating === "All" || f.rating === filterRating;

      return matchesSearch && matchesRating;
    });
  }, [feedbacks, searchTerm, filterRating]);

  // ----------------------------------------
  //      SUBMIT ADMIN REPLY + NOTIFICATION
  // ----------------------------------------
  const submitReply = async () => {
    if (!selectedFeedback) return;

    if (replyMessage.trim() === "") {
      alert("Reply cannot be empty.");
      return;
    }

    try {
      setReplying(true);

      // 1️⃣ UPDATE feedback document
      const ref = doc(db, "feedbacks", selectedFeedback.id);
      await updateDoc(ref, { reply: replyMessage });

      // 2️⃣ ADD NOTIFICATION to customer collection
      const notifRef = collection(
        db,
        "customers",
        selectedFeedback.customerId, // email is the document ID
        "notifications"
      );

      await addDoc(notifRef, {
        type: "FeedbackReply",
        title: "Your feedback has been replied",
        message: replyMessage,
        feedbackId: selectedFeedback.id,
        isRead: false,
        createdAt: serverTimestamp(),
      });

      // 3️⃣ Update UI instantly
      setFeedbacks((prev) =>
        prev.map((f) =>
          f.id === selectedFeedback.id ? { ...f, reply: replyMessage } : f
        )
      );

      // Reset modal
      setReplyMessage("");
      setSelectedFeedback(null);
    } catch (err) {
      console.error("Error sending reply:", err);
    } finally {
      setReplying(false);
    }
  };

  return (
    <>
      <Sidebar />

      <div className="feedback-container">
        <h2 className="feedback-header">Customer Ratings</h2>

        {/* FILTERS */}
        <div className="feedback-controls">
          <input
            type="text"
            placeholder="Search by customer, order, comment, or reply..."
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

        {/* TABLE */}
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
                  <th>Reply</th>
                  <th>Date</th>
                  <th>Action</th>
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

                    <td>
                      {f.reply ? (
                        <span className="reply-text">{f.reply}</span>
                      ) : (
                        <span className="no-reply">No reply yet</span>
                      )}
                    </td>

                    <td>{f.createdAt.toLocaleString()}</td>

                    <td>
                      {!f.reply ? (
                        <button
                          className="reply-button"
                          onClick={() => {
                            setSelectedFeedback(f);
                            setReplyMessage("");
                          }}
                        >
                          Reply
                        </button>
                      ) : (
                        <span className="replied-badge">Replied</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* REPLY MODAL */}
        {selectedFeedback && (
          <div className="reply-modal-overlay">
            <div className="reply-modal">
              <h3>Reply to Feedback</h3>

              <p>
                <strong>Customer:</strong> {selectedFeedback.customerId}
              </p>
              <p>
                <strong>Comment:</strong> {selectedFeedback.comment}
              </p>

              <textarea
                placeholder="Type your reply..."
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                className="reply-textarea"
              />

              <div className="reply-actions">
                <button
                  className="modal-cancel"
                  onClick={() => setSelectedFeedback(null)}
                >
                  Cancel
                </button>

                <button
                  className="modal-send"
                  onClick={submitReply}
                  disabled={replying}
                >
                  {replying ? "Sending..." : "Send Reply"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default FeedbackList;
