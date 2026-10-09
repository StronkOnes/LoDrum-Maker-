/**
 * LoDrum Maker - Core DSP Synthesis Engine
 * The Plugin Foundry | Original Log Drum Instrument & Pattern Creator
 */

import { AudioContextManager } from './AudioContextManager';
import { SynthParameters, MacroParameters } from './types';

export interface ActiveVoice {
  id: string;
  note: number;
  startTime: number;
  oscillators: OscillatorNode[];
  gains: GainNode[];
  filters: BiquadFilterNode[];
  shapers: WaveShaperNode[];
  sourceNodes: AudioNode[];
  currentFreq: number;
  targetFreq: number;
}

export class LoDrumEngine {
  private static instance: LoDrumEngine | null = null;
  private audioMgr: AudioContextManager;
  private activeVoices: Map<string, ActiveVoice> = new Map();
  private lastPlayedNote: number | null = null;
  private lastNoteTime: number = 0;

  // Active parameter state
  private params: SynthParameters = {
    bodyPitch: 0,
    bodyWaveform: 'sine',
    bodyDecay: 0.65,
    bodyRelease: 0.15,
    bodySubLevel: 0.45,
    pitchDropAmount: 24,
    pitchDropTime: 0.085,
    pitchDropCurve: 'punchy',
    transientLevel: 0.60,
    transientDecay: 0.025,
    transientTone: 1400,
    transientNoiseLevel: 0.35,
    harmonicDrive: 0.30,
    harmonicColor: 'warm',
    harmonicOddEven: 0.2,
    filterCutoff: 3800,
    filterResonance: 2.2,
    filterType: 'lowpass',
    glideTime: 0.04,
    polyphonyMode: 'legato',
    velocitySensitivity: 0.75,
    masterGain: 0,
    softLimiter: true
  };

  private macros: MacroParameters = {
    weight: 55,
    knock: 60,
    drop: 50,
    decay: 45,
    growl: 35,
    bite: 50,
    drive: 30,
    slide: 40,
    tone: 60,
    output: 80
  };

  // Distortion curve cache
  private distortionCurve: Float32Array = new Float32Array(512);

  private constructor() {
    this.audioMgr = AudioContextManager.getInstance();
    this.updateDistortionCurve();
  }

  public static getInstance(): LoDrumEngine {
    if (!LoDrumEngine.instance) {
      LoDrumEngine.instance = new LoDrumEngine();
    }
    return LoDrumEngine.instance;
  }

  public getParameters(): SynthParameters {
    return { ...this.params };
  }

  public getMacros(): MacroParameters {
    return { ...this.macros };
  }

  public setParameter<K extends keyof SynthParameters>(key: K, value: SynthParameters[K]) {
    this.params[key] = value;
    if (key === 'harmonicDrive' || key === 'harmonicColor' || key === 'harmonicOddEven') {
      this.updateDistortionCurve();
    }
    if (key === 'masterGain') {
      const db = this.params.masterGain;
      const linear = Math.pow(10, db / 20) * (this.macros.output / 100);
      this.audioMgr.setMasterVolume(linear);
    }
  }

  public setMacro(key: keyof MacroParameters, value: number) {
    this.macros[key] = Math.max(0, Math.min(100, value));
    this.applyMacroMapping(key);
  }

  public setAllMacros(newMacros: MacroParameters) {
    this.macros = { ...newMacros };
    (Object.keys(newMacros) as (keyof MacroParameters)[]).forEach(k => {
      this.applyMacroMapping(k);
    });
  }

  /**
   * Translates Macro controls into underlying DSP parameter changes
   */
  private applyMacroMapping(key: keyof MacroParameters) {
    const norm = this.macros[key] / 100;

    switch (key) {
      case 'weight':
        // Boosts sub oscillator level and gives deeper body
        this.params.bodySubLevel = 0.15 + norm * 0.75;
        break;
      case 'knock':
        // Increases transient level and punch
        this.params.transientLevel = 0.1 + norm * 0.85;
        this.params.transientDecay = 0.008 + norm * 0.045;
        break;
      case 'drop':
        // Controls pitch-drop amount (from 4 semitones up to 42 semitones) and duration
        this.params.pitchDropAmount = Math.round(6 + norm * 36);
        this.params.pitchDropTime = 0.02 + norm * 0.18;
        break;
      case 'decay':
        // Amplitude decay duration
        this.params.bodyDecay = 0.15 + Math.pow(norm, 1.6) * 1.85;
        break;
      case 'growl':
        // Upper harmonic saturation and drive
        this.params.harmonicDrive = norm * 0.85;
        this.params.filterResonance = 1.0 + norm * 4.5;
        this.updateDistortionCurve();
        break;
      case 'bite':
        // Transient frequency attack definition & tone
        this.params.transientTone = 600 + norm * 3800;
        this.params.transientNoiseLevel = 0.15 + norm * 0.65;
        break;
      case 'drive':
        // Nonlinear waveshaper drive
        this.updateDistortionCurve();
        break;
      case 'slide':
        // Glide / portamento time (0 to 180ms)
        this.params.glideTime = norm * 0.18;
        break;
      case 'tone':
        // Filter cutoff
        this.params.filterCutoff = 400 + Math.pow(norm, 2) * 12000;
        break;
      case 'output':
        // Master gain
        const db = -24 + norm * 30; // -24dB to +6dB
        const linear = Math.pow(10, db / 20);
        this.audioMgr.setMasterVolume(linear);
        break;
    }
  }

  private updateDistortionCurve() {
    const n = 512;
    const curve = new Float32Array(n);
    const drive = (this.macros.drive / 100) * 0.8 + this.params.harmonicDrive * 0.4;
    const k = drive * 24 + 1;
    const oddEven = this.params.harmonicOddEven;

    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      let y = 0;
      if (this.params.harmonicColor === 'warm') {
        // Soft tanh tube-like saturation with even harmonic asymmetry
        const asym = x + 0.15 * oddEven * (x * x - 1);
        y = Math.tanh(k * asym) / Math.tanh(k);
      } else if (this.params.harmonicColor === 'growl') {
        // Aggressive foldback distortion
        const driven = x * k * 0.6;
        y = Math.sin(driven * Math.PI * 0.5);
      } else if (this.params.harmonicColor === 'crunch') {
        // Harder clipping with polynomial edge
        const z = x * k * 0.7;
        y = Math.max(-1, Math.min(1, z * (1.2 - 0.2 * z * z)));
      } else {
        // Standard soft-knee saturation
        y = (Math.PI + k) * x / (Math.PI + k * Math.abs(x));
      }
      curve[i] = y;
    }
    this.distortionCurve = curve;
  }

  /**
   * Converts MIDI note number to frequency in Hz
   */
  public midiToFreq(note: number): number {
    return 440 * Math.pow(2, (note - 69) / 12);
  }

  /**
   * Triggers a log drum note
   * @param note MIDI note number (e.g. 36 = C1, 48 = C2)
   * @param velocity MIDI velocity (1 - 127)
   * @param isSlide Flag indicating whether this hit slides from previous note
   */
  public triggerNote(note: number, velocity: number = 100, isSlide: boolean = false): string {
    const ctx = this.audioMgr.getContext();
    const now = ctx.currentTime;
    
    // Scale velocity
    const velNorm = Math.max(0.1, Math.min(1.0, velocity / 127));
    const velSens = this.params.velocitySensitivity;
    const velGain = 1.0 - velSens + velSens * velNorm;

    // Handle polyphony / legato
    if (this.params.polyphonyMode === 'mono' || this.params.polyphonyMode === 'legato') {
      this.allNotesOff(false); // fast fade of previous voices
    }

    const voiceId = `voice_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const baseFreq = this.midiToFreq(note + this.params.bodyPitch);

    // Calculate pitch slide / drop
    let startPitchFreq = baseFreq;
    const shouldGlide = (isSlide || (this.params.polyphonyMode === 'legato' && (now - this.lastNoteTime < 0.35))) && this.lastPlayedNote !== null;
    
    if (shouldGlide && this.lastPlayedNote !== null) {
      const prevFreq = this.midiToFreq(this.lastPlayedNote + this.params.bodyPitch);
      startPitchFreq = prevFreq;
    } else {
      // Apply pitch drop
      const dropSemitones = this.params.pitchDropAmount * (0.6 + 0.4 * velNorm);
      startPitchFreq = baseFreq * Math.pow(2, dropSemitones / 12);
    }

    // 1. Master Voice Bus
    const voiceMasterGain = ctx.createGain();
    voiceMasterGain.gain.setValueAtTime(0.0001, now);
    // Instant attack with 2ms anti-click ramp
    voiceMasterGain.gain.linearRampToValueAtTime(velGain * 0.95, now + 0.003);

    // 2. Filter & Saturation Chain
    const filter = ctx.createBiquadFilter();
    filter.type = this.params.filterType === 'bandpass' ? 'bandpass' : 'lowpass';
    filter.frequency.setValueAtTime(this.params.filterCutoff, now);
    filter.Q.setValueAtTime(this.params.filterResonance, now);

    const waveshaper = ctx.createWaveShaper();
    waveshaper.curve = this.distortionCurve as unknown as Float32Array<ArrayBuffer>;
    waveshaper.oversample = '2x';

    // 3. Tuned Body Oscillator
    const bodyOsc = ctx.createOscillator();
    bodyOsc.type = this.params.bodyWaveform === 'triangle' ? 'triangle' : 'sine';
    
    // Schedule Pitch Envelope
    bodyOsc.frequency.setValueAtTime(startPitchFreq, now);
    const dropDuration = shouldGlide ? this.params.glideTime : this.params.pitchDropTime;
    
    if (this.params.pitchDropCurve === 'punchy') {
      // Two-stage drop: rapid initial punch drop (30%), then settling tail
      const midFreq = baseFreq + (startPitchFreq - baseFreq) * 0.25;
      const punchTime = dropDuration * 0.35;
      bodyOsc.frequency.exponentialRampToValueAtTime(Math.max(20, midFreq), now + punchTime);
      bodyOsc.frequency.exponentialRampToValueAtTime(Math.max(20, baseFreq), now + dropDuration);
    } else if (this.params.pitchDropCurve === 'exponential') {
      bodyOsc.frequency.exponentialRampToValueAtTime(Math.max(20, baseFreq), now + dropDuration);
    } else {
      bodyOsc.frequency.linearRampToValueAtTime(baseFreq, now + dropDuration);
    }

    // Body Amplitude Envelope
    const bodyGain = ctx.createGain();
    const decayDuration = this.params.bodyDecay * (0.7 + 0.3 * velNorm);
    bodyGain.gain.setValueAtTime(1.0, now);
    // Exponential decay towards zero
    bodyGain.gain.setTargetAtTime(0.0001, now + 0.015, decayDuration * 0.35);

    bodyOsc.connect(bodyGain);

    // 4. Sub-Harmonic Fundamental Reinforcement
    const subOsc = ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(startPitchFreq * 0.5, now);
    subOsc.frequency.exponentialRampToValueAtTime(Math.max(20, baseFreq * 0.5), now + dropDuration);

    const subGain = ctx.createGain();
    const subLevel = this.params.bodySubLevel;
    subGain.gain.setValueAtTime(subLevel, now);
    subGain.gain.setTargetAtTime(0.0001, now + 0.02, decayDuration * 0.4);

    subOsc.connect(subGain);

    // 5. Transient Attack Generator (Click / Knock / Slap)
    const transientGain = ctx.createGain();
    const transientOsc = ctx.createOscillator();
    transientOsc.type = 'triangle';
    const transientTone = this.params.transientTone;
    transientOsc.frequency.setValueAtTime(transientTone * 1.5, now);
    transientOsc.frequency.exponentialRampToValueAtTime(Math.max(60, transientTone * 0.3), now + this.params.transientDecay);

    const transientAmp = ctx.createGain();
    const transientLevel = this.params.transientLevel * velNorm;
    transientAmp.gain.setValueAtTime(transientLevel, now);
    transientAmp.gain.exponentialRampToValueAtTime(0.0001, now + this.params.transientDecay);

    transientOsc.connect(transientAmp);
    transientAmp.connect(transientGain);

    // Optional transient noise burst for wooden slap
    let noiseSource: AudioNode | null = null;
    if (this.params.transientNoiseLevel > 0.05) {
      const bufferSize = Math.floor(ctx.sampleRate * 0.04);
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
      }
      const noiseNode = ctx.createBufferSource();
      noiseNode.buffer = noiseBuffer;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(transientTone * 1.2, now);
      noiseFilter.Q.setValueAtTime(1.8, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(this.params.transientNoiseLevel * velNorm * 0.8, now);

      noiseNode.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(transientGain);

      noiseNode.start(now);
      noiseNode.stop(now + 0.04);
      noiseSource = noiseNode;
    }

    // Connect sources through waveshaper and filter
    bodyGain.connect(waveshaper);
    subGain.connect(waveshaper);
    transientGain.connect(waveshaper);

    waveshaper.connect(filter);
    filter.connect(voiceMasterGain);
    voiceMasterGain.connect(this.audioMgr.getMasterInput());

    // Start oscillators
    bodyOsc.start(now);
    subOsc.start(now);
    transientOsc.start(now);

    const totalDuration = Math.max(0.2, decayDuration + this.params.bodyRelease);
    bodyOsc.stop(now + totalDuration + 0.05);
    subOsc.stop(now + totalDuration + 0.05);
    transientOsc.stop(now + 0.1);

    const voice: ActiveVoice = {
      id: voiceId,
      note,
      startTime: now,
      oscillators: [bodyOsc, subOsc, transientOsc],
      gains: [voiceMasterGain, bodyGain, subGain, transientGain],
      filters: [filter],
      shapers: [waveshaper],
      sourceNodes: noiseSource ? [noiseSource] : [],
      currentFreq: startPitchFreq,
      targetFreq: baseFreq
    };

    this.activeVoices.set(voiceId, voice);
    this.lastPlayedNote = note;
    this.lastNoteTime = now;

    // Auto-cleanup voice
    setTimeout(() => {
      this.activeVoices.delete(voiceId);
    }, (totalDuration + 0.15) * 1000);

    return voiceId;
  }

  /**
   * Releases note or terminates active voices gracefully
   */
  public releaseNote(note: number) {
    const ctx = this.audioMgr.getContext();
    const now = ctx.currentTime;
    const releaseTime = Math.max(0.02, this.params.bodyRelease);

    this.activeVoices.forEach((voice) => {
      if (voice.note === note) {
        voice.gains.forEach((g) => {
          try {
            g.gain.cancelScheduledValues(now);
            g.gain.setTargetAtTime(0.0001, now, releaseTime * 0.4);
          } catch (_) {}
        });
        setTimeout(() => {
          this.activeVoices.delete(voice.id);
        }, releaseTime * 1000 + 50);
      }
    });
  }

  /**
   * All Notes Off - Emergency or stop command
   */
  public allNotesOff(instant: boolean = false) {
    const ctx = this.audioMgr.getContext();
    const now = ctx.currentTime;
    const fade = instant ? 0.005 : 0.03;

    this.activeVoices.forEach((voice) => {
      voice.gains.forEach((g) => {
        try {
          g.gain.cancelScheduledValues(now);
          g.gain.setTargetAtTime(0.0001, now, fade);
        } catch (_) {}
      });
      setTimeout(() => {
        voice.oscillators.forEach(osc => {
          try { osc.stop(); } catch (_) {}
        });
      }, fade * 1000 + 20);
    });
    this.activeVoices.clear();
  }
}
