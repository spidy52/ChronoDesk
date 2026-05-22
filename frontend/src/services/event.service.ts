import api from '../lib/axios';

/* ================= GET ================= */

export const fetchEvents =
  async () => {
    const { data } =
      await api.get('/events');

    return data.events;
  };

/* ================= CREATE ================= */

export const createEvent =
  async (event: any) => {
    const { data } =
      await api.post(
        '/events',
        event
      );

    return data.event;
  };

/* ================= DELETE ================= */

export const deleteEvent =
  async (id: string) => {
    await api.delete(
      `/events/${id}`
    );
  };