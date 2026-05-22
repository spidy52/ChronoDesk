import api from '../../../lib/axios';
import { useBoardStore } from '../../../store/useBoardStore';
import type { BoardElement, BoardEvent } from '../../../types/board';

class TimelineEngineClass {
  private playbackInterval: any = null;
  private stateCache: Record<number, BoardElement[]> = {}; // Caches targetTime -> elements state

  // Offline replay cache
  public allEvents: any[] = [];
  public hasLoadedAllData = false;

  /**
   * Add a new event locally to keep allEvents up to date during the session
   */
  public addEvent(event: any) {
    if (!event || !event._id) return;
    if (this.allEvents.some((e) => e._id === event._id)) return;
    this.allEvents.push(event);
    this.allEvents.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Fetch all events from DB for offline seeking
   */
  public async loadAllEvents(boardId: string) {
    try {
      const { data } = await api.get(`/boards/${boardId}/events`, {
        params: { since: 0, until: Date.now() }
      });
      if (data.success && data.events) {
        this.allEvents = data.events;
        this.hasLoadedAllData = true;

        // Dynamically adjust boardStartTime to match "when i started using the board"
        const { setTimelineBounds, boardEndTime, board } = useBoardStore.getState();
        const times = this.allEvents.map((e) => e.timestamp);
        
        // Also check if there are timeline frames
        const { timelineFrames } = useBoardStore.getState();
        timelineFrames.forEach((f) => times.push(f.timestamp));

        if (times.length > 0) {
          const earliestTime = Math.min(...times);
          setTimelineBounds(earliestTime, boardEndTime);
          useBoardStore.getState().setReplayTime(earliestTime);
        } else if (board) {
          const sessionStart = Date.now();
          setTimelineBounds(sessionStart, sessionStart + 1000);
          useBoardStore.getState().setReplayTime(sessionStart);
        }
      }
    } catch (err) {
      console.error('Failed to load all events for replay:', err);
    }
  }

  /**
   * Reconstruct board state at target timestamp T locally from in-memory event stream
   */
  public reconstructStateLocallyAt(targetTime: number): BoardElement[] {
    const elementsMap: Record<string, BoardElement> = {};

    for (const event of this.allEvents) {
      if (event.timestamp > targetTime) {
        break; // Events are sorted by timestamp
      }

      const el = event.data;
      if (event.type === 'CREATE_ELEMENT' || event.type === 'UPDATE_ELEMENT') {
        if (el && el.id) {
          elementsMap[el.id] = { ...elementsMap[el.id], ...el } as BoardElement;
        }
      } else if (event.type === 'DELETE_ELEMENT') {
        if (el && el.id) {
          delete elementsMap[el.id];
        }
      } else if (event.type === 'CLEAR') {
        Object.keys(elementsMap).forEach((id) => delete elementsMap[id]);
      }
    }

    return Object.values(elementsMap);
  }

  /**
   * Reconstruct board state at target timestamp T
   * Core logic: Use local event cache if available, else fetch from DB
   */
  public async reconstructStateAt(boardId: string, targetTime: number): Promise<BoardElement[]> {
    if (this.hasLoadedAllData) {
      return this.reconstructStateLocallyAt(targetTime);
    }

    // 1. Check local cache first
    const roundedTime = Math.floor(targetTime / 1000) * 1000;
    if (this.stateCache[roundedTime]) {
      return this.stateCache[roundedTime]!;
    }

    try {
      // 2. Fetch nearest snapshot before targetTime
      const { data: snapData } = await api.get(`/boards/${boardId}/snapshot`, {
        params: { timestamp: targetTime }
      });

      let currentElements: BoardElement[] = [];
      let since = 0;

      if (snapData.success && snapData.snapshot) {
        currentElements = snapData.snapshot.elements;
        since = snapData.snapshot.timestamp;
      }

      // Map elements for easy lookup by ID
      const elementsMap: Record<string, BoardElement> = {};
      currentElements.forEach((el) => {
        elementsMap[el.id] = el;
      });

      // 3. Fetch all events from DB between 'since' and 'targetTime'
      const { data: eventsData } = await api.get(`/boards/${boardId}/events`, {
        params: { since, until: targetTime }
      });

      if (eventsData.success && eventsData.events) {
        const events: BoardEvent[] = eventsData.events;
        
        // Replay events
        events.forEach((event) => {
          const el = event.data;
          if (event.type === 'CREATE_ELEMENT' || event.type === 'UPDATE_ELEMENT') {
            if (el && el.id) {
              elementsMap[el.id] = { ...elementsMap[el.id], ...el } as BoardElement;
            }
          } else if (event.type === 'DELETE_ELEMENT') {
            if (el && el.id) {
              delete elementsMap[el.id];
            }
          } else if (event.type === 'CLEAR') {
            Object.keys(elementsMap).forEach((id) => delete elementsMap[id]);
          }
        });
      }

      const reconstructedList = Object.values(elementsMap);
      
      // Cache the result
      this.stateCache[roundedTime] = reconstructedList;
      
      // Clean oldest cache if too large
      const cacheKeys = Object.keys(this.stateCache);
      if (cacheKeys.length > 50) {
        delete this.stateCache[Number(cacheKeys[0])];
      }

      return reconstructedList;
    } catch (err) {
      console.error('Failed to reconstruct board state:', err);
      return [];
    }
  }

  /**
   * Start playback loop mimicking video timeline
   */
  public startPlayback(boardId: string) {
    this.stopPlayback();
    
    useBoardStore.getState().setPlaying(true);
    useBoardStore.getState().setReplayMode(true);

    const stepMs = 1000; // Playhead updates every 1 second

    this.playbackInterval = setInterval(async () => {
      const { replayTime, boardEndTime, playbackSpeed, isPlaying } = useBoardStore.getState();
      
      if (!isPlaying) {
        this.stopPlayback();
        return;
      }

      // Advance playhead based on playbackSpeed multiplier
      const nextTime = replayTime + (stepMs * playbackSpeed);

      if (nextTime >= boardEndTime) {
        useBoardStore.getState().setReplayTime(boardEndTime);
        this.stopPlayback();
        // Reconstruct final frame
        const elements = this.hasLoadedAllData
          ? this.reconstructStateLocallyAt(boardEndTime)
          : await this.reconstructStateAt(boardId, boardEndTime);
        useBoardStore.getState().setElements(elements);
        return;
      }

      useBoardStore.getState().setReplayTime(nextTime);
      const elements = this.hasLoadedAllData
        ? this.reconstructStateLocallyAt(nextTime)
        : await this.reconstructStateAt(boardId, nextTime);
      useBoardStore.getState().setElements(elements);
    }, stepMs);
  }

  /**
   * Stop timeline playback loop
   */
  public stopPlayback() {
    if (this.playbackInterval) {
      clearInterval(this.playbackInterval);
      this.playbackInterval = null;
    }
    useBoardStore.getState().setPlaying(false);
  }

  /**
   * Clear timeline seek caches
   */
  public clearCache() {
    this.stateCache = {};
    this.allEvents = [];
    this.hasLoadedAllData = false;
  }
}

export const TimelineEngine = new TimelineEngineClass();
