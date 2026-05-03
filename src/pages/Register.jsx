import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import { AuthContext } from "../context/AuthContext";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", form);
      login(data);
      navigate("/");
    } catch (error) {
      setErr(error?.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={submit}>
        <div className="auth-title">Create account</div>
        <div className="auth-subtitle">Start your team workspace.</div>

        {err && <div className="alert">{err}</div>}

        <input className="input" placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="input" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="input" type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />

        <button className="btn btn-primary" disabled={loading}>
          {loading ? "Creating..." : "Register"}
        </button>

        <div className="muted small">
          Already have an account? <Link to="/login">Login</Link>
        </div>
      </form>
    </div>
  );
}