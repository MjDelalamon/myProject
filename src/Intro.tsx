import { Link } from "react-router-dom";

import "./Style/intro.css";
function Intro() {
  return (
    <div className="intro-container">
      <div className="intro-card">
        <h1 className="intro-title">Welcome!</h1>

        <div className="intro-buttons">
          <Link to="/Owner">
            <button className="intro-button admin-button" 
            style={{background:"#6e3204"}}
            >Start</button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Intro;
