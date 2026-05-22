import {
  Response,
} from 'express';

import {
  AuthRequest,
} from '../../middleware/auth.middleware';

import {
  createEventService,
  getEventsService,
  deleteEventService,
} from './event.service';

/* ================= CREATE ================= */

export const createEvent =
  async (
    req: AuthRequest,
    res: Response
  ) => {
    try {
      const event =
        await createEventService({
          ...req.body,

          createdBy:
            req.user?.userId,

          meetingLink:
            `https://meet.chronodesk.com/${Date.now()}`,
        });

      res.status(201).json({
        success: true,

        event,
      });
    } catch (error) {
      console.log(error);

      res.status(500).json({
        success: false,
      });
    }
  };

/* ================= GET ================= */

export const getEvents =
  async (
    req: AuthRequest,
    res: Response
  ) => {
    try {
      const events =
        await getEventsService(
          req.user!.userId
        );

      res.json({
        success: true,

        events,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
      });
    }
  };

/* ================= DELETE ================= */

export const deleteEvent =
  async (
    req: AuthRequest,
    res: Response
  ) => {
    try {
      await deleteEventService(
        req.params.id as string,
        req.user!.userId
      );

      res.json({
        success: true,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
      });
    }
  };