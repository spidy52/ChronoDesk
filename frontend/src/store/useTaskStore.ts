import { create } from 'zustand';

import {
  fetchTasks,
  createTask,
  updateTask,
  deleteTask,
  addCollaborator,
  removeCollaborator,
} from '../services/task.service';
import { socket } from '../services/socket';

interface Task {
  _id: string;

  title: string;

  description: string;

  status: string;

  priority: string;

  workspaceId: string;

  dueDate?: string;

  assignee?: any;

  createdBy?: any;
  collaborators?: any[];
}

interface TaskStore {
  tasks: Task[];

  loading: boolean;

  fetchAllTasks: (
    workspaceId?: string
  ) => Promise<void>;

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

  addCollaboratorToTask: (
    taskId: string,
    userId: string
  ) => Promise<void>;

  removeCollaboratorFromTask: (
    taskId: string,
    userId: string
  ) => Promise<void>;

  setupTaskSocketListeners: () => void;
}

export const useTaskStore =
  create<TaskStore>(
    (set) => ({
      tasks: [],

      loading: false,

      /* ================= FETCH ================= */

      fetchAllTasks:
        async (workspaceId) => {
          set({
            loading: true,
          });

          try {
            const tasks =
              await fetchTasks(
                workspaceId
              );

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

      /* ================= COLLABORATORS ================= */

      addCollaboratorToTask: async (taskId, userId) => {
        try {
          const updated = await addCollaborator(taskId, userId);
          set((state) => ({
            tasks: state.tasks.map((task) =>
              task._id === taskId ? updated : task
            ),
          }));
        } catch (error) {
          console.error(error);
        }
      },

      removeCollaboratorFromTask: async (taskId, userId) => {
        try {
          const updated = await removeCollaborator(taskId, userId);
          set((state) => ({
            tasks: state.tasks.map((task) =>
              task._id === taskId ? updated : task
            ),
          }));
        } catch (error) {
          console.error(error);
        }
      },

      /* ================= SOCKET ================= */
      setupTaskSocketListeners: () => {
        socket.off('task:created');
        socket.off('task:updated');
        socket.off('task:deleted');

        socket.on('task:created', (task) => {
          set((state) => ({
            tasks: [task, ...state.tasks.filter((t) => t._id !== task._id)],
          }));
        });

        socket.on('task:updated', (updatedTask) => {
          set((state) => {
            const exists = state.tasks.some((t) => t._id === updatedTask._id);
            if (exists) {
              return {
                tasks: state.tasks.map((task) =>
                  task._id === updatedTask._id ? updatedTask : task
                ),
              };
            }
            // If it doesn't exist, it means we were just added as a collaborator, so add it
            return {
              tasks: [updatedTask, ...state.tasks],
            };
          });
        });

        socket.on('task:deleted', (taskId) => {
          set((state) => ({
            tasks: state.tasks.filter((t) => t._id !== taskId),
          }));
        });

        socket.off('user:updated');
        socket.on('user:updated', (updatedUser: any) => {
          const userId = updatedUser.id || updatedUser._id;
          set((state) => ({
            tasks: state.tasks.map((task) => {
              let updated = false;
              let newAssignee = task.assignee;
              let newCollaborators = task.collaborators;

              if (task.assignee && (task.assignee._id === userId || (task.assignee as any).id === userId)) {
                newAssignee = { ...task.assignee, avatar: updatedUser.avatar, name: updatedUser.name };
                updated = true;
              }

              if (task.collaborators && Array.isArray(task.collaborators)) {
                if (task.collaborators.some((c: any) => c._id === userId || c.id === userId)) {
                  newCollaborators = task.collaborators.map((c: any) =>
                    (c._id === userId || c.id === userId)
                      ? { ...c, avatar: updatedUser.avatar, name: updatedUser.name }
                      : c
                  );
                  updated = true;
                }
              }

              if (updated) {
                return { ...task, assignee: newAssignee, collaborators: newCollaborators };
              }
              return task;
            }),
          }));
        });
      },
    })
  );