import { create } from 'zustand';
import type { BoardElement, Camera, Collaborator, Board, BoardTool, TimelineFrame } from '../types/board';

interface BoardState {
  // Metadata & Status
  board: Board | null;
  isLoading: boolean;
  error: string | null;
  
  // Board Canvas Elements
  elements: BoardElement[];
  selectedIds: string[];
  
  // Viewport camera
  camera: Camera;
  gridVisible: boolean;
  
  // Toolbar Settings
  activeTool: BoardTool;
  strokeColor: string;
  fillColor: string;
  brushWidth: number;
  
  // Multiplayer
  collaborators: Record<string, Collaborator>;
  selfProfile: Collaborator | null;
  syncStatus: 'disconnected' | 'connecting' | 'connected';
  
  // Timeline system
  isReplayMode: boolean;
  replayTime: number; // Current playhead epoch ms
  boardStartTime: number; // Min timestamp in event history
  boardEndTime: number; // Max timestamp (or current date)
  isPlaying: boolean;
  playbackSpeed: number; // 1, 2, 4, 8
  timelineFrames: TimelineFrame[];

  // Actions
  setBoard: (board: Board | null) => void;
  setElements: (elements: BoardElement[]) => void;
  addElement: (element: BoardElement) => void;
  updateElement: (id: string, updates: Partial<BoardElement>) => void;
  deleteElement: (id: string) => void;
  setSelectedIds: (ids: string[]) => void;
  setCamera: (camera: Partial<Camera>) => void;
  toggleGrid: () => void;
  setActiveTool: (tool: BoardTool) => void;
  setStrokeColor: (color: string) => void;
  setFillColor: (color: string) => void;
  setBrushWidth: (width: number) => void;
  
  // Sockets & Collaborators
  setSyncStatus: (status: 'disconnected' | 'connecting' | 'connected') => void;
  setSelfProfile: (profile: Collaborator) => void;
  updateCollaborators: (collabs: Record<string, Collaborator>) => void;
  addCollaborator: (userId: string, collab: Collaborator) => void;
  removeCollaborator: (userId: string) => void;
  updateCollaboratorCursor: (userId: string, x: number, y: number) => void;
  updateCollaboratorDrawing: (userId: string, drawing: Collaborator['activeDrawing']) => void;
  
  // Timeline Actions
  setReplayMode: (enabled: boolean) => void;
  setReplayTime: (time: number) => void;
  setTimelineBounds: (start: number, end: number) => void;
  setPlaying: (playing: boolean) => void;
  setPlaybackSpeed: (speed: number) => void;
  setTimelineFrames: (frames: TimelineFrame[]) => void;
  clearBoard: () => void;
}

export const useBoardStore = create<BoardState>((set) => ({
  board: null,
  isLoading: false,
  error: null,
  
  elements: [],
  selectedIds: [],
  
  camera: { x: 0, y: 0, zoom: 1 },
  gridVisible: true,
  
  activeTool: 'select',
  strokeColor: '#3b82f6', // Premium blue
  fillColor: '#3b82f622', // Translucent blue
  brushWidth: 4,
  
  collaborators: {},
  selfProfile: null,
  syncStatus: 'disconnected',
  
  isReplayMode: false,
  replayTime: Date.now(),
  boardStartTime: Date.now() - 3600000, // 1 hour ago default
  boardEndTime: Date.now(),
  isPlaying: false,
  playbackSpeed: 1,
  timelineFrames: [],

  // Setters
  setBoard: (board) => {
    if (board) {
      const startTime = board.createdAt ? new Date(board.createdAt).getTime() : Date.now();
      const endTime = Date.now();
      set({
        board,
        boardStartTime: startTime,
        boardEndTime: endTime,
        replayTime: startTime,
      });
    } else {
      set({ board });
    }
  },
  setElements: (elements) => set({ elements }),
  addElement: (element) => set((state) => ({ 
    elements: [...state.elements.filter(el => el.id !== element.id), element] 
  })),
  updateElement: (id, updates) => set((state) => ({
    elements: state.elements.map((el) => (el.id === id ? { ...el, ...updates } as BoardElement : el)),
  })),
  deleteElement: (id) => set((state) => ({
    elements: state.elements.filter((el) => el.id !== id),
    selectedIds: state.selectedIds.filter((selId) => selId !== id),
  })),
  setSelectedIds: (selectedIds) => set({ selectedIds }),
  setCamera: (cam) => set((state) => ({ camera: { ...state.camera, ...cam } })),
  toggleGrid: () => set((state) => ({ gridVisible: !state.gridVisible })),
  setActiveTool: (activeTool) => set({ activeTool, selectedIds: activeTool === 'select' ? [] : [] }),
  setStrokeColor: (strokeColor) => set({ strokeColor }),
  setFillColor: (fillColor) => set({ fillColor }),
  setBrushWidth: (brushWidth) => set({ brushWidth }),
  
  setSyncStatus: (syncStatus) => set({ syncStatus }),
  setSelfProfile: (selfProfile) => set({ selfProfile }),
  
  updateCollaborators: (collaborators) => set({ collaborators }),
  addCollaborator: (userId, collab) => set((state) => ({
    collaborators: { ...state.collaborators, [userId]: collab },
  })),
  removeCollaborator: (userId) => set((state) => {
    const next = { ...state.collaborators };
    delete next[userId];
    return { collaborators: next };
  }),
  updateCollaboratorCursor: (userId, x, y) => set((state) => {
    const collab = state.collaborators[userId];
    if (!collab) return {};
    return {
      collaborators: {
        ...state.collaborators,
        [userId]: { ...collab, cursor: { x, y } },
      },
    };
  }),
  updateCollaboratorDrawing: (userId, activeDrawing) => set((state) => {
    const collab = state.collaborators[userId];
    if (!collab) return {};
    return {
      collaborators: {
        ...state.collaborators,
        [userId]: { ...collab, activeDrawing },
      },
    };
  }),
  
  setReplayMode: (isReplayMode) => set((state) => ({ isReplayMode, isPlaying: isReplayMode ? state.isPlaying : false })),
  setReplayTime: (replayTime) => set({ replayTime }),
  setTimelineBounds: (start, end) => set({ boardStartTime: start, boardEndTime: end }),
  setPlaying: (isPlaying) => set({ isPlaying }),
  setPlaybackSpeed: (playbackSpeed) => set({ playbackSpeed }),
  setTimelineFrames: (timelineFrames) => set({ timelineFrames }),
  clearBoard: () => set({ elements: [], selectedIds: [] }),
}));
