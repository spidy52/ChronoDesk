import { Plus } from 'lucide-react';

interface ColumnSectionProps {
  id: string;
  title: string;
  taskCount: number;
  onAddTask: () => void;
  children: React.ReactNode;
}

export default function ColumnSection({
  id,
  title,
  taskCount,
  onAddTask,
  children,
}: ColumnSectionProps) {
  return (
    <div key={id}>
      {/* SECTION HEADER */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="font-bold text-2xl">{title}</h2>
          <span className="w-7 h-7 rounded-full bg-secondary text-muted-foreground flex items-center justify-center text-xs font-bold">
            {taskCount}
          </span>
        </div>

        {/* ADD BUTTON */}
        <button
          onClick={onAddTask}
          className="w-9 h-9 rounded-full border border-dashed border-border flex items-center justify-center text-muted-foreground hover:text-white hover:border-primary hover:bg-primary/10 transition-all"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* CHILDREN */}
      {children}
    </div>
  );
}
