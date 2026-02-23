import React, { useState } from "react";
import DevSidebar from "./DevSidebar";
import DevTopbar from "./DevTopbar";

const DevLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen">
      <div className="flex min-h-screen">
        <DevSidebar collapsed={collapsed} />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <div className="p-4 pb-0">
            <div className="glass-panel rounded-3xl px-4 py-3">
              <DevTopbar
                collapsed={collapsed}
                onToggleSidebar={() => setCollapsed((v) => !v)}
              />
            </div>
          </div>

          {/* Main content */}
          <main className="p-4 flex-1 min-h-0">
            <div className="glass-panel rounded-3xl p-5 md:p-6 h-full overflow-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default DevLayout;
