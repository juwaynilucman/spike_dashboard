import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import VisualizationArea from './components/VisualizationArea';
import './App.css';

function App() {
  const [selectedChannels, setSelectedChannels] = useState([0, 1, 2]); // Default to first 3 channels
  const [channelScrollOffset, setChannelScrollOffset] = useState(0); // Scroll offset for channels
  const [spikeData, setSpikeData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [timeRange, setTimeRange] = useState({ start: 0.0, end: 1000.0 });
  const [windowSize] = useState(1000); // Fixed window size of 1000 data points
  const [spikeThreshold, setSpikeThreshold] = useState(-25); // Default threshold: -25

  // Fetch spike data when selected channels or threshold change
  useEffect(() => {
    if (selectedChannels.length > 0) {
      fetchSpikeData();
    }
  }, [selectedChannels, spikeThreshold]);

  const fetchSpikeData = async () => {
    setIsLoading(true);
    try {
      const apiUrl = process.env.REACT_APP_API_URL;
      const response = await fetch(`${apiUrl}/api/spike-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channels: selectedChannels,
          spikeThreshold: spikeThreshold
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setSpikeData(data);
      } else {
        console.error('Failed to fetch spike data');
      }
    } catch (error) {
      console.error('Error fetching spike data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChannelToggle = (channelId) => {
    setSelectedChannels(prev => {
      if (prev.includes(channelId)) {
        return prev.filter(id => id !== channelId);
      } else {
        return [...prev, channelId];
      }
    });
    // Reset scroll offset when channels change
    setChannelScrollOffset(0);
  };

  const handleChannelScroll = (newOffset) => {
    setChannelScrollOffset(newOffset);
  };

  return (
    <div className="app">
      <Header 
        totalChannels={385}
        activeChannels={selectedChannels.length}
      />
      <div className="main-container">
        <Sidebar
          selectedChannels={selectedChannels}
          onChannelToggle={handleChannelToggle}
        />
        <VisualizationArea
          spikeData={spikeData}
          selectedChannels={selectedChannels}
          channelScrollOffset={channelScrollOffset}
          timeRange={timeRange}
          windowSize={windowSize}
          spikeThreshold={spikeThreshold}
          onTimeRangeChange={setTimeRange}
          onChannelScroll={handleChannelScroll}
          onSpikeThresholdChange={setSpikeThreshold}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}

export default App;

