import React from 'react';
import type { KeyConfig } from '../types';
import { Settings, X } from 'lucide-react';

interface EditorPanelProps {
  selectedKey: KeyConfig | null;
  onUpdateKey: (updatedKey: KeyConfig) => void;
  onClose: () => void;
}

export const EditorPanel: React.FC<EditorPanelProps> = ({ selectedKey, onUpdateKey, onClose }) => {
  if (!selectedKey) {
    return (
      <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
        <Settings size={48} opacity={0.2} style={{ marginBottom: 16 }} />
        <p>Sélectionnez une touche</p>
        <p style={{ fontSize: 13, marginTop: 4 }}>pour éditer sa configuration</p>
      </div>
    );
  }

  const handleChange = (slot: keyof KeyConfig['slots'], value: string) => {
    onUpdateKey({
      ...selectedKey,
      slots: {
        ...selectedKey.slots,
        [slot]: value
      }
    });
  };

  return (
    <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Settings size={20} className="text-accent-primary" />
          Touche #{selectedKey.index}
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
          Assignations
        </div>

        <div className="form-group">
          <label className="form-label">Appui simple (Base Tap)</label>
          <input 
            type="text" 
            className="form-input" 
            value={selectedKey.slots.base_tap || ''} 
            onChange={(e) => handleChange('base_tap', e.target.value)}
            placeholder="Ex: a, b, ENT, SPC..."
          />
        </div>

        <div className="form-group">
          <label className="form-label" style={{ color: 'var(--key-hold-text)' }}>Maintien (Base Hold)</label>
          <input 
            type="text" 
            className="form-input" 
            value={selectedKey.slots.base_hold || ''} 
            onChange={(e) => handleChange('base_hold', e.target.value)}
            placeholder="Ex: A, B, ESC, TAB..."
          />
        </div>

        <div className="form-group">
          <label className="form-label" style={{ color: 'var(--key-layer-text)' }}>Appui (Layer Tap)</label>
          <input 
            type="text" 
            className="form-input" 
            value={selectedKey.slots.layer_tap || ''} 
            onChange={(e) => handleChange('layer_tap', e.target.value)}
            placeholder="Ex: 1, 2, ', , ..."
          />
        </div>

        <div className="form-group">
          <label className="form-label" style={{ color: '#a855f7' }}>Maintien (Layer Hold)</label>
          <input 
            type="text" 
            className="form-input" 
            value={selectedKey.slots.layer_hold || ''} 
            onChange={(e) => handleChange('layer_hold', e.target.value)}
            placeholder="Ex: F1, F2..."
          />
        </div>
      </div>
    </div>
  );
};
