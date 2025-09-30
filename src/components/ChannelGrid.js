import React from 'react';
import './ChannelGrid.css';

const ChannelGrid = ({ selectedChannels, onChannelToggle, totalChannels = 385 }) => {
  const generateChannelPositions = (numChannels) => {
    const numRepeats = Math.ceil(numChannels / 4);
    const positions = [];
    
    const xPattern = [0, 51, 21, 72];
    
    const yValues = [];
    for (let i = 0; i < numRepeats; i++) {
      const row1Y = 20 + i * 100;
      const row2Y = row1Y + 50;
      yValues.push(row1Y, row1Y, row2Y, row2Y);
    }
    
    const xValues = [];
    for (let i = 0; i < numRepeats; i++) {
      xValues.push(...xPattern);
    }
    
    for (let i = 0; i < numChannels; i++) {
      positions.push({
        id: i + 1,
        x: xValues[i],
        y: yValues[i]
      });
    }
    
    return positions;
  };

  const channelPositions = generateChannelPositions(totalChannels);

  const handleChannelClick = (channelId) => {
    onChannelToggle(channelId);
  };

  return (
    <div className="channel-grid-wrapper">
      <div className="channel-grid-scroll">
        <div className="channel-grid-canvas">
          {channelPositions.map((pos) => (
            <div
              key={pos.id}
              className={`channel-box ${selectedChannels.includes(pos.id) ? 'selected' : ''}`}
              style={{
                left: `${pos.x}px`,
                top: `${pos.y}px`
              }}
              onClick={() => handleChannelClick(pos.id)}
            >
              {pos.id}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChannelGrid;
