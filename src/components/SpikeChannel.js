import React from 'react';
import Plot from 'react-plotly.js';
import './SpikeChannel.css';

const SpikeChannel = ({ channelId, data, isActive, timeRange, windowSize, spikeThreshold, isLoading }) => {
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
    // Data comes with startTime/endTime metadata from backend
    const dataStartTime = data.startTime || 0;
    const dataEndTime = data.endTime || data.data.length;
    
    // Calculate which portion of the loaded data to display
    const windowStart = Math.floor(timeRange.start);
    const windowEnd = Math.floor(timeRange.end);
    
    // Calculate offset into the data array
    const offsetStart = Math.max(0, windowStart - dataStartTime);
    const offsetEnd = Math.min(data.data.length, windowEnd - dataStartTime);
    
    const windowData = data.data.slice(offsetStart, offsetEnd);
    const spikeFlags = data.isSpike ? data.isSpike.slice(offsetStart, offsetEnd) : [];
    const timePoints = Array.from({ length: windowData.length }, (_, i) => windowStart + i);

    // Create segments for different colored line parts with proper connections
    const plotData = [];
    let currentSegment = null;
    
    windowData.forEach((value, index) => {
      const timePoint = timePoints[index];
      const isSpike = spikeFlags[index] || false;
      const segmentColor = isSpike ? '#ff4444' : '#40e0d0';
      
      // Start a new segment if needed
      if (!currentSegment) {
        currentSegment = { x: [timePoint], y: [value], color: segmentColor };
      }
      // If color changes, close current segment and start new one
      else if (currentSegment.color !== segmentColor) {
        const lastX = currentSegment.x[currentSegment.x.length - 1];
        const lastY = currentSegment.y[currentSegment.y.length - 1];
        
        // Save the completed segment with its original color
        plotData.push({
          x: [...currentSegment.x],
          y: [...currentSegment.y],
          type: 'scatter',
          mode: 'lines',
          line: { color: currentSegment.color, width: 1 },
          showlegend: false,
          hoverinfo: 'x+y',
          connectgaps: false
        });
        
        // Add connecting line segment
        // If transitioning from teal to red, use red; otherwise use the previous color
        const connectColor = (currentSegment.color === '#40e0d0' && segmentColor === '#ff4444') 
          ? '#ff4444' 
          : currentSegment.color;
        
        plotData.push({
          x: [lastX, timePoint],
          y: [lastY, value],
          type: 'scatter',
          mode: 'lines',
          line: { color: connectColor, width: 1 },
          showlegend: false,
          hoverinfo: 'x+y',
          connectgaps: false
        });
        
        // Start new segment with just the current point
        currentSegment = { 
          x: [timePoint], 
          y: [value], 
          color: segmentColor 
        };
      }
      // Same color, just add the point
      else {
        currentSegment.x.push(timePoint);
        currentSegment.y.push(value);
      }
    });
    
    // Add the last segment
    if (currentSegment && currentSegment.x.length > 0) {
      plotData.push({
        x: currentSegment.x,
        y: currentSegment.y,
        type: 'scatter',
        mode: 'lines',
        line: { color: currentSegment.color, width: 1 },
        showlegend: false,
        hoverinfo: 'x+y',
        connectgaps: false
      });
    }

    return {
      data: plotData,
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
        showlegend: false
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
        {channelId !== undefined ? `CH${channelId}` : 'No Channel'}
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

