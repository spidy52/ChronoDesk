import {
  useState,
  useEffect,
} from 'react';

import WorkspaceDock from './components/WorkspaceDock';

import Sidebar from './components/Sidebar';

import TopBar from './components/TopBar';

import KanbanBoard from './components/KanbanBoard';

import { useWorkspaceStore } from '../../store/workspaceStore';

export default function DashboardPage() {
  const { fetchAllWorkspaces } = useWorkspaceStore();

  /* ================= INITIALIZE WORKSPACES ================= */

  useEffect(() => {
    fetchAllWorkspaces();
  }, [fetchAllWorkspaces]);

  /* ================= SIDEBAR ================= */

  const [sidebarOpen, setSidebarOpen] =
    useState(() => {
      const saved =
        localStorage.getItem(
          'sidebarOpen'
        );

      return saved !== null
        ? JSON.parse(saved)
        : true;
    });

  /* ================= PERSIST SIDEBAR ================= */

  useEffect(() => {
    localStorage.setItem(
      'sidebarOpen',
      JSON.stringify(
        sidebarOpen
      )
    );
  }, [sidebarOpen]);

  /* ================= BOARD VIEW ================= */

  const [boardView, setBoardView] =
    useState<
      'list' | 'grid' | 'kanban'
    >('kanban');

  /* ================= FILTER ================= */

  const [
    activeFilter,
    setActiveFilter,
  ] = useState<string | null>(
    null
  );

  /* ================= SEARCH ================= */

  const [
    searchTerm,
    setSearchTerm,
  ] = useState('');

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground relative">

      {/* ================= WORKSPACE DOCK ================= */}

      <WorkspaceDock />

      {/* ================= SIDEBAR ================= */}

      <Sidebar
        isOpen={sidebarOpen}
      />

      {/* ================= MAIN CONTENT ================= */}

      <div className="flex flex-col flex-1 overflow-hidden">

        {/* ================= TOPBAR ================= */}

        <TopBar
          boardView={boardView}
          setBoardView={
            setBoardView
          }
          activeFilter={
            activeFilter
          }
          setActiveFilter={
            setActiveFilter
          }
          searchTerm={
            searchTerm
          }
          setSearchTerm={
            setSearchTerm
          }
          onToggleSidebar={() =>
            setSidebarOpen(
              !sidebarOpen
            )
          }
        />

        {/* ================= BOARD ================= */}

        <div className="flex-1 overflow-hidden">

          <KanbanBoard
            boardView={boardView}
            activeFilter={
              activeFilter
            }
            searchTerm={
              searchTerm
            }
          />
        </div>
      </div>
    </div>
  );
}