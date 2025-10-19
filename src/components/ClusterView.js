import React, { useState, useEffect, useRef } from 'react';
import Plot from 'react-plotly.js';
import './ClusterView.css';

const ClusterView = ({ selectedDataset }) => {
  const [clusterData, setClusterData] = useState(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [spikePreview, setSpikePreview] = useState(null);
  const [selectedChannels, setSelectedChannels] = useState({ 0: 1, 1: 2, 2: 3 });
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  useEffect(() => {
    fetchClusterData();
  }, [selectedDataset]);

  const fetchClusterData = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/cluster-data`);
      
      if (response.ok) {
        const data = await response.json();
        setClusterData(data);
      }
    } catch (error) {
      console.error('Error fetching cluster data:', error);
    }
  };

  const fetchSpikePreview = async (clusterIndex, pointIndex) => {
    setIsLoadingPreview(true);
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const channelId = selectedChannels[clusterIndex];
      
      const response = await fetch(`${apiUrl}/api/spike-preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          spikeIndex: pointIndex,
          channelId: channelId,
          window: 10
        })
      });
      
      if (response.ok) {
        const preview = await response.json();
        setSpikePreview(preview);
      }
    } catch (error) {
      console.error('Error fetching spike preview:', error);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handlePointHover = (event) => {
    if (event.points && event.points.length > 0) {
      const point = event.points[0];
      const clusterIndex = point.curveNumber;
      const pointIndex = point.pointIndex;
      
      setHoveredPoint({
        cluster: clusterIndex,
        index: pointIndex,
        x: point.x,
        y: point.y
      });
      
      fetchSpikePreview(clusterIndex, pointIndex);
    }
  };

  const handlePointUnhover = () => {
    setHoveredPoint(null);
    setSpikePreview(null);
  };

  const generatePlotData = () => {
    if (!clusterData) return [];

    const colors = ['#FF6B6B', '#4ECDC4', '#95E1D3'];
    const clusterNames = ['Cluster 1', 'Cluster 2', 'Cluster 3'];

    return clusterData.clusters.map((cluster, idx) => ({
      x: cluster.points.map(p => p[0]),
      y: cluster.points.map(p => p[1]),
      mode: 'markers',
      type: 'scatter',
      name: clusterNames[idx],
      marker: {
        size: 10,
        color: colors[idx],
        opacity: 0.7,
        line: {
          color: colors[idx],
          width: 2
        }
      },
      hovertemplate: `<b>${clusterNames[idx]}</b><br>Point: %{pointIndex}<br>PC1: %{x:.2f}<br>PC2: %{y:.2f}<extra></extra>`
    }));
  };

  const generatePreviewPlot = () => {
    if (!spikePreview || !spikePreview.waveform) return null;

    const timePoints = Array.from(
      { length: spikePreview.waveform.length }, 
      (_, i) => i - 10
    );

    return {
      data: [{
        x: timePoints,
        y: spikePreview.waveform,
        type: 'scatter',
        mode: 'lines',
        line: { color: '#40e0d0', width: 2 },
        fill: 'tozeroy',
        fillcolor: 'rgba(64, 224, 208, 0.2)'
      }],
      layout: {
        width: 300,
        height: 200,
        margin: { l: 40, r: 20, t: 30, b: 40 },
        paper_bgcolor: 'rgba(26, 26, 46, 0.95)',
        plot_bgcolor: 'rgba(0, 0, 0, 0.3)',
        font: { color: '#e0e6ed', size: 10 },
        xaxis: {
          title: 'Time (samples)',
          gridcolor: 'rgba(64, 224, 208, 0.2)',
          color: '#e0e6ed'
        },
        yaxis: {
          title: 'Amplitude',
          gridcolor: 'rgba(64, 224, 208, 0.2)',
          color: '#e0e6ed'
        },
        title: {
          text: `CH${spikePreview.channelId} - Spike ${spikePreview.spikeIndex}`,
          font: { size: 12, color: '#40e0d0' }
        }
      },
      config: {
        displayModeBar: false,
        responsive: true
      }
    };
  };

  const handleChannelChange = (clusterIndex, channelId) => {
    setSelectedChannels(prev => ({
      ...prev,
      [clusterIndex]: parseInt(channelId)
    }));
  };

  return (
    <div className="cluster-view">
      <div className="cluster-header">
        <h2>Spike Cluster Visualization</h2>
        <div className="cluster-controls">
          <div className="channel-selectors">
            {[0, 1, 2].map(clusterIdx => (
              <div key={clusterIdx} className="cluster-channel-select">
                <label style={{ color: ['#FF6B6B', '#4ECDC4', '#95E1D3'][clusterIdx] }}>
                  Cluster {clusterIdx + 1} Channel:
                </label>
                <input
                  type="number"
                  min="1"
                  max="385"
                  value={selectedChannels[clusterIdx]}
                  onChange={(e) => handleChannelChange(clusterIdx, e.target.value)}
                  className="channel-input"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="cluster-content">
        <div className="cluster-plot-container">
          <Plot
            data={generatePlotData()}
            layout={{
              autosize: true,
              paper_bgcolor: 'rgba(30, 30, 60, 0.6)',
              plot_bgcolor: 'rgba(0, 0, 0, 0.3)',
              font: { color: '#e0e6ed' },
              xaxis: {
                title: 'Principal Component 1',
                gridcolor: 'rgba(64, 224, 208, 0.2)',
                zerolinecolor: 'rgba(64, 224, 208, 0.4)',
                color: '#e0e6ed'
              },
              yaxis: {
                title: 'Principal Component 2',
                gridcolor: 'rgba(64, 224, 208, 0.2)',
                zerolinecolor: 'rgba(64, 224, 208, 0.4)',
                color: '#e0e6ed'
              },
              hovermode: 'closest',
              showlegend: true,
              legend: {
                x: 1,
                xanchor: 'right',
                y: 1,
                bgcolor: 'rgba(26, 26, 46, 0.8)',
                bordercolor: 'rgba(64, 224, 208, 0.3)',
                borderwidth: 1
              },
              margin: { l: 60, r: 20, t: 20, b: 60 }
            }}
            config={{
              displayModeBar: true,
              displaylogo: false,
              modeBarButtonsToRemove: ['lasso2d', 'select2d']
            }}
            style={{ width: '100%', height: '100%' }}
            onHover={handlePointHover}
            onUnhover={handlePointUnhover}
          />
        </div>

        {hoveredPoint && (
          <div className="spike-preview-panel">
            <div className="preview-info">
              <h3>Spike Preview</h3>
              <p>Cluster {hoveredPoint.cluster + 1} - Point {hoveredPoint.index + 1}</p>
              <p>Channel: {selectedChannels[hoveredPoint.cluster]}</p>
            </div>
            {isLoadingPreview ? (
              <div className="preview-loading">Loading...</div>
            ) : spikePreview && (
              <div className="preview-plot">
                <Plot
                  data={generatePreviewPlot().data}
                  layout={generatePreviewPlot().layout}
                  config={generatePreviewPlot().config}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClusterView;

