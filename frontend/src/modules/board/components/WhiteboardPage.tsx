import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Stage, Layer, Line, Rect, Circle, Text as KonvaText, Path, Group, Image as KonvaImage, Transformer, Arrow } from 'react-konva';
import { 
  Type, Square, Circle as CircleIcon, Triangle, StickyNote, 
  Trash2, MousePointer, Edit2, Eraser, ZoomIn, ZoomOut, Maximize2, Share2, 
  Download, ArrowLeft, Undo, Redo, Minus, ArrowUpRight
} from 'lucide-react';

import { useBoardStore } from '../../../store/useBoardStore';
import { useTaskStore } from '../../../store/useTaskStore';
import { useUIStore } from '../../../store/useUIStore';
import { RenderingEngine } from '../engine/RenderingEngine';
import { DrawingEngine } from '../engine/DrawingEngine';
import { RealtimeEngine } from '../engine/RealtimeEngine';
import { TimelineEngine } from '../engine/TimelineEngine';
import { SnapshotEngine } from '../engine/SnapshotEngine';
import type { BoardElement, BoardTool, ImageElement } from '../../../types/board';
import TimelineScrubber from './TimelineScrubber';
import api from '../../../lib/axios';

export default function WhiteboardPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();

  const { tasks, fetchAllTasks } = useTaskStore();
  const {
    board,
    elements,
    selectedIds,
    camera,
    gridVisible,
    activeTool,
    strokeColor,
    fillColor,
    brushWidth,
    collaborators,
    selfProfile,
    syncStatus,
    isReplayMode,
    setBoard,
    setElements,
    setSelectedIds,
    setCamera,
    toggleGrid,
    setActiveTool,
    setStrokeColor,
    setBrushWidth,
  } = useBoardStore();

  const theme = useUIStore((state) => state.theme);
  const [isDark, setIsDark] = useState(() => {
    if (theme === 'dark') return true;
    if (theme === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (theme === 'dark') {
      setIsDark(true);
    } else if (theme === 'light') {
      setIsDark(false);
    } else {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      setIsDark(media.matches);
      const handleChange = () => setIsDark(media.matches);
      media.addEventListener('change', handleChange);
      return () => media.removeEventListener('change', handleChange);
    }
  }, [theme]);

  const stageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const transformerRef = useRef<any>(null);

  // Bind transformer to selected node
  useEffect(() => {
    const stage = stageRef.current;
    const tr = transformerRef.current;
    if (!stage || !tr) return;

    if (selectedIds.length === 1 && activeTool === 'select') {
      const targetId = selectedIds[0];
      const selectedNode = stage.findOne('#' + targetId);
      if (selectedNode) {
        tr.nodes([selectedNode]);
        tr.getLayer().batchDraw();
      } else {
        tr.nodes([]);
      }
    } else {
      tr.nodes([]);
    }
  }, [selectedIds, elements, activeTool]);
  
  // Dimensions
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight - 200 });

  // Drawing interactions state
  const [isDrawing, setIsDrawing] = useState(false);
  const [activePoints, setActivePoints] = useState<number[]>([]);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragShape, setDragShape] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [lassoBox, setLassoBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [panning, setPanning] = useState(false);
  const [lastPanPos, setLastPanPos] = useState<{ x: number; y: number } | null>(null);
  const [hasDragged, setHasDragged] = useState(false);

  // Text editor overlay state
  const [textInput, setTextInput] = useState<{ x: number; y: number; wx: number; wy: number; elementId?: string } | null>(null);
  const [textVal, setTextVal] = useState('');

  const selectedElement = selectedIds.length > 0
    ? elements.find((e) => e.id === selectedIds[0])
    : null;

  const getCursorStyle = () => {
    if (activeTool === 'eraser') {
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="white" stroke-width="2" />
          <circle cx="12" cy="12" r="11" stroke="black" stroke-width="0.5" />
          <circle cx="12" cy="12" r="9" stroke="black" stroke-width="0.5" />
        </svg>
      `;
      const base64 = btoa(svg.trim());
      return `url(data:image/svg+xml;base64,${base64}) 12 12, auto`;
    }
    if (activeTool === 'select') {
      return 'default';
    }
    if (activeTool === 'pencil' || activeTool === 'marker') {
      return 'crosshair';
    }
    if (activeTool === 'text') {
      return 'text';
    }
    return 'crosshair';
  };

  const cursorStyle = getCursorStyle();

  // Fetch Task and Initialize Board
  useEffect(() => {
    const initBoard = async () => {
      if (!taskId) return;
      
      // 1. Fetch tasks if not loaded to extract workspaceId and name
      let task = tasks.find((t) => t._id === taskId);
      if (!task) {
        await fetchAllTasks();
        task = useTaskStore.getState().tasks.find((t) => t._id === taskId);
      }

      if (!task) {
        console.error('Task not found');
        navigate('/dashboard');
        return;
      }

      // 2. Fetch or create Whiteboard document linked to the task
      try {
        const { data } = await api.post(`/boards/task/${taskId}`, {
          title: task.title,
          workspaceId: task.workspaceId,
        });

        if (data.success && data.board) {
          setBoard(data.board);
          
          // 3. Connect real-time socket & Yjs sync
          RealtimeEngine.joinBoard(data.board._id);
          
          // 4. Fetch snapshots & timeline thumbnail frames
          await SnapshotEngine.fetchTimelineData(data.board._id);

          // 4b. Preload all events into memory for fast synchronous seeks
          await TimelineEngine.loadAllEvents(data.board._id);
          
          // 5. Initialize auto-saving snapshots every 30s
          SnapshotEngine.startAutoSnapshots(data.board._id, stageRef);
        }
      } catch (err) {
        console.error('Failed to initialize board API:', err);
      }
    };

    initBoard();

    return () => {
      RealtimeEngine.leaveBoard();
      SnapshotEngine.stopAutoSnapshots();
      TimelineEngine.stopPlayback();
      TimelineEngine.clearCache();
    };
  }, [taskId, tasks]);

  // Adjust canvas size dynamically on resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Clipboard Image Paste Support
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (isReplayMode || !board) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item?.type.indexOf('image') !== -1) {
          const file = item?.getAsFile();
          if (!file) continue;

          e.preventDefault();

          const reader = new FileReader();
          reader.onload = async (event) => {
            const base64Data = event.target?.result as string;
            if (!base64Data) return;

            try {
              const response = await api.post(`/boards/${board._id}/upload-image`, {
                base64Data,
                mimeType: file.type,
              });

              if (response.data.success && response.data.url) {
                const imageUrl = response.data.url;
                const img = new Image();
                const resolvedUrl = imageUrl.startsWith('http') ? imageUrl : `http://localhost:5000${imageUrl}`;
                img.src = resolvedUrl;
                img.crossOrigin = 'anonymous';
                img.onload = () => {
                  const aspect = img.width / img.height;

                  // Center in viewport
                  const centerX = dimensions.width / 2;
                  const centerY = dimensions.height / 2;
                  const worldCenter = RenderingEngine.screenToWorld(centerX, centerY, camera);

                  const defaultWidth = 350;
                  const computedHeight = defaultWidth / aspect;

                  const imageNode = DrawingEngine.createImage(
                    imageUrl,
                    worldCenter.x - defaultWidth / 2,
                    worldCenter.y - computedHeight / 2,
                    defaultWidth,
                    computedHeight,
                    selfProfile?.userId || 'unknown'
                  );

                  RealtimeEngine.commitElement('CREATE_ELEMENT', imageNode);
                  SnapshotEngine.logEvent();
                };
              }
            } catch (err) {
              console.error('Failed to paste and upload image:', err);
            }
          };
          reader.readAsDataURL(file);
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [board, isReplayMode, camera, dimensions, selfProfile]);

  // Handle stage mousewheel zooming
  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    const oldZoom = camera.zoom;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - camera.x) / oldZoom,
      y: (pointer.y - camera.y) / oldZoom,
    };

    const speed = 1.08;
    let newZoom = e.evt.deltaY < 0 ? oldZoom * speed : oldZoom / speed;
    newZoom = RenderingEngine.clampZoom(newZoom);

    setCamera({
      zoom: newZoom,
      x: pointer.x - mousePointTo.x * newZoom,
      y: pointer.y - mousePointTo.y * newZoom,
    });
  };

  /* ================= DRAG & STAGE INTERACTION ================= */

  const handleStageDblClick = (e: any) => {
    if (isReplayMode) return;
    if (e.target.getParent()?.className === 'Transformer') return;
    const stage = stageRef.current;
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const worldPos = RenderingEngine.screenToWorld(pointer.x, pointer.y, camera);

    const clickedEl = elements.find((el) => {
      if (el.tool === 'text' || el.tool === 'sticky') {
        return DrawingEngine.intersectsBox(worldPos.x, worldPos.y, el);
      }
      return false;
    });

    if (clickedEl) {
      setSelectedIds([clickedEl.id]);
      
      const screenPos = RenderingEngine.worldToScreen(clickedEl.x, clickedEl.y, camera);
      setTextInput({
        x: screenPos.x,
        y: screenPos.y - 15,
        wx: clickedEl.x,
        wy: clickedEl.y,
        elementId: clickedEl.id,
      });
      setTextVal((clickedEl as any).text || '');
    }
  };

  const handleStageMouseDown = (e: any) => {
    if (isReplayMode) return; // Read-only during timeline seek
    if (textInput) return; // Ignore canvas clicks during active editing to avoid race condition w/ blur
    if (e.target.getParent()?.className === 'Transformer') return;

    const stage = stageRef.current;
    if (!stage) return;
    
    // Space key panning or middle-mouse click triggers panning
    const isPanningMode = e.evt.button === 1 || e.evt.button === 2 || activeTool === 'select' && e.evt.spaceKey;
    if (isPanningMode) {
      setPanning(true);
      const pointer = stage.getPointerPosition();
      setLastPanPos(pointer);
      return;
    }

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    // Convert pointer to world space coordinate
    const worldPos = RenderingEngine.screenToWorld(pointer.x, pointer.y, camera);

    // 1. Text tool click creates editing input
    if (activeTool === 'text') {
      setTextInput({
        x: pointer.x,
        y: pointer.y - 15,
        wx: worldPos.x,
        wy: worldPos.y,
      });
      setTextVal('');
      return;
    }

    // 2. Select tool click detects select bounds
    if (activeTool === 'select') {
      const clickedEl = elements.find((el) => {
        if (el.tool === 'pencil' || el.tool === 'marker') {
          return DrawingEngine.intersectsStroke(worldPos.x, worldPos.y, el as any);
        }
        return DrawingEngine.intersectsBox(worldPos.x, worldPos.y, el);
      });

      if (clickedEl) {
        setSelectedIds([clickedEl.id]);
        
        // Setup dragging parameters for item movement
        setDragStart({ x: worldPos.x, y: worldPos.y });
        setHasDragged(false);
      } else {
        setSelectedIds([]);
        // Start dragging lasso selection rectangle
        setDragStart({ x: worldPos.x, y: worldPos.y });
        setLassoBox({ x: worldPos.x, y: worldPos.y, w: 0, h: 0 });
      }
      return;
    }

    // 3. Eraser click removes intersections
    if (activeTool === 'eraser') {
      setIsDrawing(true);
      eraseAt(worldPos.x, worldPos.y);
      return;
    }

    // 4. Pencil / Marker draw
    if (activeTool === 'pencil' || activeTool === 'marker') {
      setIsDrawing(true);
      setActivePoints([worldPos.x, worldPos.y]);
      return;
    }

    // 5. Shapes drawing
    if (['rect', 'circle', 'triangle', 'sticky', 'line', 'arrow'].includes(activeTool)) {
      setIsDrawing(true);
      setDragStart({ x: worldPos.x, y: worldPos.y });
      setDragShape({ x: worldPos.x, y: worldPos.y, w: 0, h: 0 });
    }
  };

  const handleStageMouseMove = () => {
    const stage = stageRef.current;
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const worldPos = RenderingEngine.screenToWorld(pointer.x, pointer.y, camera);

    // Broadcast cursor movements to collaborators (throttled inside engine)
    if (!isReplayMode) {
      RealtimeEngine.sendCursor(worldPos.x, worldPos.y);
    }

    // 1. Pan operation
    if (panning && lastPanPos) {
      const dx = pointer.x - lastPanPos.x;
      const dy = pointer.y - lastPanPos.y;
      setCamera({
        x: camera.x + dx,
        y: camera.y + dy,
      });
      setLastPanPos(pointer);
      return;
    }

    if (isReplayMode) return;

    // 2. Item Dragging movement (if select element active)
    if (activeTool === 'select' && dragStart && selectedIds.length > 0) {
      const dx = worldPos.x - dragStart.x;
      const dy = worldPos.y - dragStart.y;
      
      const targetId = selectedIds[0]!;
      const el = elements.find((e) => e.id === targetId);
      if (el) {
        setHasDragged(true);
        RealtimeEngine.updateElementLocally({
          ...el,
          x: el.x + dx,
          y: el.y + dy,
        } as BoardElement);
      }
      setDragStart({ x: worldPos.x, y: worldPos.y });
      return;
    }

    // 3. Lasso selection dragging
    if (activeTool === 'select' && dragStart && lassoBox) {
      const w = worldPos.x - dragStart.x;
      const h = worldPos.y - dragStart.y;
      setLassoBox({
        x: dragStart.x,
        y: dragStart.y,
        w,
        h,
      });
      return;
    }

    // 4. Pencil / Marker drawing
    if (isDrawing && (activeTool === 'pencil' || activeTool === 'marker')) {
      const nextPoints = [...activePoints, worldPos.x, worldPos.y];
      setActivePoints(nextPoints);
      
      // Emit active temporary lines to other collaborators
      RealtimeEngine.sendDrawProgress(activeTool, strokeColor, brushWidth, nextPoints);
      return;
    }

    // 5. Eraser drag checking
    if (isDrawing && activeTool === 'eraser') {
      eraseAt(worldPos.x, worldPos.y);
      return;
    }

    // 6. Shapes dimensions scaling
    if (isDrawing && dragStart && dragShape) {
      const w = worldPos.x - dragStart.x;
      const h = worldPos.y - dragStart.y;
      setDragShape({
        x: dragStart.x,
        y: dragStart.y,
        w,
        h,
      });
    }
  };

  const handleStageMouseUp = () => {
    setPanning(false);
    setLastPanPos(null);

    if (isReplayMode) return;

    // 0. Finalize Dragging an element (commit final position to DB)
    if (activeTool === 'select' && selectedIds.length > 0 && hasDragged) {
      const targetId = selectedIds[0]!;
      const el = elements.find((e) => e.id === targetId);
      if (el) {
        RealtimeEngine.commitElement('UPDATE_ELEMENT', el);
        SnapshotEngine.logEvent();
      }
      setHasDragged(false);
      setDragStart(null);
      return;
    }

    // 1. Finalize Pencil/Marker drawing
    if (isDrawing && (activeTool === 'pencil' || activeTool === 'marker')) {
      setIsDrawing(false);
      
      if (activePoints.length >= 4) {
        const stroke = DrawingEngine.createStroke(
          activePoints,
          activeTool,
          strokeColor,
          brushWidth,
          selfProfile?.userId || 'unknown'
        );
        
        RealtimeEngine.commitElement('CREATE_ELEMENT', stroke);
        SnapshotEngine.logEvent();
      }
      
      setActivePoints([]);
      // Clear drawings in progress indicator
      RealtimeEngine.sendDrawProgress('', '', 0, []);
      return;
    }

    // 2. Finalize Eraser operation
    if (isDrawing && activeTool === 'eraser') {
      setIsDrawing(false);
      return;
    }

    // 3. Finalize Lasso selection
    if (activeTool === 'select' && lassoBox && dragStart) {
      const ids = DrawingEngine.getElementsInLasso(
        elements,
        lassoBox.x,
        lassoBox.y,
        lassoBox.w,
        lassoBox.h
      );
      setSelectedIds(ids);
      setLassoBox(null);
      setDragStart(null);
      return;
    }

    // 4. Finalize Shape Element
    if (isDrawing && dragStart && dragShape) {
      setIsDrawing(false);
      
      const { x, y, w, h } = dragShape;
      const userId = selfProfile?.userId || 'unknown';

      if (activeTool === 'line' || activeTool === 'arrow') {
        if (Math.abs(w) > 3 || Math.abs(h) > 3) {
          const shape = DrawingEngine.createShape(
            activeTool,
            x,
            y,
            w,
            h,
            strokeColor,
            fillColor,
            brushWidth,
            userId
          );
          RealtimeEngine.commitElement('CREATE_ELEMENT', shape);
          SnapshotEngine.logEvent();
        }
      } else if (Math.abs(w) > 5 && Math.abs(h) > 5) {
        let shape: BoardElement;

        if (activeTool === 'rect' || activeTool === 'circle' || activeTool === 'triangle') {
          shape = DrawingEngine.createShape(
            activeTool,
            w < 0 ? x + w : x,
            h < 0 ? y + h : y,
            Math.abs(w),
            Math.abs(h),
            strokeColor,
            fillColor,
            brushWidth,
            userId
          );
        } else { // Sticky
          shape = DrawingEngine.createSticky(
            'Sticky Note',
            w < 0 ? x + w : x,
            h < 0 ? y + h : y,
            strokeColor, // uses strokeColor as bg note color
            userId
          );
        }

        RealtimeEngine.commitElement('CREATE_ELEMENT', shape);
        SnapshotEngine.logEvent();
      } else if (activeTool === 'sticky') {
        // user clicked without dragging, auto-create a 150x150 sticky note centered at cursor
        const shape = DrawingEngine.createSticky(
          'Sticky Note',
          x - 75,
          y - 75,
          strokeColor, // uses strokeColor as bg note color
          userId
        );
        RealtimeEngine.commitElement('CREATE_ELEMENT', shape);
        SnapshotEngine.logEvent();
      }

      setDragShape(null);
      setDragStart(null);
      // Auto switch back to select tool after drawing shapes
      setActiveTool('select');
    }
  };

  // Erases elements colliding with pointer coordinates
  const eraseAt = (wx: number, wy: number) => {
    elements.forEach((el) => {
      let collides = false;
      if (el.tool === 'pencil' || el.tool === 'marker') {
        collides = DrawingEngine.intersectsStroke(wx, wy, el as any);
      } else {
        collides = DrawingEngine.intersectsBox(wx, wy, el);
      }

      if (collides) {
        RealtimeEngine.commitElement('DELETE_ELEMENT', el);
        SnapshotEngine.logEvent();
      }
    });
  };

  // Commit text from input editor overlay
  const handleTextCommit = () => {
    if (!textInput || !board) return;
    if (textVal.trim().length > 0) {
      if (textInput.elementId) {
        // Edit existing element
        const el = elements.find((e) => e.id === textInput.elementId);
        if (el) {
          const updated = {
            ...el,
            text: textVal,
          } as BoardElement;
          RealtimeEngine.commitElement('UPDATE_ELEMENT', updated);
          SnapshotEngine.logEvent();
        }
      } else {
        // Create new element
        const textNode = DrawingEngine.createText(
          textVal,
          textInput.wx,
          textInput.wy,
          strokeColor,
          24, // fontSize
          selfProfile?.userId || 'unknown'
        );
        RealtimeEngine.commitElement('CREATE_ELEMENT', textNode);
        SnapshotEngine.logEvent();
      }
    } else {
      if (textInput.elementId) {
        const el = elements.find((e) => e.id === textInput.elementId);
        if (el) {
          RealtimeEngine.commitElement('DELETE_ELEMENT', el);
          SnapshotEngine.logEvent();
        }
      }
    }
    setTextInput(null);
    setActiveTool('select');
  };

  // Seek timeline scrub release
  const handleScrubRelease = async (time: number) => {
    if (!board) return;
    // Set replay time boundaries for replaying log
    const elementsList = await TimelineEngine.reconstructStateAt(board._id, time);
    setElements(elementsList);
  };

  // Delete selected item
  const handleDeleteSelected = () => {
    if (selectedIds.length > 0) {
      const targetId = selectedIds[0]!;
      const el = elements.find((e) => e.id === targetId);
      if (el) {
        RealtimeEngine.commitElement('DELETE_ELEMENT', el);
        setSelectedIds([]);
        SnapshotEngine.logEvent();
      }
    }
  };

  const handleTransformEnd = (e: any) => {
    const node = e.target;
    const targetId = node.id();
    const el = elements.find((x) => x.id === targetId);
    if (!el) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    node.scaleX(1);
    node.scaleY(1);

    let updated: BoardElement;

    if (el.tool === 'pencil' || el.tool === 'marker') {
      updated = {
        ...el,
        x: node.x(),
        y: node.y(),
        scaleX: scaleX * (el.scaleX ?? 1),
        scaleY: scaleY * (el.scaleY ?? 1),
        rotation: node.rotation(),
      } as BoardElement;
    } else if (el.tool === 'line' || el.tool === 'arrow') {
      const signX = el.width < 0 ? -1 : 1;
      const signY = el.height < 0 ? -1 : 1;
      const newWidth = Math.round(Math.abs(el.width) * scaleX) * signX;
      const newHeight = Math.round(Math.abs(el.height) * scaleY) * signY;
      updated = {
        ...el,
        x: node.x(),
        y: node.y(),
        width: newWidth,
        height: newHeight,
        rotation: node.rotation(),
      } as BoardElement;
    } else if (el.tool === 'text') {
      const oldFontSize = (el as any).fontSize || 24;
      const newFontSize = Math.max(8, Math.round(oldFontSize * scaleY));
      updated = {
        ...el,
        x: node.x(),
        y: node.y(),
        width: Math.max(20, Math.round(el.width * scaleX)),
        height: Math.max(10, Math.round(el.height * scaleY)),
        fontSize: newFontSize,
        rotation: node.rotation(),
      } as BoardElement;
    } else if (el.tool === 'circle') {
      const newWidth = Math.max(5, node.width() * scaleX);
      const diameter = newWidth;
      updated = {
        ...el,
        x: node.x(),
        y: node.y(),
        width: diameter,
        height: diameter,
        rotation: node.rotation(),
      } as BoardElement;
    } else {
      const newWidth = Math.max(5, node.width() * scaleX);
      const newHeight = Math.max(5, node.height() * scaleY);
      updated = {
        ...el,
        x: node.x(),
        y: node.y(),
        width: newWidth,
        height: newHeight,
        rotation: node.rotation(),
      } as BoardElement;
    }

    RealtimeEngine.commitElement('UPDATE_ELEMENT', updated);
    SnapshotEngine.logEvent();
  };

  // Export board as PNG canvas image
  const handleExportPNG = () => {
    const stage = stageRef.current;
    if (!stage) return;
    const url = stage.toDataURL({ pixelRatio: 2 });
    const link = document.createElement('a');
    link.download = `${board?.title || 'whiteboard'}.png`;
    link.href = url;
    link.click();
  };

  // Export board as SVG XML structure
  const handleExportSVG = () => {
    let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${dimensions.width} ${dimensions.height}">`;
    // Fill background dynamically matching the theme
    svgContent += `<rect width="100%" height="100%" fill="${isDark ? '#09090b' : '#fafafa'}" />`;

    elements.forEach((el) => {
      const rotation = el.rotation ?? 0;
      const scaleX = el.scaleX ?? 1;
      const scaleY = el.scaleY ?? 1;
      
      if (el.tool === 'pencil' || el.tool === 'marker') {
        const pathData = DrawingEngine.getFreehandPath(
          (el as any).points,
          (el as any).strokeWidth ?? 4,
          el.tool === 'marker'
        );
        svgContent += `<path d="${pathData}" fill="${el.color}" opacity="${el.tool === 'marker' ? 0.6 : 1}" transform="translate(${el.x} ${el.y}) rotate(${rotation}) scale(${scaleX} ${scaleY})" />`;
      } else if (el.tool === 'rect') {
        svgContent += `<rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" fill="${(el as any).fill || 'transparent'}" stroke="${el.color}" stroke-width="${(el as any).strokeWidth || 2}" transform="rotate(${rotation} ${el.x} ${el.y})" />`;
      } else if (el.tool === 'circle') {
        const r = el.width / 2;
        svgContent += `<circle cx="${el.x + r}" cy="${el.y + r}" r="${r}" fill="${(el as any).fill || 'transparent'}" stroke="${el.color}" stroke-width="${(el as any).strokeWidth || 2}" transform="rotate(${rotation} ${el.x + r} ${el.y + r})" />`;
      } else if (el.tool === 'triangle') {
        const p1x = el.width / 2;
        const p1y = 0;
        const p2x = 0;
        const p2y = el.height;
        const p3x = el.width;
        const p3y = el.height;
        const w1x = el.x + p1x;
        const w1y = el.y + p1y;
        const w2x = el.x + p2x;
        const w2y = el.y + p2y;
        const w3x = el.x + p3x;
        const w3y = el.y + p3y;
        svgContent += `<polygon points="${w1x},${w1y} ${w2x},${w2y} ${w3x},${w3y}" fill="${(el as any).fill || 'transparent'}" stroke="${el.color}" stroke-width="${(el as any).strokeWidth || 2}" transform="rotate(${rotation} ${el.x} ${el.y})" />`;
      } else if (el.tool === 'line') {
        svgContent += `<line x1="${el.x}" y1="${el.y}" x2="${el.x + el.width}" y2="${el.y + el.height}" stroke="${el.color}" stroke-width="${(el as any).strokeWidth || 2}" transform="rotate(${rotation} ${el.x} ${el.y})" />`;
      } else if (el.tool === 'arrow') {
        const x2 = el.x + el.width;
        const y2 = el.y + el.height;
        const angle = Math.atan2(el.height, el.width);
        const arrowLength = 15;
        const xLeft = x2 - arrowLength * Math.cos(angle - Math.PI / 6);
        const yLeft = y2 - arrowLength * Math.sin(angle - Math.PI / 6);
        const xRight = x2 - arrowLength * Math.cos(angle + Math.PI / 6);
        const yRight = y2 - arrowLength * Math.sin(angle + Math.PI / 6);
        
        svgContent += `<g transform="rotate(${rotation} ${el.x} ${el.y})">`;
        svgContent += `<line x1="${el.x}" y1="${el.y}" x2="${x2}" y2="${y2}" stroke="${el.color}" stroke-width="${(el as any).strokeWidth || 2}" />`;
        svgContent += `<polygon points="${x2},${y2} ${xLeft},${yLeft} ${xRight},${yRight}" fill="${el.color}" />`;
        svgContent += `</g>`;
      } else if (el.tool === 'text') {
        svgContent += `<text x="${el.x}" y="${el.y + 20}" fill="${el.color}" font-size="${(el as any).fontSize || 16}" transform="rotate(${rotation} ${el.x} ${el.y})">${(el as any).text}</text>`;
      } else if (el.tool === 'sticky') {
        svgContent += `<g transform="rotate(${rotation} ${el.x} ${el.y})">`;
        svgContent += `<rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" fill="${(el as any).fillColor || '#fef08a'}" rx="8" />`;
        svgContent += `<text x="${el.x + 10}" y="${el.y + 30}" fill="#000000" font-size="14">${(el as any).text}</text>`;
        svgContent += `</g>`;
      }
    });

    svgContent += `</svg>`;
    
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `${board?.title || 'whiteboard'}.svg`;
    link.href = url;
    link.click();
  };

  /* ================= RENDER GRID ================= */
  
  const gridConfig = RenderingEngine.getGridConfig(camera, dimensions.width, dimensions.height);
  const visibleElements = elements.filter((el) => 
    RenderingEngine.isElementInViewport(el, camera, dimensions.width, dimensions.height)
  );

  return (
    <div className={`flex flex-col h-screen w-full ${isDark ? 'bg-zinc-950 text-white' : 'bg-zinc-50 text-zinc-900'} overflow-hidden font-sans relative`}>
      
      {/* 1. TOP DOCK BAR */}
      <header className={`h-16 border-b ${isDark ? 'border-zinc-900 bg-zinc-950/80' : 'border-zinc-200 bg-white/80'} px-6 flex items-center justify-between backdrop-blur-md z-30 select-none`}>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/dashboard')}
            className={`w-10 h-10 rounded-xl ${isDark ? 'hover:bg-zinc-900 text-zinc-400 hover:text-white' : 'hover:bg-zinc-100 text-zinc-500 hover:text-black'} flex items-center justify-center transition-all`}
          >
            <ArrowLeft size={18} />
          </button>
          
          <div>
            <h1 className={`font-bold text-base leading-tight tracking-wide ${isDark ? 'text-zinc-100' : 'text-zinc-900'} flex items-center gap-2`}>
              {board?.title || 'Whiteboard Loading...'}
              {isReplayMode && (
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  REPLAY REVIEW
                </span>
              )}
            </h1>
            <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
              Task Workspace Dedicated Room
            </p>
          </div>
        </div>

        {/* Collaborators online avatars */}
        <div className="flex items-center gap-6">
          <div className="flex items-center -space-x-1.5">
            {selfProfile && (
              <div 
                className={`w-8 h-8 rounded-full border-2 ${isDark ? 'border-zinc-950' : 'border-white'} flex items-center justify-center text-xs font-bold text-white shadow-lg bg-blue-600`}
                title={`${selfProfile.name} (You)`}
              >
                {selfProfile.name.charAt(0)}
              </div>
            )}
            
            {Object.values(collaborators).map((c) => (
              <div 
                key={c.userId}
                style={{ backgroundColor: c.color }}
                className={`w-8 h-8 rounded-full border-2 ${isDark ? 'border-zinc-950' : 'border-white'} flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-black/20`}
                title={c.name}
              >
                {c.name.charAt(0)}
              </div>
            ))}
          </div>

          <div className={`h-6 w-px ${isDark ? 'bg-zinc-900' : 'bg-zinc-200'}`}></div>

          {/* Sync Status Badge */}
          <div className={`flex items-center gap-1.5 text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            {syncStatus === 'connected' ? (
              <span className={`flex items-center gap-1.5 font-semibold ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-emerald-950"></span>
                Connected
              </span>
            ) : syncStatus === 'connecting' ? (
              <span className={`flex items-center gap-1.5 font-semibold ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border-2 border-amber-950 animate-pulse"></span>
                Connecting
              </span>
            ) : (
              <span className={`flex items-center gap-1.5 font-semibold ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-600 border-2 border-zinc-950"></span>
                Offline
              </span>
            )}
          </div>

          <div className={`h-6 w-px ${isDark ? 'bg-zinc-900' : 'bg-zinc-200'}`}></div>

          {/* Sinks Undo / Redo */}
          <div className={`flex items-center ${isDark ? 'bg-zinc-900/60 border-zinc-800/40' : 'bg-zinc-100 border-zinc-200'} p-1 rounded-xl border`}>
            <button
              onClick={() => RealtimeEngine.undo()}
              disabled={isReplayMode}
              className={`p-1.5 ${isDark ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'hover:bg-zinc-200 text-zinc-600 hover:text-black'} rounded-lg disabled:opacity-30 disabled:pointer-events-none transition-all`}
              title="Undo (Ctrl+Z)"
            >
              <Undo size={14} />
            </button>
            <button
              onClick={() => RealtimeEngine.redo()}
              disabled={isReplayMode}
              className={`p-1.5 ${isDark ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'hover:bg-zinc-200 text-zinc-600 hover:text-black'} rounded-lg disabled:opacity-30 disabled:pointer-events-none transition-all`}
              title="Redo (Ctrl+Y)"
            >
              <Redo size={14} />
            </button>
          </div>

          {/* Exports drop downs */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPNG}
              className={`px-3 py-1.5 text-xs rounded-xl border ${isDark ? 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300 hover:text-white' : 'bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-700 hover:text-black'} font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95`}
              title="Export as PNG image"
            >
              <Download size={13} />
              PNG
            </button>
            <button
              onClick={handleExportSVG}
              className={`px-3 py-1.5 text-xs rounded-xl border ${isDark ? 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300 hover:text-white' : 'bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-700 hover:text-black'} font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95`}
              title="Export as vector SVG"
            >
              <Share2 size={13} />
              SVG
            </button>
          </div>
        </div>
      </header>

      {/* 2. MAIN CORE LAYOUT AREA */}
      <div className="flex-1 flex relative overflow-hidden">
        
        {/* Left Floating Tools Toolbar */}
        <div className={`absolute left-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 ${isDark ? 'bg-zinc-950/80 border-zinc-800/80 text-zinc-300' : 'bg-white/95 border-zinc-200 text-zinc-800'} backdrop-blur-md border p-2.5 rounded-2xl shadow-2xl z-30 select-none`}>
          <ToolButton tool="select" icon={<MousePointer size={18} />} title="Selection (V)" active={activeTool} onClick={setActiveTool} disabled={isReplayMode} />
          <ToolButton tool="pencil" icon={<Edit2 size={18} />} title="Pencil (P)" active={activeTool} onClick={setActiveTool} disabled={isReplayMode} />
          <ToolButton tool="eraser" icon={<Eraser size={18} />} title="Eraser (E)" active={activeTool} onClick={setActiveTool} disabled={isReplayMode} />
          <ToolButton tool="text" icon={<Type size={18} />} title="Text (T)" active={activeTool} onClick={setActiveTool} disabled={isReplayMode} />
          <div className={`w-8 h-px ${isDark ? 'bg-zinc-900' : 'bg-zinc-200'} my-1`}></div>
          <ToolButton tool="rect" icon={<Square size={18} />} title="Rectangle" active={activeTool} onClick={setActiveTool} disabled={isReplayMode} />
          <ToolButton tool="circle" icon={<CircleIcon size={18} />} title="Circle" active={activeTool} onClick={setActiveTool} disabled={isReplayMode} />
          <ToolButton tool="triangle" icon={<Triangle size={18} />} title="Triangle" active={activeTool} onClick={setActiveTool} disabled={isReplayMode} />
          <ToolButton tool="line" icon={<Minus size={18} />} title="Line" active={activeTool} onClick={setActiveTool} disabled={isReplayMode} />
          <ToolButton tool="arrow" icon={<ArrowUpRight size={18} />} title="Arrow" active={activeTool} onClick={setActiveTool} disabled={isReplayMode} />
          <ToolButton tool="sticky" icon={<StickyNote size={18} />} title="Sticky Note" active={activeTool} onClick={setActiveTool} disabled={isReplayMode} />
        </div>

        {/* Canvas stage workspace wrapper */}
        <div 
          ref={containerRef}
          className="flex-1 h-full w-full relative outline-none"
          style={{ cursor: cursorStyle }}
          tabIndex={0}
          onKeyDown={(e) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
              return;
            }
            if (e.key === 'Delete' || e.key === 'Backspace') {
              handleDeleteSelected();
            }
          }}
        >
          <Stage
            ref={stageRef}
            width={dimensions.width}
            height={dimensions.height}
            style={{ cursor: cursorStyle }}
            onWheel={handleWheel}
            onMouseDown={handleStageMouseDown}
            onMouseMove={handleStageMouseMove}
            onMouseUp={handleStageMouseUp}
            onDblClick={handleStageDblClick}
            className={`absolute inset-0 transition-colors duration-300 ${isDark ? 'bg-[#09090b]' : 'bg-zinc-50'}`}
          >
            {/* Grid Line background layer */}
            {gridVisible && (
              <Layer>
                {gridConfig.xLines.map((x) => (
                  <Line
                    key={`x_${x}`}
                    points={[x, -camera.y / camera.zoom - 100, x, (dimensions.height - camera.y) / camera.zoom + 100]}
                    stroke={isDark ? '#ffffff' : '#000000'}
                    strokeWidth={0.3}
                    opacity={isDark ? 0.07 : 0.09}
                  />
                ))}
                {gridConfig.yLines.map((y) => (
                  <Line
                    key={`y_${y}`}
                    points={[-camera.x / camera.zoom - 100, y, (dimensions.width - camera.x) / camera.zoom + 100, y]}
                    stroke={isDark ? '#ffffff' : '#000000'}
                    strokeWidth={0.3}
                    opacity={isDark ? 0.07 : 0.09}
                  />
                ))}
              </Layer>
            )}

            {/* Elements rendering layer */}
            <Layer x={camera.x} y={camera.y} scaleX={camera.zoom} scaleY={camera.zoom}>
              {visibleElements.map((el) => {
                const isSelected = selectedIds.includes(el.id);
                
                return (
                  <Group key={el.id}>
                    {/* Pencil and marker freehand vector path */}
                    {(el.tool === 'pencil' || el.tool === 'marker') && (
                      <Path
                        id={el.id}
                        x={el.x}
                        y={el.y}
                        scaleX={el.scaleX ?? 1}
                        scaleY={el.scaleY ?? 1}
                        rotation={el.rotation ?? 0}
                        data={DrawingEngine.getFreehandPath((el as any).points, (el as any).strokeWidth ?? 4, el.tool === 'marker')}
                        fill={el.color}
                        opacity={el.tool === 'marker' ? 0.6 : 1}
                        onTransformEnd={handleTransformEnd}
                      />
                    )}

                    {/* Rectangle rendering */}
                    {el.tool === 'rect' && (
                      <Rect
                        id={el.id}
                        x={el.x}
                        y={el.y}
                        width={el.width}
                        height={el.height}
                        stroke={el.color}
                        strokeWidth={(el as any).strokeWidth || 4}
                        fill={(el as any).fill || 'transparent'}
                        cornerRadius={4}
                        rotation={el.rotation ?? 0}
                        onTransformEnd={handleTransformEnd}
                      />
                    )}

                    {/* Circle rendering */}
                    {el.tool === 'circle' && (
                      <Group
                        id={el.id}
                        x={el.x}
                        y={el.y}
                        width={el.width}
                        height={el.height}
                        rotation={el.rotation ?? 0}
                        onTransformEnd={handleTransformEnd}
                      >
                        <Circle
                          x={el.width / 2}
                          y={el.height / 2}
                          width={el.width}
                          height={el.height}
                          radius={el.width / 2}
                          stroke={el.color}
                          strokeWidth={(el as any).strokeWidth || 4}
                          fill={(el as any).fill || 'transparent'}
                        />
                      </Group>
                    )}

                    {/* Triangle rendering */}
                    {el.tool === 'triangle' && (
                      <Line
                        id={el.id}
                        x={el.x}
                        y={el.y}
                        width={el.width}
                        height={el.height}
                        points={[
                          el.width / 2, 0,
                          0, el.height,
                          el.width, el.height
                        ]}
                        closed
                        stroke={el.color}
                        strokeWidth={(el as any).strokeWidth || 4}
                        fill={(el as any).fill || 'transparent'}
                        rotation={el.rotation ?? 0}
                        onTransformEnd={handleTransformEnd}
                      />
                    )}

                    {/* Line rendering */}
                    {el.tool === 'line' && (
                      <Line
                        id={el.id}
                        x={el.x}
                        y={el.y}
                        width={el.width}
                        height={el.height}
                        points={[0, 0, el.width, el.height]}
                        stroke={el.color}
                        strokeWidth={(el as any).strokeWidth || 4}
                        rotation={el.rotation ?? 0}
                        onTransformEnd={handleTransformEnd}
                      />
                    )}

                    {/* Arrow rendering */}
                    {el.tool === 'arrow' && (
                      <Arrow
                        id={el.id}
                        x={el.x}
                        y={el.y}
                        width={el.width}
                        height={el.height}
                        points={[0, 0, el.width, el.height]}
                        stroke={el.color}
                        fill={el.color}
                        strokeWidth={(el as any).strokeWidth || 4}
                        pointerLength={Math.max(10, ((el as any).strokeWidth || 4) * 2.5)}
                        pointerWidth={Math.max(10, ((el as any).strokeWidth || 4) * 2.5)}
                        rotation={el.rotation ?? 0}
                        onTransformEnd={handleTransformEnd}
                      />
                    )}

                    {/* Text block rendering */}
                    {el.tool === 'text' && (
                      <KonvaText
                        id={el.id}
                        x={el.x}
                        y={el.y}
                        width={el.width}
                        height={el.height}
                        text={(el as any).text}
                        fontSize={(el as any).fontSize || 24}
                        fill={el.color}
                        fontFamily="Outfit, Inter, sans-serif"
                        rotation={el.rotation ?? 0}
                        onTransformEnd={handleTransformEnd}
                      />
                    )}

                    {/* Sticky note element */}
                    {el.tool === 'sticky' && (
                      <Group
                        id={el.id}
                        x={el.x}
                        y={el.y}
                        width={el.width}
                        height={el.height}
                        rotation={el.rotation ?? 0}
                        onTransformEnd={handleTransformEnd}
                      >
                        <Rect
                          x={0}
                          y={0}
                          width={el.width}
                          height={el.height}
                          fill={(el as any).fillColor || '#fbbf24'} // sticky HSL colors
                          shadowColor="#000000"
                          shadowBlur={15}
                          shadowOpacity={0.2}
                          shadowOffset={{ x: 0, y: 8 }}
                          cornerRadius={12}
                        />
                        <KonvaText
                          x={16}
                          y={16}
                          text={(el as any).text}
                          fontSize={15}
                          fill="#000000" // black text on sticky notes
                          width={el.width - 32}
                          fontFamily="Inter, sans-serif"
                          lineHeight={1.3}
                        />
                      </Group>
                    )}

                    {/* Image rendering */}
                    {el.tool === 'image' && (
                      <WhiteboardImage 
                        id={el.id}
                        el={el as ImageElement} 
                        rotation={el.rotation}
                        onTransformEnd={handleTransformEnd}
                      />
                    )}

                    {/* Select outline bounds */}
                    {isSelected && (
                      <Rect
                        x={el.x}
                        y={el.y}
                        offsetX={el.width < 0 ? -el.width + 6 : 6}
                        offsetY={el.height < 0 ? -el.height + 6 : 6}
                        width={Math.abs(el.width) + 12}
                        height={Math.abs(el.height) + 12}
                        scaleX={el.scaleX ?? 1}
                        scaleY={el.scaleY ?? 1}
                        rotation={el.rotation ?? 0}
                        stroke="#3b82f6"
                        strokeWidth={1.5}
                        dash={[6, 4]}
                      />
                    )}
                  </Group>
                );
              })}

              {activeTool === 'select' && selectedIds.length === 1 && (
                <Transformer
                  ref={transformerRef}
                  boundBoxFunc={(oldBox, newBox) => {
                    if (newBox.width < 5 || newBox.height < 5) {
                      return oldBox;
                    }
                    return newBox;
                  }}
                />
              )}

              {/* ACTIVE DRAWING IN PROGRESS PREVIEW LAYER (Ourselves) */}
              {isDrawing && activePoints.length >= 4 && (activeTool === 'pencil' || activeTool === 'marker') && (
                <Line
                  points={activePoints}
                  stroke={strokeColor}
                  strokeWidth={brushWidth}
                  lineCap="round"
                  lineJoin="round"
                  opacity={activeTool === 'marker' ? 0.5 : 0.95}
                />
              )}

              {/* ACTIVE SHAPES DRAG PREVIEW */}
              {isDrawing && dragShape && ['rect', 'circle', 'triangle', 'sticky', 'line', 'arrow'].includes(activeTool) && (
                <Group>
                  {activeTool === 'rect' && (
                    <Rect
                      x={dragShape.w < 0 ? dragShape.x + dragShape.w : dragShape.x}
                      y={dragShape.h < 0 ? dragShape.y + dragShape.h : dragShape.y}
                      width={Math.abs(dragShape.w)}
                      height={Math.abs(dragShape.h)}
                      stroke={strokeColor}
                      strokeWidth={brushWidth}
                      fill={fillColor}
                      cornerRadius={4}
                    />
                  )}
                  {activeTool === 'circle' && (
                    <Circle
                      x={dragShape.x + dragShape.w / 2}
                      y={dragShape.y + dragShape.h / 2}
                      radius={Math.abs(dragShape.w) / 2}
                      stroke={strokeColor}
                      strokeWidth={brushWidth}
                      fill={fillColor}
                    />
                  )}
                  {activeTool === 'triangle' && (
                    <Line
                      points={[
                        dragShape.x + dragShape.w / 2, dragShape.y,
                        dragShape.x, dragShape.y + dragShape.h,
                        dragShape.x + dragShape.w, dragShape.y + dragShape.h
                      ]}
                      closed
                      stroke={strokeColor}
                      strokeWidth={brushWidth}
                      fill={fillColor}
                    />
                  )}
                  {activeTool === 'line' && (
                    <Line
                      points={[0, 0, dragShape.w, dragShape.h]}
                      x={dragShape.x}
                      y={dragShape.y}
                      stroke={strokeColor}
                      strokeWidth={brushWidth}
                    />
                  )}
                  {activeTool === 'arrow' && (
                    <Arrow
                      points={[0, 0, dragShape.w, dragShape.h]}
                      x={dragShape.x}
                      y={dragShape.y}
                      stroke={strokeColor}
                      strokeWidth={brushWidth}
                      fill={strokeColor}
                      pointerLength={Math.max(10, brushWidth * 2.5)}
                      pointerWidth={Math.max(10, brushWidth * 2.5)}
                    />
                  )}
                  {activeTool === 'sticky' && (
                    <Rect
                      x={dragShape.w < 0 ? dragShape.x + dragShape.w : dragShape.x}
                      y={dragShape.h < 0 ? dragShape.y + dragShape.h : dragShape.y}
                      width={Math.abs(dragShape.w)}
                      height={Math.abs(dragShape.h)}
                      fill={strokeColor} // note color uses strokeColor
                      cornerRadius={12}
                    />
                  )}
                </Group>
              )}

              {/* LASSO SELECTION BOX PREVIEW */}
              {lassoBox && (
                <Rect
                  x={lassoBox.w < 0 ? lassoBox.x + lassoBox.w : lassoBox.x}
                  y={lassoBox.h < 0 ? lassoBox.y + lassoBox.h : lassoBox.y}
                  width={Math.abs(lassoBox.w)}
                  height={Math.abs(lassoBox.h)}
                  stroke="#3b82f6"
                  strokeWidth={1}
                  fill="#3b82f618"
                />
              )}

              {/* COLLABORATOR ACTIVE PROGRESS PREVIEWS */}
              {Object.values(collaborators).map((collab) => {
                if (collab.activeDrawing && collab.activeDrawing.points && collab.activeDrawing.points.length >= 4) {
                  return (
                    <Line
                      key={`collab_draw_${collab.userId}`}
                      points={collab.activeDrawing.points}
                      stroke={collab.activeDrawing.color}
                      strokeWidth={collab.activeDrawing.width}
                      lineCap="round"
                      lineJoin="round"
                      opacity={collab.activeDrawing.tool === 'marker' ? 0.5 : 0.9}
                    />
                  );
                }
                return null;
              })}

              {/* COLLABORATORS REAL-TIME CURSORS LAYER */}
              {Object.values(collaborators).map((collab) => {
                if (!collab.cursor) return null;
                const { x, y } = collab.cursor;
                return (
                  <Group key={`cursor_${collab.userId}`}>
                    {/* SVG Pointer Arrow path shape */}
                    <Path
                      data="M 0 0 L 16 11 L 9 12 L 14 20 L 11 21 L 6 13 L 0 16 Z"
                      fill={collab.color}
                      x={x}
                      y={y}
                      shadowColor="#000000"
                      shadowBlur={6}
                      shadowOpacity={0.3}
                    />
                    {/* Name tag banner */}
                    <Group x={x + 10} y={y + 12}>
                      <Rect
                        width={collab.name.length * 7 + 14}
                        height={18}
                        fill={collab.color}
                        cornerRadius={4}
                      />
                      <KonvaText
                        text={collab.name}
                        fill="#ffffff"
                        fontSize={10}
                        x={7}
                        y={4}
                        fontStyle="bold"
                      />
                    </Group>
                  </Group>
                );
              })}
            </Layer>
          </Stage>

          {/* Floating Right Controls Properties Inspector */}
          {activeTool !== 'eraser' && (
            <div className={`absolute right-6 top-6 flex flex-col gap-4 ${isDark ? 'bg-zinc-950/80 border-zinc-800/80 text-zinc-300' : 'bg-white/95 border-zinc-200 text-zinc-800'} backdrop-blur-md border p-4 rounded-2xl shadow-2xl z-30 select-none w-56 text-sm`}>
              <div className="flex flex-col gap-2">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                  {activeTool === 'sticky' ? 'Note Background' : 'Stroke Color'}
                </span>
                <div className="grid grid-cols-5 gap-2">
                  <ColorDot color="#3b82f6" active={strokeColor} onClick={setStrokeColor} /> {/* blue */}
                  <ColorDot color="#ef4444" active={strokeColor} onClick={setStrokeColor} /> {/* red */}
                  <ColorDot color="#10b981" active={strokeColor} onClick={setStrokeColor} /> {/* emerald */}
                  <ColorDot color="#f59e0b" active={strokeColor} onClick={setStrokeColor} /> {/* amber */}
                  <ColorDot color="#a855f7" active={strokeColor} onClick={setStrokeColor} /> {/* purple */}
                  <ColorDot color="#ec4899" active={strokeColor} onClick={setStrokeColor} /> {/* pink */}
                  <ColorDot color="#06b6d4" active={strokeColor} onClick={setStrokeColor} /> {/* cyan */}
                  <ColorDot color="#e2e8f0" active={strokeColor} onClick={setStrokeColor} /> {/* slate */}
                  <ColorDot color="#fef08a" active={strokeColor} onClick={setStrokeColor} /> {/* sticky yellow */}
                  <ColorDot color="#fca5a5" active={strokeColor} onClick={setStrokeColor} /> {/* light red */}
                </div>
              </div>

              {activeTool !== 'sticky' && activeTool !== 'text' && (
                <>
                  <div className={`w-full h-px ${isDark ? 'bg-zinc-900' : 'bg-zinc-200'} my-1`}></div>
                  
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Brush Width</span>
                    <input 
                      type="range" 
                      min="2" 
                      max="30" 
                      value={brushWidth} 
                      onChange={(e) => setBrushWidth(Number(e.target.value))}
                      className={`w-full h-1 rounded-lg appearance-none cursor-pointer accent-blue-500 ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`} 
                    />
                    <span className={`text-[10px] text-right font-mono ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>{brushWidth}px</span>
                  </div>
                </>
              )}

              {selectedElement && (selectedElement.tool === 'text' || selectedElement.tool === 'sticky') && (
                <>
                  <div className={`w-full h-px ${isDark ? 'bg-zinc-900' : 'bg-zinc-200'} my-1`}></div>
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                      Edit Text
                    </span>
                    <textarea
                      value={(selectedElement as any).text || ''}
                      onChange={(e) => {
                        const updated = {
                          ...selectedElement,
                          text: e.target.value,
                        } as BoardElement;
                        RealtimeEngine.updateElementLocally(updated);
                      }}
                      onBlur={() => {
                        RealtimeEngine.commitElement('UPDATE_ELEMENT', selectedElement);
                        SnapshotEngine.logEvent();
                      }}
                      onKeyDown={(e) => e.stopPropagation()}
                      className={`${isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'} border rounded-lg p-2 text-xs outline-none focus:border-blue-500 w-full h-20 resize-none font-sans`}
                      placeholder="Type text here..."
                    />
                  </div>
                </>
              )}

              {/* Delete inspector action */}
              {selectedIds.length > 0 && (
                <>
                  <div className={`w-full h-px ${isDark ? 'bg-zinc-900' : 'bg-zinc-200'} my-1`}></div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDeleteSelected}
                      className="w-full py-1.5 bg-red-950/20 hover:bg-red-950/40 border border-red-500/20 text-red-400 hover:text-red-300 rounded-lg font-semibold text-xs transition-all flex items-center justify-center gap-1.5"
                      title="Delete element"
                    >
                      <Trash2 size={14} />
                      Delete Element
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Canvas Navigation Camera Controls bottom right */}
          <div className={`absolute right-6 bottom-6 flex items-center gap-1 ${isDark ? 'bg-zinc-950/80 border-zinc-800/80 text-zinc-300' : 'bg-white/95 border-zinc-200 text-zinc-800'} backdrop-blur-md border p-1.5 rounded-xl shadow-xl z-30 select-none`}>
            <button
              onClick={() => setCamera({ zoom: RenderingEngine.clampZoom(camera.zoom - 0.1) })}
              className={`p-1.5 ${isDark ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'hover:bg-zinc-100 text-zinc-500 hover:text-black'} rounded-lg transition-all`}
              title="Zoom Out"
            >
              <ZoomOut size={14} />
            </button>
            <span className={`text-[10px] font-mono ${isDark ? 'text-zinc-400' : 'text-zinc-600'} font-bold px-2 w-12 text-center select-none`}>
              {Math.round(camera.zoom * 100)}%
            </span>
            <button
              onClick={() => setCamera({ zoom: RenderingEngine.clampZoom(camera.zoom + 0.1) })}
              className={`p-1.5 ${isDark ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'hover:bg-zinc-100 text-zinc-500 hover:text-black'} rounded-lg transition-all`}
              title="Zoom In"
            >
              <ZoomIn size={14} />
            </button>
            <div className={`h-4 w-px ${isDark ? 'bg-zinc-900' : 'bg-zinc-200'} mx-1`}></div>
            <button
              onClick={() => setCamera({ x: 0, y: 0, zoom: 1 })}
              className={`p-1.5 ${isDark ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'hover:bg-zinc-100 text-zinc-500 hover:text-black'} rounded-lg transition-all`}
              title="Reset Zoom Camera"
            >
              <Maximize2 size={13} />
            </button>
            <button
              onClick={toggleGrid}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${gridVisible ? 'text-blue-400 hover:text-blue-300' : (isDark ? 'text-zinc-500 hover:text-zinc-400' : 'text-zinc-400 hover:text-zinc-600')}`}
              title="Toggle Grid Lines"
            >
              Grid
            </button>
          </div>

          {/* HTML Overlay Editor for inputting Text element */}
          {textInput && (
            <div 
              style={{ left: textInput.x, top: textInput.y }}
              className={`absolute z-40 p-2.5 rounded-xl shadow-2xl flex items-center gap-2 border ${isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-zinc-200'}`}
            >
              <input
                autoFocus
                type="text"
                value={textVal}
                onChange={(e) => setTextVal(e.target.value)}
                onBlur={handleTextCommit}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === 'Enter') handleTextCommit();
                  if (e.key === 'Escape') setTextInput(null);
                }}
                className={`rounded-lg px-3 py-1.5 text-sm outline-none focus:border-blue-500 w-44 font-sans border ${isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-300 text-zinc-900'}`}
                placeholder="Type and enter..."
              />
              <button 
                onMouseDown={(e) => { e.preventDefault(); handleTextCommit(); }}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-all"
              >
                Add
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. BOTTOM TIMELINE SCRUBBER */}
      {board && (
        <TimelineScrubber 
          boardId={board._id} 
          onScrubRelease={handleScrubRelease} 
        />
      )}
    </div>
  );
}

function WhiteboardImage({ el, id, rotation, onTransformEnd }: { el: ImageElement; id?: string; rotation?: number; onTransformEnd?: (e: any) => void }) {
  const [imageEl, setImageEl] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new Image();
    const resolvedUrl = el.src.startsWith('http') ? el.src : `http://localhost:5000${el.src}`;
    img.src = resolvedUrl;
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImageEl(img);
    };
  }, [el.src]);

  if (!imageEl) return null;

  return (
    <KonvaImage
      id={id}
      x={el.x}
      y={el.y}
      width={el.width}
      height={el.height}
      image={imageEl}
      rotation={rotation ?? 0}
      onTransformEnd={onTransformEnd}
    />
  );
}

/* ================= UTILITY BUTTONS COMPONENTS ================= */

function ToolButton({ 
  tool, 
  icon, 
  title, 
  active, 
  onClick, 
  disabled 
}: { 
  tool: BoardTool; 
  icon: React.ReactNode; 
  title: string; 
  active: BoardTool; 
  onClick: (tool: BoardTool) => void;
  disabled?: boolean;
}) {
  const isSelected = active === tool;
  const theme = useUIStore((state) => state.theme);
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  return (
    <button
      onClick={() => onClick(tool)}
      disabled={disabled}
      className={`
        w-10 h-10 rounded-xl flex items-center justify-center transition-all select-none relative group
        ${isSelected ? 'bg-blue-600 text-white shadow-lg' : (isDark ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900' : 'text-zinc-600 hover:text-black hover:bg-zinc-100')}
        disabled:opacity-30 disabled:pointer-events-none
      `}
      title={title}
    >
      {icon}
      
      {/* Tooltip */}
      <div className={`absolute left-full ml-3 px-2.5 py-1.5 rounded-lg border shadow-xl text-xs font-bold whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-100 delay-500 translate-x-1 group-hover:translate-x-0 ${isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-300' : 'bg-white border-zinc-200 text-zinc-800'}`}>
        {title}
      </div>
    </button>
  );
}

function ColorDot({ 
  color, 
  active, 
  onClick 
}: { 
  color: string; 
  active: string; 
  onClick: (color: string) => void;
}) {
  const isSelected = active === color;
  return (
    <button
      onClick={() => onClick(color)}
      style={{ backgroundColor: color }}
      className={`
        w-8 h-8 rounded-xl transition-all shadow-md active:scale-90 border-2
        ${isSelected ? 'border-white scale-110 shadow-lg shadow-black/40' : 'border-zinc-800/40 hover:scale-105'}
      `}
    />
  );
}
