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
    if (mod === 'LSHIFT') mod = 'LSFT';
    if (mod === 'LCTRL') mod = 'LCTL';
    if (mod === 'RSHIFT') mod = 'RSFT';
    if (mod === 'RCTRL') mod = 'RCTL';
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
  const m = (modifier || 'none').trim();
  
  if (!k) return '';
  if (m === 'none' || !m) {
    return k;
  }
  return `${m}(${k})`;
};

export const parseBindingForDisplay = (bindingStr: string): { tap: string; hold: string } => {
  if (!bindingStr) {
    return { tap: '', hold: '' };
  }
  const parts = bindingStr.trim().split(/\s+/);
  const behavior = parts[0];

  switch (behavior) {
    case '&kp':
      return { tap: parts.slice(1).join(' '), hold: '' };
    case '&mo':
    case '&to':
    case '&tog':
    case '&sl':
      return { tap: `L${parts[1] || '0'}`, hold: '' };
    case '&trans':
      return { tap: '▽', hold: '' };
    case '&none':
      return { tap: '·', hold: '' };
    case '&mt': {
      const holdMod = parts[1] || '';
      const tapKey = parts.slice(2).join(' ') || '';
      return { tap: tapKey, hold: holdMod };
    }
    case '&lt': {
      const holdLayer = `L${parts[1] || '0'}`;
      const tapKey = parts.slice(2).join(' ') || '';
      return { tap: tapKey, hold: holdLayer };
    }
    case '&mtl': {
      const holdLayer = `L${parts[1] || '0'}`;
      const tapLayer = `SL${parts[2] || '0'}`;
      return { tap: tapLayer, hold: holdLayer };
    }
    case '&ht': {
      const holdArg = parts[1] || '';
      const tapArg = parts.slice(2).join(' ') || '';
      return { tap: tapArg, hold: holdArg };
    }
    default:
      return { tap: bindingStr, hold: '' };
  }
};
