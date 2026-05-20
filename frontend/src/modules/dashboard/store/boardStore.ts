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

};

const initialColumns: Record<string, Column> = {

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
