import { Response } from 'express';
import { io } from '../../index';

import Task from '../../models/Task';

import {
  AuthRequest,
} from '../../middleware/auth.middleware';

/* ================= CREATE ================= */

export const createTask =
  async (
    req: AuthRequest,
    res: Response
  ) => {
    try {
      const task =
        await Task.create({
          ...req.body,

          createdBy:
            req.user?.userId,
        });

      // Populate for socket event
      const populatedTask = await Task.findById(task._id)
        .populate('collaborators', 'name email username avatar')
        .populate('createdBy', 'name email username avatar');

      if (req.user?.userId) {
        io.to(req.user.userId).emit('task:created', populatedTask);
      }

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

/* ================= GET ================= */

export const getTasks =
  async (
    req: AuthRequest,
    res: Response
  ) => {
    try {
      const tasks =
        await Task.find({
          $or: [
            { createdBy: req.user?.userId },
            { collaborators: req.user?.userId }
          ]
        })
        .populate('collaborators', 'name email username avatar')
        .populate('createdBy', 'name email username avatar')
        .sort({
          createdAt: -1,
        });

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

/* ================= UPDATE ================= */

export const updateTask =
  async (
    req: AuthRequest,
    res: Response
  ) => {
    try {
      const updatedTask =
        await Task.findOneAndUpdate(
          {
            _id: req.params.id,

            $or: [
              { createdBy: req.user?.userId },
              { collaborators: req.user?.userId }
            ]
          },

          req.body,

          {
            new: true,
          }
        )
        .populate('collaborators', 'name email username avatar')
        .populate('createdBy', 'name email username avatar');

      if (updatedTask) {
        // Emit to creator
        io.to(updatedTask.createdBy._id.toString()).emit('task:updated', updatedTask);
        // Emit to all collaborators
        updatedTask.collaborators.forEach((collab: any) => {
          io.to(collab._id.toString()).emit('task:updated', updatedTask);
        });
      }

      res.json({
        success: true,

        task: updatedTask,
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

/* ================= DELETE ================= */

export const deleteTask =
  async (
    req: AuthRequest,
    res: Response
  ) => {
    try {
      const deletedTask = await Task.findOneAndDelete({
        _id: req.params.id,

        createdBy:
          req.user?.userId,
      });

      if (deletedTask) {
        io.to(req.user!.userId).emit('task:deleted', deletedTask._id);
        deletedTask.collaborators?.forEach((collabId: any) => {
          io.to(collabId.toString()).emit('task:deleted', deletedTask._id);
        });
      }

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

/* ================= ADD COLLABORATOR ================= */

export const addCollaborator = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { userId } = req.body; // User to add

    const task = await Task.findOneAndUpdate(
      { _id: id, createdBy: req.user?.userId }, // Only creator can add
      { $addToSet: { collaborators: userId } },
      { new: true }
    ).populate('collaborators', 'name email username avatar').populate('createdBy', 'name email username avatar');

    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found or unauthorized' });
    }

    io.to(task.createdBy._id.toString()).emit('task:updated', task);
    task.collaborators.forEach((collab: any) => {
      io.to(collab._id.toString()).emit('task:updated', task);
    });

    res.json({ success: true, task });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to add collaborator' });
  }
};

/* ================= REMOVE COLLABORATOR ================= */

export const removeCollaborator = async (req: AuthRequest, res: Response) => {
  try {
    const { id, userId } = req.params;

    const task = await Task.findOneAndUpdate(
      { _id: id, createdBy: req.user?.userId },
      { $pull: { collaborators: userId } },
      { new: true }
    ).populate('collaborators', 'name email username avatar').populate('createdBy', 'name email username avatar');

    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found or unauthorized' });
    }

    io.to(task.createdBy._id.toString()).emit('task:updated', task);
    task.collaborators.forEach((collab: any) => {
      io.to(collab._id.toString()).emit('task:updated', task);
    });
    // Also emit to the removed user so it disappears from their board
    io.to(userId).emit('task:deleted', task._id);

    res.json({ success: true, task });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to remove collaborator' });
  }
};