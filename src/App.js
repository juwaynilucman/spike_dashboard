import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import VisualizationArea from './components/VisualizationArea';
import ClusterView from './components/ClusterView';
import Upload from './components/Upload';
import ConfirmDialog from './components/ConfirmDialog';
import './App.css';

function App() {
  const [selectedChannels, setSelectedChannels] = useState([179, 181, 183]);
  const [channelScrollOffset, setChannelScrollOffset] = useState(0);
  const [spikeData, setSpikeData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [timeRange, setTimeRange] = useState({ start: 0, end: 1000 });
  const [windowSize, setWindowSize] = useState(1000);
  const [spikeThreshold, setSpikeThreshold] = useState(-25);
  const [invertData, setInvertData] = useState(false);
  const [datasetInfo, setDatasetInfo] = useState({ totalDataPoints: 3500000, totalChannels: 385 });
  const [datasets, setDatasets] = useState([]);
  const [currentDataset, setCurrentDataset] = useState('c46_data_5percent.pt');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [usePrecomputedSpikes, setUsePrecomputedSpikes] = useState(false);
  const [precomputedAvailable, setPrecomputedAvailable] = useState(false);
  const [selectedView, setSelectedView] = useState('signal'); // 'signal' or 'clusters'
  const [selectedDataType, setSelectedDataType] = useState('raw'); // 'raw', 'filtered', or 'spikes'
  const [filterType, setFilterType] = useState('highpass'); // 'none', 'highpass', 'lowpass', 'bandpass', 'bandstop'
  const [filteredLineColor, setFilteredLineColor] = useState('#FFD700'); // Color for filtered data line
  const [availableAlgorithms, setAvailableAlgorithms] = useState([]);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState(null);
  const [activeJob, setActiveJob] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const [isStartingJob, setIsStartingJob] = useState(false);

  const dataCache = React.useRef({});
  const jobPollRef = React.useRef(null);

  const fetchAlgorithms = React.useCallback(async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/spike-sorting/algorithms`);

      if (response.ok) {
        const data = await response.json();
        const algorithms = Array.isArray(data.algorithms) ? data.algorithms : [];
        setAvailableAlgorithms(algorithms);
        setSelectedAlgorithm((current) => {
          if (algorithms.length === 0) {
            return null;
          }
          if (current && algorithms.some(algo => algo.name === current && algo.available)) {
            return current;
          }
          const firstAvailable = algorithms.find(algo => algo.available);
          if (firstAvailable) {
            return firstAvailable.name;
          }
          return algorithms[0].name;
        });
      }
    } catch (error) {
      console.error('Error fetching algorithms:', error);
    }
  }, []);

  useEffect(() => {
    if (availableAlgorithms.length > 0) {
      return undefined;
    }

    const retryTimer = setInterval(() => {
      fetchAlgorithms();
    }, 4000);

    return () => {
      clearInterval(retryTimer);
    };
  }, [availableAlgorithms.length, fetchAlgorithms]);

  const resetActiveJob = React.useCallback(() => {
    if (jobPollRef.current) {
      clearInterval(jobPollRef.current);
      jobPollRef.current = null;
    }
    setActiveJob(null);
    setJobStatus(null);
  }, []);

  useEffect(() => {
    const initializeApp = async () => {
      await fetchAlgorithms();
      await fetchDatasets();
      // Load c46 dataset by default on initial mount
      await handleDatasetChange('c46_data_5percent.pt');
    };
    initializeApp();
  }, [fetchAlgorithms]);

  useEffect(() => {
    return () => {
      resetActiveJob();
    };
  }, [resetActiveJob]);

  useEffect(() => {
    if (selectedChannels.length > 0) {
      dataCache.current = {};
      fetchSpikeData();
    }
  }, [selectedChannels, spikeThreshold, invertData, usePrecomputedSpikes, selectedDataType, filterType]);

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

  const fetchDatasets = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/datasets`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Available datasets:', data);
        setDatasets(data.datasets);

        if (Object.prototype.hasOwnProperty.call(data, 'current')) {
          if (typeof data.current === 'string' && data.current.length > 0) {
            setCurrentDataset(data.current);
          } else if (data.current === null) {
            setCurrentDataset(null);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching datasets:', error);
    }
  };

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

  const checkSpikeTimesAvailable = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/spike-times-available`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Spike times check response:', data);
        console.log('Setting precomputedAvailable to:', data.available);
        setPrecomputedAvailable(data.available);
        if (!data.available) {
          setUsePrecomputedSpikes(false);
        } else {
          console.log('✓ Spike times are available! Checkbox should appear.');
        }
      }
    } catch (error) {
      console.error('Error checking spike times:', error);
      setPrecomputedAvailable(false);
    }
  };

  const handleDatasetChange = async (datasetName, options = {}) => {
    const {
      skipRequest = false,
      totalChannels,
      totalDataPoints
    } = options;

    const finalizeDatasetChange = async (channels, points) => {
      setCurrentDataset(datasetName);
      resetActiveJob();

      if (typeof channels === 'number' && typeof points === 'number') {
        setDatasetInfo({
          totalChannels: channels,
          totalDataPoints: points
        });
      } else {
        await fetchDatasetInfo();
      }

      if (datasetName === 'c46_data_5percent.pt') {
        setSelectedChannels([179, 181, 183]);
      }

      dataCache.current = {};

      await new Promise(resolve => setTimeout(resolve, 1000));
      await checkSpikeTimesAvailable();
      fetchSpikeData();
    };

    if (skipRequest) {
      await finalizeDatasetChange(totalChannels, totalDataPoints);
      return;
    }

    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/dataset/set`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dataset: datasetName })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Dataset changed:', result);
        await finalizeDatasetChange(result.totalChannels, result.totalDataPoints);
      } else {
        let errorMessage = `Failed to change dataset. Status: ${response.status}`;
        try {
          const errorBody = await response.json();
          if (errorBody?.error) {
            errorMessage = errorBody.error;
          }
        } catch (parseError) {
          // ignore JSON parsing errors
        }
        console.error(errorMessage);
      }
    } catch (error) {
      console.error('Error changing dataset:', error);
    }
  };

  const handleUploadComplete = async (uploadResult) => {
    console.log('Upload complete:', uploadResult);
    setShowUploadModal(false);
    await fetchDatasets();

    if (uploadResult?.autoLoadError) {
      console.warn('Dataset auto-load warning:', uploadResult.autoLoadError);
    }

    if (uploadResult?.filename) {
      await handleDatasetChange(uploadResult.filename, {
        skipRequest: uploadResult.autoLoaded,
        totalChannels: uploadResult.totalChannels,
        totalDataPoints: uploadResult.totalDataPoints
      });
    } else {
      await checkSpikeTimesAvailable();
    }
  };

  const [datasetToDelete, setDatasetToDelete] = React.useState(null);

  const handleDatasetDelete = (datasetName) => {
    setDatasetToDelete(datasetName);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!datasetToDelete) return;

    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/dataset/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dataset: datasetToDelete })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        console.log('Dataset deleted:', result);
        setShowDeleteConfirm(false);
        setDatasetToDelete(null);
        
        await fetchDatasets();
        
        if (datasetToDelete === currentDataset) {
          await fetchDatasetInfo();
        }
      } else {
        alert(`Error: ${result.error}`);
        setShowDeleteConfirm(false);
        setDatasetToDelete(null);
      }
    } catch (error) {
      console.error('Error deleting dataset:', error);
      alert('Failed to delete dataset');
      setShowDeleteConfirm(false);
      setDatasetToDelete(null);
    }
  };

  const fetchSpikeData = async () => {
    const buffer = windowSize;
    const fetchStart = Math.max(0, Math.floor(timeRange.start) - buffer);
    const fetchEnd = Math.min(datasetInfo.totalDataPoints, Math.ceil(timeRange.end) + buffer);
    const jobIdForRequest = activeJob && activeJob.status === 'completed' ? activeJob.id : null;

    const cacheKey = `${fetchStart}-${fetchEnd}-${spikeThreshold}-${invertData}-${usePrecomputedSpikes}-${selectedDataType}-${filterType}-${jobIdForRequest || 'noJob'}`;
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
          endTime: fetchEnd,
          usePrecomputed: usePrecomputedSpikes,
          dataType: selectedDataType,
          filterType: filterType,
          jobId: jobIdForRequest
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

  const pollJobStatus = (jobId) => {
    if (!jobId) return;

    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    const poll = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/spike-sorting/jobs/${jobId}`);
        if (response.ok) {
          const job = await response.json();
          setActiveJob(job);
          setJobStatus(job.status === 'failed' && job.error ? job.error : job.status);

          if (job.status === 'completed') {
            if (jobPollRef.current) {
              clearInterval(jobPollRef.current);
              jobPollRef.current = null;
            }
            if (job?.result?.hasFiltered) {
              setSelectedView('signal');
              if (selectedDataType !== 'filtered') {
                setSelectedDataType('filtered');
              } else {
                dataCache.current = {};
                fetchSpikeData();
              }
            } else {
              dataCache.current = {};
              fetchSpikeData();
            }
          } else if (job.status === 'failed' || job.status === 'cancelled') {
            if (jobPollRef.current) {
              clearInterval(jobPollRef.current);
              jobPollRef.current = null;
            }
          }
        } else {
          console.error('Failed to poll spike sorting job');
        }
      } catch (error) {
        console.error('Error polling spike sorting job:', error);
      }
    };

    if (jobPollRef.current) {
      clearInterval(jobPollRef.current);
    }

    poll();
    jobPollRef.current = setInterval(poll, 1500);
  };

  const startSpikeSortingJob = async () => {
    if (!selectedAlgorithm || selectedChannels.length === 0) {
      return;
    }

    const selectedMeta = availableAlgorithms.find(algo => algo.name === selectedAlgorithm);
    if (!selectedMeta || !selectedMeta.available) {
      console.warn('Selected algorithm is not available');
      return;
    }

    const buffer = windowSize;
    const fetchStart = Math.max(0, Math.floor(timeRange.start) - buffer);
    const fetchEnd = Math.min(datasetInfo.totalDataPoints, Math.ceil(timeRange.end) + buffer);

    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    try {
      setIsStartingJob(true);
      resetActiveJob();

      const response = await fetch(`${apiUrl}/api/spike-sorting/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          algorithm: selectedAlgorithm,
          channels: selectedChannels,
          startTime: fetchStart,
          endTime: fetchEnd,
          params: {
            filterType,
          },
        }),
      });

      if (response.ok || response.status === 202) {
        const job = await response.json();
        setActiveJob(job);
        setJobStatus(job.status === 'failed' && job.error ? job.error : job.status);
        pollJobStatus(job.id);
      } else {
        const errorBody = await response.json().catch(() => ({}));
        console.error('Failed to start spike sorting job', errorBody);
        setJobStatus(errorBody?.error || 'failed');
      }
    } catch (error) {
      console.error('Error starting spike sorting job:', error);
      setJobStatus('failed');
    } finally {
      setIsStartingJob(false);
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

  const handleInvertDataChange = (newInvertState) => {
    setInvertData(newInvertState);
    if (spikeThreshold !== null) {
      setSpikeThreshold(-spikeThreshold);
    }
  };

  const handleNavigateToSpike = async (spikeTime, channelId, allClusterChannels = null) => {
    try {
      // Switch to signal view with spikes mode
      setSelectedView('signal');
      setSelectedDataType('spikes');

      // Enable precomputed spikes
      setUsePrecomputedSpikes(true);

      // Set all 3 cluster channels as selected (deselect others)
      if (allClusterChannels) {
        setSelectedChannels(allClusterChannels);
      } else {
        setSelectedChannels([channelId]);
      }

      // Center the view on the spike time
      const halfWindow = Math.floor(windowSize / 2);
      const newStart = Math.max(0, spikeTime - halfWindow);
      const newEnd = Math.min(datasetInfo.totalDataPoints, spikeTime + halfWindow);

      setTimeRange({ start: newStart, end: newEnd });

      console.log(`Navigating to spike at time ${spikeTime} on channel ${channelId}, selected channels: ${allClusterChannels || [channelId]}`);

    } catch (error) {
      console.error('Error navigating to spike:', error);
    }
  };

  const handleSpikeNavigation = async (direction) => {
    if (!usePrecomputedSpikes) return;

    try {
      // Get current center of the view
      const currentCenter = Math.floor((timeRange.start + timeRange.end) / 2);
      
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/navigate-spike`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentTime: currentCenter,
          direction: direction,
          channels: selectedChannels
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const targetSpike = data.spikeTime;
        
        // Center the view on the target spike
        const halfWindow = Math.floor(windowSize / 2);
        const newStart = Math.max(0, targetSpike - halfWindow);
        const newEnd = Math.min(datasetInfo.totalDataPoints, newStart + windowSize);
        setTimeRange({ start: newStart, end: newEnd });
        
        console.log(`Navigated to spike at ${targetSpike} (${data.totalSpikes} total spikes)`);
      } else {
        console.error('Failed to navigate spike');
      }
    } catch (error) {
      console.error('Error navigating spike:', error);
    }
  };

  return (
    <div className="app">
      <Header
        totalChannels={datasetInfo.totalChannels}
        activeChannels={selectedChannels.length}
        datasets={datasets}
        currentDataset={currentDataset}
        onDatasetChange={handleDatasetChange}
        onUploadClick={() => setShowUploadModal(true)}
        onDatasetDelete={handleDatasetDelete}
        selectedView={selectedView}
        onViewChange={setSelectedView}
        selectedSignalType={selectedDataType}
        onSignalTypeChange={setSelectedDataType}
        algorithms={availableAlgorithms}
        selectedAlgorithm={selectedAlgorithm}
        onAlgorithmChange={setSelectedAlgorithm}
        onRunAlgorithm={startSpikeSortingJob}
        jobStatus={jobStatus}
        jobIsRunning={Boolean(activeJob && (activeJob.status === 'queued' || activeJob.status === 'running'))}
        isStartingJob={isStartingJob}
      />
      <div className="main-container">
        {selectedView === 'signal' && (
          <Sidebar
            selectedChannels={selectedChannels}
            onChannelToggle={handleChannelToggle}
          />
        )}
        {selectedView === 'clusters' ? (
          <ClusterView
            selectedDataset={currentDataset}
            onNavigateToSpike={handleNavigateToSpike}
          />
        ) : (
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
            onInvertDataChange={handleInvertDataChange}
            isLoading={isLoading}
            usePrecomputedSpikes={usePrecomputedSpikes}
            onUsePrecomputedChange={setUsePrecomputedSpikes}
            precomputedAvailable={precomputedAvailable}
            selectedDataType={selectedDataType}
            filterType={filterType}
            onFilterTypeChange={setFilterType}
            filteredLineColor={filteredLineColor}
            onFilteredLineColorChange={setFilteredLineColor}
            onSpikeNavigation={handleSpikeNavigation}
          />
        )}
      </div>
      {showUploadModal && (
        <Upload 
          onUploadComplete={handleUploadComplete}
          onClose={() => setShowUploadModal(false)}
        />
      )}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Dataset"
        message={`Are you sure you want to delete "${datasetToDelete}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setDatasetToDelete(null);
        }}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
}

export default App;

