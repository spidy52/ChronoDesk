import { useState } from 'react';

import DashboardLayout from '../../../layouts/DashboardLayout';

import {
  Clock3,
  Timer,
  Play,
  Pause,
  Plus,
  CalendarDays,
  BarChart3,
} from 'lucide-react';

export default function TimesheetPage() {
  const [timerRunning, setTimerRunning] =
    useState(false);

  const timeEntries = [
    {
      task: 'UI Dashboard Design',
      project: 'ChronoDesk',
      duration: '4h 20m',
      status: 'Completed',
    },
    {
      task: 'Authentication Backend',
      project: 'API System',
      duration: '2h 45m',
      status: 'In Progress',
    },
    {
      task: 'Calendar Integration',
      project: 'Workspace',
      duration: '1h 30m',
      status: 'Pending',
    },
    {
      task: 'AI Assistant Planning',
      project: 'Gen AI',
      duration: '3h 10m',
      status: 'Completed',
    },
  ];

  return (
    <DashboardLayout>

      <div className="p-8">

        {/* ================= HEADER ================= */}

        <div className="flex items-center justify-between mb-8">

          <div>

            <h1 className="text-4xl font-bold">
              Timesheet
            </h1>

            <p className="text-muted-foreground mt-2">
              Track productivity and work sessions.
            </p>
          </div>

          {/* ADD ENTRY */}
          <button className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-2xl shadow-lg hover:opacity-90 transition-all">

            <Plus size={18} />

            Add Entry
          </button>
        </div>

        {/* ================= STATS ================= */}

        <div className="grid grid-cols-4 gap-6 mb-8">

          <StatCard
            title="Today's Hours"
            value="8.5h"
            icon={<Clock3 size={20} />}
          />

          <StatCard
            title="Weekly Hours"
            value="42h"
            icon={<Timer size={20} />}
          />

          <StatCard
            title="Projects"
            value="6"
            icon={<BarChart3 size={20} />}
          />

          <StatCard
            title="Meetings"
            value="12"
            icon={<CalendarDays size={20} />}
          />
        </div>

        {/* ================= TIMER + SUMMARY ================= */}

        <div className="grid grid-cols-3 gap-6 mb-8">

          {/* TIMER */}
          <div className="col-span-2 bg-card border rounded-3xl p-8">

            <div className="flex items-center justify-between mb-6">

              <h2 className="text-2xl font-bold">
                Live Work Timer
              </h2>

              <span className="text-sm text-muted-foreground">
                Current Session
              </span>
            </div>

            <div className="flex flex-col items-center justify-center py-10">

              {/* TIMER CIRCLE */}
              <div className="w-56 h-56 rounded-full border-[12px] border-primary flex items-center justify-center mb-8 shadow-lg">

                <div className="text-center">

                  <p className="text-6xl font-bold tracking-tight">
                    02:14
                  </p>

                  <p className="text-muted-foreground mt-2">
                    Hours Worked
                  </p>
                </div>
              </div>

              {/* CONTROLS */}
              <div className="flex items-center gap-4">

                <button
                  onClick={() =>
                    setTimerRunning(
                      !timerRunning
                    )
                  }
                  className={`
                    flex items-center gap-2 px-6 py-3 rounded-2xl shadow-lg transition-all
                    ${
                      timerRunning
                        ? 'bg-red-500 text-white'
                        : 'bg-primary text-primary-foreground'
                    }
                  `}
                >

                  {timerRunning ? (
                    <Pause size={18} />
                  ) : (
                    <Play size={18} />
                  )}

                  {timerRunning
                    ? 'Pause'
                    : 'Start'}
                </button>

                <button className="px-6 py-3 rounded-2xl border hover:bg-secondary transition-all">

                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* SUMMARY */}
          <div className="bg-card border rounded-3xl p-6">

            <h2 className="text-2xl font-bold mb-6">
              Productivity
            </h2>

            <div className="space-y-6">

              <ProductivityItem
                label="Design"
                percent={80}
              />

              <ProductivityItem
                label="Development"
                percent={65}
              />

              <ProductivityItem
                label="Meetings"
                percent={45}
              />

              <ProductivityItem
                label="Research"
                percent={70}
              />
            </div>
          </div>
        </div>

        {/* ================= TABLE ================= */}

        <div className="bg-card border rounded-3xl overflow-hidden shadow-sm">

          {/* HEADER */}
          <div className="grid grid-cols-4 px-6 py-5 border-b bg-secondary/40 text-sm font-semibold text-muted-foreground">

            <div>Task</div>

            <div>Project</div>

            <div>Duration</div>

            <div>Status</div>
          </div>

          {/* ROWS */}
          <div className="divide-y">

            {timeEntries.map(
              (entry, index) => (
                <TimeEntryRow
                  key={index}
                  task={entry.task}
                  project={entry.project}
                  duration={entry.duration}
                  status={entry.status}
                />
              )
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

/* ================= COMPONENTS ================= */

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-card border rounded-3xl p-6 flex items-center justify-between hover:shadow-lg transition-all">

      <div>

        <p className="text-sm text-muted-foreground mb-2">
          {title}
        </p>

        <h2 className="text-3xl font-bold">
          {value}
        </h2>
      </div>

      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
        {icon}
      </div>
    </div>
  );
}

function ProductivityItem({
  label,
  percent,
}: {
  label: string;
  percent: number;
}) {
  return (
    <div>

      <div className="flex items-center justify-between mb-2">

        <span className="font-medium text-sm">
          {label}
        </span>

        <span className="text-sm text-muted-foreground">
          {percent}%
        </span>
      </div>

      <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">

        <div
          className="h-full bg-primary rounded-full"
          style={{
            width: `${percent}%`,
          }}
        />
      </div>
    </div>
  );
}

function TimeEntryRow({
  task,
  project,
  duration,
  status,
}: {
  task: string;
  project: string;
  duration: string;
  status: string;
}) {
  return (
    <div className="grid grid-cols-4 px-6 py-5 hover:bg-secondary/40 transition-all">

      <div className="font-medium">
        {task}
      </div>

      <div className="text-muted-foreground">
        {project}
      </div>

      <div>{duration}</div>

      <div>

        <span
          className={`
            px-3 py-1 rounded-full text-xs font-semibold
            ${
              status === 'Completed'
                ? 'bg-green-500/10 text-green-500'
                : status === 'In Progress'
                ? 'bg-blue-500/10 text-blue-500'
                : 'bg-yellow-500/10 text-yellow-500'
            }
          `}
        >
          {status}
        </span>
      </div>
    </div>
  );
}