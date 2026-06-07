import api from '../../../lib/axios';
import type { BoardElement, BoardSnapshot, TimelineFrame } from '../../../types/board';
import { useBoardStore } from '../../../store/useBoardStore';

class SnapshotEngineClass {
  private snapshotInterval: any = null;
  private lastSnapshotTime = 0;
  private lastFullSnapshotTime = 0;
  private eventCountSinceLastSnapshot = 0;

  /**
   * Start periodic snapshot and thumbnail triggers
   */
  public startAutoSnapshots(boardId: string, stageRef: any) {
    this.stopAutoSnapshots();
    this.lastSnapshotTime = Date.now();
    this.lastFullSnapshotTime = Date.now();
    this.eventCountSinceLastSnapshot = 0;

    // Trigger check every 10 seconds to save thumbnail preview frames
    this.snapshotInterval = setInterval(async () => {
      const { isReplayMode, elements } = useBoardStore.getState();
      if (isReplayMode || elements.length === 0) return;

      const now = Date.now();
      const timePassed = now - this.lastSnapshotTime >= 10000; // 10 seconds
      const hasChanges = this.eventCountSinceLastSnapshot > 0; // only save if there are changes

      if (timePassed && hasChanges) {
        // 1. Capture the 10-second thumbnail picture frame
        if (stageRef.current) {
          await this.captureTimelineFrame(boardId, stageRef.current);
        }
        this.lastSnapshotTime = now;

        // 2. Separately, save full JSON state snapshot less frequently
        // (every 5 minutes or if we've accumulated 100 events)
        const timeForFullSnapshot = now - this.lastFullSnapshotTime >= 300000;
        const eventsForFullSnapshot = this.eventCountSinceLastSnapshot >= 100;

        if (timeForFullSnapshot || eventsForFullSnapshot) {
          await this.takeSnapshot(boardId, elements);
          this.lastFullSnapshotTime = now;
          this.eventCountSinceLastSnapshot = 0;
        }
      }
    }, 10000);
  }

  /**
   * Stop periodic snapshot timer
   */
  public stopAutoSnapshots() {
    if (this.snapshotInterval) {
      clearInterval(this.snapshotInterval);
      this.snapshotInterval = null;
    }
  }

  /**
   * Log an event occurrence to trigger event-based snapshots (every 100 events)
   */
  public logEvent() {
    this.eventCountSinceLastSnapshot++;
  }

  /**
   * Upload current board state as a snapshot file
   */
  public async takeSnapshot(boardId: string, elements: BoardElement[]): Promise<BoardSnapshot | null> {
    try {
      const timestamp = Date.now();
      const { data } = await api.post(`/boards/${boardId}/snapshot`, {
        timestamp,
        elements,
      });

      if (data.success) {
        console.log('Whiteboard state snapshot created successfully.');
        return data.snapshot;
      }
      return null;
    } catch (err) {
      console.error('Failed to create whiteboard snapshot:', err);
      return null;
    }
  }

  /**
   * Capture a 160x90 WEBP preview frame of the board stage and upload it
   */
  public async captureTimelineFrame(boardId: string, stage: any): Promise<TimelineFrame | null> {
    try {
      if (!stage) return null;

      // Extract a resized, optimized thumbnail dataURL using Konva
      const dataUrl = stage.toDataURL({
        mimeType: 'image/webp',
        quality: 0.7,
        pixelRatio: 0.15, // Significantly scale down coordinates to render thin thumbnails (approx 160x90 depending on screen)
      });

      const timestamp = Date.now();
      const { data } = await api.post(`/boards/${boardId}/timeline-frame`, {
        timestamp,
        thumbnailData: dataUrl,
      });

      if (data.success) {
        // Fetch new frames list to update Zustand filmstrip
        const { data: listData } = await api.get(`/boards/${boardId}/timeline-frames`);
        if (listData.success) {
          useBoardStore.getState().setTimelineFrames(listData.frames);
        }
        return data.frame;
      }
      return null;
    } catch (err) {
      console.error('Failed to capture and upload timeline frame:', err);
      return null;
    }
  }

  /**
   * Fetch all snapshots and frames from DB (used on Board join)
   */
  public async fetchTimelineData(boardId: string) {
    try {
      const { data: framesData } = await api.get(`/boards/${boardId}/timeline-frames`);
      if (framesData.success) {
        useBoardStore.getState().setTimelineFrames(framesData.frames);
      }
    } catch (err) {
      console.error('Failed to fetch timeline frames data:', err);
    }
  }
}

export const SnapshotEngine = new SnapshotEngineClass();
