export interface KeySlotMap {
  base_tap?: string;
  base_hold?: string;
  layer_tap?: string;
  layer_hold?: string;
}

export interface KeyConfig {
  index: number;
  row: number;
  col: number;
  hand: "left" | "right";
  finger: "thumb" | "index" | "middle" | "ring" | "pinky";
  is_layer_key: boolean;
  slots: KeySlotMap;
}

export interface KeyboardLayoutData {
  keys: KeyConfig[];
  char_to_key_slot: Record<string, [number, string]>;
  layer_key_index: number;
  lockedSlots: string[];
}
