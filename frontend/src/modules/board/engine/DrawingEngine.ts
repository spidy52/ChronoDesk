import { getStroke } from 'perfect-freehand';
import type { BoardElement, StrokeElement, ShapeElement, TextElement, StickyElement } from '../../../types/board';
import { v4 as uuidv4 } from 'uuid';

/**
 * Helper to convert perfect-freehand stroke outlines to SVG Path data
 */
export function getSvgPathFromStroke(stroke: number[][]): string {
  if (!stroke.length) return '';
  const d = stroke.reduce(
    (acc, [x, y], i) => {
      if (i === 0) return `M ${x} ${y}`;
      return `${acc} L ${x} ${y}`;
    },
    ''
  );
  return `${d} Z`;
}

export const DrawingEngine = {
  /**
   * Create a new Stroke element (pencil or marker)
   */
  createStroke(
    points: number[],
    tool: 'pencil' | 'marker',
    color: string,
    width: number,
    userId: string
  ): StrokeElement {
    if (points.length < 2) {
      return {
        id: uuidv4(),
        tool,
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        points: [],
        color,
        strokeWidth: width,
        timestamp: Date.now(),
        userId,
      };
    }

    let minX = points[0]!;
    let maxX = points[0]!;
    let minY = points[1]!;
    let maxY = points[1]!;

    for (let i = 0; i < points.length; i += 2) {
      const px = points[i]!;
      const py = points[i+1]!;
      if (px < minX) minX = px;
      if (px > maxX) maxX = px;
      if (py < minY) minY = py;
      if (py > maxY) maxY = py;
    }

    const normalizedPoints = points.map((val, idx) => {
      return idx % 2 === 0 ? val - minX : val - minY;
    });

    return {
      id: uuidv4(),
      tool,
      x: minX,
      y: minY,
      width: Math.max(1, maxX - minX),
      height: Math.max(1, maxY - minY),
      points: normalizedPoints,
      color,
      strokeWidth: width, // Store actual brush width here
      timestamp: Date.now(),
      userId,
    };
  },

  /**
   * Generate perfect freehand outline data for a stroke
   */
  getFreehandPath(points: number[], width: number, isMarker: boolean): string {
    if (points.length < 2) return '';
    
    // Convert flat array [x0, y0, x1, y1, ...] to array of arrays [[x0, y0], [x1, y1], ...]
    const inputPoints: number[][] = [];
    for (let i = 0; i < points.length; i += 2) {
      if (points[i] !== undefined && points[i+1] !== undefined) {
        inputPoints.push([points[i], points[i+1]]);
      }
    }
    
    const strokeOptions = {
      size: width,
      thinning: isMarker ? 0 : 0.6, // Markers are uniform, pencils thin out with speed
      smoothing: 0.5,
      streamline: 0.55,
    };
    
    const outline = getStroke(inputPoints, strokeOptions);
    return getSvgPathFromStroke(outline);
  },

  /**
   * Create a new Shape element (rect, circle, triangle)
   */
  createShape(
    tool: 'rect' | 'circle' | 'triangle' | 'line' | 'arrow',
    x: number,
    y: number,
    width: number,
    height: number,
    color: string,
    fillColor: string,
    strokeWidth: number,
    userId: string
  ): ShapeElement {
    return {
      id: uuidv4(),
      tool,
      x,
      y,
      width,
      height,
      color,
      fill: fillColor,
      strokeWidth,
      timestamp: Date.now(),
      userId,
    };
  },

  /**
   * Create a new Text element
   */
  createText(
    text: string,
    x: number,
    y: number,
    color: string,
    fontSize: number,
    userId: string
  ): TextElement {
    return {
      id: uuidv4(),
      tool: 'text',
      x,
      y,
      width: 150, // default width
      height: fontSize + 10,
      text,
      color,
      fontSize,
      timestamp: Date.now(),
      userId,
    };
  },

  /**
   * Create a new Sticky Note
   */
  createSticky(
    text: string,
    x: number,
    y: number,
    fillColor: string,
    userId: string
  ): StickyElement {
    return {
      id: uuidv4(),
      tool: 'sticky',
      x,
      y,
      width: 150,
      height: 150,
      text,
      color: '#000000', // black text
      fillColor,
      timestamp: Date.now(),
      userId,
    };
  },

  /**
   * Create a new Image element
   */
  createImage(
    src: string,
    x: number,
    y: number,
    width: number,
    height: number,
    userId: string
  ) {
    return {
      id: uuidv4(),
      tool: 'image' as const,
      x,
      y,
      width,
      height,
      src,
      color: '#000000',
      timestamp: Date.now(),
      userId,
    };
  },

  /**
   * Check if point (px, py) intersects with a line stroke
   */
  intersectsStroke(px: number, py: number, stroke: StrokeElement): boolean {
    const points = stroke.points;
    const brushWidth = stroke.strokeWidth ?? stroke.width ?? 4;
    const threshold = (brushWidth + 6) * Math.max(Math.abs(stroke.scaleX ?? 1), Math.abs(stroke.scaleY ?? 1)); // Hit threshold
    for (let i = 0; i < points.length - 2; i += 2) {
      const p1 = this.localToWorld(points[i]!, points[i+1]!, stroke);
      const p2 = this.localToWorld(points[i+2]!, points[i+3]!, stroke);
      
      const distance = this.pointToSegmentDistance(px, py, p1.x, p1.y, p2.x, p2.y);
      if (distance < threshold) {
        return true;
      }
    }
    return false;
  },

  worldToLocal(wx: number, wy: number, el: BoardElement): { x: number; y: number } {
    let dx = wx - el.x;
    let dy = wy - el.y;
    
    const rotation = el.rotation ?? 0;
    if (rotation !== 0) {
      const rad = (-rotation * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const rx = dx * cos - dy * sin;
      const ry = dx * sin + dy * cos;
      dx = rx;
      dy = ry;
    }
    
    const scaleX = el.scaleX ?? 1;
    const scaleY = el.scaleY ?? 1;
    return {
      x: dx / scaleX,
      y: dy / scaleY,
    };
  },

  localToWorld(lx: number, ly: number, el: BoardElement): { x: number; y: number } {
    const scaleX = el.scaleX ?? 1;
    const scaleY = el.scaleY ?? 1;
    const rotation = el.rotation ?? 0;
    
    let sx = lx * scaleX;
    let sy = ly * scaleY;
    
    if (rotation !== 0) {
      const rad = (rotation * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const rx = sx * cos - sy * sin;
      const ry = sx * sin + sy * cos;
      sx = rx;
      sy = ry;
    }
    
    return {
      x: el.x + sx,
      y: el.y + sy,
    };
  },

  /**
   * Check if point (px, py) is inside a bounding box
   */
  intersectsBox(px: number, py: number, el: BoardElement): boolean {
    if (el.tool === 'line' || el.tool === 'arrow') {
      const lp = this.worldToLocal(px, py, el);
      const distance = this.pointToSegmentDistance(lp.x, lp.y, 0, 0, el.width, el.height);
      const threshold = ((el as any).strokeWidth || 4) + 8;
      return distance < threshold;
    }
    const lp = this.worldToLocal(px, py, el);
    const minX = Math.min(0, el.width);
    const maxX = Math.max(0, el.width);
    const minY = Math.min(0, el.height);
    const maxY = Math.max(0, el.height);
    return lp.x >= minX && lp.x <= maxX && lp.y >= minY && lp.y <= maxY;
  },

  /**
   * Distance from point to line segment
   */
  pointToSegmentDistance(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
    const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
    if (l2 === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
    
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    
    const projectionX = x1 + t * (x2 - x1);
    const projectionY = y1 + t * (y2 - y1);
    return Math.sqrt((px - projectionX) ** 2 + (py - projectionY) ** 2);
  },

  /**
   * Checks which elements are completely inside the lasso selection rectangle
   */
  getElementsInLasso(
    elements: BoardElement[],
    lx: number,
    ly: number,
    lw: number,
    lh: number
  ): string[] {
    const x1 = Math.min(lx, lx + lw);
    const x2 = Math.max(lx, lx + lw);
    const y1 = Math.min(ly, ly + lh);
    const y2 = Math.max(ly, ly + lh);

    const isInside = (ex: number, ey: number, ew: number, eh: number) => {
      const eminX = Math.min(ex, ex + ew);
      const emaxX = Math.max(ex, ex + ew);
      const eminy = Math.min(ey, ey + eh);
      const emaxY = Math.max(ey, ey + eh);
      return eminX >= x1 && emaxX <= x2 && eminy >= y1 && emaxY <= y2;
    };

    return elements
      .filter((el) => {
        if (el.tool === 'pencil' || el.tool === 'marker') {
          // Check if all stroke points are inside lasso
          const stroke = el as StrokeElement;
          for (let i = 0; i < stroke.points.length; i += 2) {
            const wp = this.localToWorld(stroke.points[i]!, stroke.points[i+1]!, stroke);
            if (wp.x < x1 || wp.x > x2 || wp.y < y1 || wp.y > y2) return false;
          }
          return true;
        }
        return isInside(el.x, el.y, el.width, el.height);
      })
      .map((el) => el.id);
  }
};
