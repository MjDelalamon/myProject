import React, { useEffect, useState, useMemo } from "react";
import {
  collection,
  query,
  orderBy,
  updateDoc,
  doc,
  addDoc,
  serverTimestamp,
  onSnapshot,
  getDocs,
} from "firebase/firestore";
import { db } from "../Firebase/firebaseConfig";
import Sidebar from "../components/SideBar";
import "../Style/CustomerAssistance.css";

type Assistance = {
  id: string;
  customerId: string;
  message: string;
  reply?: string;
  createdAt: Date;
};

const CustomerAssistanceList: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<Assistance[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const [selectedFeedback, setSelectedFeedback] = useState<Assistance | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [replying, setReplying] = useState(false);

  const [sendMessageModal, setSendMessageModal] = useState(false);
  const [allCustomers, setAllCustomers] = useState<string[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  // Realtime feedbacks and customers
  useEffect(() => {
    setLoading(true);

    const feedbackQuery = query(
      collection(db, "CustomerAssistance"),
      orderBy("createdAt", "desc")
    );

    const unsubscribeFeedbacks = onSnapshot(
      feedbackQuery,
      (snapshot) => {
        const data = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            customerId: d.customerId ?? "N/A",
            message: d.message ?? "",
            reply: d.reply ?? "",
            createdAt: d.createdAt?.toDate() ?? new Date(),
          };
        });
        setFeedbacks(data);
        setLoading(false);
      },
      (error) => {
        console.error(error);
        setLoading(false);
      }
    );

    const customersRef = collection(db, "customers");
    const unsubscribeCustomers = onSnapshot(customersRef, (snapshot) => {
      setAllCustomers(snapshot.docs.map((doc) => doc.id));
    });

    // Refetch data when tab gains focus
    const handleFocus = () => {
      getDocs(feedbackQuery).then((snap) => {
        const data = snap.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            customerId: d.customerId ?? "N/A",
            message: d.message ?? "",
            reply: d.reply ?? "",
            createdAt: d.createdAt?.toDate() ?? new Date(),
          };
        });
        setFeedbacks(data);
      });
      getDocs(customersRef).then((snap) => {
        setAllCustomers(snap.docs.map((doc) => doc.id));
      });
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      unsubscribeFeedbacks();
      unsubscribeCustomers();
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter((f) =>
      f.customerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.reply?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [feedbacks, searchTerm]);

  // Reply to a feedback
  const submitReply = async () => {
    if (!selectedFeedback) return;
    if (!replyMessage.trim()) return alert("Reply cannot be empty");

    try {
      setReplying(true);

      // Update feedback
      const ref = doc(db, "CustomerAssistance", selectedFeedback.id);
      await updateDoc(ref, { reply: replyMessage });

      // Add notification
      const notifRefs = collection(
        db,
        "customers",
        selectedFeedback.customerId,
        "notifications"
      );
      await addDoc(notifRefs, {
        customerId: selectedFeedback.customerId,
        type: "NewFeedbackReply",
        title: "Admin",
        message: replyMessage,
        isRead: false,
        createdAt: serverTimestamp(),
      });

      setSelectedFeedback(null);
      setReplyMessage("");
    } catch (err) {
      console.error(err);
    } finally {
      setReplying(false);
    }
  };

  // Send custom message to selected customer
  const sendCustomMessage = async () => {
    if (!selectedCustomer) return alert("Select a customer");
    if (!customMessage.trim()) return alert("Message cannot be empty");

    try {
      setSendingMessage(true);
      const notifRefs = collection(db, "customers", selectedCustomer, "notifications");
      await addDoc(notifRefs, {
        customerId: selectedCustomer,
        type: "CustomMessage",
        title: "Admin",
        message: customMessage,
        isRead: false,
        createdAt: serverTimestamp(),
      });
      alert("Message sent!");
      setCustomMessage("");
      setSelectedCustomer("");
      setSendMessageModal(false);
    } catch (err) {
      console.error(err);
      alert("Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <>
      <Sidebar />
      <div className="feedback-container">
        <h2 className="feedback-header">Customer Assistance</h2>

        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="feedback-search"
        />

        <button
          className="send-message-btn"
          onClick={() => setSendMessageModal(true)}
          style={{background:"brown"}}
        >
          Send Message
        </button>

        {loading ? (
          <p>Loading...</p>
        ) : filteredFeedbacks.length === 0 ? (
          <p>No feedback found.</p>
        ) : (
          <table className="feedback-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Message</th>
                <th>Reply</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredFeedbacks.map((f) => (
                <tr key={f.id}>
                  <td>{f.customerId}</td>
                  <td title={f.message}>{f.message || <em>No message</em>}</td>
                  <td title={f.reply}>{f.reply || <em>No reply</em>}</td>
                  <td>{f.createdAt.toLocaleString()}</td>
                  <td>
                    <button
                      onClick={() => {
                        setSelectedFeedback(f);
                        setReplyMessage(f.reply || "");
                      }}
                      style={{background:"brown"}}
                    >
                      Reply
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Reply Modal */}
        {selectedFeedback && (
          <div className="reply-modal-overlay">
            <div className="reply-modal">
              <h3>Reply</h3>
              <p>
                <strong>Customer:</strong> {selectedFeedback.customerId}
              </p>
              <p>
                <strong>Message:</strong> {selectedFeedback.message}
              </p>
              <textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type reply..."
              />
              <button onClick={submitReply} disabled={replying}>
                {replying ? "Sending..." : "Send"}
              </button>
              <button onClick={() => setSelectedFeedback(null)}>Cancel</button>
            </div>
          </div>
        )}

        {/* Send Message Modal */}
        {sendMessageModal && (
          <div className="reply-modal-overlay">
            <div className="reply-modal">
              <h3>Send Message</h3>
              <select
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
              >
                <option value="">Select Customer</option>
                {allCustomers.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Type your message..."
              />    
              <button onClick={sendCustomMessage} disabled={sendingMessage}>
                {sendingMessage ? "Sending..." : "Send"}
              </button>
              <button onClick={() => setSendMessageModal(false)}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CustomerAssistanceList;
