import { Plus } from 'lucide-react';

import {
  DragDropContext,
  Droppable,
} from '@hello-pangea/dnd';

import type { DropResult } from '@hello-pangea/dnd';

import TaskCard from '../TaskCard';

interface KanbanViewProps {
  columns: Array<{ id: string; title: string }>;
  filteredTasks: any[];
  onDragEnd: (result: DropResult) => void;
  onAddTask: (columnId: string) => void;
  onEditTask?: (updatedTask: any) => Promise<void>;
  onDeleteTask?: (taskId: string) => Promise<void>;
  onPriorityChange?: (taskId: string, priority: string) => Promise<void>;
}

export default function KanbanView({
  columns,
  filteredTasks,
  onDragEnd,
  onAddTask,
}: KanbanViewProps) {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="w-full h-full overflow-x-auto overflow-y-auto scrollbar-hide">
        <div className="flex gap-6 p-4 md:p-6 min-w-max min-h-full">
          {columns.map((column) => {
            const columnTasks = filteredTasks.filter(
              (task) => task.status === column.id
            );

            return (
              <div
                key={column.id}
                className="w-[280px] sm:w-[320px] lg:w-[340px] shrink-0 flex flex-col"
              >
                {/* HEADER */}
                <div className="flex items-center justify-between mb-4 px-1">
                  <div className="flex items-center gap-3">
                    <h2 className="font-bold text-xl">{column.title}</h2>
                    <span className="w-7 h-7 rounded-full bg-secondary text-muted-foreground flex items-center justify-center text-xs font-bold">
                      {columnTasks.length}
                    </span>
                  </div>

                  {/* ADD */}
                  <button
                    onClick={() => onAddTask(column.id)}
                    className="w-9 h-9 rounded-full border border-dashed border-border flex items-center justify-center text-muted-foreground hover:text-white hover:border-primary hover:bg-primary/10 transition-all"
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
                        min-h-[300px]
                        flex flex-col gap-4 rounded-2xl transition-all duration-200
                        ${
                          snapshot.isDraggingOver
                            ? 'bg-secondary/30 p-2 outline outline-2 outline-primary/30'
                            : ''
                        }
                      `}
                    >
                      {columnTasks.map((task, index) => (
                        <TaskCard
                          key={task._id}
                          task={task}
                          index={index}
                          view="kanban"
                        />
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </div>
    </DragDropContext>
  );
}
