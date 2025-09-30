import React, { useState } from 'react';
import ChannelGrid from './ChannelGrid';
import DataTypeSelector from './DataTypeSelector';
import './Sidebar.css';

const Sidebar = ({ selectedChannels, onChannelToggle }) => {
  const [selectedDataType, setSelectedDataType] = useState('raw');

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
      <div className="data-type-group">
        <DataTypeSelector
          selectedDataType={selectedDataType}
          onDataTypeChange={setSelectedDataType}
        />
      </div>
    </div>
  );
};

export default Sidebar;

