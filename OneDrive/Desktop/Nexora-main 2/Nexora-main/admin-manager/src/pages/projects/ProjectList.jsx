import React, { useState } from "react";
import { createProject } from "../../services/managerService";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import Surface from "../../components/ui/Surface";

const AddProject = () => {
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [tasks, setTasks] = useState([{ title: "", priority: "MEDIUM" }]);

  const handleAddTask = () => {
    setTasks((prev) => [...prev, { title: "", priority: "MEDIUM" }]);
  };

  const handleRemoveTask = (index) => {
    setTasks((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleTaskChange = (index, field, value) => {
    setTasks((prev) =>
      prev.map((task, i) =>
        i === index ? { ...task, [field]: value } : task
      )
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      name: projectName,
      description: projectDescription,
      tasks,
    };

    try {
      await createProject(payload);
      alert("Project created successfully");
      setProjectName("");
      setProjectDescription("");
      setTasks([{ title: "", priority: "MEDIUM" }]);
    } catch (err) {
      alert("Failed to create project");
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-6">Add New Project</h1>

      <Surface className="p-6 space-y-6">

        <Input
          placeholder="Project Name"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
        />

        <textarea
          placeholder="Project Description"
          value={projectDescription}
          onChange={(e) => setProjectDescription(e.target.value)}
          className="w-full p-3 rounded bg-slate-800 border border-slate-700"
        />

        <div>
          <h2 className="text-2xl font-semibold mb-4">Tasks</h2>

          {tasks.map((task, index) => (
            <div key={index} className="flex gap-3 mb-3">

              <Input
                placeholder={`Task ${index + 1} Title`}
                value={task.title}
                onChange={(e) =>
                  handleTaskChange(index, "title", e.target.value)
                }
              />

              <select
                value={task.priority}
                onChange={(e) =>
                  handleTaskChange(index, "priority", e.target.value)
                }
                className="bg-slate-800 border border-slate-700 rounded px-3"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>

              <Button
                variant="danger"
                onClick={() => handleRemoveTask(index)}
              >
                Delete
              </Button>

            </div>
          ))}

          <div className="flex gap-3 mt-4">
            <Button onClick={handleAddTask}>Add Task</Button>
            <Button variant="primary" onClick={handleSubmit}>
              Create Project
            </Button>
          </div>

        </div>

      </Surface>
    </div>
  );
};

export default AddProject;