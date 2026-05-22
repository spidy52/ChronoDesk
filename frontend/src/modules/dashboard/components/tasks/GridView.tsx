import { Plus } from 'lucide-react';

import TaskCard from '../TaskCard';

interface GridViewProps {
  columns: Array<{ id: string; title: string }>;
  filteredTasks: any[];
  onAddTask: (columnId: string) => void;
  onEditTask?: (updatedTask: any) => Promise<void>;
  onDeleteTask?: (taskId: string) => Promise<void>;
  onPriorityChange?: (taskId: string, priority: string) => Promise<void>;
}

export default function GridView({
  columns,
  filteredTasks,
  onAddTask,
}: GridViewProps) {
  return (
    <div className="h-full overflow-y-auto p-4 md:p-6">
      <div className="flex flex-col gap-8">
        {columns.map((column) => {
          const columnTasks = filteredTasks.filter(
            (task) => task.status === column.id
          );

          return (
            <div key={column.id}>
              {/* SECTION HEADER */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="font-bold text-2xl">{column.title}</h2>
                  <span className="w-7 h-7 rounded-full bg-secondary text-muted-foreground flex items-center justify-center text-xs font-bold">
                    {columnTasks.length}
                  </span>
                </div>

                {/* ADD BUTTON */}
                <button
                  onClick={() => onAddTask(column.id)}
                  className="w-9 h-9 rounded-full border border-dashed border-border flex items-center justify-center text-muted-foreground hover:text-white hover:border-primary hover:bg-primary/10 transition-all"
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
                {columnTasks.map((task, index) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    index={index}
                    view="grid"
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
