import React, { useContext } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function Layout({ children }) {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navClass = ({ isActive }) => (isActive ? "nav-link active" : "nav-link");

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <div className="brand">TaskFlow Pro</div>
          <div className="user-card">
            <div className="muted tiny">Signed in as</div>
            <div className="user-name">{user?.name}</div>
            <div className="muted tiny">{user?.email}</div>
          </div>

          <nav className="nav">
            <NavLink to="/" className={navClass}>Dashboard</NavLink>
            <NavLink to="/projects" className={navClass}>Projects</NavLink>
          </nav>
        </div>

        <button className="btn btn-danger" onClick={handleLogout}>Logout</button>
      </aside>

      <main className="main">
        {children}
      </main>
    </div>
  );
}