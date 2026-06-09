import React from 'react';
import type { KeyConfig } from '../types';
import { KeyCap } from './KeyCap';
import './Keyboard.css';

interface KeyboardProps {
  keys: KeyConfig[];
  selectedKeyIndex: number | null;
  selectedLayerId: number;
  onKeySelect: (keyData: KeyConfig) => void;
}

export const Keyboard: React.FC<KeyboardProps> = ({ keys, selectedKeyIndex, selectedLayerId, onKeySelect }) => {
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
            />
          </div>
        ))}
      </div>
    </div>
  );
};
