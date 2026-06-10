import React, { useState, useEffect, useRef } from 'react';
import type { KeyConfig, LayerConfig } from '../types';
import { Settings, X, Keyboard as KeyboardIcon, ChevronDown, Check, Sparkles, Code } from 'lucide-react';
import { getZmkBindingString, parseZmkBinding, stringifyZmkBinding, parseKeyParam, stringifyKeyParam } from '../utils/zmkUtils';
import type { ZmkBinding } from '../utils/zmkUtils';

// Common ZMK Keycodes categorized for the searchable selector
const ZMK_KEYCODES = [
  // Letters
  ...Array.from({ length: 26 }, (_, i) => {
    const char = String.fromCharCode(65 + i);
    return { value: char, label: char, category: 'Letters' };
  }),
  // Numbers
  ...Array.from({ length: 10 }, (_, i) => ({
    value: `NUMBER_${i}`,
    label: `${i}`,
    category: 'Numbers'
  })),
  // Modifiers
  { value: 'LSHIFT', label: 'Left Shift (LSHIFT)', category: 'Modifiers' },
  { value: 'LCTRL', label: 'Left Control (LCTRL)', category: 'Modifiers' },
  { value: 'LALT', label: 'Left Alt / Option (LALT)', category: 'Modifiers' },
  { value: 'LGUI', label: 'Left GUI / Win / Cmd (LGUI)', category: 'Modifiers' },
  { value: 'RSHIFT', label: 'Right Shift (RSHIFT)', category: 'Modifiers' },
  { value: 'RCTRL', label: 'Right Control (RCTRL)', category: 'Modifiers' },
  { value: 'RALT', label: 'Right Alt / AltGr (RALT)', category: 'Modifiers' },
  { value: 'RGUI', label: 'Right GUI / Win / Cmd (RGUI)', category: 'Modifiers' },
  
  // Standard Keys & Punctuation
  { value: 'SPACE', label: 'Space', category: 'Symbols & Punctuation' },
  { value: 'ENTER', label: 'Enter', category: 'Symbols & Punctuation' },
  { value: 'TAB', label: 'Tab', category: 'Symbols & Punctuation' },
  { value: 'BSPC', label: 'Backspace', category: 'Symbols & Punctuation' },
  { value: 'ESC', label: 'Escape', category: 'Symbols & Punctuation' },
  { value: 'MINUS', label: '- (Minus)', category: 'Symbols & Punctuation' },
  { value: 'EQUAL', label: '= (Equal)', category: 'Symbols & Punctuation' },
  { value: 'LBKT', label: '[ (Left Bracket)', category: 'Symbols & Punctuation' },
  { value: 'RBKT', label: '] (Right Bracket)', category: 'Symbols & Punctuation' },
  { value: 'BSLH', label: '\\ (Backslash)', category: 'Symbols & Punctuation' },
  { value: 'SEMI', label: '; (Semicolon)', category: 'Symbols & Punctuation' },
  { value: 'SQT', label: '\' (Single Quote)', category: 'Symbols & Punctuation' },
  { value: 'GRAVE', label: '` (Grave)', category: 'Symbols & Punctuation' },
  { value: 'COMMA', label: ', (Comma)', category: 'Symbols & Punctuation' },
  { value: 'DOT', label: '. (Period)', category: 'Symbols & Punctuation' },
  { value: 'FSLH', label: '/ (Slash)', category: 'Symbols & Punctuation' },
  
  // Navigation & Control
  { value: 'UP', label: 'Up Arrow', category: 'Navigation & System' },
  { value: 'DOWN', label: 'Down Arrow', category: 'Navigation & System' },
  { value: 'LEFT', label: 'Left Arrow', category: 'Navigation & System' },
  { value: 'RIGHT', label: 'Right Arrow', category: 'Navigation & System' },
  { value: 'INS', label: 'Insert', category: 'Navigation & System' },
  { value: 'DEL', label: 'Delete', category: 'Navigation & System' },
  { value: 'HOME', label: 'Home', category: 'Navigation & System' },
  { value: 'END', label: 'End', category: 'Navigation & System' },
  { value: 'PG_UP', label: 'Page Up', category: 'Navigation & System' },
  { value: 'PG_DN', label: 'Page Down', category: 'Navigation & System' },
  { value: 'CAPS', label: 'Caps Lock', category: 'Navigation & System' },
  { value: 'PSCRN', label: 'Print Screen', category: 'Navigation & System' },
  { value: 'SCLK', label: 'Scroll Lock', category: 'Navigation & System' },
  { value: 'PAUSE_BREAK', label: 'Pause / Break', category: 'Navigation & System' },
  
  // F Keys
  ...Array.from({ length: 12 }, (_, i) => ({
    value: `F${i + 1}`,
    label: `F${i + 1}`,
    category: 'F Keys'
  })),

  // Keypad
  ...Array.from({ length: 10 }, (_, i) => ({
    value: `KP_NUMBER_${i}`,
    label: `Numpad ${i}`,
    category: 'Numpad'
  })),
  { value: 'KP_PLUS', label: 'Numpad +', category: 'Numpad' },
  { value: 'KP_MINUS', label: 'Numpad -', category: 'Numpad' },
  { value: 'KP_ASTERISK', label: 'Numpad *', category: 'Numpad' },
  { value: 'KP_SLASH', label: 'Numpad /', category: 'Numpad' },
  { value: 'KP_ENTER', label: 'Numpad Enter', category: 'Numpad' },
  { value: 'KP_DOT', label: 'Numpad .', category: 'Numpad' },
  { value: 'KP_EQUAL', label: 'Numpad =', category: 'Numpad' },

  // Media & Consumer
  { value: 'C_MUTE', label: 'Mute', category: 'Media' },
  { value: 'C_VOL_UP', label: 'Volume Up', category: 'Media' },
  { value: 'C_VOL_DN', label: 'Volume Down', category: 'Media' },
  { value: 'C_PP', label: 'Play / Pause', category: 'Media' },
  { value: 'C_NEXT', label: 'Next Track', category: 'Media' },
  { value: 'C_PREV', label: 'Previous Track', category: 'Media' },
  { value: 'C_PLAY', label: 'Play', category: 'Media' },
  { value: 'C_PAUSE', label: 'Pause', category: 'Media' },
  { value: 'C_STOP', label: 'Stop', category: 'Media' },
  { value: 'C_BRI_UP', label: 'Brightness Up', category: 'Media' },
  { value: 'C_BRI_DN', label: 'Brightness Down', category: 'Media' },

  // Hardware/System Reset
  { value: 'bootloader', label: 'Bootloader Reset', category: 'System & Reset' },
  { value: 'sys_reset', label: 'System Reset', category: 'System & Reset' }
];

const BEHAVIORS = [
  { value: '&kp', label: 'Key Press (kp)', desc: "Simulates a standard key press" },
  { value: '&ht', label: 'Hold / Tap (ht)', desc: 'Hold: action 1 | Tap: action 2' },
  { value: '&mo', label: 'Momentary Layer (mo)', desc: 'Activates a layer while held' },
  { value: '&lt', label: 'Layer / Tap (lt)', desc: 'Hold: activate layer | Tap: press key' },
  { value: '&mtl', label: 'Momentary / Tap Layer (mtl)', desc: 'Hold: activate layer | Tap: sticky layer' },
  { value: '&mt', label: 'Mod / Tap (mt)', desc: 'Hold: activate modifier | Tap: press key' },
  { value: '&to', label: 'To Layer (to)', desc: 'Permanently switches to a layer' },
  { value: '&tog', label: 'Toggle Layer (tog)', desc: 'Toggles a layer on/off per tap' },
  { value: '&sl', label: 'Sticky Layer (sl)', desc: 'Activates a layer for the next keypress only' },
  { value: '&sk', label: 'Sticky Mod (sk)', desc: 'Activates a modifier for the next keypress only' },
  { value: '&kt', label: 'Key Toggle (kt)', desc: "Toggles the pressed/released state of a key" },
  { value: '&bt', label: 'Bluetooth (bt)', desc: 'Controls wireless profiles and connections' },
  { value: '&rgb_ug', label: 'RGB Underglow (rgb_ug)', desc: 'Controls RGB lighting' },
  { value: '&ext_power', label: 'External Power', desc: "Controls power to displays/LEDs" },
  { value: '&out', label: 'Output (out)', desc: 'Toggles active output between USB and Bluetooth' },
  { value: '&trans', label: 'Transparent (trans)', desc: 'Inherits configuration from a lower layer' },
  { value: '&none', label: 'No Action (none)', desc: 'Completely disables the key' },
  { value: 'custom', label: 'Raw Code / Custom', desc: 'Allows direct entry of ZMK code' }
];

const MODIFIERS = [
  { value: 'none', label: 'None (none)' },
  { value: 'LS', label: 'Shift (LS)' },
  { value: 'LC', label: 'Control (LC)' },
  { value: 'LA', label: 'Alt / Option (LA)' },
  { value: 'LG', label: 'GUI / Win / Cmd (LG)' },
  { value: 'LSHIFT', label: 'Left Shift (LSHIFT)' },
  { value: 'LCTRL', label: 'Left Control (LCTRL)' },
  { value: 'LALT', label: 'Left Alt / Option (LALT)' },
  { value: 'LGUI', label: 'Left GUI / Win / Cmd (LGUI)' },
  { value: 'RSHIFT', label: 'Right Shift (RSHIFT)' },
  { value: 'RCTRL', label: 'Right Control (RCTRL)' },
  { value: 'RALT', label: 'Right Alt / AltGr (RALT)' },
  { value: 'RGUI', label: 'Right GUI / Win / Cmd (RGUI)' }
];

const BT_COMMANDS = [
  { value: 'BT_CLR', label: 'Clear Profile (BT_CLR)' },
  { value: 'BT_CLR_ALL', label: 'Clear All Profiles (BT_CLR_ALL)' },
  { value: 'BT_NXT', label: 'Next Profile (BT_NXT)' },
  { value: 'BT_PRV', label: 'Previous Profile (BT_PRV)' },
  { value: 'BT_SEL 0', label: 'Select Profile 1 (BT_SEL 0)' },
  { value: 'BT_SEL 1', label: 'Select Profile 2 (BT_SEL 1)' },
  { value: 'BT_SEL 2', label: 'Select Profile 3 (BT_SEL 2)' },
  { value: 'BT_SEL 3', label: 'Select Profile 4 (BT_SEL 3)' },
  { value: 'BT_SEL 4', label: 'Select Profile 5 (BT_SEL 4)' }
];

const RGB_COMMANDS = [
  { value: 'RGB_TOG', label: 'Toggle RGB On/Off' },
  { value: 'RGB_HUI', label: 'Hue +' },
  { value: 'RGB_HUD', label: 'Hue -' },
  { value: 'RGB_SAI', label: 'Saturation +' },
  { value: 'RGB_SAD', label: 'Saturation -' },
  { value: 'RGB_BRI', label: 'Brightness +' },
  { value: 'RGB_BRD', label: 'Brightness -' },
  { value: 'RGB_EFF', label: 'Next Effect' },
  { value: 'RGB_EFR', label: 'Previous Effect' },
  { value: 'RGB_SPI', label: 'Speed +' },
  { value: 'RGB_SPD', label: 'Speed -' }
];

const EP_COMMANDS = [
  { value: 'EP_TOG', label: 'Toggle Power (EP_TOG)' },
  { value: 'EP_ON', label: 'Power On (EP_ON)' },
  { value: 'EP_OFF', label: 'Power Off (EP_OFF)' }
];

const OUT_COMMANDS = [
  { value: 'OUT_TOG', label: 'Toggle USB/BLE (OUT_TOG)' },
  { value: 'OUT_USB', label: 'USB (OUT_USB)' },
  { value: 'OUT_BLE', label: 'Bluetooth (OUT_BLE)' }
];

// Helper to map browser keydown event to ZMK keycode format
const mapEventToZmkKeycode = (event: KeyboardEvent): string => {
  const code = event.code;
  
  if (code.startsWith('Key')) {
    return code.replace('Key', '').toUpperCase();
  }
  
  if (code.startsWith('Digit')) {
    return `NUMBER_${code.replace('Digit', '')}`;
  }
  
  if (code.match(/^F\d+$/)) {
    return code.toUpperCase();
  }
  
  if (code.startsWith('Numpad')) {
    const num = code.replace('Numpad', '');
    if (num.match(/^\d$/)) return `KP_NUMBER_${num}`;
    if (num === 'Add') return 'KP_PLUS';
    if (num === 'Subtract') return 'KP_MINUS';
    if (num === 'Multiply') return 'KP_ASTERISK';
    if (num === 'Divide') return 'KP_SLASH';
    if (num === 'Enter') return 'KP_ENTER';
    if (num === 'Decimal') return 'KP_DOT';
    if (num === 'Equal') return 'KP_EQUAL';
  }

  const map: Record<string, string> = {
    'Space': 'SPACE',
    'Enter': 'ENTER',
    'Escape': 'ESC',
    'Backspace': 'BSPC',
    'Tab': 'TAB',
    'CapsLock': 'CAPS',
    'ShiftLeft': 'LSHIFT',
    'ShiftRight': 'RSHIFT',
    'ControlLeft': 'LCTRL',
    'ControlRight': 'RCTRL',
    'AltLeft': 'LALT',
    'AltRight': 'RALT',
    'MetaLeft': 'LGUI',
    'MetaRight': 'RGUI',
    'ArrowUp': 'UP',
    'ArrowDown': 'DOWN',
    'ArrowLeft': 'LEFT',
    'ArrowRight': 'RIGHT',
    'Minus': 'MINUS',
    'Equal': 'EQUAL',
    'BracketLeft': 'LBKT',
    'BracketRight': 'RBKT',
    'Backslash': 'BSLH',
    'Semicolon': 'SEMI',
    'Quote': 'SQT',
    'Backquote': 'GRAVE',
    'Comma': 'COMMA',
    'Period': 'DOT',
    'Slash': 'FSLH',
    'Delete': 'DEL',
    'Insert': 'INS',
    'Home': 'HOME',
    'End': 'END',
    'PageUp': 'PG_UP',
    'PageDown': 'PG_DN',
    'NumLock': 'NUM_LOCK',
    'ScrollLock': 'SCROLLLOCK',
    'PrintScreen': 'PSCRN',
    'Pause': 'PAUSE_BREAK',
  };

  return map[code] || event.key.toUpperCase();
};



// Searchable Custom Select Component for ZMK Keycodes
interface SearchableSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string; category: string }[];
  placeholder?: string;
  isListening: boolean;
  onStartListening: () => void;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  isListening,
  onStartListening
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputFocus = () => {
    setIsOpen(true);
    setSearch('');
  };

  const selectedOption = options.find(opt => opt.value === value);
  const displayValue = isOpen ? search : (selectedOption ? selectedOption.label : value);

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(search.toLowerCase()) ||
    opt.value.toLowerCase().includes(search.toLowerCase())
  );

  // If search does not match any exact option, allow creating custom entry
  const exactMatch = options.some(opt => opt.value.toLowerCase() === search.trim().toLowerCase());
  const customOption = search.trim() && !exactMatch ? {
    value: search.trim().toUpperCase(),
    label: `Use "${search.trim().toUpperCase()}"`,
    category: 'Custom Value'
  } : null;

  const displayOptions = customOption ? [customOption, ...filteredOptions] : filteredOptions;

  // Group by category
  const categories: Record<string, typeof displayOptions> = {};
  displayOptions.forEach(opt => {
    if (!categories[opt.category]) {
      categories[opt.category] = [];
    }
    categories[opt.category].push(opt);
  });

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'flex', gap: 8, flex: 1 }}>
      <div style={{ position: 'relative', flex: 1 }}>
        <input
          type="text"
          className={`form-input ${isListening ? 'pulsing-capture' : ''}`}
          placeholder={isListening ? 'Press a physical key...' : placeholder}
          value={isListening ? '' : displayValue}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={handleInputFocus}
          style={{ paddingRight: 32, cursor: isListening ? 'default' : 'text' }}
          disabled={isListening}
        />
        <ChevronDown
          size={16}
          style={{
            position: 'absolute',
            right: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            opacity: 0.5
          }}
        />

        {isOpen && !isListening && (
          <div
            className="glass-panel"
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              maxHeight: 240,
              overflowY: 'auto',
              zIndex: 100,
              marginTop: 4,
              padding: 8,
              backgroundColor: 'rgba(24, 24, 27, 0.95)',
              border: '1px solid var(--border-color)',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
            }}
          >
            {Object.keys(categories).length === 0 ? (
              <div style={{ padding: '8px 12px', fontSize: 13, color: 'var(--text-secondary)' }}>
                No results
              </div>
            ) : (
              Object.keys(categories).map(catName => (
                <div key={catName}>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                      color: 'var(--accent-primary)',
                      padding: '6px 12px 2px 12px',
                      opacity: 0.8
                    }}
                  >
                    {catName}
                  </div>
                  {categories[catName].map(opt => (
                    <div
                      key={opt.value}
                      onClick={() => {
                        onChange(opt.value);
                        setIsOpen(false);
                      }}
                      style={{
                        padding: '8px 12px',
                        fontSize: 13,
                        borderRadius: 6,
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor: value === opt.value ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                        color: value === opt.value ? 'var(--text-primary)' : 'var(--text-secondary)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = value === opt.value ? 'rgba(59, 130, 246, 0.15)' : 'transparent';
                        e.currentTarget.style.color = value === opt.value ? 'var(--text-primary)' : 'var(--text-secondary)';
                      }}
                    >
                      <span>{opt.label}</span>
                      {value === opt.value && <Check size={14} className="text-accent-primary" />}
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        className="btn btn-secondary"
        onClick={onStartListening}
        title="Capture a physical key press"
        style={{
          padding: '10px 12px',
          borderColor: isListening ? '#f43f5e' : 'var(--border-color)',
          backgroundColor: isListening ? 'rgba(244, 63, 94, 0.15)' : 'rgba(0, 0, 0, 0.2)',
          color: isListening ? '#f43f5e' : 'var(--text-secondary)'
        }}
      >
        <KeyboardIcon size={16} className={isListening ? 'pulsing-capture' : ''} />
      </button>
    </div>
  );
};

interface EditorPanelProps {
  selectedKey: KeyConfig | null;
  selectedLayerId: number;
  selectedLayerName: string;
  layers: LayerConfig[];
  onUpdateKey: (updatedKey: KeyConfig) => void;
  onClose: () => void;
}

export const EditorPanel: React.FC<EditorPanelProps> = ({
  selectedKey,
  selectedLayerId,
  selectedLayerName,
  layers,
  onUpdateKey,
  onClose
}) => {
  if (!selectedKey) {
    return (
      <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
        <Settings size={48} opacity={0.2} style={{ marginBottom: 16 }} />
        <p>Select a key</p>
        <p style={{ fontSize: 13, marginTop: 4 }}>to edit its configuration</p>
      </div>
    );
  }

  const activeBindings = selectedKey.bindings || {};
  const activeBinding = activeBindings[selectedLayerId] || {};

  const currentBindingStr = getZmkBindingString(activeBinding);
  const parsedBinding = parseZmkBinding(currentBindingStr);

  // States to toggle between Wizard mode and raw text editing
  const [useRaw, setUseRaw] = useState(parsedBinding.behavior === 'custom');

  // Listening for physical keyboard key captures
  const [listeningField, setListeningField] = useState<'param1' | 'param2' | null>(null);

  // Handle global key events for capture
  useEffect(() => {
    if (!listeningField) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const zmkKey = mapEventToZmkKeycode(e);
      if (zmkKey) {
        const currentBinding = parseZmkBinding(currentBindingStr);
        const updated = { ...currentBinding };
        if (listeningField === 'param1') {
          if (updated.behavior === '&kp' || updated.behavior === '&kt') {
            const kpParam = parseKeyParam(updated.param1 || '');
            updated.param1 = stringifyKeyParam(zmkKey, kpParam.modifier);
          } else if (updated.behavior === '&ht') {
            const holdParam = parseKeyParam(updated.param1 || '');
            updated.param1 = stringifyKeyParam(zmkKey, holdParam.modifier);
          } else {
            updated.param1 = zmkKey;
          }
        } else {
          if (updated.behavior === '&ht') {
            const tapParam = parseKeyParam(updated.param2 || '');
            updated.param2 = stringifyKeyParam(zmkKey, tapParam.modifier);
          } else {
            updated.param2 = zmkKey;
          }
        }
        handleChange(stringifyZmkBinding(updated));
      }
      setListeningField(null);
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [listeningField, currentBindingStr]);

  const handleChange = (value: string) => {
    const updatedBindings = { ...activeBindings };
    updatedBindings[selectedLayerId] = {
      tap: value,
      hold: ''
    };

    onUpdateKey({
      ...selectedKey,
      bindings: updatedBindings
    });
  };

  const handleBehaviorChange = (newBehavior: string) => {
    let binding: ZmkBinding = { behavior: newBehavior };
    
    // Set sensible defaults based on behavior type
    if (newBehavior === '&kp' || newBehavior === '&kt') {
      binding.param1 = 'A';
    } else if (newBehavior === '&mo' || newBehavior === '&to' || newBehavior === '&tog' || newBehavior === '&sl') {
      binding.param1 = '0';
    } else if (newBehavior === '&sk') {
      binding.param1 = 'LSHIFT';
    } else if (newBehavior === '&bt') {
      binding.param1 = 'BT_SEL 0';
    } else if (newBehavior === '&rgb_ug') {
      binding.param1 = 'RGB_TOG';
    } else if (newBehavior === '&ext_power') {
      binding.param1 = 'EP_TOG';
    } else if (newBehavior === '&out') {
      binding.param1 = 'OUT_TOG';
    } else if (newBehavior === '&lt') {
      binding.param1 = '0';
      binding.param2 = 'SPACE';
    } else if (newBehavior === '&mtl') {
      binding.param1 = '0';
      binding.param2 = '0';
    } else if (newBehavior === '&mt') {
      binding.param1 = 'LSHIFT';
      binding.param2 = 'A';
    } else if (newBehavior === '&ht') {
      binding.param1 = 'ESC';
      binding.param2 = 'RET';
    } else if (newBehavior === 'custom') {
      binding.customValue = currentBindingStr;
    }

    const valueStr = stringifyZmkBinding(binding);
    handleChange(valueStr);

    if (newBehavior === 'custom') {
      setUseRaw(true);
    }
  };

  const handleParamChange = (paramName: 'param1' | 'param2', paramVal: string) => {
    const currentBinding = parsedBinding;
    const updated = {
      ...currentBinding,
      [paramName]: paramVal
    };
    handleChange(stringifyZmkBinding(updated));
  };

  // Render parameter selectors dynamically based on parsed behavior
  const renderParameters = (binding: ZmkBinding) => {
    const { behavior, param1 = '', param2 = '' } = binding;

    switch (behavior) {
      case '&kp':
      case '&kt': {
        const kpParam = parseKeyParam(param1);
        return (
          <div style={{ display: 'flex', gap: 12 }}>
            <div className="form-group" style={{ flex: 1.2 }}>
              <label className="form-label">Modifier</label>
              <select
                className="form-input"
                value={kpParam.modifier}
                onChange={(e) => {
                  const updatedVal = stringifyKeyParam(kpParam.keycode, e.target.value);
                  handleParamChange('param1', updatedVal);
                }}
                style={{ cursor: 'pointer' }}
              >
                {MODIFIERS.map(mod => (
                  <option key={mod.value} value={mod.value}>{mod.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ flex: 1.5 }}>
              <label className="form-label">Keycode</label>
              <SearchableSelect
                value={kpParam.keycode}
                onChange={(val) => {
                  const updatedVal = stringifyKeyParam(val, kpParam.modifier);
                  handleParamChange('param1', updatedVal);
                }}
                options={ZMK_KEYCODES}
                placeholder="Search for a key..."
                isListening={listeningField === 'param1'}
                onStartListening={() => setListeningField('param1')}
              />
            </div>
          </div>
        );
      }

      case '&mo':
      case '&to':
      case '&tog':
      case '&sl':
        return (
          <div className="form-group">
            <label className="form-label">Target Layer</label>
            <select
              className="form-input"
              value={param1}
              onChange={(e) => handleParamChange('param1', e.target.value)}
              style={{ cursor: 'pointer' }}
            >
              {layers.map(layer => (
                <option key={layer.id} value={layer.id}>
                  {layer.name} (layer {layer.id})
                </option>
              ))}
            </select>
          </div>
        );

      case '&sk':
        return (
          <div className="form-group">
            <label className="form-label">Modifier</label>
            <select
              className="form-input"
              value={param1}
              onChange={(e) => handleParamChange('param1', e.target.value)}
              style={{ cursor: 'pointer' }}
            >
              {MODIFIERS.filter(m => m.value !== 'none' && m.value.length > 2).map(mod => (
                <option key={mod.value} value={mod.value}>{mod.label}</option>
              ))}
            </select>
          </div>
        );

      case '&bt':
        return (
          <div className="form-group">
            <label className="form-label">Bluetooth Action</label>
            <select
              className="form-input"
              value={param1}
              onChange={(e) => handleParamChange('param1', e.target.value)}
              style={{ cursor: 'pointer' }}
            >
              {BT_COMMANDS.map(cmd => (
                <option key={cmd.value} value={cmd.value}>{cmd.label}</option>
              ))}
            </select>
          </div>
        );

      case '&rgb_ug':
        return (
          <div className="form-group">
            <label className="form-label">RGB Command</label>
            <select
              className="form-input"
              value={param1}
              onChange={(e) => handleParamChange('param1', e.target.value)}
              style={{ cursor: 'pointer' }}
            >
              {RGB_COMMANDS.map(cmd => (
                <option key={cmd.value} value={cmd.value}>{cmd.label}</option>
              ))}
            </select>
          </div>
        );

      case '&ext_power':
        return (
          <div className="form-group">
            <label className="form-label">External Power</label>
            <select
              className="form-input"
              value={param1}
              onChange={(e) => handleParamChange('param1', e.target.value)}
              style={{ cursor: 'pointer' }}
            >
              {EP_COMMANDS.map(cmd => (
                <option key={cmd.value} value={cmd.value}>{cmd.label}</option>
              ))}
            </select>
          </div>
        );

      case '&out':
        return (
          <div className="form-group">
            <label className="form-label">Output Action</label>
            <select
              className="form-input"
              value={param1}
              onChange={(e) => handleParamChange('param1', e.target.value)}
              style={{ cursor: 'pointer' }}
            >
              {OUT_COMMANDS.map(cmd => (
                <option key={cmd.value} value={cmd.value}>{cmd.label}</option>
              ))}
            </select>
          </div>
        );

      case '&lt':
        return (
          <div style={{ display: 'flex', gap: 12 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Layer (Hold)</label>
              <select
                className="form-input"
                value={param1}
                onChange={(e) => handleParamChange('param1', e.target.value)}
                style={{ cursor: 'pointer' }}
              >
                {layers.map(layer => (
                  <option key={layer.id} value={layer.id}>
                    {layer.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ flex: 1.5 }}>
              <label className="form-label">Key (Tap)</label>
              <SearchableSelect
                value={param2}
                onChange={(val) => handleParamChange('param2', val)}
                options={ZMK_KEYCODES}
                placeholder="Key..."
                isListening={listeningField === 'param2'}
                onStartListening={() => setListeningField('param2')}
              />
            </div>
          </div>
        );

      case '&mtl':
        return (
          <div style={{ display: 'flex', gap: 12 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Layer (Hold)</label>
              <select
                className="form-input"
                value={param1}
                onChange={(e) => handleParamChange('param1', e.target.value)}
                style={{ cursor: 'pointer' }}
              >
                {layers.map(layer => (
                  <option key={layer.id} value={layer.id}>
                    {layer.name} (layer {layer.id})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Layer (Tap)</label>
              <select
                className="form-input"
                value={param2}
                onChange={(e) => handleParamChange('param2', e.target.value)}
                style={{ cursor: 'pointer' }}
              >
                {layers.map(layer => (
                  <option key={layer.id} value={layer.id}>
                    {layer.name} (layer {layer.id})
                  </option>
                ))}
              </select>
            </div>
          </div>
        );

      case '&mt':
        return (
          <div style={{ display: 'flex', gap: 12 }}>
            <div className="form-group" style={{ flex: 1.2 }}>
              <label className="form-label">Mod (Hold)</label>
              <select
                className="form-input"
                value={param1}
                onChange={(e) => handleParamChange('param1', e.target.value)}
                style={{ cursor: 'pointer' }}
              >
                {MODIFIERS.filter(m => m.value !== 'none' && m.value.length > 2).map(mod => (
                  <option key={mod.value} value={mod.value}>{mod.value}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ flex: 1.5 }}>
              <label className="form-label">Key (Tap)</label>
              <SearchableSelect
                value={param2}
                onChange={(val) => handleParamChange('param2', val)}
                options={ZMK_KEYCODES}
                placeholder="Key..."
                isListening={listeningField === 'param2'}
                onStartListening={() => setListeningField('param2')}
              />
            </div>
          </div>
        );

      case '&ht': {
        const holdParam = parseKeyParam(param1);
        const tapParam = parseKeyParam(param2);
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Hold Mod</label>
                <select
                  className="form-input"
                  value={holdParam.modifier}
                  onChange={(e) => {
                    const updatedVal = stringifyKeyParam(holdParam.keycode, e.target.value);
                    handleParamChange('param1', updatedVal);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {MODIFIERS.map(mod => (
                    <option key={mod.value} value={mod.value}>{mod.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ flex: 1.5 }}>
                <label className="form-label">Hold Key</label>
                <SearchableSelect
                  value={holdParam.keycode}
                  onChange={(val) => {
                    const updatedVal = stringifyKeyParam(val, holdParam.modifier);
                    handleParamChange('param1', updatedVal);
                  }}
                  options={ZMK_KEYCODES}
                  placeholder="Hold key..."
                  isListening={listeningField === 'param1'}
                  onStartListening={() => setListeningField('param1')}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Tap Mod</label>
                <select
                  className="form-input"
                  value={tapParam.modifier}
                  onChange={(e) => {
                    const updatedVal = stringifyKeyParam(tapParam.keycode, e.target.value);
                    handleParamChange('param2', updatedVal);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {MODIFIERS.map(mod => (
                    <option key={mod.value} value={mod.value}>{mod.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ flex: 1.5 }}>
                <label className="form-label">Tap Key</label>
                <SearchableSelect
                  value={tapParam.keycode}
                  onChange={(val) => {
                    const updatedVal = stringifyKeyParam(val, tapParam.modifier);
                    handleParamChange('param2', updatedVal);
                  }}
                  options={ZMK_KEYCODES}
                  placeholder="Tap key..."
                  isListening={listeningField === 'param2'}
                  onStartListening={() => setListeningField('param2')}
                />
              </div>
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 24 }}>
      {/* Dynamic inline styles for pulsing capture effect */}
      <style>{`
        .pulsing-capture {
          animation: pulse-border 1.5s infinite;
          border-color: #f43f5e !important;
          box-shadow: 0 0 0 2px rgba(244, 63, 94, 0.4) !important;
        }
        @keyframes pulse-border {
          0% {
            opacity: 0.8;
          }
          50% {
            opacity: 0.3;
          }
          100% {
            opacity: 0.8;
          }
        }
        .mode-toggle-btn {
          background: none;
          border: none;
          color: var(--text-secondary);
          padding: 6px 12px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          border-radius: 6px;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.15s;
        }
        .mode-toggle-btn.active {
          background-color: var(--bg-tertiary);
          color: var(--text-primary);
          box-shadow: inset 0 1px 2px rgba(0,0,0,0.2);
        }
        .mode-toggle-btn:hover:not(.active) {
          color: var(--text-primary);
          background-color: rgba(255,255,255,0.03);
        }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Settings size={20} className="text-accent-primary" />
            Key #{selectedKey.index}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500, paddingLeft: 28 }}>
            Configuration on: {selectedLayerName}
          </div>
        </h2>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
          <X size={20} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-secondary)', marginBottom: 12, fontWeight: 600 }}>
            Information
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
            <div><span style={{ color: 'var(--text-secondary)' }}>Hand:</span> {selectedKey.hand === 'left' ? 'Left' : 'Right'}</div>
            <div><span style={{ color: 'var(--text-secondary)' }}>Finger:</span> {selectedKey.finger}</div>
          </div>
        </div>

        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-secondary)', marginBottom: 20, fontWeight: 600 }}>
          Assignments ({selectedLayerName})
        </div>

        <div style={{ marginBottom: 28, borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <label className="form-label" style={{ margin: 0, fontWeight: 600 }}>Key Binding</label>
            <div style={{ display: 'flex', backgroundColor: 'rgba(0, 0, 0, 0.2)', padding: 3, borderRadius: 8, border: '1px solid var(--border-color)' }}>
              <button
                type="button"
                className={`mode-toggle-btn ${!useRaw ? 'active' : ''}`}
                onClick={() => {
                  setUseRaw(false);
                  const parsed = parseZmkBinding(currentBindingStr);
                  if (parsed.behavior === 'custom') {
                    handleBehaviorChange('&kp');
                  }
                }}
              >
                <Sparkles size={12} className="text-accent-primary" />
                Wizard
              </button>
              <button
                type="button"
                className={`mode-toggle-btn ${useRaw ? 'active' : ''}`}
                onClick={() => setUseRaw(true)}
              >
                <Code size={12} />
                Manual
              </button>
            </div>
          </div>

          {useRaw ? (
            <div className="form-group">
              <input 
                type="text" 
                className="form-input" 
                value={currentBindingStr} 
                onChange={(e) => handleChange(e.target.value)}
                placeholder="e.g. &kp A, &mt LSHIFT A..."
              />
            </div>
          ) : (
            <div>
              <div className="form-group">
                <label className="form-label">Behavior</label>
                <select
                  className="form-input"
                  value={parsedBinding.behavior}
                  onChange={(e) => handleBehaviorChange(e.target.value)}
                  style={{ cursor: 'pointer' }}
                >
                  {BEHAVIORS.map(beh => (
                    <option key={beh.value} value={beh.value}>{beh.label}</option>
                  ))}
                </select>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6, display: 'flex', gap: 4, alignItems: 'center' }}>
                  {BEHAVIORS.find(b => b.value === parsedBinding.behavior)?.desc}
                </div>
              </div>

              {renderParameters(parsedBinding)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
