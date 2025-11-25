import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AdminUserPin, StaffUserPin } from "./Firebase/firebase_firestore";
import "./Style/Owner.css"; // Import external CSS

function Owner() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [adminPin, setAdminPin] = useState("");
  const [staffPin, setStaffPin] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const fetchPins = async () => {
      const admin = await AdminUserPin();
      const staff = await StaffUserPin();
      setAdminPin(admin);
      setStaffPin(staff);
    };
    fetchPins();
  }, []);

  const handleLogin = () => {
    if (!password.trim()) {
      setError("❌ Please enter your PIN.");
      return;
    }
    if (password === adminPin) {
      setIsLoggedIn(true);
      navigate("/Dashboard", { replace: true });
      setError("");
    } else if (password === staffPin) {
      setIsLoggedIn(true);
      navigate("/take-order", { replace: true });
      setError("");
    } else {
      setError("❌ Incorrect password. Please try again.");
    }
  };

  return (
    <div className="owner-container">
      {!isLoggedIn ? (
        <div className="login-card">
          <h2 className="login-title"
          style={{color:"#6e3204"}}  
          >Please enter pin</h2>
          <input
            type="password"
            placeholder="Enter PIN"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="login-input"
          />
          <button onClick={handleLogin} className="login-button"
          style={{background:"#6e3204"}}
          >
            Enter
          </button>
          {error && <p className="error-message">{error}</p>}
          <Link to="/Intro" className="back-link">
            ← Back
          </Link>
        </div>
      ) : (
        <div className="owner-welcome">
          <h1 className="welcome-title">👋 Welcome, Owner!</h1>
          <Link to="/Intro" className="back-link">
            ← Back to Intro
          </Link>
        </div>
      )}
    </div>
  );
}

export default Owner;
