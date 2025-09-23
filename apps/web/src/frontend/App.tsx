import React, { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "./App.css";

const App: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="login-container">
      <h1>MOBILE FINANCERS</h1>

      <input type="text" placeholder="Username" />

      <div className="password-wrapper">
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Password"
        />
        <button
          type="button"
          className="toggle-btn"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? <FaEyeSlash /> : <FaEye />}
        </button>
      </div>

      <button className="login-btn">Log In</button>
    </div>
  );
};

export default App;

