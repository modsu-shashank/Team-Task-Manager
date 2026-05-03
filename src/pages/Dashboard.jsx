import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../api";
import StatCard from "../components/StatCard";

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [selected, setSelected] = useState("");
  const [dash, setDash] = useState(null);
  const navigate = useNavigate();

  const loadProjects = async () => {
    const { data } = await api.get("/projects");
    setProjects(data);
    if (data.length && !selected) setSelected(data[0]._id);
  };

  const loadDashboard = async () => {
    if (!selected) return;
    const { data } = await api.get(`/dashboard/${selected}`);
    setDash(data);
  };

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [selected]);

  return (
    <Layout>
      <div className="page-header">
        <div>
          <div className="page-title">Team Dashboard</div>
          <div className="muted">Projects, tasks, and status at a glance.</div>
        </div>
        <button className="btn btn-primary" onClick={() => navigate("/projects")}>
          Manage Projects
        </button>
      </div>

      <div className="card header-card">
        <div className="field-grid">
          <div>
            <div className="label">Selected project</div>
            <select className="select" value={selected} onChange={(e) => setSelected(e.target.value)}>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="muted small align-end">
            {projects.length ? `${projects.length} projects loaded` : "No projects yet"}
          </div>
        </div>
      </div>

      {dash && (
        <>
          <div className="stats-grid">
            <StatCard title="Total Tasks" value={dash.totalTasks} hint="All tasks in this project" />
            <StatCard title="Overdue" value={dash.overdueTasks} hint="Due date passed and not done" />
            <StatCard title="Teams" value={projects.length} hint="Accessible projects" />
            <StatCard title="Recent" value={dash.recentTasks.length} hint="Newest task activity" />
          </div>

          <div className="two-col">
            <div className="card">
              <div className="section-title">Tasks by status</div>
              <div className="stack">
                {dash.byStatus.map((s) => (
                  <div className="row" key={s._id}>
                    <span>{s._id}</span>
                    <strong>{s.count}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="section-title">Tasks per user</div>
              <div className="stack">
                {dash.tasksPerUser.map((u) => (
                  <div className="row" key={u.userId}>
                    <div>
                      <div>{u.name}</div>
                      <div className="muted tiny">{u.email}</div>
                    </div>
                    <strong>{u.count}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="section-title">Recent tasks</div>
            <div className="task-grid">
              {dash.recentTasks.map((t) => (
                <div className="task-card" key={t._id}>
                  <div className="task-top">
                    <div>
                      <div className="task-title">{t.title}</div>
                      <div className="muted small">{t.description}</div>
                    </div>
                    <span className="pill">{t.status}</span>
                  </div>
                  <div className="muted tiny mt8">
                    Due: {new Date(t.dueDate).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {!projects.length && (
        <div className="card empty">
          <div className="section-title">No projects yet</div>
          <div className="muted">Create one from the Projects page.</div>
          <Link className="btn btn-primary mt16" to="/projects">Go to Projects</Link>
        </div>
      )}
    </Layout>
  );
}