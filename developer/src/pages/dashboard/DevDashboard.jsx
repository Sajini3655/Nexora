import React from "react";
import DevLayout from "../../components/layout/DevLayout";

const DevDashboard = () => {
  return (
    <DevLayout>
      <h2 className="text-2xl font-bold mb-6">Welcome, Developer!</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6 mb-6">
        <div className="bg-white shadow rounded p-4">
          <h3 className="text-gray-500 text-sm">Assigned Tasks</h3>
          <p className="text-xl font-bold">12</p>
        </div>
        <div className="bg-white shadow rounded p-4">
          <h3 className="text-gray-500 text-sm">Completed Tasks</h3>
          <p className="text-xl font-bold">8</p>
        </div>
        <div className="bg-white shadow rounded p-4">
          <h3 className="text-gray-500 text-sm">Pending Tasks</h3>
          <p className="text-xl font-bold">4</p>
        </div>
        <div className="bg-white shadow rounded p-4">
          <h3 className="text-gray-500 text-sm">Deadlines</h3>
          <p className="text-xl font-bold">3</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow rounded p-4">
        <h3 className="text-lg font-bold mb-2">Recent Activity</h3>
        <ul className="text-gray-600 list-disc list-inside">
          <li>Completed task: Fix login bug</li>
          <li>New task assigned: Design dashboard UI</li>
          <li>Commented on task: API integration</li>
        </ul>
      </div>
    </DevLayout>
  );
};

export default DevDashboard;
