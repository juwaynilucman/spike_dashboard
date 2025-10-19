#!/usr/bin/env python3
"""
Convert PyTorch .pt file to memory-mapped numpy array for efficient loading.
This eliminates heavy disk I/O and reduces RAM usage.
"""

import numpy as np
import torch
import os
import sys

def convert_pt_to_mmap(pt_filepath):
    """Convert .pt file to memory-mapped format"""
    print(f"\n{'='*60}")
    print(f"Converting: {pt_filepath}")
    print(f"{'='*60}")
    
    if not os.path.exists(pt_filepath):
        print(f"❌ Error: File not found")
        return False
    
    # Check if already converted
    npy_path = pt_filepath.replace('.pt', '_mmap.npy')
    shape_path = pt_filepath.replace('.pt', '_shape.txt')
    
    if os.path.exists(npy_path):
        print(f"⚠️  Memory-mapped version already exists: {npy_path}")
        response = input("Overwrite? (y/N): ").strip().lower()
        if response != 'y':
            return False
    
    print("Loading PyTorch tensor...")
    tensor_data = torch.load(pt_filepath, weights_only=False)
    
    if torch.is_tensor(tensor_data):
        data_array = tensor_data.numpy()
    elif isinstance(tensor_data, np.ndarray):
        data_array = tensor_data
    else:
        print(f"❌ Unexpected data type: {type(tensor_data)}")
        return False
    
    print(f"Original shape: {data_array.shape}")
    print(f"Original dtype: {data_array.dtype}")
    
    # Ensure (channels, timepoints) orientation
    if data_array.ndim == 2 and data_array.shape[0] > data_array.shape[1]:
        print("Transposing to (channels, timepoints)")
        data_array = data_array.T
    
    # Convert to int16 if needed
    if data_array.dtype != np.int16:
        print(f"Converting from {data_array.dtype} to int16...")
        data_min, data_max = data_array.min(), data_array.max()
        print(f"Data range: ({data_min}, {data_max})")
        
        if -32768 <= data_min and data_max <= 32767:
            data_array = data_array.astype(np.int16)
        else:
            scale = max(abs(data_min), abs(data_max)) / 32767
            print(f"⚠️  Scaling by {scale:.4f}")
            data_array = (data_array / scale).astype(np.int16)
    
    # Write memory-mapped file
    print(f"Writing memory-mapped array to: {npy_path}")
    mmap_array = np.memmap(npy_path, dtype=np.int16, mode='w+', shape=data_array.shape)
    
    # Copy in chunks with progress
    chunk_size = 10
    for i in range(0, data_array.shape[0], chunk_size):
        end = min(i + chunk_size, data_array.shape[0])
        mmap_array[i:end] = data_array[i:end]
        progress = (end / data_array.shape[0]) * 100
        print(f"Progress: {progress:.1f}%", end='\r')
    
    print()  # New line
    mmap_array.flush()
    
    # Write shape file
    with open(shape_path, 'w') as f:
        f.write(','.join(map(str, data_array.shape)))
    
    # Show results
    orig_size = os.path.getsize(pt_filepath)
    new_size = os.path.getsize(npy_path)
    
    def format_size(b):
        for u in ['B', 'KB', 'MB', 'GB']:
            if b < 1024: return f"{b:.2f} {u}"
            b /= 1024
        return f"{b:.2f} TB"
    
    print(f"\n[SUCCESS] Conversion complete!")
    print(f"Original:      {format_size(orig_size)}")
    print(f"Memory-mapped: {format_size(new_size)}")
    print(f"Shape:         {data_array.shape}")
    print(f"\nMemory efficiency:")
    print(f"   Before: Full {format_size(orig_size)} loaded into RAM")
    print(f"   After:  Only accessed pages (~4KB chunks) loaded")
    print(f"\nFiles created:")
    print(f"   [OK] {npy_path}")
    print(f"   [OK] {shape_path}")
    
    return True

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python convert_pt_to_mmap.py <file.pt>")
        print("\nExample: python convert_pt_to_mmap.py datasets/c46_data_5percent.pt")
        sys.exit(1)
    
    success = convert_pt_to_mmap(sys.argv[1])
    sys.exit(0 if success else 1)

