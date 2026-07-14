import React from 'react';
import type { KeyConfig } from '../types';
import './KeyCap.css';

import { getZmkBindingString, parseBindingForDisplay } from '../utils/zmkUtils';

interface KeyCapProps {
  keyData: KeyConfig;
  isSelected: boolean;
  selectedLayerId: number;
  layers?: { id: number; name: string }[];
  onClick: (keyData: KeyConfig) => void;
  // Simulation props
  isSimMode?: boolean;
  isHeld?: boolean;
  isLocked?: boolean;
  onSimDown?: (keyData: KeyConfig) => void;
  onSimUp?: (keyData: KeyConfig) => void;
  onSimRightClick?: (keyData: KeyConfig) => void;
}

export const KeyCap: React.FC<KeyCapProps> = ({ 
  keyData, 
  isSelected, 
  selectedLayerId, 
  layers,
  onClick,
  isSimMode = false,
  isHeld = false,
  isLocked = false,
  onSimDown,
  onSimUp,
  onSimRightClick
}) => {
  const { index } = keyData;

  let bindingStr = '';

  if (keyData.bindings) {
    const binding = keyData.bindings[selectedLayerId] || {};
    bindingStr = getZmkBindingString(binding);
  } else if (keyData.slots) {
    // Fallback for backward compatibility
    if (selectedLayerId === 0) {
      bindingStr = getZmkBindingString({
        tap: keyData.slots.base_tap,
        hold: keyData.slots.base_hold
      });
    } else if (selectedLayerId === 1) {
      bindingStr = getZmkBindingString({
        tap: keyData.slots.layer_tap,
        hold: keyData.slots.layer_hold
      });
    }
  }

  const { tap: displayTap, hold: displayHold } = parseBindingForDisplay(bindingStr, layers);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isSimMode && e.button === 0 && onSimDown && !isLocked) {
      onSimDown(keyData);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isSimMode && e.button === 0 && onSimUp && !isLocked) {
      onSimUp(keyData);
    }
  };

  const handleMouseLeave = () => {
    if (isSimMode && onSimUp && isHeld && !isLocked) {
      onSimUp(keyData);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (isSimMode) {
      e.preventDefault();
      if (onSimRightClick) {
        onSimRightClick(keyData);
      }
    }
  };

  const handleClick = () => {
    if (!isSimMode) {
      onClick(keyData);
    }
  };

  return (
    <div 
      title={bindingStr}
      className={`key-cap ${isSelected ? 'selected' : ''} ${isHeld ? 'sim-held' : ''} ${isLocked ? 'sim-locked' : ''} ${isSimMode ? 'sim-mode' : ''}`}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onContextMenu={handleContextMenu}
    >
      <div className="key-content">
        <span className="key-index">{index}</span>
        {displayTap && <span className="slot-tap">{displayTap}</span>}
        {displayHold && <span className="slot-hold">{displayHold}</span>}
      </div>
    </div>
  );
};

