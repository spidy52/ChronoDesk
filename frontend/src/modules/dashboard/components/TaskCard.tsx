import {
  Calendar,
  Trash2,
  Check,
  Pencil,
} from 'lucide-react';

import {
  useState,
} from 'react';

import { Draggable } from '@hello-pangea/dnd';

import { useTaskStore } from '../../../store/useTaskStore';

/* ================= TYPES ================= */

interface Task {
  _id: string;

  title: string;

  description: string;

  status: string;

  priority:
    | 'low'
    | 'medium'
    | 'high';

  dueDate?: string;
}

interface TaskCardProps {
  task: Task;

  index: number;

  view?:
    | 'kanban'
    | 'grid'
    | 'list';
}

/* ================= COMPONENT ================= */

export default function TaskCard({
  task,
  index,
  view = 'kanban',
}: TaskCardProps) {
  const {
    deleteTaskById,
    updateTaskById,
  } = useTaskStore();

  /* ================= EDIT MODE ================= */

  const [editing, setEditing] =
    useState(false);

  const [title, setTitle] =
    useState(task.title);

  const [
    description,
    setDescription,
  ] = useState(
    task.description
  );

  /* ================= PRIORITY COLORS ================= */

  const getPriorityClasses = (
    priority: string
  ) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/10 text-red-500 border-red-500/20';

      case 'medium':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';

      case 'low':
        return 'bg-green-500/10 text-green-500 border-green-500/20';

      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  /* ================= SAVE ================= */

  const handleSave =
    async () => {
      await updateTaskById(
        task._id,
        {
          title,
          description,
        }
      );

      setEditing(false);
    };

  /* ================= DELETE ================= */

  const handleDelete =
    async () => {
      await deleteTaskById(
        task._id
      );
    };

  /* ================= PRIORITY ================= */

  const cyclePriority =
    async () => {
      const next =
        task.priority === 'low'
          ? 'medium'
          : task.priority ===
            'medium'
          ? 'high'
          : 'low';

      await updateTaskById(
        task._id,
        {
          priority: next,
        }
      );
    };

  /* ================= CARD CONTENT ================= */

  const content = (
    <div
      className={`
        bg-card
        border
        rounded-2xl
        p-5
        shadow-sm
        hover:shadow-md
        hover:border-primary/50
        transition-all
        group
        w-full

        ${
          view === 'list'
            ? 'flex items-center justify-between gap-5'
            : ''
        }
      `}
    >

      {/* LEFT */}

      <div className="flex-1">

        {/* HEADER */}

        <div className="flex items-start justify-between gap-3 mb-3">

          {/* TITLE */}

          <div className="flex-1">

            {editing ? (
              <input
                value={title}
                onChange={(e) =>
                  setTitle(
                    e.target.value
                  )
                }
                className="w-full bg-secondary rounded-xl px-3 py-2 outline-none text-sm font-semibold"
              />
            ) : (
              <h3
                className={`
                  font-bold text-foreground leading-tight

                  ${
                    view ===
                    'grid'
                      ? 'text-xl'
                      : 'text-base'
                  }
                `}
              >
                {task.title}
              </h3>
            )}
          </div>

          {/* ACTIONS */}

          <div className="flex items-center gap-2">

            {editing ? (
              <button
                onClick={
                  handleSave
                }
                className="text-green-500 hover:scale-110 transition-all"
              >
                <Check
                  size={16}
                />
              </button>
            ) : (
              <button
                onClick={() =>
                  setEditing(
                    true
                  )
                }
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Pencil
                  size={16}
                />
              </button>
            )}

            <button
              onClick={
                handleDelete
              }
              className="text-muted-foreground hover:text-red-500 transition-colors"
            >
              <Trash2
                size={16}
              />
            </button>
          </div>
        </div>

        {/* DESCRIPTION */}

        {editing ? (
          <textarea
            value={description}
            onChange={(e) =>
              setDescription(
                e.target.value
              )
            }
            className="w-full min-h-[90px] bg-secondary rounded-xl px-3 py-3 outline-none text-sm resize-none mb-5"
          />
        ) : (
          <p
            className={`
              text-sm text-muted-foreground leading-relaxed break-words

              ${
                view ===
                'list'
                  ? 'line-clamp-1'
                  : view ===
                    'grid'
                  ? 'line-clamp-5'
                  : 'line-clamp-3'
              }

              mb-5
            `}
          >
            {task.description}
          </p>
        )}

        {/* PRIORITY */}

        <div className="flex flex-wrap gap-2 mb-5">

          <button
            onClick={
              cyclePriority
            }
            className={`text-[10px] font-bold px-2 py-1 rounded-md border uppercase tracking-wider transition-all hover:scale-105 ${getPriorityClasses(
              task.priority
            )}`}
          >
            {task.priority}
          </button>

          <span className="text-[10px] font-bold px-2 py-1 rounded-md border uppercase tracking-wider bg-primary/10 text-primary border-primary/20">

            {task.status}
          </span>
        </div>

        {/* FOOTER */}

        <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50">

          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">

            <Calendar
              size={14}
            />

            <span>
              {task.dueDate
                ? new Date(
                    task.dueDate
                  ).toLocaleDateString()
                : 'No due date'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  /* ================= LIST/GRID ================= */

  if (view !== 'kanban') {
    return content;
  }

  /* ================= KANBAN ================= */

  return (
    <Draggable
      draggableId={task._id}
      index={index}
    >
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            ...provided
              .draggableProps.style,
          }}
          className={
            snapshot.isDragging
              ? 'rotate-2 z-50'
              : ''
          }
        >
          {content}
        </div>
      )}
    </Draggable>
  );
}