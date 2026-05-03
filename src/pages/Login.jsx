import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import { AuthContext } from "../context/AuthContext";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", form);
      login(data);
      navigate("/");
    } catch (error) {
      setErr(error?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={submit}>
        <div className="auth-title">Welcome back</div>
        <div className="auth-subtitle">Sign in to manage projects and tasks.</div>

        {err && <div className="alert">{err}</div>}

        <input className="input" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="input" type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />

        <button className="btn btn-primary" disabled={loading}>
          {loading ? "Signing in..." : "Login"}
        </button>

        <div className="muted small">
          New here? <Link to="/register">Create account</Link>
        </div>
      </form>
    </div>
  );
}