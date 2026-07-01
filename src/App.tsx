import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { KeyboardLayoutData, KeyConfig } from './types';
import { Keyboard } from './components/Keyboard';
import { EditorPanel } from './components/EditorPanel';
import defaultLayoutData from './defaultLayout.json';
import { Download, Upload, Keyboard as KeyboardIcon, Undo, Redo } from 'lucide-react';
import { parseZmkBinding, getZmkBindingString } from './utils/zmkUtils';

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

const SHIFT_MAP: Record<string, string> = {
  '1': '!', '2': '@', '3': '#', '4': '$', '5': '%',
  '6': '^', '7': '&', '8': '*', '9': '(', '0': ')',
  '-': '_', '=': '+', '[': '{', ']': '}', '\\': '|',
  ';': ':', "'": '"', '`': '~', ',': '<', '.': '>',
  '/': '?'
};

const MODIFIERS = ['LSHIFT', 'RSHIFT', 'LCTRL', 'RCTRL', 'LALT', 'RALT', 'LGUI', 'RGUI', 'LS', 'LC', 'LA', 'LG', 'LSFT', 'LCTL', 'RSFT', 'RCTL'];

const isModifier = (keycode: string): boolean => {
  return MODIFIERS.includes(keycode.toUpperCase());
};

const parseKeyParam = (param: string) => {
  param = param.trim();
  const shiftMatch = param.match(/^([A-ZFTL_]+)\((.+)\)$/);
  if (shiftMatch) {
    let mod = shiftMatch[1];
    if (mod === 'LSHIFT' || mod === 'LSFT') mod = 'LS';
    if (mod === 'RSHIFT' || mod === 'RSFT') mod = 'RS';
    if (mod === 'LCTRL' || mod === 'LCTL') mod = 'LC';
    if (mod === 'RCTRL' || mod === 'RCTL') mod = 'RC';
    if (mod === 'LALT') mod = 'LA';
    if (mod === 'RALT') mod = 'RA';
    if (mod === 'LGUI') mod = 'LG';
    if (mod === 'RGUI') mod = 'RG';
    return { modifier: mod, keycode: shiftMatch[2] };
  }
  if (isModifier(param)) {
    return { modifier: param, keycode: 'none' };
  }
  return { modifier: 'none', keycode: param };
};

const keycodeToChar = (keycode: string, isShifted: boolean): string => {
  const code = keycode.toUpperCase();
  if (code.startsWith('NUMBER_')) {
    const num = code.replace('NUMBER_', '');
    return isShifted ? (SHIFT_MAP[num] || num) : num;
  }
  if (code === 'SPACE' || code === 'SPC') return ' ';
  if (code === 'ENTER' || code === 'RET') return '\n';
  if (code === 'TAB') return '\t';
  
  const charMap: Record<string, string> = {
    'MINUS': '-', 'EQUAL': '=', 'LBKT': '[', 'RBKT': ']', 'BSLH': '\\',
    'SEMI': ';', 'SQT': "'", 'GRAVE': '`', 'COMMA': ',', 'DOT': '.', 'FSLH': '/'
  };
  
  if (charMap[code]) {
    const char = charMap[code];
    return isShifted ? (SHIFT_MAP[char] || char) : char;
  }

  // Letters A-Z
  if (code.length === 1 && code >= 'A' && code <= 'Z') {
    return isShifted ? code.toUpperCase() : code.toLowerCase();
  }

  return ''; // Return empty for keys that don't output printable text
};

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

  // Undo/Redo history states
  const [past, setPast] = useState<KeyboardLayoutData[]>([]);
  const [future, setFuture] = useState<KeyboardLayoutData[]>([]);

  const layoutDataRef = useRef(layoutData);
  const pastRef = useRef(past);
  const futureRef = useRef(future);

  useEffect(() => {
    layoutDataRef.current = layoutData;
    pastRef.current = past;
    futureRef.current = future;
  }, [layoutData, past, future]);

  const pushToHistoryAndSet = (nextState: KeyboardLayoutData | ((prev: KeyboardLayoutData) => KeyboardLayoutData)) => {
    setLayoutData(prev => {
      const resolvedNext = typeof nextState === 'function' ? nextState(prev) : nextState;
      
      if (JSON.stringify(prev) !== JSON.stringify(resolvedNext)) {
        setPast(history => {
          // Check if we are just renaming a layer and the last history entry was also a layer rename
          const lastEntry = history[history.length - 1];
          const keysAreIdentical = lastEntry && JSON.stringify(lastEntry.keys) === JSON.stringify(prev.keys);
          
          if (keysAreIdentical) {
            // Replace the last entry with the state BEFORE the rename started, so undoing goes back to original name
            return history; 
          }
          
          const updated = [...history, prev];
          if (updated.length > 50) {
            return updated.slice(updated.length - 50);
          }
          return updated;
        });
        setFuture([]);
      }
      
      return resolvedNext;
    });
  };

  const undo = useCallback(() => {
    if (pastRef.current.length === 0) return;
    
    const history = pastRef.current;
    const previous = history[history.length - 1];
    const newPast = history.slice(0, -1);
    
    setFuture(fut => [layoutDataRef.current, ...fut]);
    setPast(newPast);
    setLayoutData(previous);
  }, []);

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return;
    
    const fut = futureRef.current;
    const next = fut[0];
    const newFuture = fut.slice(1);
    
    setPast(history => [...history, layoutDataRef.current]);
    setFuture(newFuture);
    setLayoutData(next);
  }, []);

  // Keyboard shortcut handler for Undo/Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger undo/redo if the user is typing in an input field
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      const isUndo = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey;
      const isRedo = 
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && e.shiftKey);

      if (isUndo) {
        e.preventDefault();
        undo();
      } else if (isRedo) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  // Simulation States
  const [isSimMode, setIsSimMode] = useState<boolean>(false);
  const [simText, setSimText] = useState<string>('');
  const [simBaseLayerId, setSimBaseLayerId] = useState<number>(0);
  const [simActiveLayerId, setSimActiveLayerId] = useState<number>(0);
  const [heldKeys, setHeldKeys] = useState<Set<number>>(new Set());
  const [lockedKeys, setLockedKeys] = useState<Set<number>>(new Set());
  const [activeMods, setActiveMods] = useState<Set<string>>(new Set());
  const [stickyMods, setStickyMods] = useState<Set<string>>(new Set());
  const [stickyLayerId, setStickyLayerId] = useState<number | null>(null);

  const holdTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const didTriggerHold = useRef<Record<number, boolean>>({});

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(layoutData));
  }, [layoutData]);

  useEffect(() => {
    if (isSimMode) {
      setSimBaseLayerId(selectedLayerId);
      setSimActiveLayerId(selectedLayerId);
      setHeldKeys(new Set());
      setLockedKeys(new Set());
      setActiveMods(new Set());
      setStickyMods(new Set());
      setStickyLayerId(null);
    }
  }, [isSimMode, selectedLayerId]);

  const selectedKey = layoutData.keys.find(k => k.index === selectedKeyIndex) || null;
  const layersList = layoutData.layers || [];
  const selectedLayerName = layersList.find(l => l.id === selectedLayerId)?.name || `Layer ${selectedLayerId + 1}`;

  const handleUpdateKey = (updatedKey: KeyConfig) => {
    pushToHistoryAndSet(prev => {
      const newKeys = prev.keys.map(k => k.index === updatedKey.index ? updatedKey : k);
      return { ...prev, keys: newKeys };
    });
  };

  const handleRenameLayer = (layerId: number, newName: string) => {
    pushToHistoryAndSet(prev => {
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
          pushToHistoryAndSet(migrated);
          setSelectedKeyIndex(null);
        } else {
          alert("Invalid JSON file. Missing 'keys' property.");
        }
      } catch (err) {
        alert("Error reading JSON file.");
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  // Simulator helper methods
  const getBindingForKey = (keyIndex: number, layerId: number): string => {
    const key = layoutData.keys.find(k => k.index === keyIndex);
    if (!key) return '&trans';
    const binding = key.bindings?.[layerId];
    return getZmkBindingString(binding);
  };

  const resolveBinding = (keyIndex: number, layerId: number): string => {
    let currentLayer = layerId;
    while (currentLayer >= 0) {
      const binding = getBindingForKey(keyIndex, currentLayer);
      if (binding !== '&trans') {
        return binding;
      }
      currentLayer--;
    }
    return '&trans';
  };

  const isShiftActive = 
    activeMods.has('LSHIFT') || 
    activeMods.has('RSHIFT') || 
    activeMods.has('Shift') || 
    activeMods.has('LS') || 
    stickyMods.has('LSHIFT') || 
    stickyMods.has('RSHIFT') || 
    stickyMods.has('Shift') || 
    stickyMods.has('LS');

  const clearStickyStates = () => {
    setStickyLayerId(null);
    setStickyMods(new Set());
    setSimActiveLayerId(simBaseLayerId);
  };

  const processTap = (keyIndex: number) => {
    const bindingStr = resolveBinding(keyIndex, simActiveLayerId);
    const parsed = parseZmkBinding(bindingStr);
    const behavior = parsed.behavior;
    const isShifted = isShiftActive;

    switch (behavior) {
      case '&kp': {
        const param = parsed.param1 || '';
        const { modifier, keycode } = parseKeyParam(param);
        const shiftForThisKey = isShifted || modifier === 'LS' || modifier === 'LSHIFT' || modifier === 'RSHIFT';
        
        const char = keycodeToChar(keycode, shiftForThisKey);
        if (char) {
          setSimText(prev => prev + char);
        } else if (keycode === 'BSPC' || keycode === 'DEL') {
          setSimText(prev => prev.slice(0, -1));
        }
        clearStickyStates();
        break;
      }
      
      case '&lt': {
        const keycode = parsed.param2 || '';
        const char = keycodeToChar(keycode, isShifted);
        if (char) {
          setSimText(prev => prev + char);
        } else if (keycode === 'BSPC' || keycode === 'DEL') {
          setSimText(prev => prev.slice(0, -1));
        }
        clearStickyStates();
        break;
      }

      case '&mt': {
        const keycode = parsed.param2 || '';
        const char = keycodeToChar(keycode, isShifted);
        if (char) {
          setSimText(prev => prev + char);
        } else if (keycode === 'BSPC' || keycode === 'DEL') {
          setSimText(prev => prev.slice(0, -1));
        }
        clearStickyStates();
        break;
      }

      case '&ht': {
        const param2 = parsed.param2 || '';
        const { keycode } = parseKeyParam(param2);
        const char = keycodeToChar(keycode, isShifted);
        if (char) {
          setSimText(prev => prev + char);
        } else if (keycode === 'BSPC' || keycode === 'DEL') {
          setSimText(prev => prev.slice(0, -1));
        }
        clearStickyStates();
        break;
      }

      case '&sl': {
        const targetLayer = parseInt(parsed.param1 || '0', 10);
        setStickyLayerId(targetLayer);
        setSimActiveLayerId(targetLayer);
        break;
      }

      case '&sk': {
        const mod = parsed.param1 || '';
        setStickyMods(prev => {
          const next = new Set(prev);
          next.add(mod);
          return next;
        });
        break;
      }

      case '&to': {
        const targetLayer = parseInt(parsed.param1 || '0', 10);
        setSimBaseLayerId(targetLayer);
        setSimActiveLayerId(targetLayer);
        clearStickyStates();
        break;
      }

      case '&tog': {
        const targetLayer = parseInt(parsed.param1 || '0', 10);
        setSimBaseLayerId(prev => {
          const next = prev === targetLayer ? 0 : targetLayer;
          setSimActiveLayerId(next);
          return next;
        });
        clearStickyStates();
        break;
      }

      case '&mtl': {
        const tapLayer = parseInt(parsed.param2 || '0', 10);
        setStickyLayerId(tapLayer);
        setSimActiveLayerId(tapLayer);
        break;
      }

      default:
        clearStickyStates();
        break;
    }
  };

  const processHoldStart = (keyIndex: number) => {
    const bindingStr = resolveBinding(keyIndex, simActiveLayerId);
    const parsed = parseZmkBinding(bindingStr);
    const behavior = parsed.behavior;

    switch (behavior) {
      case '&kp': {
        const param = parsed.param1 || '';
        const { modifier, keycode } = parseKeyParam(param);
        if (modifier && modifier !== 'none') {
          setActiveMods(prev => {
            const next = new Set(prev);
            next.add(modifier);
            return next;
          });
        }
        if (isModifier(keycode)) {
          setActiveMods(prev => {
            const next = new Set(prev);
            next.add(keycode);
            return next;
          });
        }
        break;
      }

      case '&mo': {
        const targetLayer = parseInt(parsed.param1 || '0', 10);
        setSimActiveLayerId(targetLayer);
        break;
      }

      case '&lt': {
        const targetLayer = parseInt(parsed.param1 || '0', 10);
        setSimActiveLayerId(targetLayer);
        break;
      }

      case '&mt': {
        const mod = parsed.param1 || '';
        const { modifier, keycode } = parseKeyParam(mod);
        if (modifier && modifier !== 'none') {
          setActiveMods(prev => {
            const next = new Set(prev);
            next.add(modifier);
            return next;
          });
        }
        if (isModifier(keycode)) {
          setActiveMods(prev => {
            const next = new Set(prev);
            next.add(keycode);
            return next;
          });
        } else if (keycode && keycode !== 'none') {
          const shiftForThisKey = isShiftActive || modifier === 'LS' || modifier === 'LSHIFT' || modifier === 'RSHIFT';
          const char = keycodeToChar(keycode, shiftForThisKey);
          if (char) {
            setSimText(prev => prev + char);
          }
        }
        break;
      }

      case '&ht': {
        const param1 = parsed.param1 || '';
        const { modifier, keycode } = parseKeyParam(param1);
        if (modifier && modifier !== 'none') {
          setActiveMods(prev => {
            const next = new Set(prev);
            next.add(modifier);
            return next;
          });
        }
        if (isModifier(keycode)) {
          setActiveMods(prev => {
            const next = new Set(prev);
            next.add(keycode);
            return next;
          });
        } else if (keycode && keycode !== 'none') {
          const shiftForThisKey = isShiftActive || modifier === 'LS' || modifier === 'LSHIFT' || modifier === 'RSHIFT';
          const char = keycodeToChar(keycode, shiftForThisKey);
          if (char) {
            setSimText(prev => prev + char);
          }
        }
        break;
      }

      case '&mtl': {
        const holdLayer = parseInt(parsed.param1 || '0', 10);
        setSimActiveLayerId(holdLayer);
        break;
      }

      default:
        break;
    }
  };

  const processHoldEnd = (keyIndex: number) => {
    const bindingStr = resolveBinding(keyIndex, simActiveLayerId);
    const parsed = parseZmkBinding(bindingStr);
    const behavior = parsed.behavior;

    switch (behavior) {
      case '&kp': {
        const param = parsed.param1 || '';
        const { modifier, keycode } = parseKeyParam(param);
        if (modifier && modifier !== 'none') {
          setActiveMods(prev => {
            const next = new Set(prev);
            next.delete(modifier);
            return next;
          });
        }
        if (isModifier(keycode)) {
          setActiveMods(prev => {
            const next = new Set(prev);
            next.delete(keycode);
            return next;
          });
        }
        break;
      }

      case '&mo':
      case '&lt':
      case '&mtl': {
        setSimActiveLayerId(stickyLayerId !== null ? stickyLayerId : simBaseLayerId);
        break;
      }

      case '&mt': {
        const mod = parsed.param1 || '';
        const { modifier, keycode } = parseKeyParam(mod);
        if (modifier && modifier !== 'none') {
          setActiveMods(prev => {
            const next = new Set(prev);
            next.delete(modifier);
            return next;
          });
        }
        if (isModifier(keycode)) {
          setActiveMods(prev => {
            const next = new Set(prev);
            next.delete(keycode);
            return next;
          });
        }
        break;
      }

      case '&ht': {
        const param1 = parsed.param1 || '';
        const { modifier, keycode } = parseKeyParam(param1);
        if (modifier && modifier !== 'none') {
          setActiveMods(prev => {
            const next = new Set(prev);
            next.delete(modifier);
            return next;
          });
        }
        if (isModifier(keycode)) {
          setActiveMods(prev => {
            const next = new Set(prev);
            next.delete(keycode);
            return next;
          });
        }
        break;
      }

      default:
        break;
    }
  };

  const HOLD_TAP_BEHAVIORS = ['&mt', '&lt', '&ht', '&mtl'];
  const isHoldTapBehavior = (behavior: string): boolean => {
    return HOLD_TAP_BEHAVIORS.includes(behavior);
  };

  const handleSimDown = (keyData: KeyConfig) => {
    const idx = keyData.index;
    
    setHeldKeys(prev => {
      const next = new Set(prev);
      next.add(idx);
      return next;
    });

    didTriggerHold.current[idx] = false;

    if (holdTimers.current[idx]) {
      clearTimeout(holdTimers.current[idx]);
    }

    const bindingStr = resolveBinding(idx, simActiveLayerId);
    const parsed = parseZmkBinding(bindingStr);
    const behavior = parsed.behavior;

    if (isHoldTapBehavior(behavior)) {
      holdTimers.current[idx] = setTimeout(() => {
        didTriggerHold.current[idx] = true;
        processHoldStart(idx);
      }, 200);
    } else {
      didTriggerHold.current[idx] = true;
      if (behavior === '&mo' || behavior === '&kp' || behavior === '&ht' || behavior === '&mt' || behavior === '&mtl') {
        processHoldStart(idx);
      }
      if (behavior === '&kp') {
        processTap(idx);
      } else if (behavior === '&to' || behavior === '&tog' || behavior === '&sl' || behavior === '&sk') {
        processTap(idx);
      }
    }
  };

  const handleSimUp = (keyData: KeyConfig) => {
    const idx = keyData.index;

    if (holdTimers.current[idx]) {
      clearTimeout(holdTimers.current[idx]);
      delete holdTimers.current[idx];
    }

    setHeldKeys(prev => {
      const next = new Set(prev);
      next.delete(idx);
      return next;
    });

    const bindingStr = resolveBinding(idx, simActiveLayerId);
    const parsed = parseZmkBinding(bindingStr);
    const behavior = parsed.behavior;

    if (isHoldTapBehavior(behavior)) {
      if (!didTriggerHold.current[idx]) {
        processTap(idx);
      } else {
        processHoldEnd(idx);
      }
    } else {
      if (behavior === '&mo' || behavior === '&kp' || behavior === '&ht' || behavior === '&mt' || behavior === '&mtl') {
        processHoldEnd(idx);
      }
    }
  };

  const handleSimRightClick = (keyData: KeyConfig) => {
    const idx = keyData.index;
    
    setLockedKeys(prev => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
        processHoldEnd(idx);
      } else {
        next.add(idx);
        processHoldStart(idx);
      }
      return next;
    });
  };

  return (
    <>
      <style>{`
        @keyframes blink {
          50% { opacity: 0; }
        }
      `}</style>
      <header className="app-header">
        <div className="app-title">
          <KeyboardIcon size={28} className="text-accent-primary" />
          ZMK Key Configurator
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ 
            display: 'flex', 
            backgroundColor: 'rgba(15, 23, 42, 0.6)', 
            padding: 4, 
            borderRadius: 8, 
            border: '1px solid var(--border-color)',
            alignItems: 'center'
          }}>
            <button 
              className={`btn ${!isSimMode ? 'btn-primary' : 'btn-secondary'}`} 
              onClick={() => setIsSimMode(false)}
              style={{ 
                padding: '6px 16px', 
                fontSize: '13px', 
                borderRadius: '6px',
                border: 'none',
                backgroundColor: !isSimMode ? '#3b82f6' : 'transparent',
                color: !isSimMode ? '#ffffff' : 'var(--text-secondary)',
                boxShadow: !isSimMode ? '0 2px 4px rgba(59,130,246,0.2)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              Mode Config
            </button>
            <button 
              className={`btn ${isSimMode ? 'btn-primary' : 'btn-secondary'}`} 
              onClick={() => setIsSimMode(true)}
              style={{ 
                padding: '6px 16px', 
                fontSize: '13px', 
                borderRadius: '6px',
                border: 'none',
                backgroundColor: isSimMode ? '#3b82f6' : 'transparent',
                color: isSimMode ? '#ffffff' : 'var(--text-secondary)',
                boxShadow: isSimMode ? '0 2px 4px rgba(59,130,246,0.2)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <KeyboardIcon size={14} />
              Mode Essai
            </button>
          </div>

          {/* Undo / Redo controls */}
          <div style={{ display: 'flex', gap: 8, marginRight: 8 }}>
            <button 
              className="btn btn-secondary" 
              onClick={undo}
              disabled={past.length === 0}
              title="Undo (Ctrl+Z)"
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                fontSize: '13px',
                height: '38px',
              }}
            >
              <Undo size={16} />
              Undo
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={redo}
              disabled={future.length === 0}
              title="Redo (Ctrl+Y)"
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                fontSize: '13px',
                height: '38px',
              }}
            >
              <Redo size={16} />
              Redo
            </button>
          </div>

          <label className="btn btn-secondary">
            <Upload size={18} />
            Import JSON
            <input 
              type="file" 
              accept=".json" 
              style={{ display: 'none' }} 
              onChange={handleImport}
            />
          </label>
          <button className="btn btn-primary" onClick={handleExport}>
            <Download size={18} />
            Export
          </button>
        </div>
      </header>

      <main className="app-content">
        <div className="keyboard-container" style={{ display: 'flex', flexDirection: 'column', gap: 24, flex: 1 }}>
          <div className="layer-selector-bar glass-panel" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 24px', width: '100%', borderRadius: 16 }}>
            <span style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: 14 }}>Select Layer:</span>
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

            <span style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: 14, marginLeft: 'auto' }}>Rename:</span>
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
              selectedLayerId={isSimMode ? simActiveLayerId : selectedLayerId}
              selectedKeyIndex={selectedKeyIndex} 
              layers={layersList}
              onKeySelect={(k) => setSelectedKeyIndex(k.index)} 
              isSimMode={isSimMode}
              heldKeys={heldKeys}
              lockedKeys={lockedKeys}
              onSimDown={handleSimDown}
              onSimUp={handleSimUp}
              onSimRightClick={handleSimRightClick}
            />
          </div>

          {isSimMode && (
            <div className="glass-panel" style={{ padding: 20, borderRadius: 16, border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600, fontSize: 16, color: '#f59e0b' }}>📺 Console de Test</span>
                  <span className="badge" style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)', border: '1px solid rgba(59, 130, 246, 0.4)', color: '#93c5fd', padding: '4px 10px', borderRadius: 12, fontSize: 12 }}>
                    Couche Active : {layersList.find(l => l.id === simActiveLayerId)?.name || `Layer ${simActiveLayerId + 1}`}
                  </span>
                  {activeMods.size > 0 && (
                    <span className="badge" style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', border: '1px solid rgba(245, 158, 11, 0.4)', color: '#fcd34d', padding: '4px 10px', borderRadius: 12, fontSize: 12 }}>
                      Mod: {Array.from(activeMods).join(', ')}
                    </span>
                  )}
                  {stickyMods.size > 0 && (
                    <span className="badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#a7f3d0', padding: '4px 10px', borderRadius: 12, fontSize: 12 }}>
                      Sticky Mod: {Array.from(stickyMods).join(', ')}
                    </span>
                  )}
                  {stickyLayerId !== null && (
                    <span className="badge" style={{ backgroundColor: 'rgba(139, 92, 246, 0.2)', border: '1px solid rgba(139, 92, 246, 0.4)', color: '#ddd6fe', padding: '4px 10px', borderRadius: 12, fontSize: 12 }}>
                      Sticky Layer: {layersList.find(l => l.id === stickyLayerId)?.name || `Layer ${stickyLayerId + 1}`}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: 13 }} onClick={() => setSimText('')}>
                    Effacer
                  </button>
                </div>
              </div>
              
              <div style={{
                position: 'relative',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 12,
                padding: '16px 20px',
                minHeight: '80px',
                fontFamily: 'monospace',
                fontSize: '18px',
                color: '#34d399',
                display: 'flex',
                alignItems: 'center',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all'
              }}>
                {simText || <span style={{ color: 'rgba(255, 255, 255, 0.3)', fontStyle: 'italic', fontSize: '15px' }}>Cliquez sur les touches pour tester (Clic court = Tap, Clic long = Hold, Clic droit = Lock)...</span>}
                <span className="cursor" style={{
                  display: 'inline-block',
                  width: '2px',
                  height: '20px',
                  backgroundColor: '#34d399',
                  marginLeft: '4px',
                  animation: 'blink 1s infinite'
                }}></span>
              </div>
              
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <span>💡 <strong>Clic gauche rapide</strong> : Tap (action standard)</span>
                <span>🔥 <strong>Clic gauche maintenu (&gt;400ms)</strong> : Hold (momentané / modificateur)</span>
                <span>🔒 <strong>Clic droit</strong> : Verrouiller le maintien</span>
              </div>
            </div>
          )}
        </div>

        <div className="editor-container">
          {isSimMode ? (
            <div className="glass-panel" style={{ 
              padding: '32px 24px', 
              borderRadius: 16, 
              border: '1px solid var(--border-color)', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 20, 
              height: '100%', 
              justifyContent: 'center', 
              alignItems: 'center', 
              textAlign: 'center',
              backgroundColor: 'rgba(30, 41, 59, 0.4)'
            }}>
              <div style={{ 
                padding: 16, 
                borderRadius: '50%', 
                backgroundColor: 'rgba(59, 130, 246, 0.1)', 
                border: '1px solid rgba(59, 130, 246, 0.2)', 
                marginBottom: 8 
              }}>
                <KeyboardIcon size={40} style={{ color: '#3b82f6' }} />
              </div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Mode Simulation Actif
              </h3>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)', maxWidth: 260, lineHeight: 1.5 }}>
                La configuration des touches est masquée pendant la simulation. Cliquez ci-dessous pour modifier la disposition.
              </p>
              <button 
                className="btn btn-primary" 
                onClick={() => setIsSimMode(false)}
                style={{ 
                  width: '100%', 
                  marginTop: 12,
                  padding: '10px 16px',
                  backgroundColor: '#3b82f6',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                Retour au Mode Config
              </button>
            </div>
          ) : (
            <EditorPanel 
              key={selectedKey ? `${selectedKey.index}-${selectedLayerId}` : 'empty'}
              selectedKey={selectedKey} 
              selectedLayerId={selectedLayerId}
              selectedLayerName={selectedLayerName}
              layers={layoutData.layers || []}
              onUpdateKey={handleUpdateKey}
              onClose={() => setSelectedKeyIndex(null)}
            />
          )}
        </div>
      </main>
    </>
  );
}

export default App;

