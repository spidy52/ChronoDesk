import {
  Leaf,
  LayoutDashboard,
  Box,
  Hexagon,
  CircleDot,
  Plus,
} from 'lucide-react';

import { useState } from 'react';

export default function WorkspaceDock() {
  const [activeWorkspace, setActiveWorkspace] =
    useState('dashboard');

  const workspaces = [
    {
      id: 'nature',
      icon: <Leaf size={20} />,
      color: 'bg-green-500',
      label: 'Nature Workspace',
    },
    {
      id: 'dashboard',
      icon: <LayoutDashboard size={20} />,
      color: 'bg-blue-500',
      label: 'Main Dashboard',
    },
    {
      id: 'box',
      icon: <Box size={20} />,
      color: 'bg-red-500',
      label: 'Storage Workspace',
    },
    {
      id: 'hex',
      icon: <Hexagon size={20} />,
      color: 'bg-pink-500',
      label: 'Creative Workspace',
    },
    {
      id: 'circle',
      icon: <CircleDot size={20} />,
      color: 'bg-purple-500',
      label: 'AI Workspace',
    },
  ];

  const handleWorkspaceSwitch = (id: string) => {
    setActiveWorkspace(id);

    console.log('Switch workspace:', id);

    // TODO:
    // Load workspace data
    // Fetch tasks
    // Fetch members
    // Fetch chats
  };

  return (
    <div className="w-20 h-full bg-zinc-950 border-r border-zinc-900 flex flex-col items-center py-6 shrink-0 z-30">

      {/* Mac Controls */}
      <div className="flex gap-2 mb-10">
        <div className="w-3 h-3 rounded-full bg-red-500"></div>
        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
        <div className="w-3 h-3 rounded-full bg-green-500"></div>
      </div>

      {/* Workspace Icons */}
      <div className="flex flex-col items-center gap-4 flex-1 w-full">

        {workspaces.map((workspace) => (
          <WorkspaceIcon
            key={workspace.id}
            icon={workspace.icon}
            color={workspace.color}
            label={workspace.label}
            active={activeWorkspace === workspace.id}
            onClick={() =>
              handleWorkspaceSwitch(workspace.id)
            }
          />
        ))}

        {/* Add Workspace */}
        <button
          onClick={() =>
            alert('Open create workspace modal')
          }
          className="w-11 h-11 mt-6 rounded-2xl border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-700 hover:bg-zinc-900 transition-all"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Bottom Indicator */}
      <div className="text-[10px] text-zinc-600 mt-6">
        ChronoDesk
      </div>
    </div>
  );
}

/* ---------------- ICON ---------------- */

function WorkspaceIcon({
  icon,
  color,
  active = false,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  color: string;
  active?: boolean;
  label: string;
  onClick?: () => void;
}) {
  return (
    <div className="relative group">

      {/* Active Indicator */}
      {active && (
        <div className="absolute -left-[8px] top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full"></div>
      )}

      <button
        onClick={onClick}
        className={`
          relative w-11 h-11 rounded-2xl flex items-center justify-center text-white transition-all duration-300
          ${
            active
              ? `${color} scale-105 shadow-lg`
              : 'bg-zinc-900 hover:bg-zinc-800 hover:scale-105'
          }
        `}
      >
        {icon}
      </button>

      {/* Tooltip */}
      <div className="absolute left-16 top-1/2 -translate-y-1/2 whitespace-nowrap bg-zinc-900 text-white text-xs px-3 py-2 rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-2xl border border-zinc-800">
        {label}
      </div>
    </div>
  );
}