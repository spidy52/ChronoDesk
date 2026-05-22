export type BoardTool = 'select' | 'pencil' | 'marker' | 'eraser' | 'lasso' | 'text' | 'rect' | 'circle' | 'triangle' | 'sticky' | 'image' | 'line' | 'arrow';

export interface BaseElement {
  id: string;
  tool: BoardTool;
  x: number;
  y: number;
  width: number;
  height: number;
  scaleX?: number;
  scaleY?: number;
  rotation?: number;
  color: string;
  timestamp: number;
  userId: string;
}

export interface StrokeElement extends BaseElement {
  tool: 'pencil' | 'marker';
  points: number[]; // Flat coordinate array [x0, y0, x1, y1, ...]
  pressure?: number[]; // Match points indices
  width: number;
  strokeWidth?: number; // brush width
}

export interface ShapeElement extends BaseElement {
  tool: 'rect' | 'circle' | 'triangle' | 'line' | 'arrow';
  fill?: string;
  strokeWidth: number;
}

export interface TextElement extends BaseElement {
  tool: 'text';
  text: string;
  fontSize: number;
}

export interface StickyElement extends BaseElement {
  tool: 'sticky';
  text: string;
  fillColor: string; // sticky note BG color
}

export interface ImageElement extends BaseElement {
  tool: 'image';
  src: string;
}

export type BoardElement = StrokeElement | ShapeElement | TextElement | StickyElement | ImageElement;

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export interface Collaborator {
  userId: string;
  name: string;
  avatar: string;
  color: string;
  cursor?: { x: number; y: number };
  activeDrawing?: {
    tool: string;
    color: string;
    width: number;
    points: number[];
  };
}

export interface Board {
  _id: string;
  title: string;
  taskId: string;
  workspaceId: string;
  createdBy: string;
  createdAt: string;
}

export interface BoardEvent {
  _id: string;
  boardId: string;
  type: string;
  timestamp: number;
  userId: string;
  data: any;
}

export interface BoardSnapshot {
  _id: string;
  boardId: string;
  timestamp: number;
  elements: BoardElement[];
}

export interface TimelineFrame {
  _id: string;
  boardId: string;
  timestamp: number;
  thumbnailUrl: string;
}
