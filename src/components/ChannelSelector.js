import React, { useEffect, useRef } from 'react';
import './ChannelSelector.css';

const ChannelSelector = ({ selectedChannels, onChannelToggle, isOpen, onToggle }) => {
  const dropdownRef = useRef(null);

  // Generate all 385 channel options
  const channelOptions = Array.from({ length: 385 }, (_, i) => ({
    id: i,
    name: `CH${i + 1}`,
    description: `Channel ${i + 1}`
  }));

  const handleChannelToggle = (channelId) => {
    onChannelToggle(channelId);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onToggle();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onToggle]);

  return (
    <div className="channel-dropdown" ref={dropdownRef}>
      <button className={`dropdown-button ${isOpen ? 'open' : ''}`} onClick={onToggle}>
        <span>Select Channels ({selectedChannels.length}/385)</span>
        <span className={`dropdown-arrow ${isOpen ? 'rotated' : ''}`}>▼</span>
      </button>
      <div className={`dropdown-menu ${isOpen ? '' : 'hidden'}`}>
        {channelOptions.map((channel) => (
          <div
            key={channel.id}
            className="dropdown-item"
            onClick={() => handleChannelToggle(channel.id)}
          >
            <div className={`channel-checkbox ${selectedChannels.includes(channel.id) ? 'checked' : ''}`}></div>
            <div className="channel-info">
              <div className="channel-name">{channel.name}</div>
              <div className="channel-description">{channel.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChannelSelector;

