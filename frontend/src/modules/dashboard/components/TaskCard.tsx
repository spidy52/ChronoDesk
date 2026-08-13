import {
  Calendar,
  Trash2,
  Check,
  Pencil,
  Flag,
  Plus,
  ExternalLink,
  GripVertical,
  X,
} from 'lucide-react';

import {
  useState,
} from 'react';

import { useNavigate } from 'react-router-dom';
import { Draggable } from '@hello-pangea/dnd';
import toast from 'react-hot-toast';


import { useTaskStore } from '../../../store/useTaskStore';
import { useAuthStore } from '../../auth/store';
import InviteCollaboratorModal from './modals/InviteCollaboratorModal';

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

  workspaceId?: string;

  assignee?: any;

  createdBy?: any;

  collaborators?: any[];
  pendingCollaborators?: any[];
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

  const { user } = useAuthStore();
  const navigate = useNavigate();

  const taskCreatorId = task.createdBy?._id || task.createdBy;
  const currentUserId = user?.id || user?._id;
  const isCreator = !!(taskCreatorId && currentUserId && taskCreatorId.toString() === currentUserId.toString());

  /* ================= STATES ================= */

  const [editing, setEditing] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const [title, setTitle] =
    useState(task.title);

  const [
    description,
    setDescription,
  ] = useState(
    task.description
  );

  const [dueDate, setDueDate] =
    useState(
      task.dueDate
        ? new Date(
            task.dueDate
          )
            .toISOString()
            .split('T')[0]
        : ''
    );

  const [localCollaborators, setLocalCollaborators] = useState<any[]>([]);
  const [localPendingCollaborators, setLocalPendingCollaborators] = useState<any[]>([]);

  /* ================= PRIORITY COLORS ================= */

  const getPriorityClasses = (
    priority: string
  ) => {

    switch (priority) {

      case 'high':
        return `
          bg-red-500/10
          text-red-500
          border-red-500/20
        `;

      case 'medium':
        return `
          bg-orange-500/10
          text-orange-500
          border-orange-500/20
        `;

      case 'low':
        return `
          bg-green-500/10
          text-green-500
          border-green-500/20
        `;

      default:
        return `
          bg-gray-500/10
          text-gray-500
          border-gray-500/20
        `;
    }
  };

  /* ================= SAVE ================= */

  const handleSave =
    async () => {

      try {

        setLoading(true);

        const collaboratorIds = localCollaborators.map((c) => c._id || c);
        const pendingCollaboratorIds = localPendingCollaborators.map((c) => c._id || c);

        await updateTaskById(
          task._id,
          {
            title,

            description,

            dueDate,

            collaborators: collaboratorIds,

            pendingCollaborators: pendingCollaboratorIds,
          }
        );

        setEditing(false);

      } catch (error) {

        console.error(error);

      } finally {

        setLoading(false);
      }
    };

  /* ================= DELETE ================= */

  const handleDelete =
    async () => {

      try {

        await deleteTaskById(
          task._id
        );

      } catch (error) {

        console.error(error);
      }
    };

  /* ================= PRIORITY ================= */

  const cyclePriority =
    async () => {

      try {

        const next =
          task.priority ===
          'low'
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

      } catch (error) {

        console.error(error);
      }
    };

  /* ================= DATE ================= */

  const handleDateChange =
    async (
      value: string
    ) => {

      try {

        setDueDate(value);

        await updateTaskById(
          task._id,
          {
            dueDate: value,
          }
        );

      } catch (error) {

        console.error(error);
      }
    };

  /* ================= CONTENT ================= */

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const interactive = target.closest('button, input, select, textarea, a, [role="button"]');
    if (editing || (interactive && e.currentTarget.contains(interactive))) {
      return;
    }
    navigate(`/board/${task._id}`);
  };

  const renderContent = (dragHandleProps: any) => (
    <div
      onClick={handleCardClick}
      className={`
        cursor-pointer
        bg-card/95
        backdrop-blur-sm
        border
        border-border/60
        rounded-3xl
        p-5
        shadow-sm
        hover:shadow-xl
        hover:border-primary/40
        transition-all
        duration-300
        group
        w-full
        overflow-hidden

        ${
          view === 'list'
            ? `
              flex
              flex-col
              sm:flex-row
              sm:items-center
              sm:justify-between
              gap-5
            `
            : ''
        }
      `}
    >

      {/* MAIN */}

      <div className="flex-1 min-w-0">

        {/* TOP */}

        <div className="flex items-start justify-between gap-3 mb-4">
          {view === 'kanban' && dragHandleProps && (
            <div
              {...dragHandleProps}
              className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-all shrink-0 p-1 rounded-md hover:bg-secondary/80 flex items-center justify-center"
              title="Drag Task"
            >
              <GripVertical size={16} />
            </div>
          )}

          {/* TITLE */}

          <div className="flex-1 min-w-0">

            {editing ? (

              <input
                value={title}
                onChange={(e) =>
                  setTitle(
                    e.target.value
                  )
                }
                className="
                  w-full
                  bg-secondary/70
                  rounded-xl
                  px-3
                  py-2
                  outline-none
                  text-sm
                  font-semibold
                  border
                  border-border
                "
              />

            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/board/${task._id}`);
                }}
                className={`
                  text-left
                  font-bold
                  text-foreground
                  leading-tight
                  break-words
                  hover:text-primary
                  hover:underline
                  transition-all
                  block
                  w-full
                  cursor-pointer

                  ${
                    view ===
                    'grid'
                      ? 'text-xl'
                      : 'text-base'
                  }
                `}
              >
                {task.title}
              </button>
            )}
          </div>

          {/* ACTIONS */}

          <div className="flex items-center gap-2 shrink-0">

            {editing ? (

              <div className="flex items-center gap-1.5">
                <button
                  onClick={
                    handleSave
                  }
                  disabled={loading}
                  className="
                    w-8
                    h-8
                    rounded-full
                    bg-green-500/10
                    flex
                    items-center
                    justify-center
                    text-green-500
                    hover:scale-110
                    transition-all
                    cursor-pointer
                  "
                  title="Save Changes"
                >
                  <Check
                    size={16}
                  />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setTitle(task.title);
                    setDescription(task.description);
                    setEditing(false);
                  }}
                  disabled={loading}
                  className="
                    w-8
                    h-8
                    rounded-full
                    bg-red-500/10
                    flex
                    items-center
                    justify-center
                    text-red-500
                    hover:scale-110
                    transition-all
                    cursor-pointer
                  "
                  title="Cancel Edit"
                >
                  <X
                    size={16}
                  />
                </button>
              </div>

            ) : (

              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/board/${task._id}`);
                  }}
                  className="
                    w-8
                    h-8
                    rounded-full
                    hover:bg-primary/10
                    flex
                    items-center
                    justify-center
                    text-muted-foreground
                    hover:text-primary
                    transition-all
                  "
                  title="Open Whiteboard"
                >
                  <ExternalLink size={16} />
                </button>
                <button
                  onClick={() => {
                    setLocalCollaborators(task.collaborators || []);
                    setLocalPendingCollaborators(task.pendingCollaborators || []);
                    setEditing(true);
                  }}
                  className="
                    w-8
                    h-8
                    rounded-full
                    hover:bg-primary/10
                    flex
                    items-center
                    justify-center
                    text-muted-foreground
                    hover:text-primary
                    transition-all
                  "
                  title="Edit Task"
                >
                  <Pencil
                    size={16}
                  />
                </button>
              </>
            )}

            {isCreator && (
              <button
                onClick={
                  handleDelete
                }
                className="
                  w-8
                  h-8
                  rounded-full
                  hover:bg-red-500/10
                  flex
                  items-center
                  justify-center
                  text-muted-foreground
                  hover:text-red-500
                  transition-all
                "
              >
                <Trash2
                  size={16}
                />
              </button>
            )}
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
            className="
              w-full
              min-h-[90px]
              bg-secondary/70
              rounded-2xl
              px-4
              py-3
              outline-none
              text-sm
              resize-none
              border
              border-border
              mb-5
            "
          />

        ) : (

          <p
            className={`
              text-sm
              text-muted-foreground
              leading-relaxed
              break-words

              ${
                view ===
                'list'
                  ? 'line-clamp-1'
                  : view ===
                    'grid'
                  ? 'line-clamp-5'
                  : 'line-clamp-4'
              }

              mb-5
            `}
          >
            {task.description}
          </p>
        )}

        {/* TAGS */}

        <div className="flex flex-wrap items-center gap-2 mb-5">

          {/* PRIORITY */}

          <button
            onClick={
              cyclePriority
            }
            className={`
              flex
              items-center
              gap-1
              text-[10px]
              font-bold
              px-3
              py-1.5
              rounded-full
              border
              uppercase
              tracking-wider
              transition-all
              hover:scale-105

              ${getPriorityClasses(
                task.priority
              )}
            `}
          >
            <Flag
              size={10}
            />

            {task.priority}
          </button>

          {/* STATUS */}

          <span
            className="
              text-[10px]
              font-bold
              px-3
              py-1.5
              rounded-full
              border
              uppercase
              tracking-wider
              bg-primary/10
              text-primary
              border-primary/20
            "
          >
            {task.status}
          </span>
        </div>

        {/* EDIT COLLABORATORS (Only when editing and isCreator) */}
        {editing && isCreator && ((localCollaborators && localCollaborators.length > 0) || (localPendingCollaborators && localPendingCollaborators.length > 0)) && (
          <div className="mb-4">
            <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
              Remove Collaborators
            </label>
            <div className="bg-secondary/30 rounded-xl p-2 border border-border/40 space-y-1.5 max-h-[120px] overflow-y-auto custom-scrollbar">
              {localCollaborators.map((collab: any) => (
                <div key={collab._id} className="flex items-center justify-between bg-card border border-border/30 rounded-lg p-1.5">
                  <span className="text-xs text-foreground font-semibold truncate max-w-[150px]">
                    {collab.name}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setLocalCollaborators((prev) => prev.filter((c) => (c._id || c) !== (collab._id || collab)));
                      toast.success('Collaborator marked for removal');
                    }}
                    className="p-1 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors shrink-0 cursor-pointer border border-transparent hover:border-red-500/20"
                    title="Remove Collaborator"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              {localPendingCollaborators.map((collab: any) => (
                <div key={collab._id} className="flex items-center justify-between bg-card border border-border/30 rounded-lg p-1.5 opacity-80">
                  <span className="text-xs text-foreground font-semibold truncate max-w-[150px]">
                    {collab.name} <span className="text-[10px] text-amber-500 font-normal">(Pending)</span>
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setLocalPendingCollaborators((prev) => prev.filter((c) => (c._id || c) !== (collab._id || collab)));
                      toast.success('Collaborator invitation marked for cancellation');
                    }}
                    className="p-1 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors shrink-0 cursor-pointer border border-transparent hover:border-red-500/20"
                    title="Cancel Invitation"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FOOTER */}

        <div
          className="
            flex
            items-center
            justify-between
            pt-4
            border-t
            border-border/50
          "
        >

          {/* DATE */}

          <div
            className="
              flex
              items-center
              gap-2
              text-xs
              font-medium
              text-muted-foreground
            "
          >
            <Calendar
              size={14}
            />

            <input
              type="date"

              value={dueDate}

              onChange={(e) =>
                handleDateChange(
                  e.target.value
                )
              }

              className="
                bg-secondary/40
                px-2
                py-1
                rounded-lg
                outline-none
                cursor-pointer
                text-xs
                border
                border-border/40
                hover:border-primary/40
                transition-all
              "
            />
          </div>

          <div className="flex items-center -space-x-2">
            {[task.createdBy, ...(task.collaborators || [])]
              .filter(Boolean)
              .filter((m, i, arr) => arr.findIndex(t => (t._id || t) === (m._id || m)) === i)
              .filter((m) => (m._id || m) !== user?.id)
              .map((collab, i) => (
              <div 
                key={collab._id || i}
                className="w-7 h-7 rounded-full border-2 border-card bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary z-10"
                title={collab.name || 'User'}
              >
                {collab.name?.charAt(0) || 'U'}
              </div>
            ))}
            
            {isCreator && (
              <button
                onClick={() => setIsInviteModalOpen(true)}
                className="w-7 h-7 rounded-full border-2 border-card bg-secondary hover:bg-primary/20 hover:text-primary flex items-center justify-center text-muted-foreground transition-all z-20"
                title="Add Collaborator"
              >
                <Plus size={12} />
              </button>
            )}
          </div>
        </div>
      </div>
      
      {isInviteModalOpen && (
        <InviteCollaboratorModal 
          task={task} 
          onClose={() => setIsInviteModalOpen(false)} 
        />
      )}
    </div>
  );

  /* ================= LIST / GRID ================= */

  if (view !== 'kanban') {
    return renderContent(null);
  }

  /* ================= KANBAN ================= */

  return (
    <Draggable
      draggableId={task._id}
      index={index}
    >
      {(provided, snapshot) => (

        <div
          ref={
            provided.innerRef
          }

          {...provided.draggableProps}

          style={{
            ...provided
              .draggableProps
              .style,
          }}

          className={
            snapshot.isDragging
              ? `
                rotate-2
                z-50
                scale-[1.02]
              `
              : ''
          }
        >
          {renderContent(provided.dragHandleProps)}
        </div>
      )}
    </Draggable>
  );
}