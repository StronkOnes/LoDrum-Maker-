/**
 * LoDrum Maker - Preset Manager
 * The Plugin Foundry
 * Handles factory presets, user presets, LocalStorage persistence, and JSON import/export
 */

import { Preset } from '../audio/types';
import { FACTORY_PRESETS } from './factoryPresets';

const STORAGE_KEY = 'lodrum_maker_user_presets';

export class PresetManager {
  private static userPresets: Preset[] = [];

  public static getFactoryPresets(): Preset[] {
    return FACTORY_PRESETS;
  }

  public static getUserPresets(): Preset[] {
    if (this.userPresets.length === 0) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          this.userPresets = JSON.parse(saved);
        }
      } catch (e) {
        console.warn('Failed to load user presets from localStorage', e);
      }
    }
    return this.userPresets;
  }

  public static getAllPresets(): Preset[] {
    return [...this.getFactoryPresets(), ...this.getUserPresets()];
  }

  public static saveUserPreset(preset: Preset): void {
    const list = this.getUserPresets();
    const existingIndex = list.findIndex(p => p.id === preset.id);
    if (existingIndex >= 0) {
      list[existingIndex] = preset;
    } else {
      list.push(preset);
    }
    this.userPresets = list;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to save preset to localStorage', e);
    }
  }

  public static deleteUserPreset(presetId: string): void {
    const list = this.getUserPresets().filter(p => p.id !== presetId);
    this.userPresets = list;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to delete preset from localStorage', e);
    }
  }

  public static exportPresetAsJson(preset: Preset): void {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(preset, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `LoDrum_${preset.name.replace(/\s+/g, '_')}.lodrum`);
    dlAnchorElem.click();
  }

  public static importPresetFromJson(jsonString: string): Preset | null {
    try {
      const parsed = JSON.parse(jsonString) as Preset;
      if (parsed.macros && parsed.synth && parsed.name) {
        parsed.id = `user_${Date.now()}`;
        this.saveUserPreset(parsed);
        return parsed;
      }
    } catch (e) {
      console.error('Invalid preset JSON', e);
    }
    return null;
  }
}
