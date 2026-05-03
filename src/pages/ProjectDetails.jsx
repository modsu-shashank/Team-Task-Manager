import React, { useContext, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import Layout from "../components/Layout";
import Modal from "../components/Modal";
import api from "../api";
import { AuthContext } from "../context/AuthContext";

const statuses = ["To Do", "In Progress", "Done"];

const emptyForm = {
  title: "",
  description: "",
  dueDate: "",
  priority: "Medium",
  assignedTo: ""
};

const idOf = (v) => (v && v._id ? v._id : v);

export default function ProjectDetails() {
  const { id } = useParams();
  const { user } = useContext(AuthContext);

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [dash, setDash] = useState(null);
  const [loading, setLoading] = useState(true);

  const [taskOpen, setTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskForm, setTaskForm] = useState(emptyForm);

  const [memberOpen, setMemberOpen] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [p, t, d] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/tasks/project/${id}`),
        api.get(`/dashboard/${id}`)
      ]);

      setProject(p.data);
      setTasks(t.data);
      setDash(d.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const currentMember = project?.members?.find((m) => idOf(m.user) === user?._id);
  const isAdmin = currentMember?.role === "Admin";

  const grouped = useMemo(() => {
    const bucket = { "To Do": [], "In Progress": [], Done: [] };
    for (const task of tasks) bucket[task.status].push(task);
    return bucket;
  }, [tasks]);

  const openCreate = () => {
    setEditingTask(null);
    setTaskForm(emptyForm);
    setTaskOpen(true);
  };

  const openEdit = (task) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title || "",
      description: task.description || "",
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : "",
      priority: task.priority || "Medium",
      assignedTo: idOf(task.assignedTo) || ""
    });
    setTaskOpen(true);
  };

  const saveTask = async (e) => {
    e.preventDefault();

    if (!taskForm.title || !taskForm.dueDate) {
      alert("Title and due date are required");
      return;
    }

    if (editingTask) {
      await api.put(`/tasks/${editingTask._id}/project/${id}`, taskForm);
    } else {
      await api.post(`/tasks/project/${id}`, taskForm);
    }

    setTaskOpen(false);
    setEditingTask(null);
    setTaskForm(emptyForm);
    load();
  };

  const moveStatus = async (taskId, status) => {
    await api.patch(`/tasks/${taskId}/status/project/${id}`, { status });
    load();
  };

  const deleteTask = async (taskId) => {
    if (!confirm("Delete this task?")) return;
    await api.delete(`/tasks/${taskId}/project/${id}`);
    load();
  };

  const addMember = async (e) => {
    e.preventDefault();
    await api.post(`/projects/${id}/members`, { email: memberEmail, role: "Member" });
    setMemberEmail("");
    setMemberOpen(false);
    load();
  };

  const removeMember = async (userId) => {
    if (!confirm("Remove this member?")) return;
    await api.delete(`/projects/${id}/members/${userId}`);
    load();
  };

  if (loading || !project) {
    return (
      <Layout>
        <div className="card">Loading project...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="page-header">
        <div>
          <div className="page-title">{project.name}</div>
          <div className="muted">{project.description || "No description"}</div>
          <div className="muted tiny mt8">Invite code: {project.inviteCode}</div>
        </div>

        <div className="inline-actions">
          {isAdmin && (
            <button className="btn btn-secondary" onClick={() => setMemberOpen(true)}>
              Add Member
            </button>
          )}
          <button className="btn btn-primary" onClick={openCreate}>
            Create Task
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="card stat-card">
          <div className="muted small">Total Tasks</div>
          <div className="stat-value">{dash?.totalTasks || 0}</div>
        </div>
        <div className="card stat-card">
          <div className="muted small">Overdue</div>
          <div className="stat-value">{dash?.overdueTasks || 0}</div>
        </div>
        <div className="card stat-card">
          <div className="muted small">Members</div>
          <div className="stat-value">{project.members?.length || 0}</div>
        </div>
        <div className="card stat-card">
          <div className="muted small">Your Role</div>
          <div className="stat-value">{currentMember?.role || "Unknown"}</div>
        </div>
      </div>

      <div className="board">
        {statuses.map((status) => (
          <div className="column card" key={status}>
            <div className="column-head">
              <div className="section-title">{status}</div>
              <span className="pill">{grouped[status].length}</span>
            </div>

            <div className="stack">
              {grouped[status].map((task) => {
                const assignedId = idOf(task.assignedTo);
                const canEdit = isAdmin || assignedId === user?._id;

                return (
                  <div className="task-card" key={task._id}>
                    <div className="task-top">
                      <div>
                        <div className="task-title">{task.title}</div>
                        <div className="muted small">{task.description}</div>
                      </div>
                      <span className={`pill priority-${task.priority.toLowerCase()}`}>
                        {task.priority}
                      </span>
                    </div>

                    <div className="task-meta">
                      <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                      <span>Assigned: {task.assignedTo?.name || "Unassigned"}</span>
                    </div>

                    <div className="task-actions">
                      <select
                        className="select slim"
                        value={task.status}
                        onChange={(e) => moveStatus(task._id, e.target.value)}
                      >
                        {statuses.map((s) => (
                          <option value={s} key={s}>{s}</option>
                        ))}
                      </select>

                      {canEdit && (
                        <button className="btn btn-secondary slim-btn" onClick={() => openEdit(task)}>
                          Edit
                        </button>
                      )}

                      {isAdmin && (
                        <button className="btn btn-danger slim-btn" onClick={() => deleteTask(task._id)}>
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {!grouped[status].length && (
                <div className="empty-slot">No tasks here</div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="section-title">Members</div>
        <div className="stack">
          {project.members.map((m) => {
            const memberId = idOf(m.user);
            return (
              <div className="row" key={memberId}>
                <div>
                  <div>{m.user.name}</div>
                  <div className="muted tiny">{m.user.email}</div>
                </div>
                <div className="inline-actions">
                  <span className="pill">{m.role}</span>
                  {isAdmin && memberId !== user?._id && (
                    <button className="btn btn-danger slim-btn" onClick={() => removeMember(memberId)}>
                      Remove
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Modal
        open={taskOpen}
        onClose={() => setTaskOpen(false)}
        title={editingTask ? "Edit Task" : "Create Task"}
      >
        <form className="stack" onSubmit={saveTask}>
          <input
            className="input"
            placeholder="Title"
            value={taskForm.title}
            onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
          />
          <textarea
            className="textarea"
            rows="4"
            placeholder="Description"
            value={taskForm.description}
            onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
          />
          <input
            className="input"
            type="date"
            value={taskForm.dueDate}
            onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
          />
          <select
            className="select"
            value={taskForm.priority}
            onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
          >
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
          </select>

          <select
            className="select"
            value={taskForm.assignedTo}
            onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
          >
            <option value="">Unassigned</option>
            {project.members.map((m) => (
              <option key={idOf(m.user)} value={idOf(m.user)}>
                {m.user.name} ({m.user.email})
              </option>
            ))}
          </select>

          <button className="btn btn-primary">
            {editingTask ? "Save Changes" : "Create Task"}
          </button>
        </form>
      </Modal>

      <Modal
        open={memberOpen}
        onClose={() => setMemberOpen(false)}
        title="Add Member"
      >
        <form className="stack" onSubmit={addMember}>
          <input
            className="input"
            placeholder="Member email"
            value={memberEmail}
            onChange={(e) => setMemberEmail(e.target.value)}
          />
          <button className="btn btn-primary">Add Member</button>
        </form>
      </Modal>
    </Layout>
  );
}