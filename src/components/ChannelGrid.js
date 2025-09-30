import React from 'react';
import './ChannelGrid.css';

const ChannelGrid = ({ selectedChannels, onChannelToggle, totalChannels = 385 }) => {
  // Generate channel positions based on the diagram
  // Horizontal spacing: 21px between columns
  // Vertical spacing: 20px between rows
  const generateChannelPositions = (numChannels) => {
    const numRepeats = Math.ceil(numChannels / 4); // Use ceil to include remainder
    const positions = [];
    
    // Pattern with 21px horizontal spacing:
    // Left pair: [0, 51] (0 + 30 box + 21 spacing = 51)
    // Right pair: [21, 72] (21 + 30 box + 21 spacing = 72)
    const xPattern = [0, 51, 21, 72]; // 1, 2, 3, 4 pattern
    
    // Generate y values with consistent 20px vertical spacing between all rows
    const yValues = [];
    for (let i = 0; i < numRepeats; i++) {
      // Each row is 30px (box) + 20px (spacing) = 50px
      const row1Y = 20 + i * 100; // Start of this group (2 rows * 50px = 100px per group)
      const row2Y = row1Y + 50;   // Second row: +30 (box height) + 20 (spacing)
      yValues.push(row1Y, row1Y, row2Y, row2Y); // Boxes 1,2 at row1Y; boxes 3,4 at row2Y
    }
    
    // Generate x values by tiling the pattern
    const xValues = [];
    for (let i = 0; i < numRepeats; i++) {
      xValues.push(...xPattern);
    }
    
    // Combine to create positions (1-indexed) - only up to numChannels
    for (let i = 0; i < numChannels; i++) {
      positions.push({
        id: i + 1, // 1-indexed
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
