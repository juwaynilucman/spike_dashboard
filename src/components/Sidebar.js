import React, { useState } from 'react';
import ChannelSelector from './ChannelSelector';
import './Sidebar.css';

const Sidebar = ({ selectedChannels, onChannelToggle }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <div className="sidebar">
      <div className="control-group">
        <h3>Channel Selection</h3>
        <ChannelSelector
          selectedChannels={selectedChannels}
          onChannelToggle={onChannelToggle}
          isOpen={isDropdownOpen}
          onToggle={toggleDropdown}
        />
      </div>
    </div>
  );
};

export default Sidebar;

