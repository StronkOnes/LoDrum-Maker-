/**
 * LoDrum Maker - Standard MIDI File (.mid) Exporter
 * The Plugin Foundry
 * Generates spec-compliant Type 0 Standard MIDI Files (SMF)
 */

import { SequencerPattern } from './types';

export class MidiExporter {
  private static TICKS_PER_BEAT = 480;

  /**
   * Encodes a number as a variable-length quantity (VLQ)
   */
  private static encodeVLQ(value: number): number[] {
    const bytes: number[] = [];
    let buffer = value & 0x7f;

    while ((value >>= 7) > 0) {
      buffer <<= 8;
      buffer |= (value & 0x7f) | 0x80;
    }

    while (true) {
      bytes.push(buffer & 0xff);
      if (buffer & 0x80) {
        buffer >>= 8;
      } else {
        break;
      }
    }
    return bytes;
  }

  /**
   * Converts string to byte array
   */
  private static stringToBytes(str: string): number[] {
    const bytes: number[] = [];
    for (let i = 0; i < str.length; i++) {
      bytes.push(str.charCodeAt(i) & 0xff);
    }
    return bytes;
  }

  /**
   * Generates a Standard MIDI File (.mid) ArrayBuffer from a SequencerPattern
   */
  public static generateMidiFile(pattern: SequencerPattern): Uint8Array {
    const ticksPerStep = Math.round(this.TICKS_PER_BEAT / 4); // 16th notes (120 ticks)
    const bpm = Math.max(40, Math.min(240, pattern.bpm || 113));
    const microsecsPerBeat = Math.round(60000000 / bpm);

    const trackEvents: number[] = [];

    // Track Name Event: FF 03 len text
    const trackName = pattern.name || 'LoDrum Log Drum Pattern';
    const nameBytes = this.stringToBytes(trackName);
    trackEvents.push(0x00, 0xff, 0x03, nameBytes.length, ...nameBytes);

    // Set Tempo Event: FF 51 03 tt tt tt
    trackEvents.push(
      0x00, 0xff, 0x51, 0x03,
      (microsecsPerBeat >> 16) & 0xff,
      (microsecsPerBeat >> 8) & 0xff,
      microsecsPerBeat & 0xff
    );

    // Time Signature: FF 58 04 04 02 18 08 (4/4 time)
    trackEvents.push(0x00, 0xff, 0x58, 0x04, 0x04, 0x02, 0x18, 0x08);

    // Collect all note events in order with absolute ticks
    interface ScheduledMidiNote {
      tick: number;
      isNoteOn: boolean;
      note: number;
      velocity: number;
    }

    const scheduledNotes: ScheduledMidiNote[] = [];
    const swingFactor = (pattern.swing || 0) / 100;

    pattern.steps.forEach((step, index) => {
      if (!step.active) return;

      // Calculate timing with swing for odd 16th steps
      let stepTick = index * ticksPerStep;
      if (index % 2 === 1 && swingFactor > 0) {
        stepTick += Math.round(ticksPerStep * swingFactor * 0.5);
      }

      const noteDuration = step.slide 
        ? Math.round(ticksPerStep * 1.05) // Legato overlap
        : Math.round(ticksPerStep * 0.85); // Staccato / punch

      const velocity = step.accent 
        ? Math.min(127, Math.round(step.velocity * 1.25)) 
        : step.velocity;

      scheduledNotes.push({
        tick: stepTick,
        isNoteOn: true,
        note: step.note,
        velocity: Math.max(1, Math.min(127, velocity))
      });

      scheduledNotes.push({
        tick: stepTick + noteDuration,
        isNoteOn: false,
        note: step.note,
        velocity: 0
      });
    });

    // Sort all events chronologically
    scheduledNotes.sort((a, b) => {
      if (a.tick !== b.tick) return a.tick - b.tick;
      return a.isNoteOn ? 1 : -1; // Note-offs before note-ons at same tick
    });

    let currentTick = 0;
    for (const event of scheduledNotes) {
      const deltaTicks = Math.max(0, event.tick - currentTick);
      currentTick = event.tick;

      const vlqDelta = this.encodeVLQ(deltaTicks);
      trackEvents.push(...vlqDelta);

      if (event.isNoteOn) {
        trackEvents.push(0x90, event.note & 0x7f, event.velocity & 0x7f);
      } else {
        trackEvents.push(0x80, event.note & 0x7f, 0x00);
      }
    }

    // End of Track Event: FF 2F 00 with delta to end of loop
    const patternEndTick = pattern.length * ticksPerStep;
    const endDelta = Math.max(0, patternEndTick - currentTick);
    trackEvents.push(...this.encodeVLQ(endDelta), 0xff, 0x2f, 0x00);

    // Build MThd Header Chunk
    // 4D 54 68 64 (MThd) + length 00 00 00 06 + format 00 00 + ntracks 00 01 + division
    const headerChunk: number[] = [
      0x4d, 0x54, 0x68, 0x64, // 'MThd'
      0x00, 0x00, 0x00, 0x06, // Chunk size: 6 bytes
      0x00, 0x00,             // Format 0 (single multi-channel track)
      0x00, 0x01,             // 1 track
      (this.TICKS_PER_BEAT >> 8) & 0xff,
      this.TICKS_PER_BEAT & 0xff
    ];

    // Build MTrk Track Chunk
    // 4D 54 72 6B (MTrk) + 4 bytes length + events
    const trackChunkSize = trackEvents.length;
    const trackHeader: number[] = [
      0x4d, 0x54, 0x72, 0x6b, // 'MTrk'
      (trackChunkSize >> 24) & 0xff,
      (trackChunkSize >> 16) & 0xff,
      (trackChunkSize >> 8) & 0xff,
      trackChunkSize & 0xff
    ];

    const totalBytes = new Uint8Array(headerChunk.length + trackHeader.length + trackEvents.length);
    totalBytes.set(headerChunk, 0);
    totalBytes.set(trackHeader, headerChunk.length);
    totalBytes.set(trackEvents, headerChunk.length + trackHeader.length);

    return totalBytes;
  }

  /**
   * Triggers client download of the generated .mid file
   */
  public static downloadPatternMidi(pattern: SequencerPattern, filename?: string) {
    const bytes = this.generateMidiFile(pattern);
    const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'audio/midi' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `LoDrum_${pattern.name.replace(/\s+/g, '_')}_${pattern.bpm}BPM.mid`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
