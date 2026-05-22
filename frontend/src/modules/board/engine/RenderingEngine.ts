import type { Camera, BoardElement } from '../../../types/board';

export const RenderingEngine = {
  /**
   * Transforms screen coordinate (pixel relative to canvas container) to world canvas coordinate
   */
  screenToWorld(sx: number, sy: number, camera: Camera): { x: number; y: number } {
    return {
      x: (sx - camera.x) / camera.zoom,
      y: (sy - camera.y) / camera.zoom,
    };
  },

  /**
   * Transforms world coordinate to screen pixel coordinate
   */
  worldToScreen(wx: number, wy: number, camera: Camera): { x: number; y: number } {
    return {
      x: wx * camera.zoom + camera.x,
      y: wy * camera.zoom + camera.y,
    };
  },

  /**
   * Evaluates if a canvas element is currently visible inside the viewport
   * Used for virtualization (culling) to avoid rendering elements outside view bounds.
   */
  isElementInViewport(
    el: BoardElement,
    camera: Camera,
    viewportWidth: number,
    viewportHeight: number
  ): boolean {
    const margin = 100; // Extra padding margin in pixels

    // Viewport bounds in world coordinate space
    const xMin = -camera.x / camera.zoom - margin;
    const yMin = -camera.y / camera.zoom - margin;
    const xMax = (viewportWidth - camera.x) / camera.zoom + margin;
    const yMax = (viewportHeight - camera.y) / camera.zoom + margin;

    let elMinX = el.width < 0 ? el.x + el.width : el.x;
    let elMaxX = el.width < 0 ? el.x : el.x + el.width;
    let elMinY = el.height < 0 ? el.y + el.height : el.y;
    let elMaxY = el.height < 0 ? el.y : el.y + el.height;

    // Handle strokes specifically
    if (el.tool === 'pencil' || el.tool === 'marker') {
      const stroke = el as any;
      if (!stroke.points || stroke.points.length === 0) return false;
      
      let sMinX = Infinity;
      let sMaxX = -Infinity;
      let sMinY = Infinity;
      let sMaxY = -Infinity;
      
      const scaleX = stroke.scaleX ?? 1;
      const scaleY = stroke.scaleY ?? 1;
      const rotation = stroke.rotation ?? 0;
      
      for (let i = 0; i < stroke.points.length; i += 2) {
        let lx = stroke.points[i]! * scaleX;
        let ly = stroke.points[i+1]! * scaleY;
        
        if (rotation !== 0) {
          const rad = (rotation * Math.PI) / 180;
          const cos = Math.cos(rad);
          const sin = Math.sin(rad);
          const rx = lx * cos - ly * sin;
          const ry = lx * sin + ly * cos;
          lx = rx;
          ly = ry;
        }
        
        const wx = stroke.x + lx;
        const wy = stroke.y + ly;
        
        if (wx < sMinX) sMinX = wx;
        if (wx > sMaxX) sMaxX = wx;
        if (wy < sMinY) sMinY = wy;
        if (wy > sMaxY) sMaxY = wy;
      }
      
      elMinX = sMinX;
      elMaxX = sMaxX;
      elMinY = sMinY;
      elMaxY = sMaxY;
    }

    // Check overlaps
    return elMaxX >= xMin && elMinX <= xMax && elMaxY >= yMin && elMinY <= yMax;
  },

  /**
   * Generates dynamic grid gridline arrays based on camera zoom/pan offsets
   */
  getGridConfig(camera: Camera, width: number, height: number) {
    const size = 50; // Grid cell size in pixels
    const zoom = camera.zoom;
    
    // Grid sizing scale adjustments
    let spacing = size;
    if (zoom < 0.2) spacing = size * 8;
    else if (zoom < 0.5) spacing = size * 4;
    else if (zoom < 0.8) spacing = size * 2;
    else if (zoom > 3) spacing = size / 2;

    const startX = Math.floor((-camera.x / zoom) / spacing) * spacing;
    const endX = startX + (width / zoom) + spacing * 2;
    
    const startY = Math.floor((-camera.y / zoom) / spacing) * spacing;
    const endY = startY + (height / zoom) + spacing * 2;

    const xLines: number[] = [];
    const yLines: number[] = [];

    for (let x = startX; x <= endX; x += spacing) {
      xLines.push(x);
    }
    for (let y = startY; y <= endY; y += spacing) {
      yLines.push(y);
    }

    return { xLines, yLines, spacing };
  },

  /**
   * Clamp zoom rates (e.g. 0.05x to 20x zoom bounds)
   */
  clampZoom(zoom: number): number {
    return Math.max(0.05, Math.min(20, zoom));
  }
};
