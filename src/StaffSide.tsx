import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Style/Staff.css"; // Import external CSS

function Staff() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const correctPassword = "12345";

  const handleLogin = (e) => {
    e.preventDefault();
    setError(""); // Reset error message
    if (password === correctPassword) {
      navigate("/SideBarStaff", { replace: true });
    } else {
      setError("Incorrect password.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Staff Login</h1>
        <h2>Enter PIN</h2>
        <form onSubmit={handleLogin}>
          <input
            type="password"
            placeholder="Enter Pin"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">Login</button>
          {error && <p className="error">{error}</p>}
        </form>
        <Link className="back-link" to="/Intro">
          ← Go Back
        </Link>
      </div>
    </div>
  );
}

export default Staff;
