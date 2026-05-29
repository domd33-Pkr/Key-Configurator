import React from 'react';
import type { KeyConfig } from '../types';
import './KeyCap.css';

interface KeyCapProps {
  keyData: KeyConfig;
  isSelected: boolean;
  onClick: (keyData: KeyConfig) => void;
}

export const KeyCap: React.FC<KeyCapProps> = ({ keyData, isSelected, onClick }) => {
  const { slots, index } = keyData;

  const displayBaseTap = slots.base_tap || '';
  const displayBaseHold = slots.base_hold || '';
  const displayLayerTap = slots.layer_tap || '';
  const displayLayerHold = slots.layer_hold || '';

  return (
    <div 
      className={`key-cap ${isSelected ? 'selected' : ''}`}
      onClick={() => onClick(keyData)}
    >
      <div className="key-content">
        <span className="key-index">{index}</span>
        {displayBaseTap && <span className="slot-base-tap">{displayBaseTap}</span>}
        {displayBaseHold && <span className="slot-base-hold">{displayBaseHold}</span>}
        {displayLayerTap && <span className="slot-layer-tap">{displayLayerTap}</span>}
        {displayLayerHold && <span className="slot-layer-hold">{displayLayerHold}</span>}
      </div>
    </div>
  );
};
