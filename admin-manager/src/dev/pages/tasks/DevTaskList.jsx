// ...existing code...
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import DevLayout from "../../components/layout/DevLayout";

const mockTasks = [
  { id: 1, title: "Fix login bug", status: "Pending", priority: "High", deadline: "2025-12-15" },
  { id: 2, title: "Design dashboard UI", status: "In Progress", priority: "Medium", deadline: "2025-12-18" },
  { id: 3, title: "API integration", status: "Completed", priority: "High", deadline: "2025-12-10" },
];

const DevTaskList = () => {
  const [tasks] = useState(mockTasks);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DevLayout>
      <div>
        <h2 className="text-2xl font-bold mb-4">Tasks</h2>
        <input
          className="mb-4 p-2 border rounded w-full"
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <ul className="space-y-2">
          {filteredTasks.map(task => (
            <li key={task.id} className="p-3 bg-white rounded shadow flex justify-between items-center">
              <div>
                <div className="font-medium">{task.title}</div>
                <div className="text-sm text-gray-500">{task.status} • {task.priority}</div>
              </div>
              <button onClick={() => navigate(`/dev/tasks/${task.id}`)} className="text-blue-600">View</button>
            </li>
          ))}
        </ul>
      </div>
    </DevLayout>
  );
};

export default DevTaskList;
// ...existing code...
