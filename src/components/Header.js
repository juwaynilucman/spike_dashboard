import React from 'react';
import './Header.css';

const Header = ({ totalChannels, activeChannels }) => {
  return (
    <div className="header">
      <h1>Spike Visualization Dashboard</h1>
      <div className="data-info">
        <span className="data-size">{totalChannels} channels</span>
        <span>|</span>
        <span>{activeChannels} active</span>
      </div>
    </div>
  );
};

export default Header;

