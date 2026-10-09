/**
 * LoDrum Maker - Web MIDI Controller Integration
 * The Plugin Foundry
 * Allows hardware MIDI keyboards to trigger the log drum engine with velocity
 */

import { LoDrumEngine } from './LoDrumEngine';

export interface MidiDevice {
  id: string;
  name: string;
  manufacturer: string;
  state: string;
}

export class WebMidiManager {
  private static instance: WebMidiManager | null = null;
  private engine: LoDrumEngine;
  private isSupported: boolean = false;
  private access: any = null;
  private connectedDevices: MidiDevice[] = [];
  private listeners: ((devices: MidiDevice[]) => void)[] = [];
  private activityListeners: ((note: number, vel: number) => void)[] = [];

  private constructor() {
    this.engine = LoDrumEngine.getInstance();
    this.isSupported = typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator;
  }

  public static getInstance(): WebMidiManager {
    if (!WebMidiManager.instance) {
      WebMidiManager.instance = new WebMidiManager();
    }
    return WebMidiManager.instance;
  }

  public async init(): Promise<boolean> {
    if (!this.isSupported) return false;

    try {
      this.access = await (navigator as any).requestMIDIAccess({ sysex: false });
      this.updateDevices();

      this.access.onstatechange = () => {
        this.updateDevices();
      };

      return true;
    } catch (err) {
      console.warn('Web MIDI permission denied or unavailable:', err);
      return false;
    }
  }

  private updateDevices() {
    if (!this.access) return;

    const list: MidiDevice[] = [];
    const inputs = this.access.inputs.values();

    for (const input of inputs) {
      list.push({
        id: input.id,
        name: input.name || 'Generic MIDI Device',
        manufacturer: input.manufacturer || 'Unknown',
        state: input.state
      });

      input.onmidimessage = (event: any) => this.handleMidiMessage(event);
    }

    this.connectedDevices = list;
    this.listeners.forEach((cb) => cb(list));
  }

  private handleMidiMessage(event: any) {
    const data = event.data;
    if (!data || data.length < 2) return;

    const status = data[0] & 0xf0;
    const note = data[1];
    const velocity = data.length > 2 ? data[2] : 0;

    if (status === 0x90 && velocity > 0) {
      // Note On
      this.engine.triggerNote(note, velocity);
      this.activityListeners.forEach(cb => cb(note, velocity));
    } else if (status === 0x80 || (status === 0x90 && velocity === 0)) {
      // Note Off
      this.engine.releaseNote(note);
    }
  }

  public onDeviceListChange(cb: (devices: MidiDevice[]) => void) {
    this.listeners.push(cb);
    cb(this.connectedDevices);
  }

  public onMidiActivity(cb: (note: number, vel: number) => void) {
    this.activityListeners.push(cb);
  }

  public getDevices(): MidiDevice[] {
    return this.connectedDevices;
  }

  public isMidiAvailable(): boolean {
    return this.isSupported;
  }
}
