import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Stage, Layer, Line, Rect, Circle, Text as KonvaText, Path, Group, Image as KonvaImage, Transformer, Arrow } from 'react-konva';
import { 
  Type, Square, Circle as CircleIcon, Triangle, StickyNote, 
  Trash2, MousePointer, Edit2, Eraser, ZoomIn, ZoomOut, Maximize2, Share2, 
  Download, ArrowLeft, Undo, Redo, Minus, ArrowUpRight, Clock, MoreVertical, Hand
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
import { BACKEND_URL } from '@/config';

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
    error,
    textFontFamily,
    textFontSize,
    setBoard,
    setElements,
    setSelectedIds,
    setCamera,
    toggleGrid,
    setActiveTool,
    setStrokeColor,
    setBrushWidth,
    setTextFontFamily,
    setTextFontSize,
    setError,
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
  const [showTimeline, setShowTimeline] = useState(() => window.innerWidth >= 768);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [lastTouchDist, setLastTouchDist] = useState<number | null>(null);
  const [lastTouchCenter, setLastTouchCenter] = useState<{ x: number; y: number } | null>(null);

  // Synchronize undo/redo buttons state reactively with Yjs history stack
  useEffect(() => {
    const updateUndoRedoState = () => {
      setCanUndo(RealtimeEngine.undoManager.canUndo());
      setCanRedo(RealtimeEngine.undoManager.canRedo());
    };

    updateUndoRedoState();

    RealtimeEngine.undoManager.on('stack-item-added', updateUndoRedoState);
    RealtimeEngine.undoManager.on('stack-item-popped', updateUndoRedoState);
    RealtimeEngine.undoManager.on('stack-item-updated', updateUndoRedoState);

    return () => {
      RealtimeEngine.undoManager.off('stack-item-added', updateUndoRedoState);
      RealtimeEngine.undoManager.off('stack-item-popped', updateUndoRedoState);
      RealtimeEngine.undoManager.off('stack-item-updated', updateUndoRedoState);
    };
  }, []);

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

  const textInputMountTimeRef = useRef<number>(0);
  useEffect(() => {
    if (textInput) {
      textInputMountTimeRef.current = Date.now();
    }
  }, [textInput]);

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
    if (activeTool === 'pan') {
      return panning ? 'grabbing' : 'grab';
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
      } catch (err: any) {
        console.error('Failed to initialize board API:', err);
        const errMsg = err.response?.data?.error || 'Failed to initialize whiteboard. Make sure you are a collaborator on this task.';
        setError(errMsg);
      }
    };

    initBoard();

    return () => {
      RealtimeEngine.leaveBoard();
      SnapshotEngine.stopAutoSnapshots();
      TimelineEngine.stopPlayback();
      TimelineEngine.clearCache();
      setError(null);
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

  useEffect(() => {
    const timer = setTimeout(() => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [showTimeline, activeTool, selectedIds.length]);

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
                const resolvedUrl = imageUrl.startsWith('http') ? imageUrl : `${BACKEND_URL}${imageUrl}`;
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

  // Handle multitouch panning & zooming
  const handleTouchStart = (e: any) => {
    if (isReplayMode) return;
    const stage = stageRef.current;
    if (!stage) return;

    const touches = e.evt.touches;
    if (touches.length === 1) {
      handleStageMouseDown(e);
    } else if (touches.length === 2) {
      const p1 = { x: touches[0].clientX, y: touches[0].clientY };
      const p2 = { x: touches[1].clientX, y: touches[1].clientY };
      
      const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      setLastTouchDist(dist);

      const center = {
        x: (p1.x + p2.x) / 2,
        y: (p1.y + p2.y) / 2,
      };
      setLastTouchCenter(center);
      
      setIsDrawing(false);
      setActivePoints([]);
      RealtimeEngine.sendDrawProgress('', '', 0, []);
    }
  };

  const handleTouchMove = (e: any) => {
    if (isReplayMode) return;
    const stage = stageRef.current;
    if (!stage) return;

    const touches = e.evt.touches;
    if (touches.length === 1) {
      if (activeTool !== 'pan') {
        e.evt.preventDefault(); // prevent screen scrolling when drawing/interacting
      }
      handleStageMouseMove();
    } else if (touches.length === 2 && lastTouchDist !== null && lastTouchCenter !== null) {
      e.evt.preventDefault(); // prevent browser pinch zoom

      const p1 = { x: touches[0].clientX, y: touches[0].clientY };
      const p2 = { x: touches[1].clientX, y: touches[1].clientY };
      
      const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      const center = {
        x: (p1.x + p2.x) / 2,
        y: (p1.y + p2.y) / 2,
      };

      const zoomFactor = dist / lastTouchDist;
      let newZoom = camera.zoom * zoomFactor;
      newZoom = RenderingEngine.clampZoom(newZoom);

      const dx = center.x - lastTouchCenter.x;
      const dy = center.y - lastTouchCenter.y;

      const pointer = stage.getPointerPosition() || center;
      const mousePointTo = {
        x: (pointer.x - camera.x) / camera.zoom,
        y: (pointer.y - camera.y) / camera.zoom,
      };

      setCamera({
        zoom: newZoom,
        x: pointer.x - mousePointTo.x * newZoom + dx,
        y: pointer.y - mousePointTo.y * newZoom + dy,
      });

      setLastTouchDist(dist);
      setLastTouchCenter(center);
    }
  };

  const handleTouchEnd = (e: any) => {
    const touches = e.evt.touches;
    if (touches.length === 0) {
      handleStageMouseUp();
    }
    setLastTouchDist(null);
    setLastTouchCenter(null);
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
      if (el.tool === 'pencil' || el.tool === 'marker') {
        return DrawingEngine.intersectsStroke(worldPos.x, worldPos.y, el as any);
      }
      return DrawingEngine.intersectsBox(worldPos.x, worldPos.y, el);
    });

    if (clickedEl) {
      setSelectedIds([clickedEl.id]);
      
      if (clickedEl.tool === 'text' || clickedEl.tool === 'sticky') {
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
    } else {
      setSelectedIds([]);
    }
  };

  const handleStageMouseDown = (e: any) => {
    if (isReplayMode) return; // Read-only during timeline seek
    if (textInput) {
      handleTextCommit();
      return;
    }
    if (e.target.getParent()?.className === 'Transformer') return;

    const stage = stageRef.current;
    if (!stage) return;
    
    // Space key panning, middle/right-mouse click, or Pan tool active
    const isPanningMode = e.evt.button === 1 || e.evt.button === 2 || activeTool === 'pan' || (activeTool === 'select' && e.evt.spaceKey);
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
        const isSelected = selectedIds.includes(el.id);
        if (isSelected) {
          // If already selected, allow clicking anywhere inside its box to drag it
          return DrawingEngine.intersectsBox(worldPos.x, worldPos.y, el);
        }
        if (el.tool === 'pencil' || el.tool === 'marker') {
          return DrawingEngine.intersectsStroke(worldPos.x, worldPos.y, el as any);
        }
        return DrawingEngine.intersectsBox(worldPos.x, worldPos.y, el);
      });

      if (clickedEl) {
        setSelectedIds([clickedEl.id]);
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
    if (activeTool === 'select' && selectedIds.length > 0) {
      if (hasDragged) {
        const targetId = selectedIds[0]!;
        const el = elements.find((e) => e.id === targetId);
        if (el) {
          RealtimeEngine.commitElement('UPDATE_ELEMENT', el);
          SnapshotEngine.logEvent();
        }
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

  const handleFontFamilyChange = (font: string) => {
    setTextFontFamily(font);
    if (selectedElement && selectedElement.tool === 'text') {
      const updated = {
        ...selectedElement,
        fontFamily: font,
      } as BoardElement;
      RealtimeEngine.updateElementLocally(updated);
      RealtimeEngine.commitElement('UPDATE_ELEMENT', updated);
      SnapshotEngine.logEvent();
    }
  };

  const handleFontSizeChange = (size: number) => {
    setTextFontSize(size);
    if (selectedElement && selectedElement.tool === 'text') {
      const updated = {
        ...selectedElement,
        fontSize: size,
      } as BoardElement;
      RealtimeEngine.updateElementLocally(updated);
      RealtimeEngine.commitElement('UPDATE_ELEMENT', updated);
      SnapshotEngine.logEvent();
    }
  };

  // Commit text from input editor overlay
  const handleTextCommit = (fromBlur?: boolean) => {
    if (!textInput || !board) return;
    if (fromBlur && Date.now() - textInputMountTimeRef.current < 200) {
      return;
    }
    const currentInput = textInput;
    setTextInput(null);
    setActiveTool('select');

    if (textVal.trim().length > 0) {
      if (currentInput.elementId) {
        // Edit existing element
        const el = elements.find((e) => e.id === currentInput.elementId);
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
          currentInput.wx,
          currentInput.wy,
          strokeColor,
          textFontSize,
          selfProfile?.userId || 'unknown',
          textFontFamily
        );
        RealtimeEngine.commitElement('CREATE_ELEMENT', textNode);
        SnapshotEngine.logEvent();
      }
    } else {
      if (currentInput.elementId) {
        const el = elements.find((e) => e.id === currentInput.elementId);
        if (el) {
          RealtimeEngine.commitElement('DELETE_ELEMENT', el);
          SnapshotEngine.logEvent();
        }
      }
    }
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

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center h-screen w-full p-6 ${isDark ? 'bg-zinc-950 text-white' : 'bg-zinc-50 text-zinc-900'} font-sans`}>
        <div className={`max-w-md w-full p-8 rounded-3xl border text-center shadow-2xl backdrop-blur-md ${isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white/80 border-zinc-200'}`}>
          <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286zm0 13.036h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-3 tracking-tight">Access Denied</h2>
          <p className={`text-sm mb-8 leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
            {error}
          </p>
          <button
            onClick={() => {
              setError(null);
              navigate('/dashboard');
            }}
            className="w-full py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]"
          >
            Go Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-screen w-full ${isDark ? 'bg-zinc-950 text-white' : 'bg-zinc-50 text-zinc-900'} overflow-hidden font-sans relative`}>
      
      {/* 1. TOP DOCK BAR */}
      <header className={`h-16 border-b ${isDark ? 'border-zinc-900 bg-zinc-950/80' : 'border-zinc-200 bg-white/80'} px-4 md:px-6 flex items-center justify-between backdrop-blur-md z-30 select-none`}>
        <div className="flex items-center gap-2 md:gap-4">
          <button 
            onClick={() => navigate('/dashboard')}
            className={`w-9 h-9 md:w-10 md:h-10 rounded-xl ${isDark ? 'hover:bg-zinc-900 text-zinc-400 hover:text-white' : 'hover:bg-zinc-100 text-zinc-500 hover:text-black'} flex items-center justify-center transition-all`}
          >
            <ArrowLeft size={18} />
          </button>
          
          <div>
            <h1 className={`font-bold text-sm md:text-base leading-tight tracking-wide ${isDark ? 'text-zinc-100' : 'text-zinc-900'} flex items-center gap-1.5 md:gap-2 max-w-[100px] sm:max-w-xs md:max-w-none truncate`}>
              {board?.title || 'Whiteboard Loading...'}
              {isReplayMode && (
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
                  REPLAY REVIEW
                </span>
              )}
            </h1>
            <p className="text-[9px] md:text-[10px] text-zinc-500 font-mono mt-0.5 truncate max-w-[100px] sm:max-w-xs md:max-w-none">
              Task Workspace Dedicated Room
            </p>
          </div>
        </div>

        {/* Collaborators online avatars and actions */}
        <div className="flex items-center gap-2 md:gap-6">
          {/* Collaborator Avatars */}
          <div className="flex items-center -space-x-1.5">
            {selfProfile && (
              <div 
                className={`w-7 h-7 md:w-8 md:h-8 rounded-full border-2 ${isDark ? 'border-zinc-950' : 'border-white'} flex items-center justify-center text-[10px] md:text-xs font-bold text-white shadow-lg bg-blue-600`}
                title={`${selfProfile.name} (You)`}
              >
                {selfProfile.name.charAt(0)}
              </div>
            )}
            
            {Object.values(collaborators).map((c) => (
              <div 
                key={c.userId}
                style={{ backgroundColor: c.color }}
                className={`w-7 h-7 md:w-8 md:h-8 rounded-full border-2 ${isDark ? 'border-zinc-950' : 'border-white'} flex items-center justify-center text-[10px] md:text-xs font-bold text-white shadow-lg shadow-black/20`}
                title={c.name}
              >
                {c.name.charAt(0)}
              </div>
            ))}
          </div>

          <div className={`hidden sm:block h-6 w-px ${isDark ? 'bg-zinc-900' : 'bg-zinc-200'}`}></div>

          {/* Sync Status Badge */}
          <div className="flex items-center gap-1.5 text-xs">
            {syncStatus === 'connected' ? (
              <span className={`flex items-center gap-1.5 font-semibold ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                <span className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-emerald-500 border-2 border-emerald-950"></span>
                <span className="hidden md:inline">Connected</span>
              </span>
            ) : syncStatus === 'connecting' ? (
              <span className={`flex items-center gap-1.5 font-semibold ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border-2 border-amber-950 animate-pulse"></span>
                <span className="hidden md:inline">Connecting</span>
              </span>
            ) : (
              <span className={`flex items-center gap-1.5 font-semibold ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-600 border-2 border-zinc-950"></span>
                <span className="hidden md:inline">Offline</span>
              </span>
            )}
          </div>

          <div className={`h-6 w-px ${isDark ? 'bg-zinc-900' : 'bg-zinc-200'}`}></div>

          {/* Undo / Redo */}
          <div className={`flex items-center ${isDark ? 'bg-zinc-900/60 border-zinc-800/40' : 'bg-zinc-100 border-zinc-200'} p-0.5 md:p-1 rounded-lg md:rounded-xl border`}>
            <button
              onClick={() => RealtimeEngine.undo()}
              disabled={isReplayMode || !canUndo}
              className={`p-1 md:p-1.5 ${isDark ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'hover:bg-zinc-200 text-zinc-600 hover:text-black'} rounded-md md:rounded-lg disabled:opacity-20 disabled:cursor-not-allowed transition-all`}
              title="Undo (Ctrl+Z)"
            >
              <Undo size={14} />
            </button>
            <button
              onClick={() => RealtimeEngine.redo()}
              disabled={isReplayMode || !canRedo}
              className={`p-1 md:p-1.5 ${isDark ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'hover:bg-zinc-200 text-zinc-600 hover:text-black'} rounded-md md:rounded-lg disabled:opacity-20 disabled:cursor-not-allowed transition-all`}
              title="Redo (Ctrl+Y)"
            >
              <Redo size={14} />
            </button>
          </div>

          <div className={`hidden md:block h-6 w-px ${isDark ? 'bg-zinc-900' : 'bg-zinc-200'}`}></div>

          {/* Exports drop downs (Desktop) */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => setShowTimeline(!showTimeline)}
              className={`px-3 py-1.5 text-xs rounded-xl border ${showTimeline ? (isDark ? 'bg-blue-600/20 border-blue-500/30 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-600') : (isDark ? 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300 hover:text-white' : 'bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-700 hover:text-black')} font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95`}
              title={showTimeline ? "Hide Timeline Scrubber" : "Show Timeline Scrubber"}
            >
              <Clock size={13} />
              {showTimeline ? "Hide Timeline" : "Show Timeline"}
            </button>
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

          {/* More actions menu (Mobile) */}
          <div className="relative md:hidden">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className={`p-1.5 rounded-lg border ${isDark ? 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300' : 'bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-700'} transition-all`}
            >
              <MoreVertical size={16} />
            </button>
            {showMobileMenu && (
              <div className={`absolute right-0 top-full mt-1.5 flex flex-col gap-1 p-2 rounded-xl border shadow-xl z-50 ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200'} text-xs font-semibold w-40`}>
                <button
                  onClick={() => {
                    setShowTimeline(!showTimeline);
                    setShowMobileMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 ${isDark ? 'hover:bg-zinc-900 text-zinc-300' : 'hover:bg-zinc-100 text-zinc-700'}`}
                >
                  <Clock size={13} />
                  {showTimeline ? "Hide Timeline" : "Show Timeline"}
                </button>
                <button
                  onClick={() => {
                    handleExportPNG();
                    setShowMobileMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 ${isDark ? 'hover:bg-zinc-900 text-zinc-300' : 'hover:bg-zinc-100 text-zinc-700'}`}
                >
                  <Download size={13} />
                  Export PNG
                </button>
                <button
                  onClick={() => {
                    handleExportSVG();
                    setShowMobileMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 ${isDark ? 'hover:bg-zinc-900 text-zinc-300' : 'hover:bg-zinc-100 text-zinc-700'}`}
                >
                  <Share2 size={13} />
                  Export SVG
                </button>
                <div className={`h-px ${isDark ? 'bg-zinc-900' : 'bg-zinc-200'} my-1`}></div>
                <div className="px-3 py-1 flex items-center gap-1.5 text-[9px] text-zinc-500 font-mono">
                  <span className={`w-1.5 h-1.5 rounded-full ${syncStatus === 'connected' ? 'bg-emerald-500' : syncStatus === 'connecting' ? 'bg-amber-500 animate-pulse' : 'bg-zinc-500'}`}></span>
                  {syncStatus.toUpperCase()}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Toolbar Block (Samsung Notes Style - Stays static under the header, pushing the canvas down) */}
      <div className={`md:hidden flex flex-col border-b ${isDark ? 'border-zinc-900 bg-zinc-950 text-zinc-300' : 'border-zinc-200 bg-white text-zinc-800'} z-20 select-none`}>
        {/* Main Toolbar */}
        <div className={`flex items-center gap-1 p-1 overflow-x-auto scrollbar-none justify-between border-b ${isDark ? 'border-zinc-900' : 'border-zinc-100'}`}>
          <ToolButton tool="select" icon={<MousePointer size={16} />} title="Select" active={activeTool} onClick={setActiveTool} disabled={isReplayMode} />
          <ToolButton tool="pan" icon={<Hand size={16} />} title="Pan" active={activeTool} onClick={setActiveTool} disabled={isReplayMode} />
          <ToolButton tool="pencil" icon={<Edit2 size={16} />} title="Pencil" active={activeTool} onClick={setActiveTool} disabled={isReplayMode} />
          <ToolButton tool="eraser" icon={<Eraser size={16} />} title="Eraser" active={activeTool} onClick={setActiveTool} disabled={isReplayMode} />
          <ToolButton tool="text" icon={<Type size={16} />} title="Text" active={activeTool} onClick={setActiveTool} disabled={isReplayMode} />
          
          <div className={`h-6 w-px ${isDark ? 'bg-zinc-900' : 'bg-zinc-200'} mx-0.5`}></div>
          
          <ToolButton tool="rect" icon={<Square size={16} />} title="Rect" active={activeTool} onClick={setActiveTool} disabled={isReplayMode} />
          <ToolButton tool="circle" icon={<CircleIcon size={16} />} title="Circle" active={activeTool} onClick={setActiveTool} disabled={isReplayMode} />
          <ToolButton tool="triangle" icon={<Triangle size={16} />} title="Triangle" active={activeTool} onClick={setActiveTool} disabled={isReplayMode} />
          <ToolButton tool="line" icon={<Minus size={16} />} title="Line" active={activeTool} onClick={setActiveTool} disabled={isReplayMode} />
          <ToolButton tool="arrow" icon={<ArrowUpRight size={16} />} title="Arrow" active={activeTool} onClick={setActiveTool} disabled={isReplayMode} />
          <ToolButton tool="sticky" icon={<StickyNote size={16} />} title="Sticky" active={activeTool} onClick={setActiveTool} disabled={isReplayMode} />
        </div>

        {/* Mobile Properties Strip (Only visible when activeTool is editing/drawing and not eraser) */}
        {activeTool !== 'eraser' && (
          <div className="flex flex-col gap-2 p-2.5 text-xs">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                {activeTool === 'sticky' ? 'Note Background' : 'Color'}
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
                <ColorDot color="#3b82f6" active={strokeColor} onClick={setStrokeColor} /> {/* blue */}
                <ColorDot color="#ef4444" active={strokeColor} onClick={setStrokeColor} /> {/* red */}
                <ColorDot color="#10b981" active={strokeColor} onClick={setStrokeColor} /> {/* emerald */}
                <ColorDot color="#f59e0b" active={strokeColor} onClick={setStrokeColor} /> {/* amber */}
                <ColorDot color="#a855f7" active={strokeColor} onClick={setStrokeColor} /> {/* purple */}
                <ColorDot color="#e2e8f0" active={strokeColor} onClick={setStrokeColor} /> {/* slate/light */}
                {activeTool === 'sticky' && <ColorDot color="#fef08a" active={strokeColor} onClick={setStrokeColor} />} {/* sticky yellow */}
              </div>
            </div>
            
            {activeTool !== 'sticky' && activeTool !== 'text' && (
              <div className={`flex items-center justify-between gap-3 border-t ${isDark ? 'border-zinc-900' : 'border-zinc-100'} pt-2`}>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider shrink-0">Width</span>
                <div className="flex-1 flex items-center gap-2">
                  <input 
                    type="range" 
                    min="2" 
                    max="30" 
                    value={brushWidth} 
                    onChange={(e) => setBrushWidth(Number(e.target.value))}
                    className={`w-full h-1 rounded-lg appearance-none cursor-pointer accent-blue-500 ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`} 
                  />
                  <span className={`text-[10px] font-mono shrink-0 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>{brushWidth}px</span>
                </div>
              </div>
            )}

            {(activeTool === 'text' || (selectedElement && selectedElement.tool === 'text')) && (
              <div className={`flex flex-col gap-2 border-t ${isDark ? 'border-zinc-900' : 'border-zinc-100'} pt-2`}>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-sans">Font</span>
                  <select
                    value={selectedElement && selectedElement.tool === 'text' ? ((selectedElement as any).fontFamily || textFontFamily) : textFontFamily}
                    onChange={(e) => handleFontFamilyChange(e.target.value)}
                    className={`px-2 py-1 rounded-lg border text-[10px] outline-none font-sans ${isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'}`}
                  >
                    <option value="Outfit, Inter, sans-serif">Outfit</option>
                    <option value="Inter, sans-serif">Inter</option>
                    <option value="Georgia, serif">Georgia</option>
                    <option value="Courier New, monospace">Courier</option>
                    <option value="Comic Sans MS, cursive">Comic Sans</option>
                  </select>
                </div>
                
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-sans">Size</span>
                  <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
                    {[16, 20, 24, 32, 40, 48, 64].map((size) => {
                      const currentSize = selectedElement && selectedElement.tool === 'text' ? ((selectedElement as any).fontSize || 24) : textFontSize;
                      const isSizeSelected = currentSize === size;
                      return (
                        <button
                          key={size}
                          onClick={() => handleFontSizeChange(size)}
                          className={`px-2 py-0.5 rounded border text-[9px] font-mono font-bold transition-all ${
                            isSizeSelected 
                              ? 'bg-blue-600 border-blue-500 text-white' 
                              : (isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-zinc-50 border-zinc-200 text-zinc-600')
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {selectedElement && (selectedElement.tool === 'text' || selectedElement.tool === 'sticky') && (
              <div className={`flex flex-col gap-1 border-t ${isDark ? 'border-zinc-900' : 'border-zinc-100'} pt-2`}>
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
                  className={`${isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'} border rounded-lg p-2 text-xs outline-none focus:border-blue-500 w-full h-12 resize-none font-sans`}
                  placeholder="Type text..."
                />
              </div>
            )}

            {selectedIds.length > 0 && (
              <div className={`flex items-center gap-2 border-t ${isDark ? 'border-zinc-900' : 'border-zinc-100'} pt-2`}>
                <button
                  onClick={handleDeleteSelected}
                  className="w-full py-1 bg-red-950/20 hover:bg-red-950/40 border border-red-500/20 text-red-400 hover:text-red-300 rounded-lg font-semibold text-[10px] transition-all flex items-center justify-center gap-1"
                  title="Delete element"
                >
                  <Trash2 size={12} />
                  Delete Element
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. MAIN CORE LAYOUT AREA */}
      <div className="flex-1 flex relative overflow-hidden">
        
        {/* Left Floating Tools Toolbar (Desktop only) */}
        <div className={`hidden md:flex absolute left-6 top-1/2 -translate-y-1/2 flex-col items-center gap-2 ${isDark ? 'bg-zinc-950/80 border-zinc-800/80 text-zinc-300' : 'bg-white/95 border-zinc-200 text-zinc-800'} backdrop-blur-md border p-2.5 rounded-2xl shadow-2xl z-30 select-none`}>
          <ToolButton tool="select" icon={<MousePointer size={18} />} title="Selection (V)" active={activeTool} onClick={setActiveTool} disabled={isReplayMode} />
          <ToolButton tool="pan" icon={<Hand size={18} />} title="Grab / Pan (H)" active={activeTool} onClick={setActiveTool} disabled={isReplayMode} />
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
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
              e.preventDefault();
              if (e.shiftKey) {
                RealtimeEngine.redo();
              } else {
                RealtimeEngine.undo();
              }
            } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
              e.preventDefault();
              RealtimeEngine.redo();
            } else if (e.key.toLowerCase() === 'h') {
              setActiveTool('pan');
            } else if (e.key.toLowerCase() === 'v') {
              setActiveTool('select');
            } else if (e.key.toLowerCase() === 'p') {
              setActiveTool('pencil');
            } else if (e.key.toLowerCase() === 'e') {
              setActiveTool('eraser');
            } else if (e.key.toLowerCase() === 't') {
              setActiveTool('text');
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
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
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
                  <Group
                    key={el.id}
                    id={el.id}
                    x={el.x}
                    y={el.y}
                    scaleX={el.scaleX ?? 1}
                    scaleY={el.scaleY ?? 1}
                    rotation={el.rotation ?? 0}
                    onTransformEnd={handleTransformEnd}
                  >
                    {/* Pencil and marker freehand vector path */}
                    {(el.tool === 'pencil' || el.tool === 'marker') && (
                      <Path
                        x={0}
                        y={0}
                        scaleX={1}
                        scaleY={1}
                        rotation={0}
                        data={DrawingEngine.getFreehandPath((el as any).points, (el as any).strokeWidth ?? 4, el.tool === 'marker')}
                        fill={el.color}
                        opacity={el.tool === 'marker' ? 0.6 : 1}
                      />
                    )}

                    {/* Rectangle rendering */}
                    {el.tool === 'rect' && (
                      <Rect
                        x={0}
                        y={0}
                        width={el.width}
                        height={el.height}
                        stroke={el.color}
                        strokeWidth={(el as any).strokeWidth || 4}
                        fill={(el as any).fill || 'transparent'}
                        cornerRadius={4}
                      />
                    )}

                    {/* Circle rendering */}
                    {el.tool === 'circle' && (
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
                    )}

                    {/* Triangle rendering */}
                    {el.tool === 'triangle' && (
                      <Line
                        x={0}
                        y={0}
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
                      />
                    )}

                    {/* Line rendering */}
                    {el.tool === 'line' && (
                      <Line
                        x={0}
                        y={0}
                        width={el.width}
                        height={el.height}
                        points={[0, 0, el.width, el.height]}
                        stroke={el.color}
                        strokeWidth={(el as any).strokeWidth || 4}
                      />
                    )}

                    {/* Arrow rendering */}
                    {el.tool === 'arrow' && (
                      <Arrow
                        x={0}
                        y={0}
                        width={el.width}
                        height={el.height}
                        points={[0, 0, el.width, el.height]}
                        stroke={el.color}
                        fill={el.color}
                        strokeWidth={(el as any).strokeWidth || 4}
                        pointerLength={Math.max(10, ((el as any).strokeWidth || 4) * 2.5)}
                        pointerWidth={Math.max(10, ((el as any).strokeWidth || 4) * 2.5)}
                      />
                    )}

                    {/* Text block rendering */}
                    {el.tool === 'text' && (
                      <KonvaText
                        x={0}
                        y={0}
                        text={(el as any).text}
                        fontSize={(el as any).fontSize || 24}
                        fill={el.color}
                        fontFamily={(el as any).fontFamily || "Outfit, Inter, sans-serif"}
                      />
                    )}

                    {/* Sticky note element */}
                    {el.tool === 'sticky' && (
                      <Group
                        x={0}
                        y={0}
                        width={el.width}
                        height={el.height}
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
                        el={el as ImageElement} 
                      />
                    )}

                    {/* Select outline bounds */}
                    {isSelected && (
                      <Rect
                        x={0}
                        y={0}
                        offsetX={el.width < 0 ? -el.width + 6 : 6}
                        offsetY={el.height < 0 ? -el.height + 6 : 6}
                        width={Math.abs(el.width) + 12}
                        height={Math.abs(el.height) + 12}
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

          {/* Floating Right Controls Properties Inspector (Desktop only) */}
          {activeTool !== 'eraser' && (
            <div className={`hidden md:flex absolute right-6 top-6 flex-col gap-4 ${isDark ? 'bg-zinc-950/80 border-zinc-800/80 text-zinc-300' : 'bg-white/95 border-zinc-200 text-zinc-800'} backdrop-blur-md border p-4 rounded-2xl shadow-2xl z-30 select-none w-56 text-sm`}>
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

              {(activeTool === 'text' || (selectedElement && selectedElement.tool === 'text')) && (
                <>
                  <div className={`w-full h-px ${isDark ? 'bg-zinc-900' : 'bg-zinc-200'} my-1`}></div>
                  
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-sans">Font Family</span>
                    <select
                      value={selectedElement && selectedElement.tool === 'text' ? ((selectedElement as any).fontFamily || textFontFamily) : textFontFamily}
                      onChange={(e) => handleFontFamilyChange(e.target.value)}
                      className={`w-full px-2.5 py-1.5 rounded-xl border text-xs outline-none focus:border-blue-500 font-sans ${isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'}`}
                    >
                      <option value="Outfit, Inter, sans-serif">Outfit</option>
                      <option value="Inter, sans-serif">Inter</option>
                      <option value="Georgia, serif">Georgia</option>
                      <option value="Courier New, monospace">Courier</option>
                      <option value="Comic Sans MS, cursive">Comic Sans</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-sans">Font Size</span>
                    <div className="grid grid-cols-4 gap-1">
                      {[16, 20, 24, 32, 40, 48, 64, 80].map((size) => {
                        const currentSize = selectedElement && selectedElement.tool === 'text' ? ((selectedElement as any).fontSize || 24) : textFontSize;
                        const isSizeSelected = currentSize === size;
                        return (
                          <button
                            key={size}
                            onClick={() => handleFontSizeChange(size)}
                            className={`py-1 rounded-lg border text-[10px] font-mono font-bold transition-all ${
                              isSizeSelected 
                                ? 'bg-blue-600 border-blue-500 text-white shadow-md' 
                                : (isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200' : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:text-black')
                            }`}
                          >
                            {size}
                          </button>
                        );
                      })}
                    </div>
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
          <div className={`absolute right-4 bottom-4 md:right-6 md:bottom-6 scale-90 md:scale-100 flex items-center gap-1 ${isDark ? 'bg-zinc-950/80 border-zinc-800/80 text-zinc-300' : 'bg-white/95 border-zinc-200 text-zinc-800'} backdrop-blur-md border p-1.5 rounded-xl shadow-xl z-30 select-none`}>
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
                onBlur={() => handleTextCommit(true)}
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
                onTouchStart={(e) => { e.preventDefault(); handleTextCommit(); }}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-all"
              >
                Add
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. BOTTOM TIMELINE SCRUBBER */}
      {board && showTimeline && (
        <TimelineScrubber 
          boardId={board._id} 
          onScrubRelease={handleScrubRelease} 
        />
      )}
    </div>
  );
}

function WhiteboardImage({ el }: { el: ImageElement }) {
  const [imageEl, setImageEl] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new Image();
    const resolvedUrl = el.src.startsWith('http') ? el.src : `${BACKEND_URL}${el.src}`;
    img.src = resolvedUrl;
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImageEl(img);
    };
  }, [el.src]);

  if (!imageEl) return null;

  return (
    <KonvaImage
      x={0}
      y={0}
      width={el.width}
      height={el.height}
      image={imageEl}
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
        w-9 h-9 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center transition-all select-none relative group
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
        w-7 h-7 md:w-8 md:h-8 rounded-lg md:rounded-xl transition-all shadow-md active:scale-90 border-2
        ${isSelected ? 'border-white scale-110 shadow-lg shadow-black/40' : 'border-zinc-800/40 hover:scale-105'}
      `}
    />
  );
}
