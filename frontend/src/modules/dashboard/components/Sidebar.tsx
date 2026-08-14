import {
  LayoutList,
  CheckSquare,
  Calendar,
  Users,
  MessageSquare,
  LifeBuoy,
  Settings,
  LogOut,
  Trash2,
  Home,
  Plus,
} from 'lucide-react';

import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuthStore } from '../../auth/store';
import { useWorkspaceStore } from '../../../store/workspaceStore';
import DeleteWorkspaceModal from './modals/DeleteWorkspaceModal';
import CreateWorkspaceModal from './modals/CreateWorkspaceModal';
import { useChatStore } from '../store/useChatStore';
import { BACKEND_URL } from '@/config';

export default function Sidebar({
  isOpen,
}: {
  isOpen: boolean;
}) {
  const { user, logout } = useAuthStore();
  const { activeWorkspace, workspaces, setActiveWorkspace } = useWorkspaceStore();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const chats = useChatStore((state) => state.chats);
  const totalUnread = chats.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0);

  const navigate = useNavigate();
  const location = useLocation();

  const handleDeleteWorkspace = () => {
    if (!activeWorkspace) return;
    setIsDeleteModalOpen(true);
  };

  const navItems: { label: string; icon: React.ReactNode; path: string; badge?: string }[] = [
    {
      label: 'Tasks Board',
      icon: <LayoutList size={18} />,
      path: '/dashboard',
    },
    {
      label: 'My Task',
      icon: <CheckSquare size={18} />,
      path: '/my-tasks',
    },
    {
      label: 'Calendar',
      icon: <Calendar size={18} />,
      path: '/calendar',
    },
    {
      label: 'Members',
      icon: <Users size={18} />,
      path: '/members',
    },
    {
      label: 'Chats',
      icon: <MessageSquare size={18} />,
      path: '/chats',
      badge: totalUnread > 0 ? String(totalUnread) : undefined,
    },
  ];

  return (
    <div
      className={`
        transition-all duration-300 overflow-hidden
        fixed md:relative left-0 top-0 bottom-0
        ${
          isOpen
            ? 'w-72 opacity-100'
            : 'w-0 opacity-0'
        }
        h-full bg-card border-r border-border/50 flex flex-col shrink-0 z-40 md:z-20
      `}
    >

      {/* PROFILE */}
      <div className="px-6 pb-6 pt-20 md:pt-8 flex flex-col items-center border-b border-border/50">

        <div className="relative mb-5">

          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner overflow-hidden">
            {user?.avatar ? (
              <img
                src={user.avatar.startsWith('/uploads') ? `${BACKEND_URL}${user.avatar}` : user.avatar}
                alt={user?.name || 'Avatar'}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-3xl">
                {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </div>
            )}
          </div>

          {/* Online Dot */}
          <span className="absolute bottom-2 right-2 w-4 h-4 bg-green-500 rounded-full border-2 border-background"></span>
        </div>

        {/* User Info */}
        <h2 className="font-bold text-xl text-foreground">
          {user?.name }
        </h2>

        <p className="text-sm text-muted-foreground mt-1">
          {user?.email }
        </p>

        <span className="text-xs text-primary mt-3 bg-primary/10 px-3 py-1 rounded-full font-medium">
          @{user?.username }
        </span>
      </div>

      {/* NAVIGATION */}
      <div className="flex-1 py-6 px-4 overflow-y-auto">

        {/* WORKSPACES (DASHBOARDS) - MOBILE ONLY */}
        <div className="md:hidden mb-6">
          <div className="flex items-center justify-between px-2 mb-3">
            <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
              Dashboards & Workspaces
            </h3>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-1 text-xs text-primary font-bold hover:underline bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-lg cursor-pointer"
            >
              <Plus size={14} />
              <span>New</span>
            </button>
          </div>

          <div className="space-y-1">
            {/* Personal Home */}
            <button
              onClick={() => {
                setActiveWorkspace(null);
                navigate('/dashboard');
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeWorkspace === null
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-muted-foreground hover:bg-secondary'
              }`}
            >
              <Home size={16} />
              <span>Personal Home</span>
            </button>
            
            {/* Workspaces list */}
            {workspaces.map((workspace) => (
              <button
                key={workspace._id}
                onClick={() => {
                  setActiveWorkspace(workspace);
                  navigate('/dashboard');
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeWorkspace?._id === workspace._id
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:bg-secondary'
                }`}
              >
                <div className="w-5 h-5 rounded-md bg-primary/20 flex items-center justify-center text-[10px] font-bold">
                  {workspace.name.substring(0, 2).toUpperCase()}
                </div>
                <span>{workspace.name}</span>
              </button>
            ))}

            {/* Add New Workspace Button for Mobile */}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium border border-dashed border-primary/40 text-primary hover:bg-primary/10 transition-all mt-2 cursor-pointer"
            >
              <div className="w-5 h-5 rounded-md bg-primary/20 flex items-center justify-center">
                <Plus size={14} />
              </div>
              <span>Add New Workspace</span>
            </button>
          </div>
          <div className="h-px bg-border/50 my-4"></div>
        </div>

        <div className="space-y-2">

          {navItems.map((item) => (
            <NavItem
              key={item.label}
              icon={item.icon}
              label={item.label}
              active={location.pathname === item.path}
              badge={item.badge}
              onClick={() => navigate(item.path)}
            />
          ))}
        </div>

        {/* WORKSPACE */}
        <div className="mt-10">

          <h3 className="text-xs uppercase tracking-widest text-muted-foreground px-4 mb-4">
            Workspace
          </h3>

          <div className="space-y-2">

            <NavItem
              icon={<Settings size={18} />}
              label="Settings"
              onClick={() => navigate('/settings')}
            />

            {activeWorkspace && (
              <NavItem
                icon={<Trash2 size={18} />}
                label="Delete Workspace"
                danger
                onClick={handleDeleteWorkspace}
              />
            )}

            <NavItem
              icon={<LogOut size={18} />}
              label="Logout"
              danger
              onClick={() => {
                useChatStore.getState().reset();
                logout();
                navigate('/login');
              }}
            />
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="p-4 border-t border-border/50">

        <NavItem
          icon={<LifeBuoy size={18} />}
          label="Help Center"
          onClick={() => alert('Open help center')}
        />
      </div>

      {isDeleteModalOpen && (
        <DeleteWorkspaceModal onClose={() => setIsDeleteModalOpen(false)} />
      )}

      {isCreateModalOpen && (
        <CreateWorkspaceModal onClose={() => setIsCreateModalOpen(false)} />
      )}
    </div>
  );
}

function NavItem({
  icon,
  label,
  active = false,
  badge,
  onClick,
  danger = false,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  badge?: string;
  onClick?: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-200
        ${
          active
            ? 'bg-primary text-primary-foreground shadow-lg'
            : danger
            ? 'text-red-500 hover:bg-red-500/10'
            : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
        }
      `}
    >

      <div className="flex items-center gap-3">

        <div className="opacity-90">
          {icon}
        </div>

        <span className="font-medium text-sm">
          {label}
        </span>
      </div>

      {badge && (
        <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </button>
  );
}