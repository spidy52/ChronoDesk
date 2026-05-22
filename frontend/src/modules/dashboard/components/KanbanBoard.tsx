import { useEffect } from 'react';

import type { DropResult } from '@hello-pangea/dnd';

import { useTaskStore } from '../../../store/useTaskStore';

import { useWorkspaceStore } from '../../../store/workspaceStore';

import KanbanView from './tasks/KanbanView';

import GridView from './tasks/GridView';

import ListView from './tasks/ListView';

/* ================= COLUMNS ================= */

const columns = [
  {
    id: 'todo',
    title: 'Todo',
  },

  {
    id: 'inprogress',
    title: 'In Progress',
  },

  {
    id: 'review',
    title: 'Review',
  },

  {
    id: 'completed',
    title: 'Completed',
  },
];

export default function KanbanBoard({
  boardView,
  activeFilter,
  searchTerm,
}: {
  boardView:
    | 'list'
    | 'grid'
    | 'kanban';

  activeFilter: string | null;

  searchTerm: string;
}) {

  const {
    tasks,
    fetchAllTasks,
    updateTaskById,
    addTask,
    deleteTaskById,
  } = useTaskStore();

  const {
    activeWorkspace,
  } = useWorkspaceStore();

  /* ================= FETCH ================= */

  useEffect(() => {
    fetchAllTasks();
  }, []);

  /* ================= FILTER ================= */

  const filteredTasks =
    tasks.filter((task) => {

      const currentWorkspaceId = activeWorkspace?._id || 'default';
      const matchesWorkspace = task.workspaceId === currentWorkspaceId;

      const matchesFilter =
        !activeFilter ||
        task.priority ===
          activeFilter;

      const matchesSearch =
        task.title
          .toLowerCase()
          .includes(
            searchTerm.toLowerCase()
          ) ||

        task.description
          .toLowerCase()
          .includes(
            searchTerm.toLowerCase()
          );

      return (
        matchesWorkspace &&
        matchesFilter &&
        matchesSearch
      );
    });

  /* ================= DRAG ================= */

  const onDragEnd = async (
    result: DropResult
  ) => {

    const {
      destination,
      draggableId,
    } = result;

    if (!destination) return;

    await updateTaskById(
      draggableId,
      {
        status:
          destination.droppableId,
      }
    );
  };

  /* ================= ADD ================= */

  const handleAddTask = (
    columnId: string
  ) => {

    addTask({
      title: 'New Task',

      description: '',

      status: columnId,

      priority: 'medium',

      workspaceId:
        activeWorkspace?._id ||
        'default',
    });
  };

  /* ================= EDIT ================= */

  const handleEditTask =
    async (
      updatedTask: any
    ) => {

      await updateTaskById(
        updatedTask._id,
        updatedTask
      );
    };

  /* ================= DELETE ================= */

  const handleDeleteTask =
    async (
      taskId: string
    ) => {

      await deleteTaskById(
        taskId
      );
    };

  /* ================= PRIORITY ================= */

  const handlePriorityChange =
    async (
      taskId: string,
      priority: string
    ) => {

      await updateTaskById(
        taskId,
        { priority }
      );
    };

  return (
    <div className="w-full h-full overflow-hidden">

      {/* ================= KANBAN ================= */}

      {boardView ===
      'kanban' ? (

        <KanbanView
          columns={columns}

          filteredTasks={
            filteredTasks
          }

          onDragEnd={onDragEnd}

          onAddTask={
            handleAddTask
          }

          onEditTask={
            handleEditTask
          }

          onDeleteTask={
            handleDeleteTask
          }

          onPriorityChange={
            handlePriorityChange
          }
        />

      ) : boardView ===
        'grid' ? (

        <GridView
          columns={columns}

          filteredTasks={
            filteredTasks
          }

          onAddTask={
            handleAddTask
          }

          onEditTask={
            handleEditTask
          }

          onDeleteTask={
            handleDeleteTask
          }

          onPriorityChange={
            handlePriorityChange
          }
        />

      ) : (

        <ListView
          columns={columns}

          filteredTasks={
            filteredTasks
          }

          onAddTask={
            handleAddTask
          }

          onEditTask={
            handleEditTask
          }

          onDeleteTask={
            handleDeleteTask
          }

          onPriorityChange={
            handlePriorityChange
          }
        />
      )}
    </div>
  );
}