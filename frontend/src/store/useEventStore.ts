import { create } from 'zustand';

import {
  fetchEvents,
  createEvent,
  deleteEvent,
} from '../services/event.service';

export const useEventStore =
  create((set) => ({
    events: [],

    /* ================= FETCH ================= */

    fetchAllEvents:
      async () => {
        const events =
          await fetchEvents();

        set({ events });
      },

    /* ================= CREATE ================= */

    addEvent:
      async (event: any) => {
        const newEvent =
          await createEvent(
            event
          );

        set((state: any) => ({
          events: [
            newEvent,
            ...state.events,
          ],
        }));
      },

    /* ================= DELETE ================= */

    removeEvent:
      async (id: string) => {
        await deleteEvent(id);

        set((state: any) => ({
          events:
            state.events.filter(
              (e: any) =>
                e._id !== id
            ),
        }));
      },
  }));