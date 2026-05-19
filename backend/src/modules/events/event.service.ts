import { Event } from '../../models/Event';

export class EventService {
  /**
   * Log a new event in the system
   * @param type - The type of event (e.g., 'USER_REGISTERED')
   * @param payload - The data associated with the event
   * @param userId - ID of the user performing the action
   * @param workspaceId - Optional workspace ID where the event happened
   */
  static async logEvent(type: string, payload: any, userId?: string, workspaceId?: string) {
    try {
      const event = await Event.create({
        type,
        payload,
        userId,
        workspaceId,
      });
      return event;
    } catch (error) {
      console.error(`Failed to log event: ${type}`, error);
    }
  }
}
