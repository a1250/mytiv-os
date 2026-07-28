"use client";

/**
 * Ported from the Electron app's src/modules/tasks/TasksPage.jsx — same
 * status/priority vocabulary (electron/db/schema.cjs's tasks table comments),
 * same "create then refetch" pattern used throughout the app (no
 * Redux/React Query, per the original's design).
 */
import { useEffect, useState } from "react";
import { useApi, useT } from "@/components/studio-provider";

type Task = {
  id: string;
  title: string;
  notes: string | null;
  status: string;
  priority: string;
  category: string | null;
  dueDate: string | null;
};

const STATUSES = ["backlog", "todo", "in_progress", "waiting", "done"];
const PRIORITIES = ["low", "medium", "high", "urgent"];

export default function TasksPage() {
  const api = useApi();
  const t = useT();
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");

  async function load() {
    setTasks((await api.tasks.list()) as Task[]);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    await api.tasks.create({ title, priority });
    setTitle("");
    await load();
  }

  async function handleStatusChange(id: string, status: string) {
    await api.tasks.update(id, { status });
    await load();
  }

  async function handleRemove(id: string) {
    await api.tasks.remove(id);
    await load();
  }

  if (!tasks) return <div className="page">{t("Loading…")}</div>;

  return (
    <div className="page">
      <h1>{t("Tasks & Ops")}</h1>

      <form onSubmit={handleCreate} className="task-form">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("New task title…")}
        />
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <button type="submit">{t("Add")}</button>
      </form>

      <div className="task-list">
        {tasks.length === 0 && <p className="empty">{t("No tasks yet.")}</p>}
        {tasks.map((task) => (
          <div key={task.id} className={`task-row priority-${task.priority}`}>
            <select value={task.status} onChange={(e) => handleStatusChange(task.id, e.target.value)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <span className="task-title">{task.title}</span>
            <span className={`pill priority-${task.priority}`}>{task.priority}</span>
            {task.dueDate && <span className="task-due">{task.dueDate}</span>}
            <button className="task-remove" onClick={() => handleRemove(task.id)}>
              {t("Remove")}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
