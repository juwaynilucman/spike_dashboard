import React, { useState, useRef, useMemo } from 'react';
import './Timeline.css';

const Timeline = ({ timeRange, windowSize, onTimeRangeChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const timelineRef = useRef(null);
  const dragStartRef = useRef({ x: 0, timeRange: { start: 0, end: 0 } });

  // Calculate cursor position based on current window center
  const cursorPosition = useMemo(() => {
    const totalDataRange = 1000;
    const centerTime = (timeRange.start + timeRange.end) / 2;
    return Math.max(0, Math.min(100, (centerTime / totalDataRange) * 100));
  }, [timeRange]);

  const handleMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    if (timelineRef.current) {
      const rect = timelineRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      dragStartRef.current = { x, timeRange: { ...timeRange } };
    }
  };

  const handleTimelineClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging && timelineRef.current) {
      const rect = timelineRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const positionPercent = Math.max(0, Math.min(100, (x / rect.width) * 100));
      
      // Calculate new center time
      const totalDataRange = 1000;
      const newCenterTime = (positionPercent / 100) * totalDataRange;
      
      const newStart = Math.max(0, Math.min(totalDataRange - windowSize, newCenterTime - windowSize / 2));
      const newEnd = newStart + windowSize;
      
      onTimeRangeChange({ start: newStart, end: newEnd });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add global mouse events when dragging
  React.useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e) => {
        if (!timelineRef.current) return;

        const rect = timelineRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const deltaX = x - dragStartRef.current.x;
        
        // Calculate how much to shift the time range
        const totalDataRange = 1000;
        const timeShift = (deltaX / rect.width) * totalDataRange;
        
        // Calculate new time range
        const newStart = Math.max(0, Math.min(totalDataRange - windowSize, dragStartRef.current.timeRange.start + timeShift));
        const newEnd = newStart + windowSize;
        
        // Update the time range
        onTimeRangeChange({ start: newStart, end: newEnd });
      };
      
      const handleGlobalMouseUp = () => {
        setIsDragging(false);
      };
      
      document.addEventListener('mousemove', handleGlobalMouseMove, { passive: false });
      document.addEventListener('mouseup', handleGlobalMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging, windowSize, onTimeRangeChange]);

  const timeLabels = useMemo(() => {
    const labels = [];
    const totalDataRange = 1000;
    const step = totalDataRange / 4;
    
    for (let i = 0; i <= 4; i++) {
      labels.push((i * step).toFixed(0));
    }
    
    return labels;
  }, []);

  return (
    <div className="timeline">
      <div 
        className="timeline-track" 
        ref={timelineRef}
        onClick={handleTimelineClick}
        onMouseDown={handleMouseDown}
      >
        <div 
          className={`timeline-cursor ${isDragging ? 'dragging' : ''}`}
          style={{ left: `${cursorPosition}%` }}
        ></div>
      </div>
      <div className="timeline-labels">
        {timeLabels.map((label, index) => (
          <span key={index}>{label}s</span>
        ))}
      </div>
    </div>
  );
};

export default Timeline;