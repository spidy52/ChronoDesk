import { Calendar } from 'lucide-react';
import { Draggable } from '@hello-pangea/dnd';

export interface TaskTag {
  label: string;
  color: 'red' | 'green' | 'blue' | 'purple' | 'orange' | 'pink';
}

export interface TaskCardProps {
  title: string;
  description: string;
  image?: string;
  tags: TaskTag[];
  date: string;
  assignees: string[];
}

interface DraggableTaskCardProps {
  task: TaskCardProps & { id: string };
  index: number;
}

export default function TaskCard({ task, index }: DraggableTaskCardProps) {
  
  // Tailwind color mapping helper for dynamic tags
  const getColorClasses = (color: string) => {
    switch(color) {
      case 'red': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'green': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'blue': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'purple': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'orange': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'pink': return 'bg-pink-500/10 text-pink-500 border-pink-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div 
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-card border rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-primary/50 transition-all group ${
            snapshot.isDragging ? 'shadow-xl shadow-primary/20 rotate-2 border-primary ring-2 ring-primary/20 cursor-grabbing z-50' : 'cursor-grab'
          }`}
          style={{ ...provided.draggableProps.style }}
        >
          
          {/* Optional Header Image */}
          {task.image && (
            <div className="w-full h-32 mb-4 rounded-xl overflow-hidden relative">
              <img src={task.image} alt={task.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
          )}

          {/* Content */}
          <h3 className="font-bold text-foreground mb-2 leading-tight">{task.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-3 mb-4 leading-relaxed">
            {task.description}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-6">
            {task.tags.map((tag, idx) => (
              <span 
                key={idx} 
                className={`text-[10px] font-bold px-2 py-1 rounded-md border uppercase tracking-wider ${getColorClasses(tag.color)}`}
              >
                {tag.label}
              </span>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Calendar size={14} />
              <span>{task.date}</span>
            </div>
            
            {/* Assignees */}
            <div className="flex -space-x-2">
              {task.assignees.map((src, idx) => (
                <img 
                  key={idx}
                  src={src} 
                  alt="Assignee" 
                  className="w-6 h-6 rounded-full border-2 border-card object-cover"
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}
