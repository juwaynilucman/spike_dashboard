import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import VisualizationArea from './components/VisualizationArea';
import './App.css';

function App() {
  const [selectedChannels, setSelectedChannels] = useState([1, 2, 3]); // Default to first 3 channels (1-indexed)
  const [channelScrollOffset, setChannelScrollOffset] = useState(0); // Scroll offset for channels
  const [spikeData, setSpikeData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [timeRange, setTimeRange] = useState({ start: 0.0, end: 1000.0 });
  const [windowSize] = useState(1000); // Fixed window size of 1000 data points
  const [spikeThreshold, setSpikeThreshold] = useState(-25); // Default threshold: -25
  const [datasetInfo, setDatasetInfo] = useState({ totalDataPoints: 3500000, totalChannels: 385 });
  
  // Cache for loaded data chunks
  const dataCache = React.useRef({});

  // Fetch dataset info on mount
  useEffect(() => {
    fetchDatasetInfo();
  }, []);

  // Fetch spike data when selected channels or threshold change
  useEffect(() => {
    if (selectedChannels.length > 0) {
      dataCache.current = {}; // Clear cache when channels or threshold change
      fetchSpikeData();
    }
  }, [selectedChannels, spikeThreshold]);

  // Fetch data when time range changes
  useEffect(() => {
    if (selectedChannels.length > 0) {
      fetchSpikeData();
    }
  }, [timeRange]);

  const fetchDatasetInfo = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/dataset-info`);
      
      if (response.ok) {
        const info = await response.json();
        console.log('Dataset info:', info);
        setDatasetInfo(info);
      }
    } catch (error) {
      console.error('Error fetching dataset info:', error);
    }
  };

  const fetchSpikeData = async () => {
    // Calculate data range to fetch with buffer
    const buffer = 5000; // Load extra data on each side
    const fetchStart = Math.max(0, Math.floor(timeRange.start) - buffer);
    const fetchEnd = Math.min(datasetInfo.totalDataPoints, Math.ceil(timeRange.end) + buffer);
    
    // Check if we need to fetch new data
    const cacheKey = `${fetchStart}-${fetchEnd}-${spikeThreshold}`;
    const needsFetch = selectedChannels.some(ch => !dataCache.current[`${ch}-${cacheKey}`]);
    
    if (!needsFetch) {
      // Use cached data
      const cachedData = {};
      selectedChannels.forEach(ch => {
        cachedData[ch] = dataCache.current[`${ch}-${cacheKey}`];
      });
      setSpikeData(cachedData);
      return;
    }

    setIsLoading(true);
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/spike-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channels: selectedChannels,
          spikeThreshold: spikeThreshold,
          startTime: fetchStart,
          endTime: fetchEnd
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Cache the data
        selectedChannels.forEach(ch => {
          if (data[ch]) {
            dataCache.current[`${ch}-${cacheKey}`] = data[ch];
          }
        });
        
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
        totalChannels={datasetInfo.totalChannels}
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
          totalDataPoints={datasetInfo.totalDataPoints}
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

