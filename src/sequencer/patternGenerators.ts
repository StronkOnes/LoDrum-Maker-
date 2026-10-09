/**
 * LoDrum Maker - Algorithmic Pattern Generator
 * The Plugin Foundry | Original Log Drum Instrument & Pattern Creator
 * Generates authentic, editable rhythmic phrases with musical nuance
 */

import { SequencerPattern, SequencerStep } from '../audio/types';
import { quantizeToScale, noteNameToMidi } from './scales';

export type GenreStyle = 
  | 'amapiano_bounce' 
  | 'gqom_bass' 
  | 'deep_log' 
  | 'dark_pulse' 
  | 'rolling_phrase' 
  | 'minimal_groove' 
  | 'experimental_bounce';

export interface GenerationOptions {
  length: number;           // 16 or 32
  bpm: number;
  swing: number;
  density: number;          // 0 - 100
  complexity: number;       // 0 - 100
  accentStrength: number;   // 0 - 100
  rootNote: string;         // 'C', 'F', etc.
  scale: string;            // 'minor_pentatonic', 'phrygian', etc.
  baseOctave: number;       // 1 or 2
}

export class PatternGenerator {
  /**
   * Generates a musically authentic log drum pattern based on genre rules
   */
  public static generate(style: GenreStyle, options: GenerationOptions): SequencerPattern {
    const steps: SequencerStep[] = [];
    const rootMidi = noteNameToMidi(`${options.rootNote}${options.baseOctave}`);

    // Initialize blank steps
    for (let i = 0; i < options.length; i++) {
      steps.push({
        active: false,
        note: rootMidi,
        velocity: 95,
        accent: false,
        slide: false,
        probability: 1.0
      });
    }

    switch (style) {
      case 'amapiano_bounce':
        this.generateAmapianoBounce(steps, rootMidi, options);
        break;
      case 'gqom_bass':
        this.generateGqomBass(steps, rootMidi, options);
        break;
      case 'deep_log':
        this.generateDeepLog(steps, rootMidi, options);
        break;
      case 'dark_pulse':
        this.generateDarkPulse(steps, rootMidi, options);
        break;
      case 'rolling_phrase':
        this.generateRollingPhrase(steps, rootMidi, options);
        break;
      case 'minimal_groove':
        this.generateMinimalGroove(steps, rootMidi, options);
        break;
      case 'experimental_bounce':
        this.generateExperimentalBounce(steps, rootMidi, options);
        break;
    }

    const styleNames: Record<GenreStyle, string> = {
      amapiano_bounce: 'Amapiano Bounce',
      gqom_bass: 'Gqom Percussive Bass',
      deep_log: 'Deep Log Drum',
      dark_pulse: 'Dark Club Pulse',
      rolling_phrase: 'Rolling Phrase',
      minimal_groove: 'Minimal Groove',
      experimental_bounce: 'Experimental Bounce'
    };

    return {
      id: `pat_${Date.now()}`,
      name: `${styleNames[style]} (${options.rootNote})`,
      length: options.length,
      bpm: options.bpm,
      swing: options.swing,
      scaleRoot: options.rootNote,
      scaleType: options.scale,
      steps
    };
  }

  /**
   * Classic Amapiano syncopation: 3-3-2 rhythmic displacement, ghost notes, and slides
   */
  private static generateAmapianoBounce(steps: SequencerStep[], rootMidi: number, opt: GenerationOptions) {
    // 3-3-2 foundational accents on 16-step grid: Step 0, 3, 6, 10, 12, 14
    const coreHits = [0, 3, 6, 8, 11, 14];
    const ghostHits = [2, 5, 9, 12, 15];

    coreHits.forEach(idx => {
      if (idx < steps.length) {
        steps[idx].active = true;
        steps[idx].velocity = idx === 0 || idx === 6 || idx === 11 ? 118 : 100;
        steps[idx].accent = idx === 0 || idx === 11;
        steps[idx].note = quantizeToScale(rootMidi, opt.rootNote, opt.scale);
      }
    });

    // Pitch movement & slides based on complexity
    if (opt.complexity > 30) {
      // Step 6 drops a 4th or 5th down
      if (steps[6]) {
        steps[6].note = quantizeToScale(rootMidi - 5, opt.rootNote, opt.scale);
      }
      // Step 11 leaps up an octave or minor 7th
      if (steps[11]) {
        steps[11].note = quantizeToScale(rootMidi + (opt.complexity > 60 ? 10 : 7), opt.rootNote, opt.scale);
        steps[11].slide = true;
      }
      if (steps[14]) {
        steps[14].note = quantizeToScale(rootMidi + 3, opt.rootNote, opt.scale);
      }
    }

    // Ghost notes based on density
    if (opt.density > 45) {
      ghostHits.forEach(idx => {
        if (idx < steps.length && Math.random() < (opt.density / 100) * 0.75) {
          steps[idx].active = true;
          steps[idx].velocity = 68; // Softer ghost hit
          steps[idx].accent = false;
          steps[idx].note = quantizeToScale(rootMidi, opt.rootNote, opt.scale);
        }
      });
    }

    // Duplicate pattern for 32 steps with subtle turnaround variation
    if (steps.length === 32) {
      for (let i = 0; i < 16; i++) {
        steps[i + 16] = { ...steps[i] };
      }
      // Turnaround in step 28-31
      steps[28].active = true;
      steps[28].note = quantizeToScale(rootMidi + 5, opt.rootNote, opt.scale);
      steps[29].active = true;
      steps[29].velocity = 85;
      steps[30].active = true;
      steps[30].slide = true;
      steps[30].note = quantizeToScale(rootMidi + 7, opt.rootNote, opt.scale);
    }
  }

  /**
   * Gqom driving percussive bass: hard-hitting quarter/eighth notes with syncopated triplets
   */
  private static generateGqomBass(steps: SequencerStep[], rootMidi: number, opt: GenerationOptions) {
    const hits = [0, 2, 4, 6, 7, 10, 12, 13, 14];

    hits.forEach(idx => {
      if (idx < steps.length) {
        steps[idx].active = true;
        steps[idx].velocity = idx % 4 === 0 ? 122 : 105;
        steps[idx].accent = idx === 0 || idx === 7 || idx === 12;
        steps[idx].note = quantizeToScale(rootMidi, opt.rootNote, opt.scale);
      }
    });

    // Dark Gqom minor second or diminished fifth dissonance
    if (opt.complexity > 35) {
      if (steps[7]) {
        steps[7].note = quantizeToScale(rootMidi + 1, opt.rootNote, opt.scale); // Semitone tension
        steps[7].slide = true;
      }
      if (steps[13]) {
        steps[13].note = quantizeToScale(rootMidi + 6, opt.rootNote, opt.scale); // Tritone slam
      }
    }

    if (steps.length === 32) {
      for (let i = 0; i < 16; i++) {
        steps[i + 16] = { ...steps[i] };
      }
      // Machine gun double-time burst at the end of bar 2
      steps[30].active = true;
      steps[30].velocity = 120;
      steps[31].active = true;
      steps[31].velocity = 125;
      steps[31].accent = true;
    }
  }

  /**
   * Deep Log Drum: Sparse, earth-rumbling sub hits with long decay space
   */
  private static generateDeepLog(steps: SequencerStep[], rootMidi: number, opt: GenerationOptions) {
    const sparseHits = [0, 6, 10, 14];
    sparseHits.forEach(idx => {
      if (idx < steps.length) {
        steps[idx].active = true;
        steps[idx].velocity = 115;
        steps[idx].accent = true;
        steps[idx].note = quantizeToScale(rootMidi, opt.rootNote, opt.scale);
      }
    });

    if (steps[6]) {
      steps[6].note = quantizeToScale(rootMidi - 5, opt.rootNote, opt.scale);
    }
    if (steps[10]) {
      steps[10].slide = true;
      steps[10].note = quantizeToScale(rootMidi + 3, opt.rootNote, opt.scale);
    }

    if (steps.length === 32) {
      for (let i = 0; i < 16; i++) {
        steps[i + 16] = { ...steps[i] };
      }
      steps[26].active = true;
      steps[26].note = quantizeToScale(rootMidi - 7, opt.rootNote, opt.scale);
    }
  }

  /**
   * Dark Club Pulse: Relentless driving rhythm
   */
  private static generateDarkPulse(steps: SequencerStep[], rootMidi: number, opt: GenerationOptions) {
    for (let i = 0; i < steps.length; i += 2) {
      steps[i].active = true;
      steps[i].velocity = i % 4 === 0 ? 120 : 92;
      steps[i].accent = i % 8 === 0;
      steps[i].note = quantizeToScale(rootMidi, opt.rootNote, opt.scale);
    }

    if (opt.complexity > 40) {
      if (steps[6]) steps[6].slide = true;
      if (steps[14]) {
        steps[14].note = quantizeToScale(rootMidi + 5, opt.rootNote, opt.scale);
        steps[14].slide = true;
      }
    }
  }

  /**
   * Rolling Phrase: Continuous tumbling log rolls
   */
  private static generateRollingPhrase(steps: SequencerStep[], rootMidi: number, opt: GenerationOptions) {
    const rollPattern = [0, 1, 2, 4, 6, 8, 9, 10, 12, 14, 15];
    rollPattern.forEach(idx => {
      if (idx < steps.length) {
        steps[idx].active = true;
        steps[idx].velocity = idx % 4 === 0 ? 116 : 88;
        steps[idx].note = quantizeToScale(rootMidi + (idx % 3 === 0 ? 0 : 3), opt.rootNote, opt.scale);
        if (idx === 8 || idx === 14) steps[idx].slide = true;
      }
    });
  }

  /**
   * Minimal Groove: Stripped-back pocket groove
   */
  private static generateMinimalGroove(steps: SequencerStep[], rootMidi: number, opt: GenerationOptions) {
    const minHits = [0, 4, 9, 12];
    minHits.forEach(idx => {
      if (idx < steps.length) {
        steps[idx].active = true;
        steps[idx].velocity = idx === 0 ? 115 : 98;
        steps[idx].accent = idx === 0 || idx === 9;
        steps[idx].note = quantizeToScale(rootMidi, opt.rootNote, opt.scale);
      }
    });
  }

  /**
   * Experimental Bounce: Polyrhythmic jumps and wide intervals
   */
  private static generateExperimentalBounce(steps: SequencerStep[], rootMidi: number, opt: GenerationOptions) {
    const expHits = [0, 3, 5, 8, 11, 13, 14];
    const intervals = [0, 7, 12, -5, 3, 10, -7];

    expHits.forEach((idx, i) => {
      if (idx < steps.length) {
        steps[idx].active = true;
        steps[idx].velocity = 85 + Math.floor(Math.random() * 40);
        steps[idx].accent = i % 2 === 0;
        steps[idx].slide = i % 3 === 0;
        steps[idx].note = quantizeToScale(rootMidi + intervals[i % intervals.length], opt.rootNote, opt.scale);
      }
    });
  }
}
