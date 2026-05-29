import React, { useState, useEffect } from 'react';
import type { KeyboardLayoutData, KeyConfig } from './types';
import { Keyboard } from './components/Keyboard';
import { EditorPanel } from './components/EditorPanel';
import defaultLayoutData from './defaultLayout.json';
import { Download, Upload, Keyboard as KeyboardIcon } from 'lucide-react';

function App() {
  const [layoutData, setLayoutData] = useState<KeyboardLayoutData>(defaultLayoutData as KeyboardLayoutData);
  const [selectedKeyIndex, setSelectedKeyIndex] = useState<number | null>(null);

  const selectedKey = layoutData.keys.find(k => k.index === selectedKeyIndex) || null;

  const handleUpdateKey = (updatedKey: KeyConfig) => {
    setLayoutData(prev => {
      const newKeys = prev.keys.map(k => k.index === updatedKey.index ? updatedKey : k);
      return { ...prev, keys: newKeys };
    });
  };

  const generateExportData = (): KeyboardLayoutData => {
    const data = { ...layoutData };
    // Auto-generate char_to_key_slot
    const charToKeySlot: Record<string, [number, string]> = {};
    data.keys.forEach(key => {
      Object.entries(key.slots).forEach(([slotName, char]) => {
        if (char && char !== '<LAYER>') {
          charToKeySlot[char] = [key.index, slotName];
        }
      });
    });
    
    // Auto-generate lockedSlots
    const lockedSlots: string[] = [];
    data.keys.forEach(key => {
      Object.entries(key.slots).forEach(([slotName, char]) => {
        if (char) {
          lockedSlots.push(`${key.index},${slotName}`);
        }
      });
    });

    data.char_to_key_slot = charToKeySlot;
    // data.lockedSlots = lockedSlots; // Keeping original for now or update it based on needs
    
    return data;
  };

  const handleExport = () => {
    const data = generateExportData();
    const jsonString = JSON.stringify(data, null, 2);
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
          setLayoutData(parsed);
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
        <div className="keyboard-container">
          <Keyboard 
            keys={layoutData.keys} 
            selectedKeyIndex={selectedKeyIndex} 
            onKeySelect={(k) => setSelectedKeyIndex(k.index)} 
          />
        </div>

        <div className="editor-container">
          <EditorPanel 
            selectedKey={selectedKey} 
            onUpdateKey={handleUpdateKey}
            onClose={() => setSelectedKeyIndex(null)}
          />
        </div>
      </main>
    </>
  );
}

export default App;
