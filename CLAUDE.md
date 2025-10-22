# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Neural Spike Visualizer** - a full-stack application for visualizing and analyzing neural electrophysiology data. It consists of a Flask backend API and a React frontend for real-time visualization of spike data from multi-channel neural recordings.

## Development Commands

### Backend (Python/Flask)
```bash
# Install Python dependencies
pip install -r requirements.txt

# Start the Flask API server
python api.py
# Server runs on http://localhost:5000
```

### Frontend (React)
```bash
# Install Node dependencies
npm install

# Start development server
npm start
# React app runs on http://localhost:3000

# Build for production
npm run build
```

### Data Conversion
```bash
# Convert PyTorch .pt files to memory-mapped format (for performance)
python convert_pt_to_mmap.py datasets/your_file.pt
```

## Architecture

### Backend (`api.py`)

The Flask API handles neural data loading, filtering, and spike detection:

- **Data Management**: Supports multiple dataset formats (`.pt`, `.bin`, `.dat`, `.raw`)
  - PyTorch tensors loaded via `torch.load()`
  - Memory-mapped numpy arrays for efficient large file access
  - Automatic detection and loading of associated spike time labels from `datasets/labels/`

- **Dataset-Label Mapping System**:
  - `dataset_labels_mapping.json` maps raw datasets to their spike time labels
  - Functions: `load_mapping_database()`, `add_label_mapping()`, `get_label_filename()`
  - Labels stored in `datasets/labels/` folder, separate from raw data

- **Signal Processing** (`apply_filter()` in api.py:104-151):
  - Butterworth filters: highpass (300Hz), lowpass (3kHz), bandpass (300-3000Hz)
  - Zero-phase filtering via `scipy.signal.filtfilt`
  - Preserves DC offset for display when appropriate

- **Spike Detection**:
  - Threshold-based real-time detection (`get_real_data()`)
  - Precomputed spike times from label files (`get_precomputed_spike_data()`)
  - Peak finding within spike windows

- **Cluster Visualization** (`/api/cluster-data`):
  - Loads `spikes_xyclu_time.npy` with format: `[x, y, cluster_id, time_sec]`
  - Supports both synthetic demo data and real cluster data
  - Generates distinct colors per cluster using golden ratio HSV distribution

### Frontend (React)

Component hierarchy and data flow:

```
App.js (main state container)
├── Header.js (dataset selector, view mode switcher)
├── Sidebar.js (channel selection)
├── VisualizationArea.js (spike/waveform views)
│   ├── Timeline.js (time navigation)
│   ├── SpikeGrid.js (multi-channel display)
│   │   └── SpikeChannel.js (individual channel with Plotly)
│   └── DataTypeSelector.js (raw/filtered/spikes modes)
└── ClusterView.js (PCA/clustering visualization)
    └── Spike preview overlay on hover
```

**Key State Management** (in App.js):
- `spikeData`: Cached channel data with spike markers
- `dataCache`: Request-level caching to avoid redundant API calls (cache key includes time range, threshold, filter settings)
- `selectedDataType`: View mode ('raw', 'filtered', 'spikes', 'clusters')
- `usePrecomputedSpikes`: Toggle between threshold detection and precomputed labels

**Data Flow**:
1. User changes time range/channels/filters → `fetchSpikeData()`
2. Cache check via `cacheKey = ${fetchStart}-${fetchEnd}-${threshold}-${invert}-${precomputed}-${dataType}-${filter}`
3. API POST to `/api/spike-data` with buffer padding (±windowSize)
4. Response includes: `{channelId: {data: [], isSpike: [], spikePeaks: [], filteredData: []}}`
5. SpikeChannel components render waveforms with Plotly

### Data Formats

**Neural Recording Data**:
- Shape: `(channels, timepoints)` - e.g., (385, 3500000)
- Dtype: `int16` (microvolts)
- Sampling rate: 30 kHz

**Spike Times Labels**:
- Global: NumPy array of sample indices `[1523, 4892, ...]`
- Channel-specific: Dict `{channelId: [spike_times...]}`

**Cluster Data** (`spikes_xyclu_time.npy`):
- Columns: `[x_coord, y_coord, cluster_id, time_seconds]`
- Used for PCA/t-SNE visualization and cluster assignment

## Important Implementation Details

### Memory-Mapped Loading
The backend supports memory-mapped arrays to avoid loading multi-GB files into RAM:
- `.pt` files can be converted to `_mmap.npy` + `_shape.txt`
- When available, uses `np.memmap()` for O(1) load time
- Falls back to full `torch.load()` with warning if mmap files missing

### Filter Edge Effects
Signal filters use a 100-sample buffer before/after requested time range to avoid edge artifacts:
```python
buffer = 100
buffer_start = max(0, start_time - buffer)
buffered_data = data_array[index, buffer_start:buffer_end]
filtered = apply_filter(buffered_data)
result = filtered[offset:offset+len(requested)]
```

### Spike Navigation
When `usePrecomputedSpikes` is enabled:
- Frontend calls `/api/navigate-spike` with `{currentTime, direction: 'next'|'prev', channels}`
- Backend finds nearest spike time across all selected channels
- Wraps around to first/last spike at boundaries

### Cluster View Interaction
- Hover over points fetches waveform preview via `/api/spike-preview`
- Double-click navigates to spike time in waveform view (switches to 'spikes' mode)
- Channel mapping associates cluster IDs with neural channels

## Key Files

- `api.py` - Flask backend (1100+ lines)
- `src/App.js` - React main component with state management
- `src/components/ClusterView.js` - PCA/cluster visualization
- `src/components/SpikeChannel.js` - Plotly waveform rendering
- `convert_pt_to_mmap.py` - Preprocessing utility
- `datasets/dataset_labels_mapping.json` - Dataset-to-label associations

## Common Pitfalls

1. **Data not loading**: Ensure `datasets/` folder exists and contains `.pt`/`.bin` files. Check that spike time labels are in `datasets/labels/` and properly mapped in `dataset_labels_mapping.json`.

2. **Filter artifacts**: Filters need sufficient context - don't apply to very short segments (<200 samples).

3. **Memory issues**: For files >10GB, use `convert_pt_to_mmap.py` before loading.

4. **Spike times mismatch**: Verify sampling rate consistency (default 30kHz). Label files must use sample indices, not seconds.

5. **CORS errors**: Frontend assumes backend runs on `localhost:5000`. Override with `REACT_APP_API_URL` in `.env`.

6. **Transpose confusion**: Backend expects `(channels, timepoints)` but some files are `(timepoints, channels)` - auto-detection logic is in `load_binary_data()` (api.py:254-257).
