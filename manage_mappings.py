#!/usr/bin/env python3
"""
Dataset-Label Mapping Management Tool

This script helps you manually manage the mappings between dataset files
and their corresponding spike times label files.
"""

import json
import os
import sys

MAPPING_DB_PATH = 'datasets/dataset_labels_mapping.json'
DATASETS_FOLDER = 'datasets'
LABELS_FOLDER = 'datasets/labels'

def load_mappings():
    """Load existing mappings"""
    if os.path.exists(MAPPING_DB_PATH):
        with open(MAPPING_DB_PATH, 'r') as f:
            return json.load(f)
    return {}

def save_mappings(mappings):
    """Save mappings to file"""
    with open(MAPPING_DB_PATH, 'w') as f:
        json.dump(mappings, f, indent=2)
    print(f"[OK] Saved {len(mappings)} mappings")

def list_mappings():
    """List all current mappings"""
    mappings = load_mappings()
    
    if not mappings:
        print("No mappings found.")
        return
    
    print("\nCurrent Mappings:")
    print("-" * 80)
    for i, (dataset, label) in enumerate(mappings.items(), 1):
        print(f"{i}. {dataset}")
        print(f"   → {label}")
    print("-" * 80)
    print(f"Total: {len(mappings)} mappings")

def list_files():
    """List available dataset and label files"""
    print("\nAvailable Datasets:")
    print("-" * 80)
    if os.path.exists(DATASETS_FOLDER):
        datasets = [f for f in os.listdir(DATASETS_FOLDER) 
                   if os.path.isfile(os.path.join(DATASETS_FOLDER, f)) 
                   and f.endswith(('.bin', '.dat', '.raw', '.pt'))]
        for i, f in enumerate(datasets, 1):
            print(f"{i}. {f}")
    
    print("\nAvailable Label Files:")
    print("-" * 80)
    if os.path.exists(LABELS_FOLDER):
        labels = [f for f in os.listdir(LABELS_FOLDER) if f.endswith('.pt')]
        for i, f in enumerate(labels, 1):
            print(f"{i}. {f}")

def add_mapping():
    """Add a new mapping interactively"""
    list_files()
    
    print("\n" + "=" * 80)
    dataset = input("Enter dataset filename: ").strip()
    label = input("Enter label filename: ").strip()
    
    if not dataset or not label:
        print("[ERROR] Both filenames are required")
        return
    
    dataset_path = os.path.join(DATASETS_FOLDER, dataset)
    label_path = os.path.join(LABELS_FOLDER, label)
    
    if not os.path.exists(dataset_path):
        print(f"[WARN] Dataset file not found: {dataset_path}")
        confirm = input("Add mapping anyway? (y/n): ").strip().lower()
        if confirm != 'y':
            return
    
    if not os.path.exists(label_path):
        print(f"[WARN] Label file not found: {label_path}")
        confirm = input("Add mapping anyway? (y/n): ").strip().lower()
        if confirm != 'y':
            return
    
    mappings = load_mappings()
    mappings[dataset] = label
    save_mappings(mappings)
    
    print(f"[OK] Added mapping: {dataset} -> {label}")

def remove_mapping():
    """Remove a mapping interactively"""
    mappings = load_mappings()
    
    if not mappings:
        print("No mappings to remove.")
        return
    
    list_mappings()
    
    dataset = input("\nEnter dataset filename to remove mapping: ").strip()
    
    if dataset not in mappings:
        print(f"[ERROR] No mapping found for: {dataset}")
        return
    
    del mappings[dataset]
    save_mappings(mappings)
    
    print(f"[OK] Removed mapping for: {dataset}")

def auto_detect_mappings():
    """Try to automatically detect mappings based on file naming"""
    if not os.path.exists(LABELS_FOLDER):
        print("[ERROR] Labels folder not found")
        return
    
    mappings = load_mappings()
    new_count = 0
    
    label_files = [f for f in os.listdir(LABELS_FOLDER) if f.endswith('.pt')]
    dataset_files = [f for f in os.listdir(DATASETS_FOLDER) 
                    if os.path.isfile(os.path.join(DATASETS_FOLDER, f))
                    and f.endswith(('.bin', '.dat', '.raw', '.pt'))]
    
    for label in label_files:
        base = label.replace('_labels', '_data').replace('_spike_times', '').replace('_spikes', '').replace('_times', '')
        
        for dataset in dataset_files:
            if dataset.startswith(base.replace('.pt', '')):
                if dataset not in mappings:
                    mappings[dataset] = label
                    print(f"[OK] Auto-detected: {dataset} -> {label}")
                    new_count += 1
                break
    
    if new_count > 0:
        save_mappings(mappings)
        print(f"\n[OK] Added {new_count} new mappings")
    else:
        print("[INFO] No new mappings detected")

def main():
    print("=" * 80)
    print("Dataset-Label Mapping Management Tool")
    print("=" * 80)
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        if command == 'list':
            list_mappings()
        elif command == 'files':
            list_files()
        elif command == 'add':
            add_mapping()
        elif command == 'remove':
            remove_mapping()
        elif command == 'auto':
            auto_detect_mappings()
        else:
            print(f"Unknown command: {command}")
    else:
        while True:
            print("\nOptions:")
            print("  1. List current mappings")
            print("  2. List available files")
            print("  3. Add new mapping")
            print("  4. Remove mapping")
            print("  5. Auto-detect mappings")
            print("  6. Exit")
            
            choice = input("\nSelect option (1-6): ").strip()
            
            if choice == '1':
                list_mappings()
            elif choice == '2':
                list_files()
            elif choice == '3':
                add_mapping()
            elif choice == '4':
                remove_mapping()
            elif choice == '5':
                auto_detect_mappings()
            elif choice == '6':
                print("Goodbye!")
                break
            else:
                print("Invalid option")

if __name__ == '__main__':
    main()

