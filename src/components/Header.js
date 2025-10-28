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
  onDatasetDelete,
  selectedView,
  onViewChange,
  selectedSignalType,
  onSignalTypeChange,
  algorithms = [],
  selectedAlgorithm,
  onAlgorithmChange,
  onRunAlgorithm,
  jobStatus,
  jobIsRunning,
  isStartingJob
}) => {
  const isSelectedAvailable = selectedAlgorithm && algorithms.some(
    algo => algo.name === selectedAlgorithm && algo.available
  );

  const formatStatus = (status) => {
    if (!status || typeof status !== 'string') return status;
    return status
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const statusLabel = formatStatus(jobStatus);

  return (
    <div className="header">
      <h1>Spike Visualization Dashboard</h1>

      <div className="header-controls">
        <div className="view-selector-container">
          <label htmlFor="view-select">View:</label>
          <select
            id="view-select"
            className="view-selector"
            value={selectedView}
            onChange={(e) => onViewChange(e.target.value)}
          >
            <option value="signal">Signal View</option>
            <option value="clusters">Cluster View</option>
          </select>
        </div>

        {selectedView === 'signal' && (
          <div className="view-selector-container">
            <label htmlFor="signal-type-select">Signal Type:</label>
            <select
              id="signal-type-select"
              className="view-selector"
              value={selectedSignalType}
              onChange={(e) => onSignalTypeChange(e.target.value)}
            >
              <option value="raw">Raw Data</option>
              <option value="filtered">Filtered Data</option>
              <option value="spikes">Detected Spikes</option>
            </select>
          </div>
        )}

        {selectedView === 'signal' && (
          <div className="algorithm-controls">
            <label htmlFor="algorithm-select">Spike Sorting:</label>
            <select
              id="algorithm-select"
              className="view-selector algorithm-select"
              value={selectedAlgorithm || ''}
              onChange={(e) => onAlgorithmChange && onAlgorithmChange(e.target.value || null)}
            >
              <option value="" disabled>Select algorithm</option>
              {algorithms.map((algo) => (
                <option
                  key={algo.name}
                  value={algo.name}
                  disabled={!algo.available}
                >
                  {algo.displayName || algo.name}
                  {!algo.available ? ' (Unavailable)' : ''}
                </option>
              ))}
            </select>
            <button
              className="algorithm-runner-button"
              onClick={onRunAlgorithm}
              disabled={!isSelectedAvailable || jobIsRunning || isStartingJob}
            >
              {jobIsRunning ? 'Running…' : isStartingJob ? 'Starting…' : 'Run'}
            </button>
            {statusLabel && (
              <span className={`job-status-indicator ${jobIsRunning ? 'job-status-running' : ''}`}>
                {statusLabel}
              </span>
            )}
          </div>
        )}

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

