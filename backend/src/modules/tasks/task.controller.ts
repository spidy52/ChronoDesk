import { Request, Response } from 'express';

import {
  createTaskService,
  getTasksService,
  updateTaskService,
  deleteTaskService,
} from './task.service';

/* ================= CREATE TASK ================= */

export const createTask = async (
  req: Request,
  res: Response
) => {
  try {
    const task =
      await createTaskService(
        req.body
      );

    res.status(201).json({
      success: true,

      task,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,

      error:
        'Failed to create task',
    });
  }
};

/* ================= GET TASKS ================= */

export const getTasks = async (
  req: Request,
  res: Response
) => {
  try {
    const tasks =
      await getTasksService();

    res.json({
      success: true,

      tasks,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,

      error:
        'Failed to fetch tasks',
    });
  }
};

/* ================= UPDATE TASK ================= */

export const updateTask =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const task =
        await updateTaskService(
          req.params.id,
          req.body
        );

      res.json({
        success: true,

        task,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,

        error:
          'Failed to update task',
      });
    }
  };

/* ================= DELETE TASK ================= */

export const deleteTask =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      await deleteTaskService(
        req.params.id
      );

      res.json({
        success: true,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,

        error:
          'Failed to delete task',
      });
    }
  };