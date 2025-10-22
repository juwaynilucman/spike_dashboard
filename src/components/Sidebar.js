import React, { useState, useRef, useEffect } from 'react';
import ChannelGrid from './ChannelGrid';
import './Sidebar.css';

const Sidebar = ({ selectedChannels, onChannelToggle }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [width, setWidth] = useState(280);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef(null);
  const resizeThrottleRef = useRef(null);
  const minWidth = 200;
  const maxWidth = 500;

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;

      const newWidth = e.clientX;
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setWidth(newWidth);

        // Throttle resize events during dragging for better performance
        if (resizeThrottleRef.current) {
          clearTimeout(resizeThrottleRef.current);
        }
        resizeThrottleRef.current = setTimeout(() => {
          window.dispatchEvent(new Event('resize'));
        }, 100);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      // Trigger window resize event after resizing is complete
      window.dispatchEvent(new Event('resize'));
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      // Clear any pending resize throttle
      if (resizeThrottleRef.current) {
        clearTimeout(resizeThrottleRef.current);
      }
    };
  }, [isResizing]);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
    // Trigger window resize event to notify plots
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 300); // Match the transition duration
  };

  return (
    <>
      <div
        ref={sidebarRef}
        className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}
        style={{ width: isCollapsed ? '0px' : `${width}px` }}
      >
        <div className="sidebar-content">
          <div className="sidebar-header">
            <h3>Channel Selection ({selectedChannels.length}/385)</h3>
            <button
              className="sidebar-collapse-btn"
              onClick={toggleSidebar}
              title="Collapse sidebar"
            >
              ‹
            </button>
          </div>
          <div className="control-group">
            <ChannelGrid
              selectedChannels={selectedChannels}
              onChannelToggle={onChannelToggle}
              totalChannels={385}
            />
          </div>
        </div>
        {!isCollapsed && (
          <div
            className="sidebar-resize-handle"
            onMouseDown={handleMouseDown}
          />
        )}
      </div>
      {isCollapsed && (
        <button
          className="sidebar-expand-btn"
          onClick={toggleSidebar}
          title="Expand sidebar"
        >
          ›
        </button>
      )}
    </>
  );
};

export default Sidebar;

