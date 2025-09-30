import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import VisualizationArea from './components/VisualizationArea';
import './App.css';

function App() {
  const [selectedChannels, setSelectedChannels] = useState([1, 2, 3]);
  const [channelScrollOffset, setChannelScrollOffset] = useState(0);
  const [spikeData, setSpikeData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [timeRange, setTimeRange] = useState({ start: 0, end: 1000 });
  const [windowSize, setWindowSize] = useState(1000);
  const [spikeThreshold, setSpikeThreshold] = useState(-25);
  const [invertData, setInvertData] = useState(false);
  const [datasetInfo, setDatasetInfo] = useState({ totalDataPoints: 3500000, totalChannels: 385 });
  
  const dataCache = React.useRef({});

  useEffect(() => {
    fetchDatasetInfo();
  }, []);

  useEffect(() => {
    if (selectedChannels.length > 0) {
      dataCache.current = {};
      fetchSpikeData();
    }
  }, [selectedChannels, spikeThreshold, invertData]);

  const fetchTimeoutRef = React.useRef(null);

  useEffect(() => {
    if (selectedChannels.length > 0) {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
      
      fetchTimeoutRef.current = setTimeout(() => {
        fetchSpikeData();
      }, 200);
      
      return () => {
        if (fetchTimeoutRef.current) {
          clearTimeout(fetchTimeoutRef.current);
        }
      };
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
    const buffer = windowSize;
    const fetchStart = Math.max(0, Math.floor(timeRange.start) - buffer);
    const fetchEnd = Math.min(datasetInfo.totalDataPoints, Math.ceil(timeRange.end) + buffer);
    
    const cacheKey = `${fetchStart}-${fetchEnd}-${spikeThreshold}-${invertData}`;
    const needsFetch = selectedChannels.some(ch => !dataCache.current[`${ch}-${cacheKey}`]);
    
    if (!needsFetch) {
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
          invertData: invertData,
          startTime: fetchStart,
          endTime: fetchEnd
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        
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
    setChannelScrollOffset(0);
  };

  const handleChannelScroll = (newOffset) => {
    setChannelScrollOffset(newOffset);
  };

  const handleWindowSizeChange = (newSize) => {
    const currentStart = timeRange.start;
    setWindowSize(newSize);
    setTimeRange({ start: currentStart, end: currentStart + newSize });
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
                invertData={invertData}
                totalDataPoints={datasetInfo.totalDataPoints}
                onTimeRangeChange={setTimeRange}
                onWindowSizeChange={handleWindowSizeChange}
                onChannelScroll={handleChannelScroll}
                onSpikeThresholdChange={setSpikeThreshold}
                onInvertDataChange={setInvertData}
                isLoading={isLoading}
              />
      </div>
    </div>
  );
}

export default App;

