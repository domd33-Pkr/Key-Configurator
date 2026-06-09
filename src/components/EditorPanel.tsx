import React from 'react';
import type { KeyConfig } from '../types';
import { Settings, X } from 'lucide-react';

interface EditorPanelProps {
  selectedKey: KeyConfig | null;
  selectedLayerId: number;
  selectedLayerName: string;
  onUpdateKey: (updatedKey: KeyConfig) => void;
  onClose: () => void;
}

export const EditorPanel: React.FC<EditorPanelProps> = ({ selectedKey, selectedLayerId, selectedLayerName, onUpdateKey, onClose }) => {
  if (!selectedKey) {
    return (
      <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
        <Settings size={48} opacity={0.2} style={{ marginBottom: 16 }} />
        <p>Sélectionnez une touche</p>
        <p style={{ fontSize: 13, marginTop: 4 }}>pour éditer sa configuration</p>
      </div>
    );
  }

  const activeBindings = selectedKey.bindings || {};
  const activeBinding = activeBindings[selectedLayerId] || {};

  // For backward compatibility fallback if bindings aren't initialized yet
  let tapValue = activeBinding.tap || '';
  let holdValue = activeBinding.hold || '';
  if (!selectedKey.bindings && selectedKey.slots) {
    if (selectedLayerId === 0) {
      tapValue = selectedKey.slots.base_tap || '';
      holdValue = selectedKey.slots.base_hold || '';
    } else if (selectedLayerId === 1) {
      tapValue = selectedKey.slots.layer_tap || '';
      holdValue = selectedKey.slots.layer_hold || '';
    }
  }

  const handleChange = (field: 'tap' | 'hold', value: string) => {
    const updatedBindings = { ...activeBindings };
    updatedBindings[selectedLayerId] = {
      ...activeBinding,
      [field]: value
    };

    onUpdateKey({
      ...selectedKey,
      bindings: updatedBindings
    });
  };

  return (
    <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Settings size={20} className="text-accent-primary" />
            Touche #{selectedKey.index}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500, paddingLeft: 28 }}>
            Configuration sur : {selectedLayerName}
          </div>
        </h2>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
          <X size={20} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-secondary)', marginBottom: 16, fontWeight: 600 }}>
            Informations
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: 14 }}>
            <div><span style={{ color: 'var(--text-secondary)' }}>Main :</span> {selectedKey.hand === 'left' ? 'Gauche' : 'Droite'}</div>
            <div><span style={{ color: 'var(--text-secondary)' }}>Doigt :</span> {selectedKey.finger}</div>
          </div>
        </div>

        <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-secondary)', marginBottom: 16, fontWeight: 600 }}>
          Assignations ({selectedLayerName})
        </div>

        <div className="form-group">
          <label className="form-label">Appui simple (Tap)</label>
          <input 
            type="text" 
            className="form-input" 
            value={tapValue} 
            onChange={(e) => handleChange('tap', e.target.value)}
            placeholder="Ex: a, b, ENT, SPC..."
          />
        </div>

        <div className="form-group">
          <label className="form-label" style={{ color: 'var(--key-hold-text)' }}>Maintien (Hold)</label>
          <input 
            type="text" 
            className="form-input" 
            value={holdValue} 
            onChange={(e) => handleChange('hold', e.target.value)}
            placeholder="Ex: A, B, ESC, TAB..."
          />
        </div>
      </div>
    </div>
  );
};
