/**
 * LoDrum Maker - Types & Parameter Specifications
 * The Plugin Foundry | Original Log Drum Instrument & Pattern Creator
 */

export interface SynthParameters {
  // Body Oscillator
  bodyPitch: number;         // Root pitch offset / fine-tune in semitones (-12 to +12)
  bodyWaveform: 'sine' | 'triangle' | 'harmonics' | 'hybrid'; // Waveform type
  bodyDecay: number;         // Amplitude decay time in seconds (0.05 to 3.0)
  bodyRelease: number;       // Release time in seconds (0.01 to 1.5)
  bodySubLevel: number;      // Sub-harmonic fundamental weight (0.0 to 1.0)
  
  // Pitch-Drop Engine
  pitchDropAmount: number;   // Semitones to drop from (0 to 48 semitones)
  pitchDropTime: number;     // Drop duration in seconds (0.01 to 0.40)
  pitchDropCurve: 'fast' | 'exponential' | 'linear' | 'punchy'; // Curve shape
  
  // Transient Generator (Knock / Click)
  transientLevel: number;    // Transient volume (0.0 to 1.0)
  transientDecay: number;    // Transient decay in seconds (0.002 to 0.08)
  transientTone: number;     // Transient frequency/tone (100Hz to 6000Hz)
  transientNoiseLevel: number;// Noise / slap component (0.0 to 1.0)
  
  // Harmonic Generator
  harmonicDrive: number;     // Saturation / Upper harmonics intensity (0.0 to 1.0)
  harmonicColor: 'warm' | 'metallic' | 'growl' | 'crunch'; // Saturation algorithm
  harmonicOddEven: number;   // Balance between even (warm tube) & odd (buzz/punch) harmonics (-1 to +1)
  
  // Filter Section
  filterCutoff: number;      // Filter cutoff frequency in Hz (80 to 18000)
  filterResonance: number;   // Resonance Q factor (0.5 to 12.0)
  filterType: 'lowpass' | 'bandpass' | 'highcut'; // Filter mode
  
  // Performance & Glide
  glideTime: number;         // Portamento / slide time in seconds (0.0 to 0.3)
  polyphonyMode: 'mono' | 'legato' | 'poly'; // Voice allocation
  velocitySensitivity: number; // Velocity sensitivity (0.0 to 1.0)
  
  // Master Output
  masterGain: number;        // Output gain in dB (-24 to +6)
  softLimiter: boolean;      // Soft saturation ceiling limiter
}

export interface MacroParameters {
  weight: number;   // 0 - 100: Low-frequency foundation & sub body
  knock: number;    // 0 - 100: Attack and transient percussive impact
  drop: number;     // 0 - 100: Pitch drop depth and speed
  decay: number;    // 0 - 100: Overall sound duration
  growl: number;    // 0 - 100: Harmonic density and grit
  bite: number;     // 0 - 100: Upper-mid definition and attack tone
  drive: number;    // 0 - 100: Distortion and saturation warmth
  slide: number;    // 0 - 100: Glide / portamento time
  tone: number;     // 0 - 100: Spectral tilt and filter brightness
  output: number;   // 0 - 100: Master output volume
}

export interface SequencerStep {
  active: boolean;          // Is note triggered on this step
  note: number;             // MIDI note number (e.g. 36 = C1, 48 = C2)
  velocity: number;         // Velocity 1 - 127
  accent: boolean;          // High-accent hit
  slide: boolean;           // Glide to next note
  probability: number;      // 0.0 to 1.0 triggering probability
}

export interface SequencerPattern {
  id: string;
  name: string;
  length: number;           // 16 or 32 steps
  bpm: number;              // 60 - 180 BPM
  swing: number;            // 0 - 75%
  scaleRoot: string;        // 'C', 'C#', 'D', etc.
  scaleType: string;        // 'minor', 'phrygian', 'pentatonic', 'dorian', 'chromatic'
  steps: SequencerStep[];
}

export interface Preset {
  id: string;
  name: string;
  category: 'Amapiano' | 'Gqom' | 'Sub' | 'Distorted' | 'Percussive' | 'Experimental';
  description: string;
  macros: MacroParameters;
  synth: SynthParameters;
  defaultPattern?: SequencerPattern;
}

export type ActiveTab = 'sound' | 'pattern' | 'perform';
