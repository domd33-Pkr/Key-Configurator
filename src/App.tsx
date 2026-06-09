import React, { useState, useEffect } from 'react';
import type { KeyboardLayoutData, KeyConfig } from './types';
import { Keyboard } from './components/Keyboard';
import { EditorPanel } from './components/EditorPanel';
import defaultLayoutData from './defaultLayout.json';
import { Download, Upload, Keyboard as KeyboardIcon } from 'lucide-react';

const migrateLayoutData = (data: any): KeyboardLayoutData => {
  // Ensure we have a layers array of 16 layers
  let layers = data.layers;
  if (!layers || !Array.isArray(layers) || layers.length !== 16) {
    layers = Array.from({ length: 16 }, (_, i) => ({
      id: i,
      name: `Layer ${i + 1}`
    }));
  } else {
    // Make sure we have 16 layers exactly
    const updatedLayers = [...layers];
    for (let i = updatedLayers.length; i < 16; i++) {
      updatedLayers.push({ id: i, name: `Layer ${i + 1}` });
    }
    layers = updatedLayers.slice(0, 16);
  }

  const keys = data.keys.map((key: any) => {
    // If the key already has bindings, make sure it has exactly 16 layers mapped
    const bindings: Record<number, { tap?: string; hold?: string }> = {};
    for (let i = 0; i < 16; i++) {
      if (key.bindings && key.bindings[i]) {
        bindings[i] = {
          tap: key.bindings[i].tap || '',
          hold: key.bindings[i].hold || ''
        };
      } else {
        bindings[i] = { tap: '', hold: '' };
      }
    }

    // If old slots exist and bindings for Layer 1/2 are empty, migrate them
    if (key.slots) {
      if (!bindings[0].tap && !bindings[0].hold) {
        bindings[0] = {
          tap: key.slots.base_tap || '',
          hold: key.slots.base_hold || ''
        };
      }
      if (!bindings[1].tap && !bindings[1].hold) {
        bindings[1] = {
          tap: key.slots.layer_tap || '',
          hold: key.slots.layer_hold || ''
        };
      }
    }

    return {
      ...key,
      bindings
    };
  });

  return {
    ...data,
    keys,
    layers
  };
};

const LOCAL_STORAGE_KEY = 'zmk_key_configurator_layout';

function App() {
  const [layoutData, setLayoutData] = useState<KeyboardLayoutData>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.keys) {
          return migrateLayoutData(parsed);
        }
      } catch (e) {
        console.error("Failed to parse saved layout from localStorage", e);
      }
    }
    return migrateLayoutData(defaultLayoutData);
  });
  const [selectedKeyIndex, setSelectedKeyIndex] = useState<number | null>(null);
  const [selectedLayerId, setSelectedLayerId] = useState<number>(0);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(layoutData));
  }, [layoutData]);

  const selectedKey = layoutData.keys.find(k => k.index === selectedKeyIndex) || null;
  const layersList = layoutData.layers || [];
  const selectedLayerName = layersList.find(l => l.id === selectedLayerId)?.name || `Layer ${selectedLayerId + 1}`;

  const handleUpdateKey = (updatedKey: KeyConfig) => {
    setLayoutData(prev => {
      const newKeys = prev.keys.map(k => k.index === updatedKey.index ? updatedKey : k);
      return { ...prev, keys: newKeys };
    });
  };

  const handleRenameLayer = (layerId: number, newName: string) => {
    setLayoutData(prev => {
      const newLayers = (prev.layers || []).map(l => l.id === layerId ? { ...l, name: newName } : l);
      return { ...prev, layers: newLayers };
    });
  };

  const handleExport = () => {
    const jsonString = JSON.stringify(layoutData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'keyboard_layout_updated.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.keys && Array.isArray(parsed.keys)) {
          const migrated = migrateLayoutData(parsed);
          setLayoutData(migrated);
          setSelectedKeyIndex(null);
        } else {
          alert("Fichier JSON invalide. Il manque la propriété 'keys'.");
        }
      } catch (err) {
        alert("Erreur lors de la lecture du fichier JSON.");
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  return (
    <>
      <header className="app-header">
        <div className="app-title">
          <KeyboardIcon size={28} className="text-accent-primary" />
          ZMK Key Configurator
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <label className="btn btn-secondary">
            <Upload size={18} />
            Importer JSON
            <input 
              type="file" 
              accept=".json" 
              style={{ display: 'none' }} 
              onChange={handleImport}
            />
          </label>
          <button className="btn btn-primary" onClick={handleExport}>
            <Download size={18} />
            Exporter
          </button>
        </div>
      </header>

      <main className="app-content">
        <div className="keyboard-container" style={{ display: 'flex', flexDirection: 'column', gap: 24, flex: 1 }}>
          <div className="layer-selector-bar glass-panel" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 24px', width: '100%', borderRadius: 16 }}>
            <span style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: 14 }}>Sélection Layer :</span>
            <select 
              value={selectedLayerId} 
              onChange={(e) => setSelectedLayerId(Number(e.target.value))}
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                padding: '8px 16px',
                fontSize: '14px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {layersList.map(layer => (
                <option key={layer.id} value={layer.id}>{layer.name}</option>
              ))}
            </select>

            <span style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: 14, marginLeft: 'auto' }}>Renommer :</span>
            <input 
              type="text" 
              value={layersList.find(l => l.id === selectedLayerId)?.name || ''} 
              onChange={(e) => handleRenameLayer(selectedLayerId, e.target.value)}
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                padding: '8px 16px',
                fontSize: '14px',
                outline: 'none',
                width: '200px'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
            <Keyboard 
              keys={layoutData.keys} 
              selectedLayerId={selectedLayerId}
              selectedKeyIndex={selectedKeyIndex} 
              onKeySelect={(k) => setSelectedKeyIndex(k.index)} 
            />
          </div>
        </div>

        <div className="editor-container">
          <EditorPanel 
            selectedKey={selectedKey} 
            selectedLayerId={selectedLayerId}
            selectedLayerName={selectedLayerName}
            onUpdateKey={handleUpdateKey}
            onClose={() => setSelectedKeyIndex(null)}
          />
        </div>
      </main>
    </>
  );
}

export default App;
