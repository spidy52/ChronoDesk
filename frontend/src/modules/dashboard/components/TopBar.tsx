import {
  Search,
  LayoutGrid,
  List,
  LogOut,
  Mail,
  Check,
  X,
  Settings,
  Filter,
  Columns,
  ChevronDown,
  PanelLeftClose,
  User,
} from 'lucide-react';
import { socket } from '../../../services/socket';

import {
  useEffect,
  useState,
} from 'react';

import { useNavigate, useLocation } from 'react-router-dom';

import { useAuthStore } from '../../auth/store';
import { api } from '../../../lib/axios';

interface Invitation {
  _id: string;
  fromUser: {
    name: string;
    email: string;
  };
  status: string;

  createdAt: string;
}

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

  boardView:
    | 'list'
    | 'grid'
    | 'kanban';

  setBoardView: React.Dispatch<
    React.SetStateAction<
      | 'list'
      | 'grid'
      | 'kanban'
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
  const location = useLocation();

  const isTasksRoute = location.pathname === '/dashboard' || location.pathname === '/my-tasks';

  const getTitle = () => {
    switch (location.pathname) {
      case '/dashboard': return 'Tasks Board';
      case '/my-tasks': return 'My Tasks';
      case '/timesheet': return 'Timesheet';
      case '/calendar': return 'Calendar';
      case '/members': return 'Members';
      case '/chats': return 'Chats';
      default: return 'Tasks Board';
    }
  };

  const [
    activeDropdown,
    setActiveDropdown,
  ] = useState<
    | 'mail'
    | 'profile'
    | 'filters'
    | null
  >(null);

  const [
    invitations,
    setInvitations,
  ] = useState<Invitation[]>([]);

  const [
    loadingInvites,
    setLoadingInvites,
  ] = useState(false);

  /* FETCH REAL INVITATIONS */

  useEffect(() => {

    fetchInvitations();

    const handleNewInvitation = () => {
      fetchInvitations();
    };

    socket.on('invitation:sent', handleNewInvitation);

    return () => {
      socket.off('invitation:sent', handleNewInvitation);
    };

  }, []);

  const fetchInvitations =
    async () => {

      try {

        setLoadingInvites(
          true
        );

        const response =
          await api.get(
            '/members/invitations'
          );

        setInvitations(
          response.data
        );

      } catch (error) {

        console.error(error);

      } finally {

        setLoadingInvites(
          false
        );
      }
    };

  /* ACCEPT INVITATION */

  const acceptInvitation =
    async (id: string) => {

      try {

        await api.patch(
          `/members/accept/${id}`
        );

        setInvitations(
          (prev) =>
            prev.filter(
              (invite) =>
                invite._id !== id
            )
        );

      } catch (error) {

        console.error(error);

        alert(
          'Failed to accept invitation'
        );
      }
    };

  /* REJECT INVITATION */

  const rejectInvitation =
    async (id: string) => {

      try {

        await api.patch(
          `/members/reject/${id}`
        );

        setInvitations(
          (prev) =>
            prev.filter(
              (invite) =>
                invite._id !== id
            )
        );

      } catch (error) {

        console.error(error);

        alert(
          'Failed to reject invitation'
        );
      }
    };

  return (

    <div className="relative flex items-center justify-between px-8 py-6 border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-40">

      {/* LEFT */}

      <div className="flex items-center gap-5">

        <button
          onClick={
            onToggleSidebar
          }
          className="w-11 h-11 rounded-2xl border bg-card flex items-center justify-center hover:bg-secondary transition-all"
        >

          <PanelLeftClose
            size={18}
          />
        </button>

        <h1 className="text-3xl font-bold tracking-tight">
          {getTitle()}
        </h1>

        {/* SEARCH */}
        
        {isTasksRoute && (
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
        )}
      </div>

      {/* RIGHT */}

      <div className="flex items-center gap-4">

        {/* INVITATIONS */}

        <div className="relative">

          <button
            onClick={() =>
              setActiveDropdown(
                activeDropdown ===
                  'mail'
                  ? null
                  : 'mail'
              )
            }
            className="w-11 h-11 rounded-full border bg-card flex items-center justify-center hover:bg-secondary transition-all relative"
          >

            <Mail size={18} />

            {invitations.length >
              0 && (

              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-semibold">

                {
                  invitations.length
                }
              </span>
            )}
          </button>

          {/* DROPDOWN */}

          {activeDropdown ===
            'mail' && (

            <div className="absolute right-0 top-14 w-[380px] bg-card border rounded-3xl shadow-2xl p-4 z-50">

              {/* HEADER */}

              <div className="flex items-center justify-between mb-5">

                <div>

                  <h3 className="font-bold text-lg">

                    Invitations
                  </h3>

                  <p className="text-xs text-muted-foreground mt-1">

                    Real workspace invitations
                  </p>
                </div>

                <button
                  onClick={() =>
                    setActiveDropdown(
                      null
                    )
                  }
                  className="w-8 h-8 rounded-xl hover:bg-secondary flex items-center justify-center"
                >

                  <X size={16} />
                </button>
              </div>

              {/* LIST */}

              <div className="space-y-4 max-h-[450px] overflow-y-auto">

                {loadingInvites ? (

                  <div className="py-10 text-center text-muted-foreground text-sm">

                    Loading invitations...
                  </div>

                ) : invitations.length ===
                  0 ? (

                  <div className="py-10 text-center">

                    <div className="w-14 h-14 rounded-2xl bg-secondary mx-auto flex items-center justify-center mb-4">

                      <Check
                        size={22}
                      />
                    </div>

                    <h4 className="font-semibold">

                      No Invitations
                    </h4>

                    <p className="text-sm text-muted-foreground mt-1">

                      You have no pending invitations
                    </p>
                  </div>

                ) : (

                  invitations.map(
                    (
                      invitation
                    ) => (

                      <InvitationCard
                        key={
                          invitation._id
                        }
                        invitation={
                          invitation
                        }
                        onAccept={
                          acceptInvitation
                        }
                        onReject={
                          rejectInvitation
                        }
                      />
                    )
                  )
                )}
              </div>
            </div>
          )}
        </div>

        {/* PROFILE */}

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
                    '/settings'
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

        {/* FILTER */}

        {isTasksRoute && (
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
        )}

        {/* VIEW */}

        {isTasksRoute && (
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
        )}
      </div>
    </div>
  );
}

/* VIEW BUTTON */

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

/* INVITATION CARD */

function InvitationCard({
  invitation,
  onAccept,
  onReject,
}: {
  invitation: Invitation;

  onAccept: (
    id: string
  ) => void;

  onReject: (
    id: string
  ) => void;
}) {

  return (

    <div className="border rounded-2xl p-4 bg-secondary/40">

      {/* TOP */}

      <div className="flex items-center gap-3 mb-4">

        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">

          {invitation.fromUser?.name?.charAt(
            0
          )?.toUpperCase() || 'U'}
        </div>

        <div className="flex-1">

          <h4 className="font-semibold text-sm">

            {
              invitation
                .fromUser?.name || 'Unknown User'
            }
          </h4>

          <p className="text-xs text-muted-foreground">

            {
              invitation
                .fromUser?.email || ''
            }
          </p>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
        invited you to connect as a friend.
      </p>

      {/* ACTIONS */}

      <div className="flex items-center gap-3">

        <button
          onClick={() =>
            onAccept(
              invitation._id
            )
          }
          className="flex-1 bg-primary text-primary-foreground py-2 rounded-xl text-sm font-medium hover:opacity-90 transition-all"
        >

          Accept
        </button>

        <button
          onClick={() =>
            onReject(
              invitation._id
            )
          }
          className="flex-1 border border-border py-2 rounded-xl text-sm font-medium hover:bg-secondary transition-all"
        >

          Reject
        </button>
      </div>
    </div>
  );
}

/* PROFILE BUTTON */

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