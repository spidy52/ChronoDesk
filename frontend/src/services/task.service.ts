import api from '../lib/axios';

/* ================= GET TASKS ================= */

export const fetchTasks =
  async (workspaceId?: string) => {
    const params = workspaceId
      ? { workspaceId }
      : {};

    const { data } =
      await api.get('/tasks', { params });

    return data.tasks;
  };

/* ================= CREATE TASK ================= */

export const createTask =
  async (task: any) => {
    const { data } =
      await api.post(
        '/tasks',
        task
      );

    return data.task;
  };

/* ================= UPDATE TASK ================= */

export const updateTask =
  async (
    id: string,
    updates: any
  ) => {
    const { data } =
      await api.patch(
        `/tasks/${id}`,
        updates
      );

    return data.task;
  };

/* ================= DELETE TASK ================= */

export const deleteTask =
  async (id: string) => {
    await api.delete(
      `/tasks/${id}`
    );
  };

/* ================= COLLABORATORS ================= */

export const addCollaborator = async (taskId: string, userId: string) => {
  const { data } = await api.post(`/tasks/${taskId}/collaborators`, { userId });
  return data.task;
};

export const removeCollaborator = async (taskId: string, userId: string) => {
  const { data } = await api.delete(`/tasks/${taskId}/collaborators/${userId}`);
  return data.task;
};