/**
 * LoDrum Maker - High Precision Sequencer Engine
 * The Plugin Foundry
 * Uses Web Audio API clock lookahead scheduling for jitter-free real-time playback
 */

import { AudioContextManager } from '../audio/AudioContextManager';
import { LoDrumEngine } from '../audio/LoDrumEngine';
import { SequencerPattern, SequencerStep } from '../audio/types';

export class SequencerEngine {
  private static instance: SequencerEngine | null = null;
  private audioMgr: AudioContextManager;
  private synthEngine: LoDrumEngine;

  private isPlaying: boolean = false;
  private currentStep: number = 0;
  private nextStepTime: number = 0;
  private timerId: number | null = null;

  // Lookahead settings in seconds
  private readonly lookahead: number = 0.025; // Check every 25ms
  private readonly scheduleAheadTime: number = 0.100; // Schedule 100ms ahead

  // Active pattern
  private pattern: SequencerPattern;

  // Step listeners for UI synchronization
  private stepListeners: ((step: number) => void)[] = [];
  private playStateListeners: ((isPlaying: boolean) => void)[] = [];

  private constructor() {
    this.audioMgr = AudioContextManager.getInstance();
    this.synthEngine = LoDrumEngine.getInstance();

    // Default 16-step Amapiano pattern
    const defaultSteps: SequencerStep[] = Array.from({ length: 16 }, (_, i) => ({
      active: [0, 3, 6, 8, 11, 14].includes(i),
      note: 36, // C1
      velocity: i === 0 || i === 11 ? 118 : 95,
      accent: i === 0 || i === 11,
      slide: i === 11,
      probability: 1.0
    }));

    this.pattern = {
      id: 'default_amapiano',
      name: 'Amapiano Bounce',
      length: 16,
      bpm: 113,
      swing: 32,
      scaleRoot: 'C',
      scaleType: 'minor_pentatonic',
      steps: defaultSteps
    };
  }

  public static getInstance(): SequencerEngine {
    if (!SequencerEngine.instance) {
      SequencerEngine.instance = new SequencerEngine();
    }
    return SequencerEngine.instance;
  }

  public getPattern(): SequencerPattern {
    return this.pattern;
  }

  public setPattern(pat: SequencerPattern) {
    this.pattern = pat;
  }

  public updateStep(index: number, partialStep: Partial<SequencerStep>) {
    if (this.pattern.steps[index]) {
      this.pattern.steps[index] = { ...this.pattern.steps[index], ...partialStep };
    }
  }

  public setBpm(bpm: number) {
    this.pattern.bpm = Math.max(40, Math.min(220, bpm));
  }

  public setSwing(swing: number) {
    this.pattern.swing = Math.max(0, Math.min(75, swing));
  }

  public setPatternLength(len: number) {
    const targetLen = len === 32 ? 32 : 16;
    if (this.pattern.length === targetLen) return;

    this.pattern.length = targetLen;
    if (targetLen === 32 && this.pattern.steps.length < 32) {
      // Duplicate first 16 steps into bar 2
      const newSteps: SequencerStep[] = [...this.pattern.steps];
      for (let i = 0; i < 16; i++) {
        newSteps.push({ ...this.pattern.steps[i % this.pattern.steps.length] });
      }
      this.pattern.steps = newSteps;
    } else if (targetLen === 16 && this.pattern.steps.length > 16) {
      this.pattern.steps = this.pattern.steps.slice(0, 16);
    }
  }

  public async play() {
    if (this.isPlaying) return;
    await this.audioMgr.unlock();
    const ctx = this.audioMgr.getContext();

    this.isPlaying = true;
    this.currentStep = 0;
    this.nextStepTime = ctx.currentTime + 0.05;

    this.notifyPlayState(true);
    this.scheduler();
  }

  public pause() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.synthEngine.allNotesOff(false);
    this.notifyPlayState(false);
  }

  public stop() {
    this.pause();
    this.currentStep = 0;
    this.notifyStep(0);
  }

  private scheduler = () => {
    if (!this.isPlaying) return;
    const ctx = this.audioMgr.getContext();

    while (this.nextStepTime < ctx.currentTime + this.scheduleAheadTime) {
      this.scheduleStep(this.currentStep, this.nextStepTime);
      this.advanceStep();
    }

    this.timerId = window.setTimeout(this.scheduler, this.lookahead * 1000);
  };

  private scheduleStep(stepIndex: number, time: number) {
    const step = this.pattern.steps[stepIndex];
    if (!step) return;

    // UI sync
    const ctx = this.audioMgr.getContext();
    const delayMs = Math.max(0, (time - ctx.currentTime) * 1000);
    setTimeout(() => {
      if (this.isPlaying) {
        this.notifyStep(stepIndex);
      }
    }, delayMs);

    if (step.active) {
      // Check probability
      if (step.probability < 1.0 && Math.random() > step.probability) {
        return;
      }

      const velocity = step.accent 
        ? Math.min(127, Math.round(step.velocity * 1.25)) 
        : step.velocity;

      this.synthEngine.triggerNote(step.note, velocity, step.slide);
    }
  }

  private advanceStep() {
    const secondsPerBeat = 60.0 / this.pattern.bpm;
    const baseStepDuration = secondsPerBeat / 4.0; // 16th note

    let stepDuration = baseStepDuration;

    // Apply swing on odd steps (16th swing)
    const swingFactor = (this.pattern.swing / 100) * 0.5;
    if (this.currentStep % 2 === 0) {
      stepDuration = baseStepDuration * (1.0 + swingFactor);
    } else {
      stepDuration = baseStepDuration * (1.0 - swingFactor);
    }

    this.nextStepTime += stepDuration;
    this.currentStep = (this.currentStep + 1) % this.pattern.length;
  }

  public onStep(cb: (step: number) => void) {
    this.stepListeners.push(cb);
  }

  public onPlayStateChange(cb: (isPlaying: boolean) => void) {
    this.playStateListeners.push(cb);
  }

  private notifyStep(step: number) {
    this.stepListeners.forEach(cb => cb(step));
  }

  private notifyPlayState(isPlaying: boolean) {
    this.playStateListeners.forEach(cb => cb(isPlaying));
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}
