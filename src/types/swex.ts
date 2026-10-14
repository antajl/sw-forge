// src/types/swex.ts - SWEX JSON type definitions
// Based on SWEX export format and demo.json structure

/**
 * Main SWEX JSON structure from game export
 */
export interface SwexJson {
  command: string;
  ret_code: number;
  wizard_info: WizardInfo;
  unit_list?: Unit[];
  runes?: Rune[];
  rune_list?: Rune[];
  building_list?: Building[];
}

export interface WizardInfo {
  wizard_id: number;
  wizard_name: string;
  wizard_mana: number;
  wizard_crystal: number;
  wizard_crystal_paid: number;
  wizard_last_login: string;
  wizard_last_country: string;
  wizard_last_lang: string;
  wizard_level: number;
  experience: number;
  wizard_energy: number;
  energy_max: number;
  energy_per_min: number;
  next_energy_gain: number;
  arena_energy: number;
  arena_energy_max: number;
  arena_energy_next_gain: number;
  ameria_luck_energy: number;
  ameria_luck_energy_max: number;
  ameria_luck_energy_next_refill_ts: number;
  unit_slots: UnitSlots;
  rep_unit_id: number;
  rep_assigned: number;
  guild_rep_unit_id: number;
  [key: string]: any; // Additional wizard fields
}

export interface UnitSlots {
  number: number;
}

export interface Unit {
  unit_id: number;
  wizard_id: number;
  island_id: number;
  pos_x: number;
  pos_y: number;
  building_id: number;
  unit_master_id: number;
  unit_level: number;
  class: number;
  con: number;
  atk: number;
  def: number;
  spd: number;
  resist: number;
  accuracy: number;
  critical_rate: number;
  critical_damage: number;
  experience: number;
  exp_gained: number;
  exp_gain_rate: number;
  skills: [number, number][];
  runes?: Rune[];
  [key: string]: any; // Additional unit fields
}

export interface Rune {
  rune_id: number;
  wizard_id: number;
  occupied_type: number;
  occupied_id: number;
  slot_no: number;
  rank: number;
  class: number;
  set_id: number;
  upgrade_limit: number;
  upgrade_curr: number;
  base_value: number;
  sell_value: number;
  pri_eff: [number, number];
  prefix_eff: [number, number];
  sec_eff: [number, number, number, number][];
  [key: string]: any; // Additional rune fields
}

export interface Building {
  building_id: number;
  wizard_id: number;
  island_id: number;
  pos_x: number;
  pos_y: number;
  building_master_id: number;
  [key: string]: any; // Additional building fields
}