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

      let matchesFilter = true;
      if (activeFilter) {
        const selectedFilters = activeFilter.split(',').filter(Boolean);
        if (selectedFilters.length > 0) {
          const priorityFilters = selectedFilters.filter(f => ['low', 'medium', 'high'].includes(f));
          const statusFilters = selectedFilters.filter(f => ['todo', 'inprogress', 'in-progress', 'review', 'complete', 'completed'].includes(f));

          const matchesPriority = priorityFilters.length === 0 || priorityFilters.includes(task.priority?.toLowerCase() || '');
          
          const taskStatus = task.status?.toLowerCase() || '';
          const matchesStatus = statusFilters.length === 0 || statusFilters.some(sf => {
            if (sf === 'inprogress' || sf === 'in-progress') return taskStatus === 'inprogress' || taskStatus === 'in-progress';
            if (sf === 'complete' || sf === 'completed') return taskStatus === 'complete' || taskStatus === 'completed';
            return taskStatus === sf;
          });

          matchesFilter = matchesPriority && matchesStatus;
        }
      }

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