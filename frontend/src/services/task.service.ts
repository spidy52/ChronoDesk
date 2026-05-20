import axios from 'axios';

const API =
  'http://localhost:5000/api/tasks';

/* ================= GET TASKS ================= */

export const fetchTasks =
  async () => {
    const { data } =
      await axios.get(API);

    return data.tasks;
  };

/* ================= CREATE TASK ================= */

export const createTask =
  async (task: any) => {
    const { data } =
      await axios.post(
        API,
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
      await axios.patch(
        `${API}/${id}`,
        updates
      );

    return data.task;
  };

/* ================= DELETE TASK ================= */

export const deleteTask =
  async (id: string) => {
    await axios.delete(
      `${API}/${id}`
    );
  };