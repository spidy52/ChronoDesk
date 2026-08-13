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
import toast from 'react-hot-toast';

import {
  useEffect,
  useState,
} from 'react';

import { useNavigate, useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';

import { useAuthStore } from '../../auth/store';
import { api } from '../../../lib/axios';
import { useWorkspaceStore } from '../../../store/workspaceStore';
import { useChatStore } from '../store/useChatStore';
import { useTaskStore } from '../../../store/useTaskStore';

interface Invitation {
  _id: string;
  type?: 'member' | 'task';
  taskTitle?: string;

  fromUser?: {
    _id: string;
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

  const { user, logout, updateUser } =
    useAuthStore();
  const workspaces = useWorkspaceStore((state: any) => state.workspaces);
  const chats = useChatStore((state: any) => state.chats);
  const tasks = useTaskStore((state: any) => state.tasks);

  const myTasks = tasks.filter((t: any) => {
    const assigneeId = t.assignee?._id || t.assignee;
    const currentUserId = user?.id || user?._id;
    return assigneeId && currentUserId && assigneeId.toString() === currentUserId.toString();
  });
  const completedTasksCount = myTasks.filter((t: any) => t.status?.toLowerCase() === 'completed').length;

  const navigate = useNavigate();
  const location = useLocation();

  const isTasksRoute = location.pathname === '/dashboard' || location.pathname === '/my-tasks';

  const getTitle = () => {
    switch (location.pathname) {
      case '/dashboard': return 'Tasks Board';
      case '/my-tasks': return 'My Tasks';
      case '/calendar': return 'Calendar';
      case '/members': return 'Members';
      case '/chats': return 'Chats';
      case '/whiteboard': return 'Whiteboard';
      case '/settings': return 'Settings';
      default: return 'ChronoDesk';
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

  const [myProfileOpen, setMyProfileOpen] = useState(false);

  // Sync profile details and store counts in real-time when the modal opens
  useEffect(() => {
    if (myProfileOpen) {
      // Sync profile fields from backend (avatar, bio, createdAt)
      api.get('/auth/profile')
        .then((res) => {
          if (res.data?.user) {
            updateUser(res.data.user);
          }
        })
        .catch((err) => console.error('Failed to sync profile:', err));

      // Refresh chats count
      const chatStore = useChatStore.getState();
      if (chatStore.fetchChats) {
        chatStore.fetchChats();
      }

      // Refresh tasks count
      const taskStore = useTaskStore.getState();
      if (taskStore.fetchAllTasks) {
        taskStore.fetchAllTasks();
      }
    }
  }, [myProfileOpen, updateUser]);

  const [
    invitations,
    setInvitations,
  ] = useState<Invitation[]>([]);

  const [
    loadingInvites,
    setLoadingInvites,
  ] = useState(false);

  /* FETCH REAL INVITATIONS */

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

  useEffect(() => {
    // Fetch invitations on next tick to avoid synchronous setState warnings
    const timer = setTimeout(() => {
      fetchInvitations();
    }, 0);

    const handleNewInvitation = () => {
      fetchInvitations();
    };

    socket.on('invitation:sent', handleNewInvitation);

    return () => {
      clearTimeout(timer);
      socket.off('invitation:sent', handleNewInvitation);
    };

  }, []);

  /* ACCEPT INVITATION */

  const acceptInvitation =
    async (id: string) => {
      const invite = invitations.find((i) => i._id === id);
      if (!invite) return;

      try {
        if (invite.type === 'task') {
          await api.post(`/tasks/invitations/${id}/accept`);
          const fetchAllTasks = useTaskStore.getState().fetchAllTasks;
          if (fetchAllTasks) {
            fetchAllTasks();
          }
        } else {
          await api.patch(
            `/members/accept/${id}`
          );
        }

        setInvitations(
          (prev) =>
            prev.filter(
              (i) =>
                i._id !== id
            )
        );

        toast.success('Invitation accepted successfully');
      } catch (error) {

        console.error(error);

        toast.error(
          'Failed to accept invitation'
        );
      }
    };

  /* REJECT INVITATION */

  const rejectInvitation =
    async (id: string) => {
      const invite = invitations.find((i) => i._id === id);
      if (!invite) return;

      try {
        if (invite.type === 'task') {
          await api.post(`/tasks/invitations/${id}/reject`);
        } else {
          await api.patch(
            `/members/reject/${id}`
          );
        }

        setInvitations(
          (prev) =>
            prev.filter(
              (i) =>
                i._id !== id
            )
        );

        toast.success('Invitation rejected successfully');
      } catch (error) {

        console.error(error);

        toast.error(
          'Failed to reject invitation'
        );
      }
    };

  return (

    <div className="relative flex items-center justify-between px-4 py-3 md:px-8 md:py-6 border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-40">

      {/* LEFT */}

      <div className="flex items-center gap-2 md:gap-5">

        <button
          onClick={
            onToggleSidebar
          }
          className="w-9 h-9 md:w-11 md:h-11 rounded-xl md:rounded-2xl border bg-card flex items-center justify-center hover:bg-secondary transition-all"
        >

          <PanelLeftClose
            size={16}
            className="md:w-[18px] md:h-[18px]"
          />
        </button>

        <h1 className="text-lg md:text-3xl font-bold tracking-tight">
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
            className="w-9 h-9 md:w-11 md:h-11 rounded-full border bg-card flex items-center justify-center hover:bg-secondary transition-all relative"
          >

            <Mail size={16} className="md:w-[18px] md:h-[18px]" />

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
            className="flex items-center gap-1 bg-card border rounded-full p-1.5 md:pl-2 md:pr-4 md:py-2 hover:bg-secondary transition-all"
          >

            <div className="w-6 h-6 md:w-9 md:h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-[10px] md:text-sm">

              {user?.name?.charAt(
                0
              ) ||
                user?.email?.charAt(
                  0
                ) ||
                'U'}
            </div>

            <span className="hidden md:inline font-medium text-sm">

              {user?.name ||
                'User'}
            </span>

            <ChevronDown
              size={14}
              className="hidden md:block"
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
                onClick={() => {
                  setMyProfileOpen(true);
                  setActiveDropdown(null);
                }}
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
            className="flex items-center gap-1 md:gap-2 text-sm font-medium text-muted-foreground hover:text-foreground p-2 md:px-3 md:py-2 rounded-xl hover:bg-secondary transition-all"
          >

            <span className="hidden md:inline">Filter</span>

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
          <div className="flex items-center bg-secondary p-0.5 md:p-1 rounded-xl md:rounded-2xl">

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

        {/* PERSONAL PROFILE SUMMARY MODAL */}
        {myProfileOpen && user && createPortal(
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6 backdrop-blur-sm animate-in fade-in duration-300">
            <div 
              className="fixed inset-0 bg-transparent" 
              onClick={() => setMyProfileOpen(false)} 
            />
            <div className="w-full max-w-md bg-card border border-border/85 rounded-3xl shadow-2xl flex flex-col relative z-10 max-h-[90vh] overflow-y-auto scrollbar-hide animate-in zoom-in-95 duration-200">
              {/* TOP BANNER */}
              <div className="h-28 bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/20 relative border-b border-border/10 shrink-0">
                {/* CLOSE BUTTON */}
                <button
                  onClick={() => setMyProfileOpen(false)}
                  className="absolute right-5 top-5 w-8 h-8 rounded-full bg-background/60 hover:bg-background/80 border border-border/30 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all z-20 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* PROFILE CONTENT CONTAINER */}
              <div className="px-6 pb-6 pt-0 flex flex-col items-center relative">
                {/* Avatar */}
                <div className="w-24 h-24 rounded-3xl bg-primary/20 border-4 border-card flex items-center justify-center text-primary font-bold text-3xl shadow-xl overflow-hidden -mt-12 mb-3 relative z-10 bg-card">
                  {user.avatar ? (
                    <img 
                      src={user.avatar.startsWith('/uploads') ? `${api.defaults.baseURL?.replace('/api', '') || ''}${user.avatar}` : user.avatar} 
                      alt="avatar" 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    user.name?.charAt(0) || 'U'
                  )}
                </div>

                {/* Name & Username */}
                <h3 className="font-bold text-xl text-foreground tracking-tight">{user.name}</h3>
                <span className="text-xs text-muted-foreground bg-secondary px-3 py-1 rounded-full font-medium border border-border/40 mt-1.5 mb-1">
                  @{user.username}
                </span>

                {/* Joined Date */}
                {user.createdAt && (
                  <span className="text-[10px] text-muted-foreground mb-4">
                    Member since {new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                )}

                {/* Biography Callout */}
                <div className="w-full bg-secondary/10 border border-border/20 rounded-2xl p-4 mb-4 text-center">
                  <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold block mb-1">About Me</span>
                  <p className="text-xs text-muted-foreground leading-relaxed italic">
                    "{user.bio || "No biography provided yet. Go to settings to write one!"}"
                  </p>
                </div>

                {/* Account Info Cards */}
                <div className="w-full space-y-3">
                  {/* Email Info Card */}
                  <div className="bg-secondary/20 border border-border/30 rounded-2xl p-4 flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <Mail size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Email Address</span>
                      <span className="text-sm font-medium text-foreground block truncate">{user.email}</span>
                    </div>
                  </div>

                  {/* Status Info Card */}
                  <div className="bg-secondary/20 border border-border/30 rounded-2xl p-4 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500 shrink-0">
                        <User size={16} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Account Status</span>
                        <span className="text-sm font-medium text-foreground block truncate">Active Member</span>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-500 font-semibold text-[10px] flex items-center gap-1.5 border border-green-500/20 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      Online
                    </span>
                  </div>
                </div>

                {/* Metric Cards Grid */}
                <div className="w-full grid grid-cols-2 gap-4 mt-6">
                  {/* Workspaces Metric Card */}
                  <div className="bg-secondary/25 border border-border/30 rounded-2xl p-4 flex flex-col items-center justify-center hover:bg-secondary/40 transition-all group text-center">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform mb-2">
                      <LayoutGrid size={16} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Workspaces</span>
                    <h4 className="text-xl font-bold text-foreground mt-1">{workspaces.length + 1}</h4>
                  </div>

                  {/* Chats Metric Card */}
                  <div className="bg-secondary/25 border border-border/30 rounded-2xl p-4 flex flex-col items-center justify-center hover:bg-secondary/40 transition-all group text-center">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform mb-2">
                      <Mail size={16} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Conversations</span>
                    <h4 className="text-xl font-bold text-foreground mt-1">{chats.length}</h4>
                  </div>

                  {/* Tasks Metric Card */}
                  <div className="bg-secondary/25 border border-border/30 rounded-2xl p-4 flex flex-col items-center justify-center hover:bg-secondary/40 transition-all group text-center">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform mb-2">
                      <List size={16} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Tasks Assigned</span>
                    <h4 className="text-xl font-bold text-foreground mt-1">{myTasks.length}</h4>
                  </div>

                  {/* Done Metric Card */}
                  <div className="bg-secondary/25 border border-border/30 rounded-2xl p-4 flex flex-col items-center justify-center hover:bg-secondary/40 transition-all group text-center">
                    <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform mb-2">
                      <Check size={16} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Tasks Completed</span>
                    <h4 className="text-xl font-bold text-foreground mt-1">{completedTasksCount}</h4>
                  </div>
                </div>

                {/* Action Footer */}
                <div className="w-full mt-6 pt-5 border-t border-border/30">
                  <button
                    onClick={() => {
                      setMyProfileOpen(false);
                      navigate('/settings');
                    }}
                    className="w-full py-3 rounded-2xl bg-primary text-primary-foreground hover:opacity-90 text-sm font-semibold transition-all active:scale-[0.98] shadow-lg shadow-primary/10 cursor-pointer text-center"
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
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
      className={`p-1.5 md:p-2 rounded-lg md:rounded-xl transition-all ${
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
        {invitation.type === 'task'
          ? `invited you to collaborate on the task "${invitation.taskTitle}".`
          : 'invited you to connect as a friend.'}
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