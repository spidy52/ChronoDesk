
import DashboardLayout from '../../../layouts/DashboardLayout';

import {
  CheckCircle2,
  Clock3,
  AlertCircle,
  Plus,
} from 'lucide-react';

export default function MyTasksPage() {
  const tasks = [
    {
      title: 'Finish UI Design',
      priority: 'High',
      status: 'In Progress',
      due: 'Today',
    },
    {
      title: 'API Integration',
      priority: 'Medium',
      status: 'Pending',
      due: 'Tomorrow',
    },
    {
      title: 'Fix Authentication Bug',
      priority: 'High',
      status: 'Completed',
      due: 'Yesterday',
    },
    {
      title: 'Create Timeline Replay',
      priority: 'Low',
      status: 'Pending',
      due: '2 Days Left',
    },
  ];

  return (
    <DashboardLayout>

      <div className="p-8">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-8">

          <div>

            <h1 className="text-4xl font-bold">
              My Tasks
            </h1>

            <p className="text-muted-foreground mt-2">
              Manage your assigned tasks and productivity.
            </p>
          </div>

          {/* ADD TASK */}
          <button className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-2xl hover:opacity-90 transition-all shadow-lg">

            <Plus size={18} />

            Add Task
          </button>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-4 gap-6 mb-8">

          <StatCard
            title="Total Tasks"
            value="24"
            icon={<Clock3 size={20} />}
          />

          <StatCard
            title="Completed"
            value="12"
            icon={<CheckCircle2 size={20} />}
          />

          <StatCard
            title="Pending"
            value="8"
            icon={<AlertCircle size={20} />}
          />

          <StatCard
            title="Overdue"
            value="4"
            icon={<AlertCircle size={20} />}
            danger
          />
        </div>

        {/* TASK TABLE */}
        <div className="bg-card border rounded-3xl overflow-hidden shadow-sm">

          {/* TABLE HEADER */}
          <div className="grid grid-cols-4 px-6 py-5 border-b bg-secondary/40 text-sm font-semibold text-muted-foreground">

            <div>Task</div>

            <div>Priority</div>

            <div>Status</div>

            <div>Due Date</div>
          </div>

          {/* TASK ROWS */}
          <div className="divide-y">

            {tasks.map((task, index) => (
              <TaskRow
                key={index}
                title={task.title}
                priority={task.priority}
                status={task.status}
                due={task.due}
              />
            ))}
          </div>
        </div>

        {/* PRODUCTIVITY + DEADLINES */}
        <div className="grid grid-cols-2 gap-6 mt-8">

          {/* PRODUCTIVITY */}
          <div className="bg-card border rounded-3xl p-6">

            <h2 className="text-xl font-bold mb-4">
              Today's Progress
            </h2>

            <div className="space-y-5">

              <ProgressItem
                label="Design Tasks"
                percent={80}
              />

              <ProgressItem
                label="Development"
                percent={60}
              />

              <ProgressItem
                label="Meetings"
                percent={40}
              />
            </div>
          </div>

          {/* DEADLINES */}
          <div className="bg-card border rounded-3xl p-6">

            <h2 className="text-xl font-bold mb-4">
              Upcoming Deadlines
            </h2>

            <div className="space-y-4">

              <DeadlineItem
                title="UI Submission"
                date="Today"
              />

              <DeadlineItem
                title="Backend API"
                date="Tomorrow"
              />

              <DeadlineItem
                title="Project Demo"
                date="Friday"
              />
            </div>
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
  danger = false,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div className="bg-card border rounded-3xl p-6 flex items-center justify-between hover:shadow-lg transition-all">

      <div>

        <p className="text-sm text-muted-foreground mb-2">
          {title}
        </p>

        <h2
          className={`text-3xl font-bold ${
            danger
              ? 'text-red-500'
              : ''
          }`}
        >
          {value}
        </h2>
      </div>

      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
        {icon}
      </div>
    </div>
  );
}

function TaskRow({
  title,
  priority,
  status,
  due,
}: {
  title: string;
  priority: string;
  status: string;
  due: string;
}) {
  return (
    <div className="grid grid-cols-4 px-6 py-5 hover:bg-secondary/40 transition-all">

      <div className="font-medium">
        {title}
      </div>

      <div>
        <span
          className={`
            px-3 py-1 rounded-full text-xs font-semibold
            ${
              priority === 'High'
                ? 'bg-red-500/10 text-red-500'
                : priority === 'Medium'
                ? 'bg-yellow-500/10 text-yellow-500'
                : 'bg-green-500/10 text-green-500'
            }
          `}
        >
          {priority}
        </span>
      </div>

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

      <div className="text-muted-foreground">
        {due}
      </div>
    </div>
  );
}

function ProgressItem({
  label,
  percent,
}: {
  label: string;
  percent: number;
}) {
  return (
    <div>

      <div className="flex items-center justify-between mb-2">

        <span className="text-sm font-medium">
          {label}
        </span>

        <span className="text-sm text-muted-foreground">
          {percent}%
        </span>
      </div>

      <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">

        <div
          className="h-full bg-primary rounded-full transition-all"
          style={{
            width: `${percent}%`,
          }}
        />
      </div>
    </div>
  );
}

function DeadlineItem({
  title,
  date,
}: {
  title: string;
  date: string;
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/40 hover:bg-secondary transition-all">

      <div>

        <h3 className="font-semibold">
          {title}
        </h3>

        <p className="text-sm text-muted-foreground">
          Deadline approaching
        </p>
      </div>

      <span className="text-sm font-medium text-primary">
        {date}
      </span>
    </div>
  );
}