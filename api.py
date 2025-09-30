from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import json
import os

app = Flask(__name__)
CORS(app)

data_array = None
nrows = 385

def load_binary_data():
    global data_array
    
    inputfilename = 'subset_5pct.bin'
    if not os.path.exists(inputfilename):
        print(f"Warning: {inputfilename} not found. Using mock data.")
        return None
    
    try:
        data_memmap = np.memmap(inputfilename, dtype=np.int16, mode='r')
        data_array = data_memmap.reshape((-1, nrows)).T
        
        print(f"Loaded data with shape: {data_array.shape}")
        return data_array
    except Exception as e:
        print(f"Error loading binary data: {e}")
        return None

def get_real_data(channels, spike_threshold=None, invert_data=False, start_time=0, end_time=20000):
    global data_array
    
    if data_array is None:
        return None
    
    total_available = data_array.shape[1]
    start_time = max(0, int(start_time))
    end_time = min(total_available, int(end_time))
    
    data = {}
    
    for channel_id in channels:
        array_index = channel_id - 1
        
        if array_index >= data_array.shape[0] or array_index < 0:
            continue
            
        channel_data = data_array[array_index, start_time:end_time]
        
        if invert_data:
            channel_data = -channel_data
        
        if spike_threshold is not None:
            if invert_data:
                is_spike = channel_data >= spike_threshold
            else:
                is_spike = channel_data <= spike_threshold
        else:
            is_spike = [False] * len(channel_data)
        
        spike_peaks = []
        if spike_threshold is not None:
            in_spike = False
            spike_start_idx = 0
            
            for i in range(len(is_spike)):
                if is_spike[i] and not in_spike:
                    in_spike = True
                    spike_start_idx = i
                elif (not is_spike[i] or i == len(is_spike) - 1) and in_spike:
                    spike_end_idx = i if not is_spike[i] else i + 1
                    spike_segment = channel_data[spike_start_idx:spike_end_idx]
                    
                    if len(spike_segment) > 0:
                        if invert_data:
                            peak_idx = spike_start_idx + int(np.argmax(spike_segment))
                        else:
                            peak_idx = spike_start_idx + int(np.argmin(spike_segment))
                        spike_peaks.append(peak_idx)
                    
                    in_spike = False
        
        print(f"Channel {channel_id}: Sending {len(channel_data)} points (range: {start_time}-{end_time}, inverted: {invert_data}, peaks: {len(spike_peaks)})")
        
        data[channel_id] = {
            'data': channel_data.tolist(),
            'isSpike': is_spike if isinstance(is_spike, list) else is_spike.tolist(),
            'spikePeaks': spike_peaks,
            'channelId': channel_id,
            'startTime': start_time,
            'endTime': end_time
        }
    
    return data

@app.route('/api/dataset-info', methods=['GET'])
def get_dataset_info():
    try:
        global data_array
        
        if data_array is None:
            return jsonify({'error': 'Data not loaded'}), 500
        
        return jsonify({
            'totalChannels': data_array.shape[0],
            'totalDataPoints': int(data_array.shape[1]),
            'maxTimeRange': int(data_array.shape[1])
        })
        
    except Exception as e:
        print(f"Error in get_dataset_info: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/spike-data', methods=['POST'])
def get_spike_data():
    try:
        data = request.get_json()
        channels = data.get('channels', [])
        spike_threshold = data.get('spikeThreshold', None)
        invert_data = data.get('invertData', False)
        start_time = data.get('startTime', 0)
        end_time = data.get('endTime', 20000)
        
        max_points = 20000
        end_time = min(end_time, start_time + max_points)

        spike_data = get_real_data(channels, spike_threshold, invert_data, start_time, end_time)
        
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
