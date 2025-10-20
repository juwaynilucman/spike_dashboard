import React from 'react';
import ChannelGrid from './ChannelGrid';
import './Sidebar.css';

const Sidebar = ({ selectedChannels, onChannelToggle }) => {
  return (
    <div className="sidebar">
      <div className="control-group">
        <h3>Channel Selection ({selectedChannels.length}/385)</h3>
        <ChannelGrid
          selectedChannels={selectedChannels}
          onChannelToggle={onChannelToggle}
          totalChannels={385}
        />
      </div>
    </div>
  );
};

export default Sidebar;

