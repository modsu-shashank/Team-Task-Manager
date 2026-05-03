import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import Modal from "../components/Modal";
import api from "../api";

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [inviteCode, setInviteCode] = useState("");

  const load = async () => {
    const { data } = await api.get("/projects");
    setProjects(data);
  };

  useEffect(() => {
    load();
  }, []);

  const createProject = async (e) => {
    e.preventDefault();
    await api.post("/projects", form);
    setForm({ name: "", description: "" });
    setCreateOpen(false);
    load();
  };

  const joinProject = async (e) => {
    e.preventDefault();
    await api.post("/projects/join", { inviteCode });
    setInviteCode("");
    setJoinOpen(false);
    load();
  };

  return (
    <Layout>
      <div className="page-header">
        <div>
          <div className="page-title">Projects</div>
          <div className="muted">Create workspaces or join using invite code.</div>
        </div>

        <div className="inline-actions">
          <button className="btn btn-secondary" onClick={() => setJoinOpen(true)}>Join Project</button>
          <button className="btn btn-primary" onClick={() => setCreateOpen(true)}>Create Project</button>
        </div>
      </div>

      <div className="projects-grid">
        {projects.map((p) => (
          <Link className="card project-card" key={p._id} to={`/projects/${p._id}`}>
            <div className="task-top">
              <div>
                <div className="project-name">{p.name}</div>
                <div className="muted small">{p.description || "No description"}</div>
              </div>
              <span className="pill">{p.members?.length || 0} members</span>
            </div>

            <div className="project-footer">
              <div className="muted tiny">Invite code: {p.inviteCode}</div>
              <div className="muted tiny">
                Admin: {p.createdBy?.name || "Unknown"}
              </div>
            </div>
          </Link>
        ))}
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Project">
        <form className="stack" onSubmit={createProject}>
          <input
            className="input"
            placeholder="Project name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <textarea
            className="textarea"
            rows="4"
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <button className="btn btn-primary">Create</button>
        </form>
      </Modal>

      <Modal open={joinOpen} onClose={() => setJoinOpen(false)} title="Join Project">
        <form className="stack" onSubmit={joinProject}>
          <input
            className="input"
            placeholder="Invite code"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
          />
          <button className="btn btn-primary">Join</button>
        </form>
      </Modal>
    </Layout>
  );
}