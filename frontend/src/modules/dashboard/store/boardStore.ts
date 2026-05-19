import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { TaskCardProps } from '../components/TaskCard';
export interface Task extends TaskCardProps {
  id: string;
}

export interface Column {
  id: string;
  title: string;
  taskIds: string[];
}

interface BoardState {
  tasks: Record<string, Task>;
  columns: Record<string, Column>;
  columnOrder: string[];
  
  // Actions
  moveTask: (taskId: string, sourceColId: string, destColId: string, sourceIndex: number, destIndex: number) => void;
  addTask: (columnId: string, task: Omit<Task, 'id'>) => void;
}

// Initial Mock Data
const initialTasks: Record<string, Task> = {
  'task-1': { id: 'task-1', title: 'Upcoming Project', description: 'View competitors and similar projects...', tags: [{ label: 'Marketing', color: 'pink' }, { label: 'Sales', color: 'green' }], date: 'Today', assignees: ['https://i.pravatar.cc/150?u=4'] },
  'task-2': { id: 'task-2', title: 'Advertising Company', description: 'Prepare references for the advertising campaign...', tags: [{ label: 'Marketing', color: 'pink' }], date: '29 March', assignees: ['https://i.pravatar.cc/150?u=6'] },
  'task-3': { id: 'task-3', title: 'Moodboard', description: 'It is a long established fact that a reader will be distracted...', image: 'https://images.unsplash.com/photo-1618761714954-0b8cd0026356?auto=format&fit=crop&w=400&q=80', tags: [{ label: 'Design', color: 'blue' }], date: 'Tomorrow', assignees: ['https://i.pravatar.cc/150?u=7'] },
  'task-4': { id: 'task-4', title: 'Design Analysis', description: 'Check the design for paddings and how new NFTs are loaded.', tags: [{ label: 'Sales', color: 'green' }], date: '28 March', assignees: ['https://i.pravatar.cc/150?u=10'] },
  'task-5': { id: 'task-5', title: 'Bank Card Registration', description: 'Design own payments form our site using Elements UI.', image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=400&q=80', tags: [{ label: 'Design', color: 'blue' }, { label: 'Coding', color: 'orange' }], date: '28 March', assignees: ['https://i.pravatar.cc/150?u=15'] },
};

const initialColumns: Record<string, Column> = {
  'col-1': { id: 'col-1', title: 'Research', taskIds: ['task-1', 'task-2'] },
  'col-2': { id: 'col-2', title: 'Design', taskIds: ['task-3'] },
  'col-3': { id: 'col-3', title: 'In Review', taskIds: ['task-4'] },
  'col-4': { id: 'col-4', title: 'Development', taskIds: ['task-5'] },
};

export const useBoardStore = create<BoardState>((set) => ({
  tasks: initialTasks,
  columns: initialColumns,
  columnOrder: ['col-1', 'col-2', 'col-3', 'col-4'],

  moveTask: (taskId, sourceColId, destColId, sourceIndex, destIndex) => 
    set((state) => {
      const newColumns = { ...state.columns };
      
      const sourceTaskIds = Array.from(newColumns[sourceColId].taskIds);
      sourceTaskIds.splice(sourceIndex, 1);
      
      if (sourceColId === destColId) {
        sourceTaskIds.splice(destIndex, 0, taskId);
        newColumns[sourceColId] = { ...newColumns[sourceColId], taskIds: sourceTaskIds };
      } else {
        const destTaskIds = Array.from(newColumns[destColId].taskIds);
        destTaskIds.splice(destIndex, 0, taskId);
        
        newColumns[sourceColId] = { ...newColumns[sourceColId], taskIds: sourceTaskIds };
        newColumns[destColId] = { ...newColumns[destColId], taskIds: destTaskIds };
      }

      return { columns: newColumns };
    }),

  addTask: (columnId, taskData) => 
    set((state) => {
      const newId = `task-${uuidv4()}`;
      const newTask = { ...taskData, id: newId };
      
      const newColumn = { ...state.columns[columnId] };
      newColumn.taskIds = [newId, ...newColumn.taskIds];

      return {
        tasks: { ...state.tasks, [newId]: newTask },
        columns: { ...state.columns, [columnId]: newColumn }
      };
    }),
}));
