import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import DashboardLayout from '../../../layouts/DashboardLayout';

import {
  Clock3,
  Timer,
  Play,
  Pause,
  Plus,
  CalendarDays,
  BarChart3,
  Trash2,
} from 'lucide-react';

/* ================= TYPES ================= */

interface TimeEntry {
  id: string;

  task: string;

  project: string;

  duration: number;

  status:
    | 'completed'
    | 'inprogress'
    | 'pending';

  createdAt: string;
}

/* ================= PAGE ================= */

export default function TimesheetPage() {

  const [timerRunning, setTimerRunning] =
    useState(false);

  const [seconds, setSeconds] =
    useState(0);

  const intervalRef =
    useRef<any>(null);

  const [
    entries,
    setEntries,
  ] = useState<TimeEntry[]>(() => {

    const saved =
      localStorage.getItem(
        'timesheetEntries'
      );

    return saved
      ? JSON.parse(saved)
      : [];
  });

  /* ================= PERSIST ================= */

  useEffect(() => {

    localStorage.setItem(
      'timesheetEntries',
      JSON.stringify(entries)
    );

  }, [entries]);

  /* ================= TIMER ================= */

  useEffect(() => {

    if (timerRunning) {

      intervalRef.current =
        setInterval(() => {

          setSeconds(
            (prev) => prev + 1
          );

        }, 1000);

    } else {

      clearInterval(
        intervalRef.current
      );
    }

    return () =>
      clearInterval(
        intervalRef.current
      );

  }, [timerRunning]);

  /* ================= FORMAT ================= */

  const formatTime = (
    totalSeconds: number
  ) => {

    const hrs = Math.floor(
      totalSeconds / 3600
    );

    const mins = Math.floor(
      (totalSeconds % 3600) /
        60
    );

    const secs =
      totalSeconds % 60;

    return `${String(
      hrs
    ).padStart(2, '0')}:${String(
      mins
    ).padStart(2, '0')}:${String(
      secs
    ).padStart(2, '0')}`;
  };

  /* ================= ADD ENTRY ================= */

  const handleAddEntry =
    () => {

      const newEntry: TimeEntry =
        {
          id:
            Date.now().toString(),

          task: `Task ${
            entries.length + 1
          }`,

          project:
            'ChronoDesk',

          duration:
            Math.floor(
              Math.random() * 5
            ) + 1,

          status:
            'completed',

          createdAt:
            new Date().toISOString(),
        };

      setEntries([
        newEntry,
        ...entries,
      ]);
    };

  /* ================= DELETE ================= */

  const handleDelete =
    (id: string) => {

      setEntries(
        entries.filter(
          (entry) =>
            entry.id !== id
        )
      );
    };

  /* ================= RESET ================= */

  const handleReset =
    () => {

      setTimerRunning(false);

      setSeconds(0);
    };

  /* ================= STATS ================= */

  const totalHours =
    entries.reduce(
      (
        total,
        entry
      ) =>
        total +
        entry.duration,
      0
    );

  const completed =
    entries.filter(
      (e) =>
        e.status ===
        'completed'
    ).length;

  const inProgress =
    entries.filter(
      (e) =>
        e.status ===
        'inprogress'
    ).length;

  const pending =
    entries.filter(
      (e) =>
        e.status ===
        'pending'
    ).length;

  const productivity =
    useMemo(() => {

      const total =
        entries.length || 1;

      return {
        completed:
          Math.round(
            (completed /
              total) *
              100
          ),

        progress:
          Math.round(
            (inProgress /
              total) *
              100
          ),

        pending:
          Math.round(
            (pending /
              total) *
              100
          ),
      };

    }, [
      entries,
      completed,
      inProgress,
      pending,
    ]);

  return (
    <DashboardLayout>

      <div className="p-4 md:p-8 overflow-y-auto h-full scrollbar-hide">

        {/* ================= HEADER ================= */}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-8">

          <div>

            <h1 className="text-4xl font-bold">
              Timesheet
            </h1>

            <p className="text-muted-foreground mt-2">
              Track productivity and work sessions.
            </p>
          </div>

          {/* ADD ENTRY */}

          <button
            onClick={
              handleAddEntry
            }
            className="
              flex
              items-center
              gap-2
              bg-primary
              text-primary-foreground
              px-5
              py-3
              rounded-2xl
              shadow-lg
              hover:opacity-90
              transition-all
            "
          >

            <Plus size={18} />

            Add Entry
          </button>
        </div>

        {/* ================= STATS ================= */}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">

          <StatCard
            title="Today's Hours"
            value={`${totalHours}h`}
            icon={<Clock3 size={20} />}
          />

          <StatCard
            title="Completed"
            value={completed.toString()}
            icon={<Timer size={20} />}
          />

          <StatCard
            title="Active Tasks"
            value={inProgress.toString()}
            icon={
              <BarChart3 size={20} />
            }
          />

          <StatCard
            title="Pending"
            value={pending.toString()}
            icon={
              <CalendarDays size={20} />
            }
          />
        </div>

        {/* ================= TIMER + PRODUCTIVITY ================= */}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">

          {/* TIMER */}

          <div
            className="
              xl:col-span-2
              bg-card
              border
              rounded-3xl
              p-8
            "
          >

            <div className="flex items-center justify-between mb-6">

              <h2 className="text-2xl font-bold">
                Live Work Timer
              </h2>

              <span className="text-sm text-muted-foreground">
                Current Session
              </span>
            </div>

            <div className="flex flex-col items-center justify-center py-10">

              {/* TIMER */}

              <div
                className="
                  w-56
                  h-56
                  rounded-full
                  border-[12px]
                  border-primary
                  flex
                  items-center
                  justify-center
                  mb-8
                  shadow-lg
                "
              >

                <div className="text-center">

                  <p className="text-5xl font-bold tracking-tight">

                    {formatTime(
                      seconds
                    )}
                  </p>

                  <p className="text-muted-foreground mt-2">
                    Live Timer
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
                    flex
                    items-center
                    gap-2
                    px-6
                    py-3
                    rounded-2xl
                    shadow-lg
                    transition-all

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

                <button
                  onClick={
                    handleReset
                  }
                  className="
                    px-6
                    py-3
                    rounded-2xl
                    border
                    hover:bg-secondary
                    transition-all
                  "
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* PRODUCTIVITY */}

          <div
            className="
              bg-card
              border
              rounded-3xl
              p-6
            "
          >

            <h2 className="text-2xl font-bold mb-6">
              Productivity
            </h2>

            <div className="space-y-6">

              <ProductivityItem
                label="Completed"
                percent={
                  productivity.completed
                }
              />

              <ProductivityItem
                label="In Progress"
                percent={
                  productivity.progress
                }
              />

              <ProductivityItem
                label="Pending"
                percent={
                  productivity.pending
                }
              />
            </div>
          </div>
        </div>

        {/* ================= TABLE ================= */}

        <div
          className="
            bg-card
            border
            rounded-3xl
            overflow-hidden
            shadow-sm
          "
        >

          {/* HEADER */}

          <div
            className="
              hidden
              md:grid
              grid-cols-5
              px-6
              py-5
              border-b
              bg-secondary/40
              text-sm
              font-semibold
              text-muted-foreground
            "
          >

            <div>Task</div>

            <div>Project</div>

            <div>Duration</div>

            <div>Status</div>

            <div className="text-right">
              Actions
            </div>
          </div>

          {/* EMPTY */}

          {entries.length ===
            0 && (

            <div className="p-16 text-center">

              <h2 className="text-2xl font-bold mb-3">
                No Entries Found
              </h2>

              <p className="text-muted-foreground mb-6">
                Create your first work entry.
              </p>

              <button
                onClick={
                  handleAddEntry
                }
                className="
                  bg-primary
                  text-primary-foreground
                  px-5
                  py-3
                  rounded-2xl
                "
              >
                Add Entry
              </button>
            </div>
          )}

          {/* ROWS */}

          <div className="divide-y">

            {entries.map(
              (entry) => (

                <TimeEntryRow
                  key={entry.id}
                  entry={entry}
                  onDelete={
                    handleDelete
                  }
                />
              )
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

/* ================= STAT CARD ================= */

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
    <div
      className="
        bg-card
        border
        rounded-3xl
        p-6
        flex
        items-center
        justify-between
        hover:shadow-lg
        transition-all
      "
    >

      <div>

        <p className="text-sm text-muted-foreground mb-2">
          {title}
        </p>

        <h2 className="text-3xl font-bold">
          {value}
        </h2>
      </div>

      <div
        className="
          w-12
          h-12
          rounded-2xl
          bg-primary/10
          flex
          items-center
          justify-center
          text-primary
        "
      >
        {icon}
      </div>
    </div>
  );
}

/* ================= PRODUCTIVITY ================= */

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

      <div
        className="
          w-full
          h-3
          bg-secondary
          rounded-full
          overflow-hidden
        "
      >

        <div
          className="
            h-full
            bg-primary
            rounded-full
            transition-all
          "
          style={{
            width: `${percent}%`,
          }}
        />
      </div>
    </div>
  );
}

/* ================= ROW ================= */

function TimeEntryRow({
  entry,
  onDelete,
}: any) {

  const statusColor =
    entry.status ===
    'completed'
      ? 'bg-green-500/10 text-green-500'
      : entry.status ===
        'inprogress'
      ? 'bg-blue-500/10 text-blue-500'
      : 'bg-yellow-500/10 text-yellow-500';

  return (
    <div
      className="
        grid
        md:grid-cols-5
        gap-4
        px-6
        py-5
        hover:bg-secondary/40
        transition-all
      "
    >

      {/* TASK */}

      <div className="font-medium">

        {entry.task}
      </div>

      {/* PROJECT */}

      <div className="text-muted-foreground">

        {entry.project}
      </div>

      {/* DURATION */}

      <div>
        {entry.duration}h
      </div>

      {/* STATUS */}

      <div>

        <span
          className={`
            px-3
            py-1
            rounded-full
            text-xs
            font-semibold
            capitalize
            ${statusColor}
          `}
        >
          {entry.status}
        </span>
      </div>

      {/* ACTIONS */}

      <div className="flex justify-end">

        <button
          onClick={() =>
            onDelete(
              entry.id
            )
          }
          className="
            w-9
            h-9
            rounded-xl
            hover:bg-red-500/10
            text-red-500
            flex
            items-center
            justify-center
            transition-all
          "
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}