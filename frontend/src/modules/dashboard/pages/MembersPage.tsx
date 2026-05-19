import { useState } from 'react';

import DashboardLayout from '../../../layouts/DashboardLayout';

import {
  Plus,
  Search,
  MoreVertical,
  Crown,
  Shield,
  User,
  Mail,
  Phone,
} from 'lucide-react';

export default function MembersPage() {
  const [search, setSearch] =
    useState('');

  const members = [
    {
      name: 'Ravi Kumar',
      role: 'Admin',
      email: 'ravi@chronodesk.ai',
      phone: '+91 9876543210',
      status: 'Online',
      avatar:
        'https://i.pravatar.cc/150?u=1',
    },
    {
      name: 'Sarah Johnson',
      role: 'Designer',
      email: 'sarah@chronodesk.ai',
      phone: '+91 9988776655',
      status: 'Offline',
      avatar:
        'https://i.pravatar.cc/150?u=2',
    },
    {
      name: 'Michael Chen',
      role: 'Developer',
      email: 'michael@chronodesk.ai',
      phone: '+91 8877665544',
      status: 'Busy',
      avatar:
        'https://i.pravatar.cc/150?u=3',
    },
    {
      name: 'Emma Watson',
      role: 'Manager',
      email: 'emma@chronodesk.ai',
      phone: '+91 7766554433',
      status: 'Online',
      avatar:
        'https://i.pravatar.cc/150?u=4',
    },
  ];

  const filteredMembers =
    members.filter((member) =>
      member.name
        .toLowerCase()
        .includes(search.toLowerCase())
    );

  return (
    <DashboardLayout>

      <div className="p-8">

        {/* ================= HEADER ================= */}

        <div className="flex items-center justify-between mb-8">

          <div>

            <h1 className="text-4xl font-bold">
              Members
            </h1>

            <p className="text-muted-foreground mt-2">
              Manage workspace team members and permissions.
            </p>
          </div>

          {/* INVITE */}
          <button className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-2xl shadow-lg hover:opacity-90 transition-all">

            <Plus size={18} />

            Invite Member
          </button>
        </div>

        {/* ================= STATS ================= */}

        <div className="grid grid-cols-4 gap-6 mb-8">

          <StatCard
            title="Total Members"
            value="24"
          />

          <StatCard
            title="Online"
            value="12"
            online
          />

          <StatCard
            title="Projects"
            value="8"
          />

          <StatCard
            title="Admins"
            value="3"
          />
        </div>

        {/* ================= SEARCH ================= */}

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
              setSearch(e.target.value)
            }
            className="flex-1 bg-transparent outline-none"
          />
        </div>

        {/* ================= MEMBERS GRID ================= */}

        <div className="grid grid-cols-2 gap-6">

          {filteredMembers.map(
            (member, index) => (
              <MemberCard
                key={index}
                member={member}
              />
            )
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

/* ================= COMPONENTS ================= */

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
}: {
  member: {
    name: string;
    role: string;
    email: string;
    phone: string;
    status: string;
    avatar: string;
  };
}) {
  return (
    <div className="bg-card border rounded-3xl p-6 hover:shadow-xl transition-all">

      {/* TOP */}
      <div className="flex items-start justify-between mb-6">

        <div className="flex items-center gap-4">

          {/* AVATAR */}
          <div className="relative">

            <img
              src={member.avatar}
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

          {/* INFO */}
          <div>

            <h2 className="text-xl font-bold">
              {member.name}
            </h2>

            <div className="flex items-center gap-2 mt-1">

              <RoleIcon
                role={member.role}
              />

              <span className="text-sm text-muted-foreground">
                {member.role}
              </span>
            </div>
          </div>
        </div>

        {/* MENU */}
        <button className="w-10 h-10 rounded-2xl hover:bg-secondary flex items-center justify-center transition-all">

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
          icon={<Phone size={16} />}
          text={member.phone}
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