import { useState } from 'react';

import WorkspaceDock from '../modules/dashboard/components/WorkspaceDock';
import Sidebar from '../modules/dashboard/components/Sidebar';
import TopBar from '../modules/dashboard/components/TopBar';

export default function DashboardLayout({
  children,
  fullHeight = false,
}: {
  children: React.ReactNode;
  fullHeight?: boolean;
}) {
  /* ---------------- SIDEBAR ---------------- */

  const [sidebarOpen, setSidebarOpen] =
    useState(true);

  /* ---------------- BOARD VIEW ---------------- */

  const [boardView, setBoardView] = useState<
    'list' | 'grid' | 'kanban'
  >('kanban');

  /* ---------------- FILTER ---------------- */

  const [activeFilter, setActiveFilter] =
    useState<string | null>(null);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">

      {/* ================= WORKSPACE DOCK ================= */}

      <WorkspaceDock />

      {/* ================= SIDEBAR ================= */}

      <Sidebar isOpen={sidebarOpen} />

      {/* ================= MAIN CONTENT ================= */}

      <div className="flex flex-col flex-1 overflow-hidden">

        {/* ================= TOPBAR ================= */}

        <TopBar
          boardView={boardView}
          setBoardView={setBoardView}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          onToggleSidebar={() =>
            setSidebarOpen(!sidebarOpen)
          }
        />

        {/* ================= PAGE CONTENT ================= */}

        <div className={`flex-1 ${fullHeight ? 'overflow-hidden' : 'overflow-auto bg-[#f8f9fc] dark:bg-background'}`}>

          {children}
        </div>
      </div>
    </div>
  );
}