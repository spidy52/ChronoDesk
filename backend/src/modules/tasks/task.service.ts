import Task from '../../models/Task';

/* ================= CREATE ================= */

export const createTaskService =
  async (data: any) => {
    return await Task.create(data);
  };

/* ================= GET ================= */

export const getTasksService =
  async () => {
    return await Task.find().populate(
      'assignee'
    );
  };

/* ================= UPDATE ================= */

export const updateTaskService =
  async (
    id: string,
    data: any
  ) => {
    return await Task.findByIdAndUpdate(
      id,
      data,
      { new: true }
    );
  };

/* ================= DELETE ================= */

export const deleteTaskService =
  async (id: string) => {
    return await Task.findByIdAndDelete(
      id
    );
  };