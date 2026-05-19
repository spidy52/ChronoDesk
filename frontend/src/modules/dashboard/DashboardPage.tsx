import { useState } from 'react';

import WorkspaceDock from './components/WorkspaceDock';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import KanbanBoard from './components/KanbanBoard';

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] =
    useState(true);

  const [boardView, setBoardView] = useState<
    'list' | 'grid' | 'kanban'
  >('kanban');

  const [activeFilter, setActiveFilter] =
    useState<string | null>(null);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">

      {/* Workspace Dock */}
      <WorkspaceDock />

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} />

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">

        {/* Top Bar */}
        <TopBar
          boardView={boardView}
          setBoardView={setBoardView}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          onToggleSidebar={() =>
            setSidebarOpen(!sidebarOpen)
          }
        />

        {/* Board */}
        <div className="flex-1 overflow-hidden">
          <KanbanBoard
            boardView={boardView}
            activeFilter={activeFilter}
          />
        </div>
      </div>
    </div>
  );
}