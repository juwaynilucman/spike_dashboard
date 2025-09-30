import React from 'react';
import './DataTypeSelector.css';

const DataTypeSelector = ({ selectedDataType, onDataTypeChange }) => {
  const dataTypes = [
    { id: 'raw', label: 'Raw Data' },
    { id: 'filtered', label: 'Filtered Data' },
    { id: 'spikes', label: 'Detected Spikes' }
  ];

  return (
    <div className="data-type-selector">
      <label htmlFor="data-type-select">Visualization Type:</label>
      <select
        id="data-type-select"
        className="data-type-select"
        value={selectedDataType}
        onChange={(e) => onDataTypeChange(e.target.value)}
      >
        {dataTypes.map((type) => (
          <option key={type.id} value={type.id}>
            {type.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default DataTypeSelector;
