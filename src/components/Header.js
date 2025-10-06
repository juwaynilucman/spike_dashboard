import React from 'react';
import DatasetSelector from './DatasetSelector';
import './Header.css';

const Header = ({ 
  totalChannels, 
  activeChannels, 
  datasets, 
  currentDataset, 
  onDatasetChange, 
  onUploadClick,
  onDatasetDelete 
}) => {
  return (
    <div className="header">
      <h1>Spike Visualization Dashboard</h1>
      
      <div className="header-controls">
        <DatasetSelector
          datasets={datasets}
          currentDataset={currentDataset}
          onDatasetChange={onDatasetChange}
          onDatasetDelete={onDatasetDelete}
        />

        <button 
          className="upload-button-header" 
          onClick={onUploadClick}
          title="Upload new dataset"
        >
          <svg 
            width="18" 
            height="18" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Header;

