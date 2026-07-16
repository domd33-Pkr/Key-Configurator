export interface ZmkBinding {
  behavior: string;
  param1?: string;
  param2?: string;
  customValue?: string;
}

export const getZmkBindingString = (binding?: { tap?: string; hold?: string }): string => {
  if (!binding) return '&trans';
  const tap = (binding.tap || '').trim();
  const hold = (binding.hold || '').trim();

  if (!tap && !hold) {
    return '&trans';
  }

  // If tap already starts with '&', it is a full ZMK binding stored in the tap field
  if (tap.startsWith('&')) {
    return tap;
  }

  // If hold is set, and it doesn't start with '&', this is a legacy hold-tap (mod-tap or layer-tap)
  if (hold && !hold.startsWith('&')) {
    // Check if hold is a number (meaning it's a layer-tap)
    if (/^\d+$/.test(hold)) {
      return `&lt ${hold} ${tap}`;
    }
    // Check if hold is a standard modifier
    const mod = hold === 'S' || hold === 'LSHIFT' ? 'LSHIFT' : hold;
    return `&mt ${mod} ${tap}`;
  }

  // If only tap is set and it doesn't start with '&'
  if (tap) {
    if (tap === '<LAYER>' || tap === 'LAYER') {
      return `&mo 1`;
    }
    return `&kp ${tap}`;
  }

  // If only hold is set (unlikely, but fallback)
  if (hold) {
    if (hold.startsWith('&')) return hold;
    return `&kp ${hold}`;
  }

  return '&trans';
};

export const parseZmkBinding = (value: string): ZmkBinding => {
  if (!value) {
    return { behavior: '&none' };
  }
  
  const trimmed = value.trim();
  
  if (!trimmed.startsWith('&')) {
    if (trimmed === '<LAYER>') {
      return { behavior: '&mo', param1: '1' };
    }
    return { behavior: '&kp', param1: trimmed };
  }

  const parts = trimmed.split(/\s+/);
  const behavior = parts[0];

  switch (behavior) {
    case '&kp':
      return { behavior, param1: parts.slice(1).join(' ') };
    case '&mo':
    case '&to':
    case '&tog':
    case '&sl':
      return { behavior, param1: parts[1] || '0' };
    case '&trans':
    case '&none':
      return { behavior };
    case '&sk':
      return { behavior, param1: parts[1] || 'LSHIFT' };
    case '&kt':
      return { behavior, param1: parts[1] || '' };
    case '&bt':
      return { behavior, param1: parts.slice(1).join(' ') };
    case '&rgb_ug':
      return { behavior, param1: parts.slice(1).join(' ') };
    case '&ext_power':
      return { behavior, param1: parts[1] || 'EP_TOG' };
    case '&out':
      return { behavior, param1: parts[1] || 'OUT_TOG' };
    case '&lt':
      return { behavior, param1: parts[1] || '0', param2: parts.slice(2).join(' ') };
    case '&mtl':
      return { behavior, param1: parts[1] || '0', param2: parts[2] || '0' };
    case '&mt':
      return { behavior, param1: parts[1] || 'LSHIFT', param2: parts.slice(2).join(' ') };
    case '&ht':
      return { behavior, param1: parts[1] || 'ESC', param2: parts.slice(2).join(' ') };
    default:
      return { behavior: 'custom', customValue: trimmed };
  }
};

export const stringifyZmkBinding = (binding: ZmkBinding): string => {
  const { behavior, param1, param2, customValue } = binding;
  if (behavior === 'custom') {
    return customValue || '';
  }
  if (behavior === '&trans' || behavior === '&none') {
    return behavior;
  }
  if (behavior === '&lt' || behavior === '&mt' || behavior === '&ht' || behavior === '&mtl') {
    return `${behavior} ${param1 || ''} ${param2 || ''}`.trim();
  }
  return `${behavior} ${param1 || ''}`.trim();
};

export const parseKeyParam = (param: string): { keycode: string; modifier: string } => {
  const trimmed = (param || '').trim();
  if (!trimmed) {
    return { keycode: '', modifier: 'none' };
  }

  const match = trimmed.match(/^([A-Z0-9_]+)\((.*)\)$/);
  if (match) {
    let mod = match[1];
    if (mod === 'LSHIFT' || mod === 'LSFT') mod = 'LS';
    if (mod === 'RSHIFT' || mod === 'RSFT') mod = 'RS';
    if (mod === 'LCTRL' || mod === 'LCTL') mod = 'LC';
    if (mod === 'RCTRL' || mod === 'RCTL') mod = 'RC';
    if (mod === 'LALT') mod = 'LA';
    if (mod === 'RALT') mod = 'RA';
    if (mod === 'LGUI') mod = 'LG';
    if (mod === 'RGUI') mod = 'RG';
    return {
      keycode: match[2],
      modifier: mod
    };
  }

  return {
    keycode: trimmed,
    modifier: 'none'
  };
};

export const stringifyKeyParam = (keycode: string, modifier: string): string => {
  const k = (keycode || '').trim();
  let m = (modifier || 'none').trim();
  
  if (!k) return '';
  if (m === 'none' || !m) {
    return k;
  }
  if (m === 'LSHIFT' || m === 'LSFT') m = 'LS';
  if (m === 'RSHIFT' || m === 'RSFT') m = 'RS';
  if (m === 'LCTRL' || m === 'LCTL') m = 'LC';
  if (m === 'RCTRL' || m === 'RCTL') m = 'RC';
  if (m === 'LALT') m = 'LA';
  if (m === 'RALT') m = 'RA';
  if (m === 'LGUI') m = 'LG';
  if (m === 'RGUI') m = 'RG';
  return `${m}(${k})`;
};

export const parseBindingForDisplay = (bindingStr: string, layers?: {id: number; name: string}[]): { tap: string; hold: string } => {
  if (!bindingStr) {
    return { tap: '', hold: '' };
  }
  const parts = bindingStr.trim().split(/\s+/);
  const behavior = parts[0];

  const getLayerDisplay = (layerIdStr: string, prefix: string = '') => {
    const id = parseInt(layerIdStr || '0', 10);
    if (layers && layers.length > 0) {
      const layer = layers.find(l => l.id === id);
      if (layer && layer.name) {
        // If the layer is named "Layer X", just show LX, otherwise show the name
        if (layer.name.match(/^Layer\s*\d+$/i)) {
          return `${prefix}L${id}`;
        }
        return layer.name;
      }
    }
    return `${prefix}L${id}`;
  };

  let tap = '';
  let hold = '';

  switch (behavior) {
    case '&kp':
      tap = parts.slice(1).join(' ');
      break;
    case '&mo':
    case '&to':
    case '&tog':
    case '&sl':
      tap = getLayerDisplay(parts[1], '');
      break;
    case '&trans':
      tap = '▽';
      break;
    case '&none':
      tap = '·';
      break;
    case '&mt': {
      hold = parts[1] || '';
      tap = parts.slice(2).join(' ') || '';
      break;
    }
    case '&lt': {
      hold = getLayerDisplay(parts[1], '');
      tap = parts.slice(2).join(' ') || '';
      break;
    }
    case '&mtl': {
      hold = getLayerDisplay(parts[1], '');
      tap = getLayerDisplay(parts[2], 'S');
      break;
    }
    case '&ht': {
      hold = parts[1] || '';
      tap = parts.slice(2).join(' ') || '';
      break;
    }
    default:
      tap = bindingStr;
  }

  const clean = (val: string) => {
    const trimmed = val.trim();
    const match = trimmed.match(/^(?:RSFT|LSFT|RS|LS|LSHIFT|RSHIFT)\((.*)\)$/i);
    if (match) {
      const inner = match[1].trim();
      const cleanInner = inner.replace(/(KP_)?NUMBER_/g, '');
      const shiftMap: Record<string, string> = {
        '1': '!',
        '2': '@',
        '3': '#',
        '4': '$',
        '5': '%',
        '6': '^',
        '7': '&',
        '8': '*',
        '9': '(',
        '0': ')',
        'MINUS': '_',
        'EQUAL': '+',
        'GRAVE': '~',
        'LBKT': '{',
        'RBKT': '}',
        'BSLH': '|',
        'SEMI': ':',
        'SQT': '"',
        'COMMA': '<',
        'DOT': '>',
        'FSLH': '?',
        'SLASH': '?',
      };
      return shiftMap[cleanInner] || cleanInner;
    }
    const cleanedVal = trimmed.replace(/(KP_)?NUMBER_/g, '');
    const symbolMap: Record<string, string> = {
      'MINUS': '-',
      'EQUAL': '=',
      'GRAVE': '`',
      'LBKT': '[',
      'RBKT': ']',
      'BSLH': '\\',
      'SEMI': ';',
      'SQT': '\'',
      'COMMA': ',',
      'DOT': '.',
      'FSLH': '/',
      'SLASH': '/',
      'DELTA': 'Δ',
      'OHM': 'Ω',
      'DEGREE': '°',
    };
    return symbolMap[cleanedVal] || cleanedVal;
  };

  return { tap: clean(tap), hold: clean(hold) };
};
