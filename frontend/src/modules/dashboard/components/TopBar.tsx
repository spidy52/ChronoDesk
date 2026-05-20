import {
  Bell,
  Mail,
  Search,
  Filter,
  LayoutGrid,
  List,
  Columns,
  ChevronDown,
  PanelLeftClose,
  Settings,
  LogOut,
  User,
  X,
} from 'lucide-react';

import { useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { useAuthStore } from '../../auth/store';

export default function TopBar({
  onToggleSidebar,
  boardView,
  setBoardView,
  activeFilter,
  setActiveFilter,
  searchTerm,
  setSearchTerm,
}: {
  onToggleSidebar: () => void;

  boardView: 'list' | 'grid' | 'kanban';

  setBoardView: React.Dispatch<
    React.SetStateAction<
      'list' | 'grid' | 'kanban'
    >
  >;

  activeFilter: string | null;

  setActiveFilter: React.Dispatch<
    React.SetStateAction<string | null>
  >;

  searchTerm: string;

  setSearchTerm: React.Dispatch<
    React.SetStateAction<string>
  >;
}) {
  const { user, logout } =
    useAuthStore();

  const navigate = useNavigate();

  /* ================= DROPDOWN CONTROL ================= */

  const [activeDropdown, setActiveDropdown] =
    useState<
      | 'notifications'
      | 'profile'
      | 'filters'
      | null
    >(null);

  return (
    <div className="relative flex items-center justify-between px-8 py-6 border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-40">

      {/* ================= LEFT ================= */}

      <div className="flex items-center gap-5">

        {/* SIDEBAR TOGGLE */}

        <button
          onClick={onToggleSidebar}
          className="w-11 h-11 rounded-2xl border bg-card flex items-center justify-center hover:bg-secondary transition-all"
        >
          <PanelLeftClose size={18} />
        </button>

        {/* TITLE */}

        <h1 className="text-3xl font-bold tracking-tight">

          Tasks Board
        </h1>

        {/* SEARCH */}

        <div className="hidden md:flex items-center bg-card border rounded-2xl px-4 py-3 w-[260px] lg:w-[320px]">
          <Search
            size={18}
            className="text-muted-foreground mr-3"
          />

          <input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) =>
              setSearchTerm(
                e.target.value
              )
            }
            className="bg-transparent outline-none text-sm flex-1"
          />
        </div>
      </div>

      {/* ================= RIGHT ================= */}

      <div className="flex items-center gap-4">

        {/* ================= CHAT PAGE ================= */}

        <button
          onClick={() =>
            navigate(
              '/dashboard/chats'
            )
          }
          className="w-11 h-11 rounded-full border bg-card flex items-center justify-center hover:bg-secondary transition-all"
        >
          <Mail size={18} />
        </button>

        {/* ================= NOTIFICATIONS ================= */}

        <div className="relative">

          <button
            onClick={() =>
              setActiveDropdown(
                activeDropdown ===
                  'notifications'
                  ? null
                  : 'notifications'
              )
            }
            className="w-11 h-11 rounded-full border bg-card flex items-center justify-center hover:bg-secondary transition-all relative"
          >

            <Bell size={18} />

            <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-background"></span>
          </button>

          {activeDropdown ===
            'notifications' && (
            <div className="absolute right-0 top-14 w-80 bg-card border rounded-3xl shadow-2xl p-4 z-50">

              <div className="flex items-center justify-between mb-4">

                <h3 className="font-bold text-lg">

                  Notifications
                </h3>

                <button
                  onClick={() =>
                    setActiveDropdown(
                      null
                    )
                  }
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3">

                <NotificationItem
                  title="Task moved"
                  description="Task moved to completed"
                />

                <NotificationItem
                  title="Deadline"
                  description="Project deadline tomorrow"
                />

                <NotificationItem
                  title="Comment"
                  description="New comment added"
                />
              </div>
            </div>
          )}
        </div>

        {/* ================= PROFILE ================= */}

        <div className="relative">

          <button
            onClick={() =>
              setActiveDropdown(
                activeDropdown ===
                  'profile'
                  ? null
                  : 'profile'
              )
            }
            className="flex items-center gap-3 bg-card border rounded-full pl-2 pr-4 py-2 hover:bg-secondary transition-all"
          >

            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">

              {user?.name?.charAt(
                0
              ) ||
                user?.email?.charAt(
                  0
                ) ||
                'U'}
            </div>

            <span className="font-medium text-sm">

              {user?.name ||
                'User'}
            </span>

            <ChevronDown
              size={16}
            />
          </button>

          {activeDropdown ===
            'profile' && (
            <div className="absolute right-0 top-14 w-60 bg-card border rounded-3xl shadow-2xl p-2 z-50">

              <ProfileButton
                icon={
                  <User
                    size={18}
                  />
                }
                label="Profile"
              />

              <ProfileButton
                icon={
                  <Settings
                    size={18}
                  />
                }
                label="Settings"
                onClick={() =>
                  navigate(
                    '/dashboard/settings'
                  )
                }
              />

              <ProfileButton
                icon={
                  <LogOut
                    size={18}
                  />
                }
                label="Logout"
                danger
                onClick={() => {
                  logout();

                  navigate(
                    '/login'
                  );
                }}
              />
            </div>
          )}
        </div>

        {/* ================= FILTERS ================= */}

        <div className="relative">

          <button
            onClick={() =>
              setActiveDropdown(
                activeDropdown ===
                  'filters'
                  ? null
                  : 'filters'
              )
            }
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground px-3 py-2 rounded-xl hover:bg-secondary transition-all"
          >

            Filter

            <Filter size={16} />
          </button>

          {activeDropdown ===
            'filters' && (
            <div className="absolute top-14 right-0 bg-card border rounded-2xl shadow-2xl p-3 w-52 z-50">

              {[
                'low',
                'medium',
                'high',
              ].map((priority) => (
                <button
                  key={priority}
                  onClick={() => {
                    setActiveFilter(
                      activeFilter ===
                        priority
                        ? null
                        : priority
                    );

                    setActiveDropdown(
                      null
                    );
                  }}
                  className={`
                    w-full text-left px-4 py-3 rounded-xl text-sm transition-all
                    ${
                      activeFilter ===
                      priority
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-secondary'
                    }
                  `}
                >
                  {priority}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ================= VIEW SWITCHER ================= */}

        <div className="flex items-center bg-secondary p-1 rounded-2xl">

          <ViewButton
            active={
              boardView ===
              'list'
            }
            onClick={() =>
              setBoardView(
                'list'
              )
            }
            icon={
              <List
                size={18}
              />
            }
          />

          <ViewButton
            active={
              boardView ===
              'grid'
            }
            onClick={() =>
              setBoardView(
                'grid'
              )
            }
            icon={
              <LayoutGrid
                size={18}
              />
            }
          />

          <ViewButton
            active={
              boardView ===
              'kanban'
            }
            onClick={() =>
              setBoardView(
                'kanban'
              )
            }
            icon={
              <Columns
                size={18}
              />
            }
          />
        </div>
      </div>
    </div>
  );
}

/* ================= VIEW BUTTON ================= */

function ViewButton({
  active,
  onClick,
  icon,
}: {
  active: boolean;

  onClick: () => void;

  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`p-2 rounded-xl transition-all ${
        active
          ? 'bg-background shadow-sm text-foreground'
          : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {icon}
    </button>
  );
}

/* ================= NOTIFICATION ITEM ================= */

function NotificationItem({
  title,
  description,
}: {
  title: string;

  description: string;
}) {
  return (
    <div className="p-4 rounded-2xl bg-secondary hover:bg-secondary/70 transition-all cursor-pointer">

      <h4 className="font-semibold text-sm mb-1">

        {title}
      </h4>

      <p className="text-xs text-muted-foreground">

        {description}
      </p>
    </div>
  );
}

/* ================= PROFILE BUTTON ================= */

function ProfileButton({
  icon,
  label,
  danger = false,
  onClick,
}: {
  icon: React.ReactNode;

  label: string;

  danger?: boolean;

  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all
        ${
          danger
            ? 'text-red-500 hover:bg-red-500/10'
            : 'hover:bg-secondary'
        }
      `}
    >
      {icon}

      <span className="text-sm font-medium">

        {label}
      </span>
    </button>
  );
}