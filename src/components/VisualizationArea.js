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
            type="text" 
            className="time-input" 
            value={`${timeRange.start.toFixed(2)}s`}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              if (!isNaN(value)) {
                onTimeRangeChange(prev => ({ ...prev, start: value }));
              }
            }}
            placeholder="Start"
          />
          <span>to</span>
          <input 
            type="text" 
            className="time-input" 
            value={`${timeRange.end.toFixed(2)}s`}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              if (!isNaN(value)) {
                onTimeRangeChange(prev => ({ ...prev, end: value }));
              }
            }}
            placeholder="End"
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

