import { useState } from 'react';

import WorkspaceDock from '../modules/dashboard/components/WorkspaceDock';
import Sidebar from '../modules/dashboard/components/Sidebar';
import TopBar from '../modules/dashboard/components/TopBar';
import { useChatStore } from '../modules/dashboard/store/useChatStore';
import { useTaskStore } from '../store/useTaskStore';
import { useEffect } from 'react';

export default function DashboardLayout({
  children,
  fullHeight = false,
}: {
  children: React.ReactNode;
  fullHeight?: boolean;
}) {
  const { initSocket, cleanupSocket, socketInitialized } = useChatStore();
  const { setupTaskSocketListeners } = useTaskStore();

  useEffect(() => {
    if (!socketInitialized) {
      initSocket();
    }
    setupTaskSocketListeners();
    return () => cleanupSocket();
  }, [initSocket, cleanupSocket, socketInitialized, setupTaskSocketListeners]);

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

  /* ---------------- SEARCH ---------------- */
  
  const [searchTerm, setSearchTerm] = useState('');

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
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
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