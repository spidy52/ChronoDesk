import {
  LayoutList,
  CheckSquare,
  Clock,
  Calendar,
  Users,
  MessageSquare,
  LifeBuoy,
  Settings,
  LogOut,
} from 'lucide-react';

import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../auth/store';

export default function Sidebar({
  isOpen,
}: {
  isOpen: boolean;
}) {
  const { user, logout } = useAuthStore();

  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    {
      label: 'Tasks Board',
      icon: <LayoutList size={18} />,
      path: '/dashboard',
    },
    {
      label: 'My Task',
      icon: <CheckSquare size={18} />,
      path: '/my-tasks',
      badge: '2',
    },
    {
      label: 'Timesheet',
      icon: <Clock size={18} />,
      path: '/timesheet',
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
    },
  ];

  return (
    <div
      className={`
        transition-all duration-300 overflow-hidden
        ${
          isOpen
            ? 'w-72 opacity-100'
            : 'w-0 opacity-0'
        }
        h-full bg-card border-r border-border/50 flex flex-col shrink-0 z-20
      `}
    >

      {/* PROFILE */}
      <div className="p-8 flex flex-col items-center border-b border-border/50">

        <div className="relative mb-5">

          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">

            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-3xl">
              {user?.name?.charAt(0) ||
                user?.email?.charAt(0) ||
                'C'}
            </div>
          </div>

          {/* Online Dot */}
          <span className="absolute bottom-2 right-2 w-4 h-4 bg-green-500 rounded-full border-2 border-background"></span>
        </div>

        {/* User Info */}
        <h2 className="font-bold text-xl text-foreground">
          {user?.name || 'Workspace User'}
        </h2>

        <p className="text-sm text-muted-foreground mt-1">
          {user?.email || 'user@chronodesk.ai'}
        </p>

        <span className="text-xs text-primary mt-3 bg-primary/10 px-3 py-1 rounded-full font-medium">
          @chronodesk_admin
        </span>
      </div>

      {/* NAVIGATION */}
      <div className="flex-1 py-6 px-4 overflow-y-auto">

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
              onClick={() => alert('Open settings')}
            />

            <NavItem
              icon={<LogOut size={18} />}
              label="Logout"
              danger
              onClick={() => {
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