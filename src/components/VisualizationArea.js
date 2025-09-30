import React from 'react';
import SpikeGrid from './SpikeGrid';
import Timeline from './Timeline';
import './VisualizationArea.css';

const VisualizationArea = ({ 
  spikeData, 
  selectedChannels, 
  channelScrollOffset,
  timeRange, 
  windowSize,
  spikeThreshold,
  totalDataPoints,
  onTimeRangeChange,
  onWindowSizeChange,
  onChannelScroll,
  onSpikeThresholdChange,
  isLoading 
}) => {
  return (
    <div className="visualization-area">
      <div className="viz-header">
        <h2>Raw Data Visualization</h2>
        <div className="time-controls">
          <label>Time Range:</label>
          <input 
            type="number" 
            className="time-input" 
            value={Math.floor(timeRange.start)}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              if (!isNaN(value)) {
                onTimeRangeChange({ start: value, end: value + windowSize });
              }
            }}
            placeholder="Start"
          />
          <span>to</span>
          <input 
            type="number" 
            className="time-input" 
            value={Math.floor(timeRange.end)}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              if (!isNaN(value)) {
                onTimeRangeChange({ start: value - windowSize, end: value });
              }
            }}
            placeholder="End"
          />
          <label>Window Size:</label>
          <input 
            type="number" 
            className="window-input" 
            value={windowSize}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              if (!isNaN(value) && value > 0 && value <= 10000) {
                onWindowSizeChange(value);
              }
            }}
            min="1"
            max="10000"
            placeholder="Window"
          />
          <label>Spike Threshold:</label>
          <input 
            type="number" 
            className="threshold-input" 
            value={spikeThreshold ?? ''}
            onChange={(e) => {
              const inputValue = e.target.value;
              if (inputValue === '') {
                onSpikeThresholdChange(null);
              } else {
                const value = parseFloat(inputValue);
                if (!isNaN(value)) {
                  onSpikeThresholdChange(value);
                }
              }
            }}
            step="1"
          />
        </div>
      </div>

      <SpikeGrid 
        spikeData={spikeData}
        selectedChannels={selectedChannels}
        channelScrollOffset={channelScrollOffset}
        timeRange={timeRange}
        windowSize={windowSize}
        onChannelScroll={onChannelScroll}
        isLoading={isLoading}
      />

      <Timeline 
        timeRange={timeRange}
        windowSize={windowSize}
        totalDataRange={totalDataPoints}
        onTimeRangeChange={onTimeRangeChange}
      />
    </div>
  );
};

export default VisualizationArea;

