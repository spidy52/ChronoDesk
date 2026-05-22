import * as Y from 'yjs';
import { socket } from '../../../services/socket';
import { useBoardStore } from '../../../store/useBoardStore';
import type { BoardElement, Collaborator } from '../../../types/board';
import { useAuthStore } from '../../auth/store';
import { TimelineEngine } from './TimelineEngine';

function toUint8Array(data: any): Uint8Array {
  if (data instanceof Uint8Array) return data;
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  if (data && data.buffer instanceof ArrayBuffer) {
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  }
  if (data && data.type === 'Buffer' && Array.isArray(data.data)) {
    return new Uint8Array(data.data);
  }
  return new Uint8Array(data);
}

class RealtimeEngineClass {
  public yDoc: Y.Doc;
  public yElements: Y.Map<any>;
  public undoManager: Y.UndoManager;
  private currentBoardId: string | null = null;
  private cursorThrottleTimeout: any = null;
  private syncTimeout: any = null;

  constructor() {
    this.yDoc = new Y.Doc();
    this.yElements = this.yDoc.getMap('elements');
    this.undoManager = new Y.UndoManager(this.yElements);

    // Watch Yjs Map changes to update our Zustand local store
    this.yElements.observe(() => {
      // Avoid overwriting store if we are in historical replay review mode
      const { isReplayMode } = useBoardStore.getState();
      if (!isReplayMode) {
        const els = Array.from(this.yElements.values()) as BoardElement[];
        useBoardStore.getState().setElements(els);
      }
    });

    // Handle local Yjs document modifications to emit over websocket
    this.yDoc.on('update', (update, origin) => {
      // Only emit changes that originate from user interactions (not peer updates or DB loads)
      if (origin !== 'socket' && origin !== 'initial-load') {
        const boardId = useBoardStore.getState().board?._id;
        if (boardId) {
          socket.emit('yjs:update', update);
        }
      }
    });
  }

  public joinBoard(boardId: string) {
    this.currentBoardId = boardId;
    
    // Set socket auth token
    const token = useAuthStore.getState().token;
    if (token) {
      socket.auth = { token };
    }

    // Connect socket if not already connected
    if (!socket.connected) {
      socket.connect();
    }

    useBoardStore.getState().setSyncStatus('connecting');

    // Register listeners
    this.registerSocketListeners(boardId);

    // Join room
    socket.emit('board:join', { boardId });
  }

  /**
   * Leaves current board and cleans up Yjs doc / Socket listeners
   */
  public leaveBoard() {
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
      this.syncTimeout = null;
    }

    if (this.currentBoardId) {
      socket.emit('board:leave');
      socket.off('yjs:update');
      socket.off('yjs:sync-step-1');
      socket.off('yjs:sync-step-2');
      socket.off('cursor:update');
      socket.off('draw:progress-update');
      socket.off('board:joined');
      socket.off('board:user-joined');
      socket.off('board:user-left');
      socket.off('element:commit-success');
      socket.off('board:clear-success');
    }
    
    this.currentBoardId = null;
    this.yElements.clear();
    useBoardStore.getState().setSyncStatus('disconnected');
    useBoardStore.getState().updateCollaborators({});
  }

  private async loadFromDatabase(boardId: string) {
    try {
      const elements = await TimelineEngine.reconstructStateAt(boardId, Date.now());
      
      // Bulk insert these elements into Yjs map
      this.yDoc.transact(() => {
        elements.forEach((el) => {
          if (!this.yElements.has(el.id)) {
            this.yElements.set(el.id, el);
          }
        });
      }, 'initial-load');
    } catch (err) {
      console.error('Failed to load initial board elements from DB:', err);
    }
  }

  private registerSocketListeners(boardId: string) {
    // 1. Initial connection response
    socket.on('board:joined', async ({ activeUsers, selfProfile }) => {
      useBoardStore.getState().setSyncStatus('connected');
      useBoardStore.getState().setSelfProfile(selfProfile);
      
      const collabsMap: Record<string, Collaborator> = {};
      activeUsers.forEach((u: any) => {
        collabsMap[u.userId] = u;
      });
      useBoardStore.getState().updateCollaborators(collabsMap);

      if (activeUsers.length > 0) {
        // Trigger initial Yjs state synchronization (step-1) from peers
        const stateVector = Y.encodeStateVector(this.yDoc);
        socket.emit('yjs:sync-step-1', stateVector);

        // Safety fallback: if no peer response in 2.5 seconds, fetch from DB
        this.syncTimeout = setTimeout(async () => {
          if (this.yElements.size === 0) {
            console.warn('Sync with peers timed out. Falling back to DB load...');
            await this.loadFromDatabase(boardId);
          }
        }, 2500);
      } else {
        // We are the first user in the room!
        await this.loadFromDatabase(boardId);
      }
    });

    // 2. Another client requested our state vector
    socket.on('yjs:sync-step-1', ({ requestingUserId, stateVector }) => {
      const update = Y.encodeStateAsUpdate(this.yDoc, toUint8Array(stateVector));
      socket.emit('yjs:sync-step-2', {
        targetUserId: requestingUserId,
        update,
      });
    });

    // 3. Receive sync updates from a peer
    socket.on('yjs:sync-step-2', (update: any) => {
      if (this.syncTimeout) {
        clearTimeout(this.syncTimeout);
        this.syncTimeout = null;
      }
      Y.applyUpdate(this.yDoc, toUint8Array(update), 'socket');
    });

    // 4. Normal real-time Yjs document updates
    socket.on('yjs:update', (update: any) => {
      Y.applyUpdate(this.yDoc, toUint8Array(update), 'socket');
    });

    // 5. Presence: New peer joined
    socket.on('board:user-joined', (userProfile) => {
      useBoardStore.getState().addCollaborator(userProfile.userId, userProfile);
    });

    // 6. Presence: Peer left
    socket.on('board:user-left', ({ userId }) => {
      useBoardStore.getState().removeCollaborator(userId);
    });

    // 7. Cursors: Mouse coordinate stream
    socket.on('cursor:update', ({ userId, x, y }) => {
      useBoardStore.getState().updateCollaboratorCursor(userId, x, y);
    });

    // 8. Low-latency: Temporary lines drawing
    socket.on('draw:progress-update', ({ userId, tool, color, width, points }) => {
      useBoardStore.getState().updateCollaboratorDrawing(userId, {
        tool,
        color,
        width,
        points,
      });
    });

    // 9. Element commits (finalized shapes/strokes)
    socket.on('element:commit-success', (boardEvent) => {
      TimelineEngine.addEvent(boardEvent);
      // Reconcile and apply to Yjs element model under 'socket' origin to prevent loop echo
      const el = boardEvent.data;
      this.yDoc.transact(() => {
        if (boardEvent.type === 'CREATE_ELEMENT' || boardEvent.type === 'UPDATE_ELEMENT') {
          this.yElements.set(el.id, el);
        } else if (boardEvent.type === 'DELETE_ELEMENT') {
          this.yElements.delete(el.id);
        }
      }, 'socket');
    });

    // 10. Clear canvas
    socket.on('board:clear-success', (clearEvent) => {
      TimelineEngine.addEvent(clearEvent);
      this.yDoc.transact(() => {
        this.yElements.clear();
      }, 'socket');
      useBoardStore.getState().clearBoard();
    });

  }

  /* ================= SEND ACTIONS ================= */

  /**
   * Broadcast cursor x/y coordinates (throttled to 25ms to reduce bandwidth and lag)
   */
  public sendCursor(x: number, y: number) {
    if (this.cursorThrottleTimeout) return;
    
    this.cursorThrottleTimeout = setTimeout(() => {
      this.cursorThrottleTimeout = null;
    }, 25);

    socket.emit('cursor:move', { x, y });
  }

  /**
   * Broadcast mouse drag coordinates for active pencil/marker lines
   */
  public sendDrawProgress(tool: string, color: string, width: number, points: number[]) {
    socket.emit('draw:progress', { tool, color, width, points });
  }

  /**
   * Update Yjs map locally only (propagating to peers in real-time but bypassing DB commit)
   */
  public updateElementLocally(element: BoardElement) {
    this.yElements.set(element.id, element);
  }

  /**
   * Commit a shape to MongoDB and Yjs document
   */
  public commitElement(type: 'CREATE_ELEMENT' | 'UPDATE_ELEMENT' | 'DELETE_ELEMENT', element: BoardElement) {
    // 1. Locally append/mutate inside our Yjs Map immediately (optimistic UI render)
    if (type === 'CREATE_ELEMENT' || type === 'UPDATE_ELEMENT') {
      this.yElements.set(element.id, element);
    } else if (type === 'DELETE_ELEMENT') {
      this.yElements.delete(element.id);
    }

    // 2. Broadcast finalized event to DB
    socket.emit('element:commit', {
      type,
      timestamp: Date.now(),
      data: element,
    });
  }

  /**
   * Trigger clear board event
   */
  public emitClearBoard() {
    socket.emit('board:clear');
  }

  /**
   * Undo/Redo operations utilizing Yjs history
   */
  public undo() {
    if (this.undoManager.canUndo()) {
      this.undoManager.undo();
    }
  }

  public redo() {
    if (this.undoManager.canRedo()) {
      this.undoManager.redo();
    }
  }
}

export const RealtimeEngine = new RealtimeEngineClass();
