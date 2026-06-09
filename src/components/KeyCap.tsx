import React from 'react';
import type { KeyConfig } from '../types';
import './KeyCap.css';

interface KeyCapProps {
  keyData: KeyConfig;
  isSelected: boolean;
  selectedLayerId: number;
  onClick: (keyData: KeyConfig) => void;
}

export const KeyCap: React.FC<KeyCapProps> = ({ keyData, isSelected, selectedLayerId, onClick }) => {
  const { index } = keyData;

  let displayTap = '';
  let displayHold = '';

  if (keyData.bindings) {
    const binding = keyData.bindings[selectedLayerId] || {};
    displayTap = binding.tap || '';
    displayHold = binding.hold || '';
  } else if (keyData.slots) {
    // Fallback for backward compatibility
    if (selectedLayerId === 0) {
      displayTap = keyData.slots.base_tap || '';
      displayHold = keyData.slots.base_hold || '';
    } else if (selectedLayerId === 1) {
      displayTap = keyData.slots.layer_tap || '';
      displayHold = keyData.slots.layer_hold || '';
    }
  }

  return (
    <div 
      className={`key-cap ${isSelected ? 'selected' : ''}`}
      onClick={() => onClick(keyData)}
    >
      <div className="key-content">
        <span className="key-index">{index}</span>
        {displayTap && <span className="slot-tap">{displayTap}</span>}
        {displayHold && <span className="slot-hold">{displayHold}</span>}
      </div>
    </div>
  );
};
