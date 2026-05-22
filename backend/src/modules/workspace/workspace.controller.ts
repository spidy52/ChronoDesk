import {
  Response,
} from 'express';

import {
  AuthRequest,
} from '../../middleware/auth.middleware';

import Workspace from '../../models/Workspace';

import { z } from 'zod';

/* ================= VALIDATION SCHEMA ================= */

const createWorkspaceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
});

/* ================= CREATE ================= */

export const createWorkspace =
  async (
    req: AuthRequest,
    res: Response
  ) => {
    try {
      const validationResult = createWorkspaceSchema.safeParse(req.body);

      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validationResult.error.issues,
        });
      }

      const workspace =
        await Workspace.create({
          ...validationResult.data,

          owner: req.user?.userId,
        });

      res.status(201).json({
        success: true,

        workspace,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,

        error:
          'Failed to create workspace',
      });
    }
  };

/* ================= GET ALL ================= */

export const getWorkspaces =
  async (
    req: AuthRequest,
    res: Response
  ) => {
    try {
      const workspaces =
        await Workspace.find({
          $or: [
            { owner: req.user?.userId },
            { members: req.user?.userId },
          ],
        }).populate('owner members');

      res.json({
        success: true,

        workspaces,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,

        error:
          'Failed to fetch workspaces',
      });
    }
  };

/* ================= GET BY ID ================= */

export const getWorkspaceById =
  async (
    req: AuthRequest,
    res: Response
  ) => {
    try {
      const workspace =
        await Workspace.findById(
          req.params.id
        ).populate('owner members');

      if (!workspace) {
        return res.status(404).json({
          success: false,

          error: 'Workspace not found',
        });
      }

      res.json({
        success: true,

        workspace,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,

        error:
          'Failed to fetch workspace',
      });
    }
  };

/* ================= UPDATE ================= */

export const updateWorkspace =
  async (
    req: AuthRequest,
    res: Response
  ) => {
    try {
      const workspace =
        await Workspace.findOneAndUpdate(
          {
            _id: req.params.id,

            owner: req.user?.userId,
          },

          req.body,

          {
            new: true,
          }
        );

      if (!workspace) {
        return res.status(404).json({
          success: false,

          error: 'Workspace not found',
        });
      }

      res.json({
        success: true,

        workspace,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,

        error:
          'Failed to update workspace',
      });
    }
  };

/* ================= DELETE ================= */

export const deleteWorkspace =
  async (
    req: AuthRequest,
    res: Response
  ) => {
    try {
      const workspace =
        await Workspace.findOneAndDelete({
          _id: req.params.id,

          owner: req.user?.userId,
        });

      if (!workspace) {
        return res.status(404).json({
          success: false,

          error: 'Workspace not found',
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
          'Failed to delete workspace',
      });
    }
  };
