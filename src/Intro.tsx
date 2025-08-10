import { Link } from "react-router-dom";
import "./Style/Intro.css"; // Import your external CSS file

function Intro() {
  return (
    <div className="intro-container">
      <div className="intro-card">
        <h1 className="intro-title">Welcome!</h1>

        <div className="intro-buttons">
          <Link to="/Owner">
            <button className="intro-button admin-button">Admin</button>
          </Link>
          <Link to="/Staff">
            <button className="intro-button staff-button">Staff</button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Intro;
