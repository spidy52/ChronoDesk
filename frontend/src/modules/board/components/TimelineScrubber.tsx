import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Monitor } from 'lucide-react';
import { useBoardStore } from '../../../store/useBoardStore';
import { TimelineEngine } from '../engine/TimelineEngine';
import { RealtimeEngine } from '../engine/RealtimeEngine';
import { useUIStore } from '../../../store/useUIStore';

const getFullUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  return `http://localhost:5000${url}`;
};

interface TimelineScrubberProps {
  boardId: string;
  onScrubRelease: (time: number) => void;
}

export default function TimelineScrubber({ boardId, onScrubRelease }: TimelineScrubberProps) {
  const {
    isReplayMode,
    replayTime,
    boardStartTime,
    boardEndTime,
    isPlaying,
    playbackSpeed,
    timelineFrames,
    setReplayMode,
    setReplayTime,
    setPlaybackSpeed,
    setElements,
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

  const scrubberRef = useRef<HTMLDivElement>(null);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState<number>(0);
  const [hoverThumb, setHoverThumb] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Time boundaries helper
  const totalDuration = Math.max(1000, boardEndTime - boardStartTime);
  const currentPercentage = Math.min(100, Math.max(0, ((replayTime - boardStartTime) / totalDuration) * 100));

  // Playback toggling
  const handlePlayToggle = () => {
    if (isPlaying) {
      TimelineEngine.stopPlayback();
    } else {
      // If we are at the end, restart from beginning
      if (replayTime >= boardEndTime - 1000) {
        setReplayTime(boardStartTime);
      }
      TimelineEngine.startPlayback(boardId);
    }
  };

  // Convert client offset X to time
  const getTimeFromX = (clientX: number): number => {
    if (!scrubberRef.current) return boardStartTime;
    const rect = scrubberRef.current.getBoundingClientRect();
    const x = Math.min(rect.width, Math.max(0, clientX - rect.left));
    const pct = x / rect.width;
    return boardStartTime + pct * totalDuration;
  };

  const lastSeekTimeRef = useRef<number>(0);

  // Dragging Scrubber handlers
  const handleMouseDown = async (e: React.MouseEvent) => {
    setIsDragging(true);
    TimelineEngine.stopPlayback();
    const newTime = getTimeFromX(e.clientX);
    setReplayTime(newTime);
    setReplayMode(true);
    
    lastSeekTimeRef.current = newTime;
    let elementsList;
    if (TimelineEngine.hasLoadedAllData) {
      elementsList = TimelineEngine.reconstructStateLocallyAt(newTime);
    } else {
      elementsList = await TimelineEngine.reconstructStateAt(boardId, newTime);
    }
    if (lastSeekTimeRef.current === newTime) {
      setElements(elementsList);
    }
  };

  useEffect(() => {
    const handleMouseMove = async (e: MouseEvent) => {
      if (!isDragging) return;
      const newTime = getTimeFromX(e.clientX);
      setReplayTime(newTime);

      lastSeekTimeRef.current = newTime;
      let elementsList;
      if (TimelineEngine.hasLoadedAllData) {
        elementsList = TimelineEngine.reconstructStateLocallyAt(newTime);
      } else {
        elementsList = await TimelineEngine.reconstructStateAt(boardId, newTime);
      }
      if (lastSeekTimeRef.current === newTime) {
        setElements(elementsList);
      }
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        onScrubRelease(replayTime);
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, replayTime, boardId, onScrubRelease, setElements]);

  // Keep boardEndTime updated in real-time when in live mode
  useEffect(() => {
    if (isReplayMode) return;

    const interval = setInterval(() => {
      const { setTimelineBounds, boardStartTime } = useBoardStore.getState();
      setTimelineBounds(boardStartTime, Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [isReplayMode]);

  // Hovering tooltip handler
  const handleMouseMoveHover = (e: React.MouseEvent) => {
    if (!scrubberRef.current) return;
    const rect = scrubberRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    setHoverX(x);
    
    const time = getTimeFromX(e.clientX);
    setHoverTime(time);

    // Find closest thumbnail image frame
    let closestFrame = null;
    let minDiff = Infinity;
    timelineFrames.forEach((frame) => {
      const diff = Math.abs(frame.timestamp - time);
      if (diff < minDiff) {
        minDiff = diff;
        closestFrame = frame;
      }
    });

    if (closestFrame && minDiff < 30000) { // Hover thumbnail within 30s proximity
      setHoverThumb((closestFrame as any).thumbnailUrl);
    } else {
      setHoverThumb(null);
    }
  };

  // Format dates for labels
  const formatTime = (ms: number) => {
    const date = new Date(ms);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className={`border-t p-4 select-none relative flex flex-col gap-3 ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
      
      {/* Upper Controls */}
      <div className="flex items-center justify-between gap-4">
        
        {/* Playback Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={handlePlayToggle}
            className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-all shadow-md active:scale-95"
            title={isPlaying ? 'Pause' : 'Play Replay'}
          >
            {isPlaying ? <Pause size={18} fill="white" /> : <Play size={18} fill="white" className="ml-0.5" />}
          </button>
          
          <button
            onClick={() => {
              TimelineEngine.stopPlayback();
              setReplayTime(boardStartTime);
              onScrubRelease(boardStartTime);
            }}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600'}`}
            title="Restart"
          >
            <RotateCcw size={14} />
          </button>

          {/* Speed Multiplier */}
          <select
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
            className={`border text-xs rounded-lg px-2 py-1 outline-none cursor-pointer transition-all ${isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700' : 'bg-zinc-100 border-zinc-300 text-zinc-700 hover:bg-zinc-200'}`}
            title="Playback Speed"
          >
            <option value="1">1x Speed</option>
            <option value="2">2x Speed</option>
            <option value="4">4x Speed</option>
            <option value="8">8x Speed</option>
          </select>
        </div>

        {/* Time display indicator */}
        <div className={`font-mono text-xs flex items-center gap-2 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
          <span className="text-blue-500 font-bold">{formatTime(replayTime)}</span>
          <span className={isDark ? 'text-zinc-600' : 'text-zinc-400'}>/</span>
          <span>{formatTime(boardEndTime)}</span>
        </div>

        {/* Modes Toggle */}
        <div>
          {isReplayMode ? (
            <button
              onClick={() => {
                TimelineEngine.stopPlayback();
                setReplayMode(false);
                // Snap back to live Yjs elements instead of database
                const liveEls = Array.from(RealtimeEngine.yElements.values()) as any[];
                setElements(liveEls);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${isDark ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-600/20' : 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100'}`}
            >
              <Monitor size={12} />
              Return to Live Board
            </button>
          ) : (
            <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${isDark ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'bg-blue-50 text-blue-600 border border-blue-200'}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></span>
              Live Sync Active
            </span>
          )}
        </div>
      </div>

      {/* Timeline Filmstrip & Draggable Scrubber */}
      <div 
        ref={scrubberRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMoveHover}
        onMouseLeave={() => setHoverTime(null)}
        className={`h-20 rounded-2xl border relative cursor-ew-resize overflow-hidden ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-100 border-zinc-200'}`}
      >
        {/* filmstrip backgrounds (thumbnails at times) */}
        <div className="absolute inset-0 flex items-center pointer-events-none opacity-40 gap-1 overflow-x-auto scrollbar-hide px-2">
          {timelineFrames.map((frame, i) => {
            const framePct = ((frame.timestamp - boardStartTime) / totalDuration) * 100;
            return (
              <img
                key={frame._id || i}
                src={getFullUrl(frame.thumbnailUrl)}
                alt="thumbnail"
                style={{ 
                  left: `${framePct}%`,
                  transform: 'translateX(-50%)',
                }}
                className={`absolute h-16 w-28 object-cover rounded-md border ${isDark ? 'border-zinc-800' : 'border-zinc-300'}`}
              />
            );
          })}
        </div>

        {/* Playhead bar */}
        <div 
          style={{ left: `${currentPercentage}%` }}
          className="absolute top-0 bottom-0 w-0.5 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] z-10 pointer-events-none"
        >
          {/* Top handle pill */}
          <div className="absolute -top-1 -left-1.5 w-3.5 h-3.5 rounded-full bg-blue-500 border border-white shadow-md"></div>
        </div>

        {/* Hover preview tooltips */}
        {hoverTime !== null && (
          <div 
            style={{ 
              left: `${hoverX}px`,
              transform: 'translateX(-50%)',
            }}
            className={`absolute bottom-full mb-3 pointer-events-none z-30 flex flex-col items-center gap-1.5 p-1.5 rounded-xl shadow-xl transition-all duration-75 ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}
          >
            {hoverThumb && (
              <img 
                src={getFullUrl(hoverThumb)} 
                alt="preview" 
                className={`w-28 h-16 object-cover rounded-lg border ${isDark ? 'border-zinc-700 bg-zinc-950' : 'border-zinc-200 bg-zinc-100'}`} 
              />
            )}
            <div className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${isDark ? 'text-zinc-300 bg-zinc-950' : 'text-zinc-600 bg-zinc-100'}`}>
              {formatTime(hoverTime)}
            </div>
            <div className={`w-2 h-2 border-r border-b rotate-45 -mt-2 ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}></div>
          </div>
        )}

        {/* Timestamps ticks */}
        <div className={`absolute bottom-0 left-0 right-0 h-4 pointer-events-none flex justify-between px-3 text-[9px] font-mono items-center border-t ${isDark ? 'bg-zinc-900/60 text-zinc-500 border-zinc-800/40' : 'bg-zinc-50/80 text-zinc-400 border-zinc-200'}`}>
          <span>{formatTime(boardStartTime)}</span>
          <span>{formatTime(boardStartTime + totalDuration / 2)}</span>
          <span>{formatTime(boardEndTime)}</span>
        </div>
      </div>
    </div>
  );
}
