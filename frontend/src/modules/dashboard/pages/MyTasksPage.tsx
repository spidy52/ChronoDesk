import {
  useEffect,
} from 'react';

import DashboardLayout from '../../../layouts/DashboardLayout';

import {
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Clock4,
  Circle,
} from 'lucide-react';

import { useTaskStore } from '../../../store/useTaskStore';

/* ================= PAGE ================= */

export default function MyTasksPage() {

  const {
    tasks,
    fetchAllTasks,
    addTask,
    deleteTaskById,
  } = useTaskStore();

  /* ================= FETCH ================= */

  useEffect(() => {

    const loadTasks =
      async () => {
        await fetchAllTasks();
      };

    loadTasks();

  }, []);

  /* ================= ADD TASK ================= */

  const handleAddTask =
    async () => {

      await addTask({
        title: 'New Task',

        description:
          'Task description',

        status: 'todo',

        priority: 'medium',
      });

      await fetchAllTasks();
    };

  return (
    <DashboardLayout>

      <div className="p-4 md:p-8 overflow-y-auto h-full scrollbar-hide">

        {/* ================= HEADER ================= */}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-8">

          <div>

            <h1 className="text-4xl font-bold">
              My Tasks
            </h1>

            <p className="text-muted-foreground mt-2">
              Manage your tasks and workflow.
            </p>
          </div>

          {/* ADD TASK */}

          <button
            onClick={
              handleAddTask
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
              hover:opacity-90
              transition-all
              shadow-lg
            "
          >

            <Plus size={18} />

            Add Task
          </button>
        </div>

        {/* ================= STATS ================= */}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">

          <StatCard
            title="Total Tasks"
            value={tasks.length.toString()}
            icon={<Circle size={20} />}
          />

          <StatCard
            title="Completed"
            value={
              tasks
                .filter(
                  (t) =>
                    t.status ===
                    'completed'
                )
                .length
                .toString()
            }
            icon={
              <CheckCircle2 size={20} />
            }
          />

          <StatCard
            title="Pending"
            value={
              tasks
                .filter(
                  (t) =>
                    t.status ===
                      'todo' ||
                    t.status ===
                      'inprogress'
                )
                .length
                .toString()
            }
            icon={
              <AlertCircle size={20} />
            }
          />

          <StatCard
            title="Review"
            value={
              tasks
                .filter(
                  (t) =>
                    t.status ===
                    'review'
                )
                .length
                .toString()
            }
            icon={
              <Clock4 size={20} />
            }
          />
        </div>

        {/* ================= TASK TABLE ================= */}

        <div
          className="
            bg-card
            border
            rounded-3xl
            overflow-hidden
            shadow-sm
          "
        >

          {/* TABLE HEADER */}

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

            <div>Priority</div>

            <div>Status</div>

            <div>Due Date</div>

            <div className="text-right">
              Actions
            </div>
          </div>

          {/* EMPTY */}

          {tasks.length === 0 && (

            <div className="p-16 text-center">

              <h2 className="text-2xl font-bold mb-3">
                No Tasks Found
              </h2>

              <p className="text-muted-foreground mb-6">
                Create your first task.
              </p>

              <button
                onClick={
                  handleAddTask
                }
                className="
                  bg-primary
                  text-primary-foreground
                  px-5
                  py-3
                  rounded-2xl
                "
              >
                Create Task
              </button>
            </div>
          )}

          {/* TASKS */}

          <div className="divide-y">

            {tasks

              .sort((a, b) => {

                if (!a.dueDate)
                  return 1;

                if (!b.dueDate)
                  return -1;

                return (
                  new Date(
                    a.dueDate
                  ).getTime() -
                  new Date(
                    b.dueDate
                  ).getTime()
                );
              })

              .map((task) => (

                <TaskRow
                  key={task._id}
                  task={task}
                  onDelete={
                    deleteTaskById
                  }
                />
              ))}
          </div>
        </div>

        {/* ================= PROGRESS ================= */}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-8">

          {/* COMPLETION */}

          <div
            className="
              bg-card
              border
              rounded-3xl
              p-6
              shadow-sm
            "
          >

            <h2 className="text-xl font-bold mb-6">
              Task Completion
            </h2>

            <ProgressItem
              label="Completed"
              percent={
                tasks.length > 0
                  ? Math.round(
                      (
                        tasks.filter(
                          (t) =>
                            t.status ===
                            'completed'
                        ).length /
                        tasks.length
                      ) * 100
                    )
                  : 0
              }
            />
          </div>

          {/* PENDING */}

          <div
            className="
              bg-card
              border
              rounded-3xl
              p-6
              shadow-sm
            "
          >

            <h2 className="text-xl font-bold mb-6">
              Pending Tasks
            </h2>

            <ProgressItem
              label="Pending"
              percent={
                tasks.length > 0
                  ? Math.round(
                      (
                        tasks.filter(
                          (t) =>
                            t.status ===
                              'todo' ||
                            t.status ===
                              'inprogress'
                        ).length /
                        tasks.length
                      ) * 100
                    )
                  : 0
              }
            />
          </div>

          {/* REVIEW */}

          <div
            className="
              bg-card
              border
              rounded-3xl
              p-6
              shadow-sm
            "
          >

            <h2 className="text-xl font-bold mb-6">
              In Review
            </h2>

            <ProgressItem
              label="Review"
              percent={
                tasks.length > 0
                  ? Math.round(
                      (
                        tasks.filter(
                          (t) =>
                            t.status ===
                            'review'
                        ).length /
                        tasks.length
                      ) * 100
                    )
                  : 0
              }
            />
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

/* ================= TASK ROW ================= */

function TaskRow({
  task,
  onDelete,
}: any) {

  const priorityColor =
    task.priority === 'high'
      ? 'bg-red-500/10 text-red-500'
      : task.priority ===
        'medium'
      ? 'bg-yellow-500/10 text-yellow-500'
      : 'bg-green-500/10 text-green-500';

  const statusColor =
    task.status ===
    'completed'
      ? 'bg-green-500/10 text-green-500'
      : task.status ===
        'review'
      ? 'bg-purple-500/10 text-purple-500'
      : task.status ===
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
        hover:bg-secondary/30
        transition-all
      "
    >

      {/* TASK */}

      <div className="font-semibold">

        {task.title}

        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">

          {task.description}
        </p>
      </div>

      {/* PRIORITY */}

      <div>

        <span
          className={`
            px-3
            py-1
            rounded-full
            text-xs
            font-semibold
            capitalize
            ${priorityColor}
          `}
        >
          {task.priority}
        </span>
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
          {task.status}
        </span>
      </div>

      {/* DATE */}

      <div className="text-sm text-muted-foreground">

        {task.dueDate
          ? new Date(
              task.dueDate
            ).toLocaleDateString()
          : 'No due date'}
      </div>

      {/* ACTIONS */}

      <div className="flex items-center justify-end gap-3">

        <button
          onClick={() =>
            onDelete(task._id)
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

/* ================= PROGRESS ITEM ================= */

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
            duration-500
          "
          style={{
            width: `${percent}%`,
          }}
        />
      </div>
    </div>
  );
}