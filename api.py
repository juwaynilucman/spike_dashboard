from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import json
import os

app = Flask(__name__)
CORS(app)

# Global variables for data
data_array = None
nrows = 385

def load_binary_data():
    """Load the binary data file"""
    global data_array
    
    inputfilename = 'subset_5pct.bin'
    if not os.path.exists(inputfilename):
        print(f"Warning: {inputfilename} not found. Using mock data.")
        return None
    
    try:
        # Create a memory-mapped array for the binary file
        data_memmap = np.memmap(inputfilename, dtype=np.int16, mode='r')
        
        # Reshape the memory-mapped array
        data_array = data_memmap.reshape((-1, nrows)).T
        
        print(f"Loaded data with shape: {data_array.shape}")
        return data_array
    except Exception as e:
        print(f"Error loading binary data: {e}")
        return None

def get_real_data(channels, spike_threshold=None):
    """Extract real data from the binary file with spike detection"""
    global data_array
    
    if data_array is None:
        return None
    
    data = {}
    
    for channel_id in channels:
        
        if channel_id >= data_array.shape[0] or channel_id < 0:
            continue
            
        channel_data = data_array[channel_id, 0:10000]
        
        # Detect spikes based on threshold (if provided)
        if spike_threshold is not None:
            is_spike = channel_data <= spike_threshold
        else:
            # No threshold: all data is normal (no spikes)
            is_spike = [False] * len(channel_data)
        
        data[channel_id] = {
            'data': channel_data.tolist(),
            'isSpike': is_spike if isinstance(is_spike, list) else is_spike.tolist(),
            'channelId': channel_id
        }
    
    return data

@app.route('/api/spike-data', methods=['POST'])
def get_spike_data():
    """Get spike data for selected channels and time range"""
    try:
        data = request.get_json()
        channels = data.get('channels', [])
        spike_threshold = data.get('spikeThreshold', None)

        spike_data = get_real_data(channels, spike_threshold)
        
        return jsonify(spike_data)
        
    except Exception as e:
        print(f"Error in get_spike_data: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    load_binary_data()
    
    print("Starting Spike Visualizer API...")
    print(f"Data loaded: {data_array is not None}")
    print(f"Total channels: {nrows}")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
