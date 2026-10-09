/**
 * LoDrum Maker - Audio Context & Visualizer Manager
 * The Plugin Foundry
 */

export class AudioContextManager {
  private static instance: AudioContextManager | null = null;
  private ctx: AudioContext | null = null;
  private masterGainNode: GainNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private isUnlocked = false;

  private constructor() {}

  public static getInstance(): AudioContextManager {
    if (!AudioContextManager.instance) {
      AudioContextManager.instance = new AudioContextManager();
    }
    return AudioContextManager.instance;
  }

  public getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx({ latencyHint: 'interactive' });
      this.setupMasterNodes();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private setupMasterNodes() {
    if (!this.ctx) return;
    
    this.masterGainNode = this.ctx.createGain();
    this.masterGainNode.gain.setValueAtTime(0.85, this.ctx.currentTime);
    
    this.analyserNode = this.ctx.createAnalyser();
    this.analyserNode.fftSize = 1024;
    this.analyserNode.smoothingTimeConstant = 0.8;

    this.masterGainNode.connect(this.analyserNode);
    this.analyserNode.connect(this.ctx.destination);
  }

  public getMasterInput(): GainNode {
    this.getContext();
    return this.masterGainNode!;
  }

  public getAnalyser(): AnalyserNode {
    this.getContext();
    return this.analyserNode!;
  }

  public async unlock(): Promise<boolean> {
    const ctx = this.getContext();
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
        this.isUnlocked = true;
      } catch (err) {
        console.warn('Audio unlock waiting for gesture', err);
        return false;
      }
    } else {
      this.isUnlocked = true;
    }
    return this.isUnlocked;
  }

  public setMasterVolume(val: number) {
    if (this.masterGainNode && this.ctx) {
      // val is linear 0.0 to 1.5
      const targetGain = Math.max(0, Math.min(val, 2.0));
      this.masterGainNode.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.02);
    }
  }

  public getSampleRate(): number {
    return this.ctx ? this.ctx.sampleRate : 44100;
  }
}
