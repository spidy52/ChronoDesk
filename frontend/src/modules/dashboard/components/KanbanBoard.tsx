import { Plus } from 'lucide-react';

import {
  DragDropContext,
  Droppable,
} from '@hello-pangea/dnd';

import type { DropResult } from '@hello-pangea/dnd';

import TaskCard from './TaskCard';
import { useBoardStore } from '../store/boardStore';

export default function KanbanBoard({
  boardView,
  activeFilter,
}: {
  boardView: 'list' | 'grid' | 'kanban';

  activeFilter: string | null;
}) {
  const {
    tasks,
    columns,
    columnOrder,
    moveTask,
  } = useBoardStore();

  const onDragEnd = (
    result: DropResult
  ) => {
    const {
      destination,
      source,
      draggableId,
    } = result;

    if (!destination) return;

    if (
      destination.droppableId ===
        source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    moveTask(
      draggableId,
      source.droppableId,
      destination.droppableId,
      source.index,
      destination.index
    );
  };

  return (
    <div className="w-full h-full overflow-auto p-6">

      <DragDropContext onDragEnd={onDragEnd}>

        <div
          className={
            boardView === 'kanban'
              ? 'grid grid-flow-col auto-cols-[320px] gap-6 min-w-full items-start'
              : boardView === 'grid'
              ? 'grid grid-cols-3 gap-6'
              : 'flex flex-col gap-6'
          }
        >

          {columnOrder.map((colId) => {
            const column = columns[colId];

            const columnTasks =
              column.taskIds
                .map(
                  (taskId) => tasks[taskId]
                )
                .filter(Boolean)
                .filter((task) => {
                  if (!activeFilter)
                    return true;

                  return task.tags.some(
                    (tag: any) =>
                      tag.label ===
                      activeFilter
                  );
                });

            return (
              <KanbanColumn
                key={column.id}
                column={column}
                tasks={columnTasks}
              />
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}

function KanbanColumn({
  column,
  tasks,
}: {
  column: any;
  tasks: any[];
}) {
  const { addTask } = useBoardStore();

  const handleAddTask = () => {
    addTask(column.id, {
      title: 'New Task',
      description:
        'Double click to edit this task.',
      tags: [
        {
          label: 'New',
          color: 'red',
        },
      ],
      date: 'Today',
      assignees: [],
    });
  };

  return (
    <div className="w-[320px] shrink-0 flex flex-col">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-5">

        <div className="flex items-center gap-3">

          <h2 className="font-bold text-lg">
            {column.title}
          </h2>

          <span className="w-6 h-6 rounded-full bg-secondary text-muted-foreground flex items-center justify-center text-xs font-bold">
            {tasks.length}
          </span>
        </div>

        <button
          onClick={handleAddTask}
          className="text-muted-foreground hover:text-foreground transition-all border border-dashed border-border rounded-full p-1 hover:border-primary hover:bg-primary/10"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* DROPPABLE */}
      <Droppable droppableId={column.id}>

        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`
              min-h-[200px]
              flex flex-col gap-4
              rounded-2xl
              transition-all duration-200
              pb-4
              ${
                snapshot.isDraggingOver
                  ? 'bg-secondary/40 p-2 outline outline-2 outline-primary/30'
                  : ''
              }
            `}
          >

            {tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
              />
            ))}

            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}