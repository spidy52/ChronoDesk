import { useEffect, useState } from 'react';

import DashboardLayout from '../../../layouts/DashboardLayout';

import { api } from '../../../lib/axios';

import {
  Plus,
  Search,
  MoreVertical,
  Crown,
  Shield,
  User,
  Mail,
  X,
} from 'lucide-react';

import { socket } from '../../../services/socket';

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
          return alert(
            'Username required'
          );
        }

        await api.post(
          '/members/invite',
          inviteData
        );

        alert(
          'Invitation sent successfully'
        );

        setInviteModal(false);

        setInviteData({
          username: '',
          role: 'Member',
        });
      } catch (error: any) {
        console.error(error);

        alert(
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
        const confirmDelete =
          window.confirm(
            'Remove this member?'
          );

        if (!confirmDelete) return;

        await api.delete(
          `/members/${id}`
        );

        setMembers((prev) =>
          prev.filter(
            (member) =>
              member._id !== id
          )
        );
      } catch (error) {
        console.error(error);

        alert(
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

        <div className="flex items-center justify-between mb-8">

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

        <div className="grid grid-cols-4 gap-6 mb-8">

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

          <div className="grid grid-cols-2 gap-6">

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

          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6">

            <div className="w-full max-w-lg bg-card border rounded-3xl p-8">

              {/* TOP */}

              <div className="flex items-center justify-between mb-6">

                <div>

                  <h2 className="text-2xl font-bold">
                    Invite Member
                  </h2>

                  <p className="text-muted-foreground text-sm mt-1">
                    Send workspace invitation
                  </p>
                </div>

                <button
                  onClick={() =>
                    setInviteModal(
                      false
                    )
                  }
                  className="w-10 h-10 rounded-xl hover:bg-secondary flex items-center justify-center"
                >
                  <X size={18} />
                </button>
              </div>

              {/* USERNAME */}

              <div className="mb-5">

                <label className="text-sm font-medium block mb-2">
                  Username
                </label>

                <input
                  type="text"
                  value={
                    inviteData.username
                  }
                  onChange={(e) =>
                    setInviteData({
                      ...inviteData,
                      username:
                        e.target
                          .value,
                    })
                  }
                  placeholder="Enter username"
                  className="w-full border bg-background rounded-2xl px-4 py-3 outline-none"
                />
              </div>

              {/* ROLE */}

              <div className="mb-8">

                <label className="text-sm font-medium block mb-2">
                  Role
                </label>

                <select
                  value={
                    inviteData.role
                  }
                  onChange={(e) =>
                    setInviteData({
                      ...inviteData,
                      role:
                        e.target
                          .value,
                    })
                  }
                  className="w-full border bg-background rounded-2xl px-4 py-3 outline-none"
                >
                  <option>
                    Member
                  </option>

                  <option>
                    Admin
                  </option>

                  <option>
                    Manager
                  </option>

                  <option>
                    Designer
                  </option>

                  <option>
                    Developer
                  </option>
                </select>
              </div>

              {/* ACTIONS */}

              <div className="flex items-center gap-4">

                <button
                  onClick={() =>
                    setInviteModal(
                      false
                    )
                  }
                  className="flex-1 border rounded-2xl py-3 hover:bg-secondary transition-all"
                >
                  Cancel
                </button>

                <button
                  onClick={
                    sendInvitation
                  }
                  className="flex-1 bg-primary text-primary-foreground rounded-2xl py-3 hover:opacity-90 transition-all"
                >
                  Send Invite
                </button>
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
            onRemove(member._id)
          }
          className="w-10 h-10 rounded-2xl hover:bg-red-500/10 hover:text-red-500 flex items-center justify-center transition-all"
        >
          <MoreVertical size={18} />
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