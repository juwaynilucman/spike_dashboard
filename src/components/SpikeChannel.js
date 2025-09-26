import React from 'react';
import Plot from 'react-plotly.js';
import './SpikeChannel.css';

const SpikeChannel = ({ channelId, data, isActive, timeRange, windowSize, isLoading }) => {
  const generatePlotData = () => {
    if (!data || !data.data || !isActive) {
      return {
        data: [{
          x: [],
          y: [],
          type: 'scatter',
          mode: 'lines',
          line: { color: '#40e0d0', width: 1 },
          name: 'Spike Data'
        }],
        layout: {
          xaxis: { 
            title: 'Time (s)',
            color: '#e0e6ed',
            gridcolor: 'rgba(64, 224, 208, 0.2)',
            showgrid: true
          },
          yaxis: { 
            title: 'Amplitude',
            color: '#e0e6ed',
            gridcolor: 'rgba(64, 224, 208, 0.2)',
            showgrid: true
          },
          plot_bgcolor: 'rgba(0, 0, 0, 0.2)',
          paper_bgcolor: 'transparent',
          font: { color: '#e0e6ed' },
          margin: { l: 50, r: 20, t: 20, b: 50 }
        },
        config: {
          displayModeBar: false,
          responsive: true
        }
      };
    }

    // Extract data points within the current window
    const startIndex = Math.floor(timeRange.start);
    const endIndex = Math.min(Math.floor(timeRange.end), data.data.length);
    const windowData = data.data.slice(startIndex, endIndex);
    const timePoints = Array.from({ length: windowData.length }, (_, i) => startIndex + i);

    return {
      data: [{
        x: timePoints,
        y: windowData,
        type: 'scatter',
        mode: 'lines',
        line: { color: '#40e0d0', width: 1 },
        name: 'Spike Data'
      }],
      layout: {
        xaxis: { 
          title: 'Time (s)',
          color: '#e0e6ed',
          gridcolor: 'rgba(64, 224, 208, 0.2)',
          showgrid: true,
          range: [timeRange.start, timeRange.end]
        },
        yaxis: { 
          title: 'Amplitude',
          color: '#e0e6ed',
          gridcolor: 'rgba(64, 224, 208, 0.2)',
          showgrid: true
        },
        plot_bgcolor: 'rgba(0, 0, 0, 0.2)',
        paper_bgcolor: 'transparent',
        font: { color: '#e0e6ed' },
        margin: { l: 50, r: 20, t: 20, b: 50 },
      },
      config: {
        displayModeBar: false,
        responsive: true
      }
    };
  };

  const plotData = generatePlotData();

  return (
    <div className={`spike-channel ${!isActive ? 'inactive' : ''}`}>
      <div className="channel-label">
        {channelId !== undefined ? `CH${channelId + 1}` : 'No Channel'}
      </div>
      <div className="spike-waveform">
        {isActive ? (
          <div className="plot-container">
            <Plot
              data={plotData.data}
              layout={plotData.layout}
              config={plotData.config}
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        ) : (
          <div className="empty-channel">
            <div className="empty-message">Channel Disabled</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpikeChannel;

