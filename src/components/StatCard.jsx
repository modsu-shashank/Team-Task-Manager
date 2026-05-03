import React from "react";

export default function StatCard({ title, value, hint }) {
  return (
    <div className="card stat-card">
      <div className="muted small">{title}</div>
      <div className="stat-value">{value}</div>
      <div className="muted tiny">{hint}</div>
    </div>
  );
}