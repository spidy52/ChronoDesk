import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../../middleware/auth.middleware';
import Board from '../../models/Board';
import BoardEvent from '../../models/BoardEvent';
import BoardSnapshot from '../../models/BoardSnapshot';
import TimelineFrame from '../../models/TimelineFrame';
import { StorageEngine } from '../../utils/storage';

/**
 * Get or create whiteboard connected to a task
 */
export const getOrCreateBoard = async (req: AuthRequest, res: Response) => {
  try {
    const { taskId } = req.params;
    const { title, workspaceId } = req.body;

    if (!taskId) {
      return res.status(400).json({ success: false, error: 'Task ID is required' });
    }

    let board = await Board.findOne({ taskId: new mongoose.Types.ObjectId(taskId as string) });

    if (!board) {
      if (!title || !workspaceId) {
        return res.status(400).json({ 
          success: false, 
          error: 'Title and workspaceId are required to create a new board' 
        });
      }

      board = await Board.create({
        title,
        taskId: new mongoose.Types.ObjectId(taskId as string),
        workspaceId,
        createdBy: new mongoose.Types.ObjectId(req.user?.userId as string),
      });
      console.log(`Created new board: ${board._id} for task ${taskId}`);
    }

    res.json({ success: true, board });
  } catch (error: any) {
    console.error('getOrCreateBoard error:', error);
    res.status(500).json({ success: false, error: 'Failed to get or create board' });
  }
};

/**
 * Fetch historical events for a board up to/during a specific range
 */
export const getEvents = async (req: AuthRequest, res: Response) => {
  try {
    const { boardId } = req.params;
    const since = Number(req.query.since) || 0;
    const until = req.query.until ? Number(req.query.until) : Date.now();

    const events = await BoardEvent.find({
      boardId: new mongoose.Types.ObjectId(boardId as string),
      timestamp: { $gt: since, $lte: until },
    }).sort({ timestamp: 1 });

    res.json({ success: true, events });
  } catch (error: any) {
    console.error('getEvents error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch board events' });
  }
};

/**
 * Fetch nearest snapshot before a specific timestamp and return its serialized state
 */
export const getSnapshot = async (req: AuthRequest, res: Response) => {
  try {
    const { boardId } = req.params;
    const timestamp = req.query.timestamp ? Number(req.query.timestamp) : Date.now();

    // Find nearest snapshot before or equal to target timestamp
    const snapshotMeta = await BoardSnapshot.findOne({
      boardId: new mongoose.Types.ObjectId(boardId as string),
      timestamp: { $lte: timestamp },
    }).sort({ timestamp: -1 });

    if (!snapshotMeta) {
      return res.json({ 
        success: true, 
        snapshot: null, 
        message: 'No snapshot found prior to this timestamp' 
      });
    }

    // Load actual compressed file content from StorageEngine
    const elementsContent = await StorageEngine.getFile(snapshotMeta.snapshotUrl);
    const elements = JSON.parse(elementsContent.toString());

    res.json({
      success: true,
      snapshot: {
        _id: snapshotMeta._id,
        boardId: snapshotMeta.boardId,
        timestamp: snapshotMeta.timestamp,
        elements,
      }
    });
  } catch (error: any) {
    console.error('getSnapshot error:', error);
    res.status(500).json({ success: false, error: 'Failed to load snapshot' });
  }
};

/**
 * Store a new canvas snapshot
 */
export const saveSnapshot = async (req: AuthRequest, res: Response) => {
  try {
    const { boardId } = req.params;
    const { timestamp, elements } = req.body;

    if (!timestamp || !elements) {
      return res.status(400).json({ success: false, error: 'timestamp and elements are required' });
    }

    const filename = `snap_${boardId}_${timestamp}.json`;
    const serializedData = typeof elements === 'string' ? elements : JSON.stringify(elements);
    
    // Save to S3/Disk
    const fileUrl = await StorageEngine.saveFile('snapshots', filename, serializedData);

    const snapshot = await BoardSnapshot.create({
      boardId: new mongoose.Types.ObjectId(boardId as string),
      timestamp,
      snapshotUrl: fileUrl,
    });

    res.status(201).json({ success: true, snapshot });
  } catch (error: any) {
    console.error('saveSnapshot error:', error);
    res.status(500).json({ success: false, error: 'Failed to save snapshot' });
  }
};

/**
 * Fetch timeline frame previews for the filmstrip
 */
export const getTimelineFrames = async (req: AuthRequest, res: Response) => {
  try {
    const { boardId } = req.params;

    const frames = await TimelineFrame.find({ boardId: new mongoose.Types.ObjectId(boardId as string) }).sort({ timestamp: 1 });

    res.json({ success: true, frames });
  } catch (error: any) {
    console.error('getTimelineFrames error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch timeline frames' });
  }
};

/**
 * Upload a new thumbnail preview frame
 */
export const saveTimelineFrame = async (req: AuthRequest, res: Response) => {
  try {
    const { boardId } = req.params;
    const { timestamp, thumbnailData } = req.body; // base64 string

    if (!timestamp || !thumbnailData) {
      return res.status(400).json({ success: false, error: 'timestamp and thumbnailData (base64) are required' });
    }

    // Parse base64 thumbnailData
    const matches = thumbnailData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ success: false, error: 'Invalid base64 format' });
    }

    const buffer = Buffer.from(matches[2], 'base64');
    const filename = `thumb_${boardId}_${timestamp}.webp`;
    
    // Save file
    const fileUrl = await StorageEngine.saveFile('thumbnails', filename, buffer);

    const frame = await TimelineFrame.create({
      boardId: new mongoose.Types.ObjectId(boardId as string),
      timestamp,
      thumbnailUrl: fileUrl,
    });

    res.status(201).json({ success: true, frame });
  } catch (error: any) {
    console.error('saveTimelineFrame error:', error);
    res.status(500).json({ success: false, error: 'Failed to save timeline frame' });
  }
};

/**
 * Upload a general whiteboard image (base64)
 */
export const uploadImage = async (req: AuthRequest, res: Response) => {
  try {
    const { boardId } = req.params;
    const { base64Data, mimeType } = req.body;

    if (!base64Data || !mimeType) {
      return res.status(400).json({ success: false, error: 'base64Data and mimeType are required' });
    }

    // Extract base64 content
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/) || [null, mimeType, base64Data];
    const base64Str = matches[2] || base64Data;
    const buffer = Buffer.from(base64Str, 'base64');

    // Generate extension
    const ext = mimeType.split('/')[1] || 'png';
    const filename = `img_${boardId}_${Date.now()}.${ext}`;

    const fileUrl = await StorageEngine.saveFile('images', filename, buffer);

    res.status(201).json({ success: true, url: fileUrl });
  } catch (error: any) {
    console.error('uploadImage error:', error);
    res.status(500).json({ success: false, error: 'Failed to upload image' });
  }
};
