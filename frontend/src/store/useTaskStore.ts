import { create } from 'zustand';

import {
  fetchTasks,
  createTask,
  updateTask,
  deleteTask,
} from '../services/task.service';

interface Task {
  _id: string;

  title: string;

  description: string;

  status: string;

  priority: string;
}

interface TaskStore {
  tasks: Task[];

  loading: boolean;

  fetchAllTasks: () => Promise<void>;

  addTask: (
    task: any
  ) => Promise<void>;

  updateTaskById: (
    id: string,
    updates: any
  ) => Promise<void>;

  deleteTaskById: (
    id: string
  ) => Promise<void>;
}

export const useTaskStore =
  create<TaskStore>(
    (set, get) => ({
      tasks: [],

      loading: false,

      /* ================= FETCH ================= */

      fetchAllTasks:
        async () => {
          set({
            loading: true,
          });

          try {
            const tasks =
              await fetchTasks();

            set({
              tasks,
            });
          } catch (error) {
            console.error(error);
          } finally {
            set({
              loading: false,
            });
          }
        },

      /* ================= CREATE ================= */

      addTask:
        async (task) => {
          try {
            const newTask =
              await createTask(
                task
              );

            set((state) => ({
              tasks: [
                newTask,
                ...state.tasks,
              ],
            }));
          } catch (error) {
            console.error(error);
          }
        },

      /* ================= UPDATE ================= */

      updateTaskById:
        async (
          id,
          updates
        ) => {
          try {
            const updated =
              await updateTask(
                id,
                updates
              );

            set((state) => ({
              tasks:
                state.tasks.map(
                  (
                    task
                  ) =>
                    task._id ===
                    id
                      ? updated
                      : task
                ),
            }));
          } catch (error) {
            console.error(error);
          }
        },

      /* ================= DELETE ================= */

      deleteTaskById:
        async (id) => {
          try {
            await deleteTask(id);

            set((state) => ({
              tasks:
                state.tasks.filter(
                  (
                    task
                  ) =>
                    task._id !==
                    id
                ),
            }));
          } catch (error) {
            console.error(error);
          }
        },
    })
  );