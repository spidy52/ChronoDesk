import Event from '../../models/Event';

/* ================= CREATE ================= */

export const createEventService =
  async (data: any) => {
    return await Event.create(data);
  };

/* ================= GET ================= */

export const getEventsService =
  async (userId: string) => {
    return await Event.find({
      createdBy: userId,
    }).sort({
      date: 1,
    });
  };

/* ================= DELETE ================= */

export const deleteEventService =
  async (
    id: string,
    userId: string
  ) => {
    return await Event.findOneAndDelete(
      {
        _id: id,
        createdBy: userId,
      }
    );
  };