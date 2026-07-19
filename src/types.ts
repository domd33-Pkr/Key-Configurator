export interface KeySlotMap {
  base_tap?: string;
  base_hold?: string;
  layer_tap?: string;
  layer_hold?: string;
}

export interface LayerConfig {
  id: number;
  name: string;
}

export interface NamedLayer {
  id: string;
  name: string;
}

export interface KeyLayerBinding {
  tap?: string;
  hold?: string;
}

export interface KeyConfig {
  index: number;
  row: number;
  col: number;
  hand: "left" | "right";
  finger: "thumb" | "index" | "middle" | "ring" | "pinky";
  is_layer_key: boolean;
  slots?: KeySlotMap; // For old layouts compatibility
  bindings?: Record<string, KeyLayerBinding>;
}

export interface KeyboardLayoutData {
  keys: KeyConfig[];
  layers?: LayerConfig[];
  namedLayers?: NamedLayer[];
  layerMapping?: string[];
  char_to_key_slot?: Record<string, [number, string]>;
  layer_key_index?: number;
  lockedSlots?: string[];
}
