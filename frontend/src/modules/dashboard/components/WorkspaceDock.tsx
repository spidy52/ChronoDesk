import {
  Plus,
  Home,
} from 'lucide-react';

import { useEffect, useState } from 'react';
import { useWorkspaceStore } from '../../../store/workspaceStore';
import CreateWorkspaceModal from './modals/CreateWorkspaceModal';

export default function WorkspaceDock() {
  const { workspaces, activeWorkspace, setActiveWorkspace, fetchAllWorkspaces } = useWorkspaceStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchAllWorkspaces();
  }, []);

  const handleWorkspaceSwitch = (workspace: any) => {
    setActiveWorkspace(workspace);
    console.log('Switch workspace:', workspace ? workspace._id : 'all');
  };

  // Generate color based on string length and char codes
  const getColor = (name: string) => {
    const colors = [
      'bg-green-500',
      'bg-blue-500',
      'bg-red-500',
      'bg-pink-500',
      'bg-purple-500',
      'bg-orange-500',
      'bg-teal-500',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="w-20 h-full bg-zinc-950 border-r border-zinc-900 flex flex-col items-center py-6 shrink-0 z-30">

      {/* Workspace Icons */}
      <div className="flex flex-col items-center gap-4 flex-1 w-full">
        
        {/* Home Workspace (Default) */}
        <WorkspaceIcon
          icon={<Home size={20} />}
          color="bg-zinc-100 text-zinc-900"
          label="Personal Home"
          active={activeWorkspace === null}
          onClick={() => handleWorkspaceSwitch(null)}
        />
        
        <div className="w-10 h-px bg-zinc-800 my-1"></div>

        {workspaces.map((workspace) => (
          <WorkspaceIcon
            key={workspace._id}
            icon={<span className="text-sm font-bold">{workspace.name.substring(0, 2).toUpperCase()}</span>}
            color={getColor(workspace.name)}
            label={workspace.name}
            active={activeWorkspace?._id === workspace._id}
            onClick={() =>
              handleWorkspaceSwitch(workspace)
            }
          />
        ))}

        {/* Add Workspace */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-11 h-11 mt-6 rounded-2xl border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-700 hover:bg-zinc-900 transition-all"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Bottom Indicator */}
      <div className="text-[10px] text-zinc-600 mt-6 font-semibold tracking-wider">
        CD
      </div>

      {isModalOpen && (
        <CreateWorkspaceModal onClose={() => setIsModalOpen(false)} />
      )}
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