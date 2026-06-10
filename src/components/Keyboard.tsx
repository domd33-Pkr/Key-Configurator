import React from 'react';
import type { KeyConfig } from '../types';
import { KeyCap } from './KeyCap';
import './Keyboard.css';

interface KeyboardProps {
  keys: KeyConfig[];
  selectedKeyIndex: number | null;
  selectedLayerId: number;
  onKeySelect: (keyData: KeyConfig) => void;
  // Simulation props
  isSimMode?: boolean;
  heldKeys?: Set<number>;
  lockedKeys?: Set<number>;
  onSimDown?: (keyData: KeyConfig) => void;
  onSimUp?: (keyData: KeyConfig) => void;
  onSimRightClick?: (keyData: KeyConfig) => void;
}

export const Keyboard: React.FC<KeyboardProps> = ({ 
  keys, 
  selectedKeyIndex, 
  selectedLayerId, 
  onKeySelect,
  isSimMode = false,
  heldKeys = new Set(),
  lockedKeys = new Set(),
  onSimDown,
  onSimUp,
  onSimRightClick
}) => {
  const leftKeys = keys.filter(k => k.hand === 'left' || k.index <= 10);
  const rightKeys = keys.filter(k => k.hand === 'right' || k.index > 10);

  return (
    <div className="keyboard-wrapper">
      <div className="keyboard-half left-half">
        {leftKeys.map((k) => (
          <div key={k.index} className={`key-position key-pos-${k.index}`}>
            <KeyCap 
              keyData={k} 
              isSelected={selectedKeyIndex === k.index} 
              selectedLayerId={selectedLayerId}
              onClick={onKeySelect} 
              isSimMode={isSimMode}
              isHeld={heldKeys.has(k.index)}
              isLocked={lockedKeys.has(k.index)}
              onSimDown={onSimDown}
              onSimUp={onSimUp}
              onSimRightClick={onSimRightClick}
            />
          </div>
        ))}
      </div>

      <div className="keyboard-half right-half">
        {rightKeys.map((k) => (
          <div key={k.index} className={`key-position key-pos-${k.index}`}>
            <KeyCap 
              keyData={k} 
              isSelected={selectedKeyIndex === k.index} 
              selectedLayerId={selectedLayerId}
              onClick={onKeySelect} 
              isSimMode={isSimMode}
              isHeld={heldKeys.has(k.index)}
              isLocked={lockedKeys.has(k.index)}
              onSimDown={onSimDown}
              onSimUp={onSimUp}
              onSimRightClick={onSimRightClick}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

