import { useState } from 'react';

import DashboardLayout from '../../../layouts/DashboardLayout';

import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock3,
  CalendarDays,
  Video,
  Users,
  Bell,
} from 'lucide-react';

export default function CalendarPage() {
  const [selectedDay, setSelectedDay] =
    useState<number>(12);

  const days = [
    'Sun',
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat',
  ];

  const dates = Array.from(
    { length: 31 },
    (_, i) => i + 1
  );

  const schedule = [
    {
      title: 'UI Design Review',
      time: '10:00 AM - 11:00 AM',
      members: 4,
      type: 'Design',
    },
    {
      title: 'Backend Sprint',
      time: '1:00 PM - 2:30 PM',
      members: 8,
      type: 'Development',
    },
    {
      title: 'Client Presentation',
      time: '4:00 PM - 5:00 PM',
      members: 3,
      type: 'Business',
    },
  ];

  return (
    <DashboardLayout>

      <div className="flex h-full overflow-hidden">

        {/* ================= LEFT SCHEDULE PANEL ================= */}

        <div className="w-[360px] border-r bg-card p-6 overflow-y-auto">

          {/* HEADER */}
          <div className="flex items-center justify-between mb-8">

            <div>

              <h1 className="text-3xl font-bold">
                Schedule
              </h1>

              <p className="text-sm text-muted-foreground mt-1">
                Manage meetings & events
              </p>
            </div>

            <button className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:opacity-90 transition-all">

              <Plus size={20} />
            </button>
          </div>

          {/* TODAY CARD */}
          <div className="bg-primary text-primary-foreground rounded-3xl p-6 mb-8 shadow-xl">

            <p className="text-sm opacity-80 mb-2">
              Today's Date
            </p>

            <h2 className="text-5xl font-bold mb-2">
              12
            </h2>

            <p className="text-lg font-medium">
              September 2026
            </p>
          </div>

          {/* UPCOMING EVENTS */}
          <div>

            <h2 className="text-xl font-bold mb-5">
              Upcoming Events
            </h2>

            <div className="space-y-4">

              {schedule.map(
                (event, index) => (
                  <EventCard
                    key={index}
                    title={event.title}
                    time={event.time}
                    members={event.members}
                    type={event.type}
                  />
                )
              )}
            </div>
          </div>
        </div>

        {/* ================= RIGHT CALENDAR ================= */}

        <div className="flex-1 overflow-y-auto p-8">

          {/* TOP BAR */}
          <div className="flex items-center justify-between mb-8">

            {/* NAVIGATION */}
            <div className="flex items-center gap-4">

              <button className="w-11 h-11 rounded-2xl border bg-card hover:bg-secondary flex items-center justify-center transition-all">

                <ChevronLeft size={18} />
              </button>

              <button className="w-11 h-11 rounded-2xl border bg-card hover:bg-secondary flex items-center justify-center transition-all">

                <ChevronRight size={18} />
              </button>

              <h2 className="text-3xl font-bold">
                September 2026
              </h2>
            </div>

            {/* VIEW */}
            <div className="flex items-center gap-3 bg-card border rounded-2xl px-5 py-3">

              <CalendarDays size={18} />

              <span className="font-medium">
                Monthly View
              </span>
            </div>
          </div>

          {/* DAYS */}
          <div className="grid grid-cols-7 gap-4 mb-4">

            {days.map((day) => (
              <div
                key={day}
                className="text-center py-4 text-sm font-bold text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>

          {/* CALENDAR GRID */}
          <div className="grid grid-cols-7 gap-4">

            {dates.map((date) => (
              <button
                key={date}
                onClick={() =>
                  setSelectedDay(date)
                }
                className={`
                  h-36 rounded-3xl border p-4 text-left transition-all hover:shadow-lg
                  ${
                    selectedDay === date
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card hover:bg-secondary'
                  }
                `}
              >

                {/* DATE */}
                <div className="flex items-center justify-between mb-4">

                  <span className="text-xl font-bold">
                    {date}
                  </span>

                  {date === 12 && (
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  )}
                </div>

                {/* EVENTS */}
                <div className="space-y-2">

                  {date === 12 && (
                    <>
                      <div className="text-xs px-3 py-2 rounded-xl bg-blue-500/20 text-blue-500 font-medium">

                        Design Review
                      </div>

                      <div className="text-xs px-3 py-2 rounded-xl bg-green-500/20 text-green-500 font-medium">

                        Sprint Meeting
                      </div>
                    </>
                  )}

                  {date === 18 && (
                    <div className="text-xs px-3 py-2 rounded-xl bg-red-500/20 text-red-500 font-medium">

                      Client Demo
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* BOTTOM SECTION */}
          <div className="mt-10 grid grid-cols-3 gap-6">

            {/* TODAY MEETINGS */}
            <div className="col-span-2 bg-card border rounded-3xl p-6">

              <div className="flex items-center justify-between mb-6">

                <h2 className="text-2xl font-bold">
                  Today's Meetings
                </h2>

                <span className="text-sm text-muted-foreground">
                  3 Meetings
                </span>
              </div>

              <div className="space-y-5">

                {schedule.map(
                  (meeting, index) => (
                    <MeetingRow
                      key={index}
                      title={meeting.title}
                      time={meeting.time}
                      type={meeting.type}
                    />
                  )
                )}
              </div>
            </div>

            {/* REMINDERS */}
            <div className="bg-card border rounded-3xl p-6">

              <div className="flex items-center gap-3 mb-6">

                <Bell size={20} />

                <h2 className="text-2xl font-bold">
                  Reminders
                </h2>
              </div>

              <div className="space-y-4">

                <ReminderCard
                  title="Submit Sprint"
                  date="Today"
                />

                <ReminderCard
                  title="Design Handoff"
                  date="Tomorrow"
                />

                <ReminderCard
                  title="AI Demo"
                  date="Friday"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

/* ================= COMPONENTS ================= */

function EventCard({
  title,
  time,
  members,
  type,
}: {
  title: string;
  time: string;
  members: number;
  type: string;
}) {
  return (
    <div className="p-5 rounded-3xl border bg-background hover:shadow-lg transition-all">

      <div className="flex items-center justify-between mb-3">

        <span className="px-3 py-1 rounded-xl bg-primary/10 text-primary text-xs font-bold">
          {type}
        </span>

        <Video size={18} />
      </div>

      <h3 className="font-bold text-lg mb-2">
        {title}
      </h3>

      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">

        <Clock3 size={14} />

        {time}
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">

        <Users size={14} />

        {members} Members
      </div>
    </div>
  );
}

function MeetingRow({
  title,
  time,
  type,
}: {
  title: string;
  time: string;
  type: string;
}) {
  return (
    <div className="flex items-center justify-between p-5 rounded-3xl border hover:shadow-lg transition-all">

      <div>

        <h3 className="font-bold text-lg mb-2">
          {title}
        </h3>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">

          <Clock3 size={14} />

          {time}
        </div>
      </div>

      <span className="px-4 py-2 rounded-xl bg-primary/10 text-primary text-sm font-semibold">
        {type}
      </span>
    </div>
  );
}

function ReminderCard({
  title,
  date,
}: {
  title: string;
  date: string;
}) {
  return (
    <div className="p-4 rounded-2xl bg-secondary/40 hover:bg-secondary transition-all">

      <div className="flex items-center justify-between">

        <div>

          <h3 className="font-semibold">
            {title}
          </h3>

          <p className="text-sm text-muted-foreground mt-1">
            Upcoming reminder
          </p>
        </div>

        <span className="text-sm font-semibold text-primary">
          {date}
        </span>
      </div>
    </div>
  );
}