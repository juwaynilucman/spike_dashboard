import React from 'react';
import SpikeChannel from './SpikeChannel';
import './SpikeGrid.css';

const SpikeGrid = ({ spikeData, selectedChannels, channelScrollOffset, timeRange, windowSize, spikeThreshold, onChannelScroll, isLoading }) => {
  // Show channels starting from the scroll offset
  const displayChannels = selectedChannels.slice(channelScrollOffset, channelScrollOffset + 3);
  
  // Fill remaining slots with empty channels if needed
  const gridChannels = Array.from({ length: 3 }, (_, index) => {
    const channelId = displayChannels[index];
    return {
      id: channelId,
      data: channelId !== undefined ? spikeData[channelId] : null,
      isActive: channelId !== undefined
    };
  });

  const maxOffset = Math.max(0, selectedChannels.length - 3);
  const canScrollUp = channelScrollOffset > 0;
  const canScrollDown = channelScrollOffset < maxOffset;

  return (
    <div className="spike-grid-container">
      <div className="spike-grid">
        {gridChannels.map((channel, index) => (
          <SpikeChannel
            key={channel.id || `empty-${index}`}
            channelId={channel.id}
            data={channel.data}
            isActive={channel.isActive}
            timeRange={timeRange}
            windowSize={windowSize}
            spikeThreshold={spikeThreshold}
            isLoading={isLoading}
          />
        ))}
      </div>
      
      <div className="channel-slider-container">
        <div className="channel-slider-track">
          <div 
            className="channel-slider-thumb"
            style={{ 
              top: `${maxOffset > 0 ? (channelScrollOffset / maxOffset) * 100 : 0}%`,
              opacity: selectedChannels.length > 3 ? 1 : 0.3
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              if (selectedChannels.length <= 3) return;
              const rect = e.currentTarget.parentElement.getBoundingClientRect();
              const handleMouseMove = (moveEvent) => {
                const y = moveEvent.clientY - rect.top;
                const percentage = Math.max(0, Math.min(100, (y / rect.height) * 100));
                const newOffset = Math.round((percentage / 100) * maxOffset);
                onChannelScroll(newOffset);
              };
              const handleMouseUp = () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
              };
              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default SpikeGrid;

