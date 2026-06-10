import { useEffect, useState } from 'react';

import DashboardLayout from '../../../layouts/DashboardLayout';

import { api } from '../../../lib/axios';
import { BACKEND_URL } from '@/config';

import {
  Plus,
  Search,
  Crown,
  Shield,
  User,
  Mail,
  X,
  Trash2,
} from 'lucide-react';

import { socket } from '../../../services/socket';
import toast from 'react-hot-toast';

interface Member {
  _id: string;
  name: string;
  username: string;
  email: string;
  userId?: string;
  phone?: string;
  role: string;
  status: string;
  avatar?: string;
}

export default function MembersPage() {
  const [search, setSearch] =
    useState('');

  const [members, setMembers] =
    useState<Member[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [inviteModal, setInviteModal] =
    useState(false);

  const [inviteData, setInviteData] =
    useState({
      username: '',
      role: 'Member',
    });

  // Search users states inside invite modal
  const [userQuery, setUserQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);

  useEffect(() => {
    if (!userQuery) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingUsers(true);
      try {
        const response = await api.get(`/auth/search-users?q=${userQuery}`);
        setSearchResults(response.data);
      } catch (err) {
        console.error('Search users error:', err);
      } finally {
        setIsSearchingUsers(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [userQuery]);

  /* FETCH MEMBERS */

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers =
    async () => {
      try {
        setLoading(true);

        const response =
          await api.get('/members');

        setMembers(response.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

  /* REAL-TIME PRESENCE */
  useEffect(() => {
    const handleUserOnline = ({ userId }: { userId: string }) => {
      setMembers((prev) =>
        prev.map((m) =>
          m.userId === userId ? { ...m, status: 'Online' } : m
        )
      );
    };

    const handleUserOffline = ({ userId }: { userId: string }) => {
      setMembers((prev) =>
        prev.map((m) =>
          m.userId === userId ? { ...m, status: 'Offline' } : m
        )
      );
    };

    const handleMemberRemoved = (memberId: string) => {
      setMembers((prev) => prev.filter((m) => m._id !== memberId));
    };

    const handleInvitationAccepted = () => {
      // Re-fetch members to get the fully populated data
      fetchMembers();
    };

    socket.on('user:online', handleUserOnline);
    socket.on('user:offline', handleUserOffline);
    socket.on('member:removed', handleMemberRemoved);
    socket.on('invitation:accepted', handleInvitationAccepted);

    return () => {
      socket.off('user:online', handleUserOnline);
      socket.off('user:offline', handleUserOffline);
      socket.off('member:removed', handleMemberRemoved);
      socket.off('invitation:accepted', handleInvitationAccepted);
    };
  }, []);

  /* SEND INVITATION */

  const sendInvitation =
    async () => {
      try {
        if (!inviteData.username) {
          return toast.error(
            'Username required'
          );
        }

        await api.post(
          '/members/invite',
          inviteData
        );

        toast.success(
          'Invitation sent successfully'
        );

        setInviteModal(false);

        setInviteData({
          username: '',
          role: 'Member',
        });
      } catch (error: any) {
        console.error(error);

        toast.error(
          error?.response?.data
            ?.message ||
            'Failed to send invitation'
        );
      }
    };

  /* REMOVE MEMBER */

  const removeMember =
    async (id: string) => {
      try {
        await api.delete(
          `/members/${id}`
        );

        setMembers((prev) =>
          prev.filter(
            (member) =>
              member._id !== id
          )
        );
        toast.success('Member removed successfully');
      } catch (error) {
        console.error(error);

        toast.error(
          'Failed to remove member'
        );
      }
    };

  /* FILTER */

  const filteredMembers =
    members.filter((member) =>
      member.name
        .toLowerCase()
        .includes(search.toLowerCase())
    );

  return (
    <DashboardLayout>
      <div className="p-8">

        {/* HEADER */}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 mb-8">

          <div>
            <h1 className="text-4xl font-bold">
              Members
            </h1>

            <p className="text-muted-foreground mt-2">
              Manage workspace members and invitations.
            </p>
          </div>

          <button
            onClick={() =>
              setInviteModal(true)
            }
            className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-2xl shadow-lg hover:opacity-90 transition-all"
          >
            <Plus size={18} />

            Invite Member
          </button>
        </div>

        {/* STATS */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

          <StatCard
            title="Total Members"
            value={String(
              members.length
            )}
          />

          <StatCard
            title="Online"
            value={String(
              members.filter(
                (m) =>
                  m.status ===
                  'Online'
              ).length
            )}
            online
          />

          <StatCard
            title="Admins"
            value={String(
              members.filter(
                (m) =>
                  m.role ===
                  'Admin'
              ).length
            )}
          />

          <StatCard
            title="Managers"
            value={String(
              members.filter(
                (m) =>
                  m.role ===
                  'Manager'
              ).length
            )}
          />
        </div>

        {/* SEARCH */}

        <div className="bg-card border rounded-3xl p-5 mb-8 flex items-center gap-4">

          <Search
            size={20}
            className="text-muted-foreground"
          />

          <input
            type="text"
            placeholder="Search members..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            className="flex-1 bg-transparent outline-none"
          />
        </div>

        {/* MEMBERS */}

        {loading ? (

          <div className="text-center py-20 text-muted-foreground">
            Loading members...
          </div>

        ) : filteredMembers.length ===
          0 ? (

          <div className="text-center py-20 text-muted-foreground">
            No members found
          </div>

        ) : (

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {filteredMembers.map(
              (member) => (

                <MemberCard
                  key={member._id}
                  member={member}
                  onRemove={
                    removeMember
                  }
                />
              )
            )}
          </div>
        )}

        {/* INVITE MODAL */}

        {inviteModal && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-lg bg-card border border-border/85 rounded-3xl p-8 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
              {/* TOP */}
              <div className="flex items-center justify-between mb-6 shrink-0">
                <div>
                  <h2 className="text-2xl font-bold">Invite Member</h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    Search and preview user before inviting
                  </p>
                </div>
                <button
                  onClick={() => {
                    setInviteModal(false);
                    setUserQuery('');
                    setSearchResults([]);
                    setSelectedUser(null);
                  }}
                  className="w-10 h-10 rounded-xl hover:bg-secondary flex items-center justify-center transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              {/* MODAL MAIN CONTENT */}
              <div className="flex-1 overflow-y-auto pr-1">
                {!selectedUser ? (
                  /* SEARCH SCREEN */
                  <div className="space-y-5">
                    <div>
                      <label className="text-sm font-medium block mb-2">
                        Search User (Name or Username)
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={userQuery}
                          onChange={(e) => setUserQuery(e.target.value)}
                          placeholder="Type name or username..."
                          className="w-full border bg-background border-border rounded-2xl pl-11 pr-4 py-3 outline-none focus:border-primary transition-all text-sm"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                      </div>
                    </div>

                    {/* SEARCH RESULTS LIST */}
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                      {isSearchingUsers ? (
                        <div className="text-center py-6 text-sm text-muted-foreground">
                          Searching users...
                        </div>
                      ) : searchResults.length > 0 ? (
                        searchResults.map((u) => (
                          <button
                            key={u._id}
                            onClick={() => {
                              setSelectedUser(u);
                              setInviteData({
                                ...inviteData,
                                username: u.username,
                              });
                            }}
                            className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-secondary border border-transparent hover:border-border/50 text-left transition-all group"
                          >
                            <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-semibold overflow-hidden shrink-0">
                              {u.avatar ? (
                                <img src={u.avatar.startsWith('/uploads') ? `${BACKEND_URL}${u.avatar}` : u.avatar} alt="avatar" className="w-full h-full object-cover" />
                              ) : (
                                u.name?.charAt(0) || 'U'
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="font-semibold text-sm text-foreground block truncate">{u.name}</span>
                              <span className="text-xs text-muted-foreground block truncate">@{u.username}</span>
                            </div>
                            <span className="text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-all pr-2">
                              View Profile &rarr;
                            </span>
                          </button>
                        ))
                      ) : userQuery ? (
                        <div className="text-center py-6 text-sm text-muted-foreground">
                          No users found matching "{userQuery}"
                        </div>
                      ) : (
                        <div className="text-center py-6 text-sm text-muted-foreground font-light">
                          Start typing to search users...
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* USER PROFILE PREVIEW CARD */
                  <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                    <button
                      onClick={() => setSelectedUser(null)}
                      className="text-xs font-bold text-primary hover:underline flex items-center gap-1.5"
                    >
                      &larr; Back to Search
                    </button>

                    {/* CARD BODY */}
                    <div className="bg-secondary/40 border border-border/50 rounded-2xl p-6 flex flex-col items-center text-center relative overflow-hidden">
                      {/* Avatar */}
                      <div className="w-20 h-20 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-2xl shadow-inner overflow-hidden mb-4">
                        {selectedUser.avatar ? (
                          <img src={selectedUser.avatar.startsWith('/uploads') ? `${BACKEND_URL}${selectedUser.avatar}` : selectedUser.avatar} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                          selectedUser.name?.charAt(0) || 'U'
                        )}
                      </div>

                      {/* Name & Username */}
                      <h4 className="font-bold text-lg text-foreground">{selectedUser.name}</h4>
                      <span className="text-xs text-primary font-semibold mb-2">@{selectedUser.username}</span>
                      
                      {/* Email */}
                      <span className="text-xs text-muted-foreground font-mono bg-background px-3 py-1 rounded-full border border-border/50 mb-4">
                        {selectedUser.email}
                      </span>

                      {/* Bio */}
                      <div className="w-full border-t border-border/50 pt-4 mt-2 text-left">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground block font-bold mb-1">Bio</span>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {selectedUser.bio || 'No bio provided.'}
                        </p>
                      </div>

                      {/* Member Since */}
                      <div className="w-full border-t border-border/50 pt-4 mt-4 text-left flex justify-between text-[10px] text-muted-foreground">
                        <span>Joined ChronoDesk:</span>
                        <span className="font-mono">
                          {new Date(selectedUser.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>

                    {/* ROLE SELECTOR */}
                    <div>
                      <label className="text-sm font-medium block mb-2">
                        Select Workspace Role
                      </label>
                      <select
                        value={inviteData.role}
                        onChange={(e) =>
                          setInviteData({
                            ...inviteData,
                            role: e.target.value,
                          })
                        }
                        className="w-full border bg-background border-border rounded-2xl px-4 py-3 outline-none text-sm"
                      >
                        <option>Member</option>
                        <option>Admin</option>
                        <option>Manager</option>
                        <option>Designer</option>
                        <option>Developer</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* ACTIONS */}
              <div className="flex items-center gap-4 mt-6 shrink-0 border-t border-border/30 pt-5">
                <button
                  onClick={() => {
                    setInviteModal(false);
                    setUserQuery('');
                    setSearchResults([]);
                    setSelectedUser(null);
                  }}
                  className="flex-1 border border-border rounded-2xl py-3 hover:bg-secondary text-sm font-medium transition-all"
                >
                  Cancel
                </button>

                {selectedUser && (
                  <button
                    onClick={sendInvitation}
                    className="flex-1 bg-primary text-primary-foreground rounded-2xl py-3 hover:opacity-90 text-sm font-semibold transition-all shadow-lg shadow-primary/20"
                  >
                    Send Invite
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

/* COMPONENTS */

function StatCard({
  title,
  value,
  online = false,
}: {
  title: string;
  value: string;
  online?: boolean;
}) {

  return (

    <div className="bg-card border rounded-3xl p-6 hover:shadow-lg transition-all">

      <p className="text-sm text-muted-foreground mb-2">
        {title}
      </p>

      <h2
        className={`text-3xl font-bold ${
          online
            ? 'text-green-500'
            : ''
        }`}
      >
        {value}
      </h2>
    </div>
  );
}

function MemberCard({
  member,
  onRemove,
}: {
  member: Member;

  onRemove: (id: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (confirmDelete) {
    return (
      <div className="bg-card border border-red-500/25 rounded-3xl p-6 hover:shadow-xl transition-all flex flex-col justify-between min-h-[160px]">
        <div>
          <h3 className="text-lg font-bold text-red-500 flex items-center gap-2">
            <Trash2 size={18} />
            Remove Connection?
          </h3>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Are you sure you want to remove <strong>{member.name}</strong> from your workspace members?
          </p>
        </div>
        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={() => onRemove(member._id)}
            className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-all shadow-md active:scale-[0.98]"
          >
            Yes, Remove
          </button>
          <button
            onClick={() => setConfirmDelete(false)}
            className="flex-1 py-2.5 px-4 rounded-xl border border-border hover:bg-secondary text-sm font-semibold transition-all active:scale-[0.98]"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border rounded-3xl p-6 hover:shadow-xl transition-all">

      {/* TOP */}

      <div className="flex items-start justify-between mb-6">

        <div className="flex items-center gap-4">

          <div className="relative">

            <img
              src={
                member.avatar ||
                `https://ui-avatars.com/api/?name=${member.name}`
              }
              alt={member.name}
              className="w-16 h-16 rounded-2xl object-cover"
            />

            <span
              className={`
                absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background
                ${
                  member.status ===
                  'Online'
                    ? 'bg-green-500'
                    : member.status ===
                      'Busy'
                    ? 'bg-red-500'
                    : 'bg-gray-400'
                }
              `}
            ></span>
          </div>

          <div>

            <h2 className="text-xl font-bold">
              {member.name}
            </h2>

            <div className="flex items-center gap-2 mt-1">

              <RoleIcon
                role={member.role}
              />

              <span className="text-sm text-muted-foreground">
                @{member.username}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() =>
            setConfirmDelete(true)
          }
          className="w-10 h-10 rounded-2xl hover:bg-red-500/10 hover:text-red-500 flex items-center justify-center transition-all"
          title="Remove Member"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* DETAILS */}

      <div className="space-y-4">

        <InfoRow
          icon={<Mail size={16} />}
          text={member.email}
        />

        <InfoRow
          icon={<Shield size={16} />}
          text={member.role}
        />
      </div>

      {/* FOOTER */}

      <div className="flex items-center justify-between mt-6">

        <span
          className={`
            px-4 py-2 rounded-xl text-sm font-semibold
            ${
              member.status ===
              'Online'
                ? 'bg-green-500/10 text-green-500'
                : member.status ===
                  'Busy'
                ? 'bg-red-500/10 text-red-500'
                : 'bg-gray-500/10 text-gray-500'
            }
          `}
        >
          {member.status}
        </span>

        <button className="px-5 py-2 rounded-2xl bg-primary text-primary-foreground hover:opacity-90 transition-all">
          View Profile
        </button>
      </div>
    </div>
  );
}

function RoleIcon({
  role,
}: {
  role: string;
}) {

  if (role === 'Admin') {

    return (
      <Crown
        size={16}
        className="text-yellow-500"
      />
    );
  }

  if (role === 'Manager') {

    return (
      <Shield
        size={16}
        className="text-blue-500"
      />
    );
  }

  return (
    <User
      size={16}
      className="text-primary"
    />
  );
}

function InfoRow({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {

  return (

    <div className="flex items-center gap-3 text-sm text-muted-foreground">

      {icon}

      <span>{text}</span>
    </div>
  );
}