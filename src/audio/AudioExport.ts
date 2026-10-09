/**
 * LoDrum Maker - High Quality Audio Exporter (WAV 24-bit / 44.1kHz)
 * The Plugin Foundry
 * Uses OfflineAudioContext to render authentic log drum stems or one-shots
 */

import { SynthParameters, MacroParameters, SequencerPattern } from './types';

export class AudioExporter {
  /**
   * Generates a 24-bit PCM WAV File from an AudioBuffer
   */
  public static audioBufferToWav(buffer: AudioBuffer): Uint8Array {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 24;
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const numSamples = buffer.length;
    const dataSize = numSamples * blockAlign;
    const bufferSize = 44 + dataSize;

    const arrayBuffer = new ArrayBuffer(bufferSize);
    const view = new DataView(arrayBuffer);

    // RIFF chunk descriptor
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    this.writeString(view, 8, 'WAVE');

    // "fmt " sub-chunk
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
    view.setUint16(20, format, true); // AudioFormat
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);

    // "data" sub-chunk
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    // Write interleaved 24-bit PCM samples
    let offset = 44;
    const channels: Float32Array[] = [];
    for (let c = 0; c < numChannels; c++) {
      channels.push(buffer.getChannelData(c));
    }

    for (let i = 0; i < numSamples; i++) {
      for (let c = 0; c < numChannels; c++) {
        // Clamp sample to [-1, 1]
        let sample = Math.max(-1, Math.min(1, channels[c][i]));
        // Scale to 24-bit range (-8388608 to 8388607)
        let intSample = sample < 0 ? sample * 8388608 : sample * 8388607;
        intSample = Math.round(intSample);

        // Little-endian 3-byte write
        view.setUint8(offset, intSample & 0xff);
        view.setUint8(offset + 1, (intSample >> 8) & 0xff);
        view.setUint8(offset + 2, (intSample >> 16) & 0xff);
        offset += 3;
      }
    }

    return new Uint8Array(arrayBuffer);
  }

  private static writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  /**
   * Renders a one-shot sample or complete pattern using an OfflineAudioContext
   */
  public static async renderPatternToWav(
    pattern: SequencerPattern,
    params: SynthParameters,
    macros: MacroParameters,
    sampleRate: number = 44100
  ): Promise<Uint8Array> {
    const bpm = pattern.bpm || 113;
    const secondsPerBeat = 60 / bpm;
    const secondsPerStep = secondsPerBeat / 4;
    const swingFactor = (pattern.swing || 0) / 100;

    const patternDuration = pattern.length * secondsPerStep;
    const tailDuration = 1.5; // Natural decay tail
    const totalDuration = patternDuration + tailDuration;

    const offlineCtx = new OfflineAudioContext(2, Math.ceil(totalDuration * sampleRate), sampleRate);

    // Setup master gain & distortion curve
    const masterGain = offlineCtx.createGain();
    const db = params.masterGain || 0;
    masterGain.gain.setValueAtTime(Math.pow(10, db / 20) * (macros.output / 100), 0);
    masterGain.connect(offlineCtx.destination);

    // Precalculate waveshaper curve
    const n = 512;
    const curve = new Float32Array(n);
    const drive = (macros.drive / 100) * 0.8 + params.harmonicDrive * 0.4;
    const k = drive * 24 + 1;
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      curve[i] = Math.tanh(k * x) / Math.tanh(k);
    }

    let lastNote: number | null = null;
    let lastTime = 0;

    // Schedule active steps
    pattern.steps.forEach((step, stepIndex) => {
      if (!step.active) return;

      let startTime = stepIndex * secondsPerStep;
      if (stepIndex % 2 === 1 && swingFactor > 0) {
        startTime += secondsPerStep * swingFactor * 0.5;
      }

      const velNorm = Math.max(0.1, Math.min(1.0, (step.accent ? step.velocity * 1.25 : step.velocity) / 127));
      const velGain = 1.0 - params.velocitySensitivity + params.velocitySensitivity * velNorm;

      const baseFreq = 440 * Math.pow(2, (step.note + params.bodyPitch - 69) / 12);
      const shouldGlide = (step.slide || (params.polyphonyMode === 'legato' && (startTime - lastTime < 0.35))) && lastNote !== null;

      let startPitchFreq = baseFreq;
      if (shouldGlide && lastNote !== null) {
        startPitchFreq = 440 * Math.pow(2, (lastNote + params.bodyPitch - 69) / 12);
      } else {
        const dropSemitones = params.pitchDropAmount * (0.6 + 0.4 * velNorm);
        startPitchFreq = baseFreq * Math.pow(2, dropSemitones / 12);
      }

      // Voice master gain
      const voiceGain = offlineCtx.createGain();
      voiceGain.gain.setValueAtTime(0.0001, startTime);
      voiceGain.gain.linearRampToValueAtTime(velGain * 0.95, startTime + 0.003);

      // Filter & Shaper
      const filter = offlineCtx.createBiquadFilter();
      filter.type = params.filterType === 'bandpass' ? 'bandpass' : 'lowpass';
      filter.frequency.setValueAtTime(params.filterCutoff, startTime);
      filter.Q.setValueAtTime(params.filterResonance, startTime);

      const shaper = offlineCtx.createWaveShaper();
      shaper.curve = curve as unknown as Float32Array<ArrayBuffer>;

      // Body Oscillator
      const bodyOsc = offlineCtx.createOscillator();
      bodyOsc.type = params.bodyWaveform === 'triangle' ? 'triangle' : 'sine';
      bodyOsc.frequency.setValueAtTime(startPitchFreq, startTime);

      const dropDuration = shouldGlide ? params.glideTime : params.pitchDropTime;
      bodyOsc.frequency.exponentialRampToValueAtTime(Math.max(20, baseFreq), startTime + dropDuration);

      const bodyGain = offlineCtx.createGain();
      const decayDuration = params.bodyDecay * (0.7 + 0.3 * velNorm);
      bodyGain.gain.setValueAtTime(1.0, startTime);
      bodyGain.gain.setTargetAtTime(0.0001, startTime + 0.015, decayDuration * 0.35);

      bodyOsc.connect(bodyGain);

      // Sub Oscillator
      const subOsc = offlineCtx.createOscillator();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(startPitchFreq * 0.5, startTime);
      subOsc.frequency.exponentialRampToValueAtTime(Math.max(20, baseFreq * 0.5), startTime + dropDuration);

      const subGain = offlineCtx.createGain();
      subGain.gain.setValueAtTime(params.bodySubLevel, startTime);
      subGain.gain.setTargetAtTime(0.0001, startTime + 0.02, decayDuration * 0.4);

      subOsc.connect(subGain);

      // Transient Click
      const transOsc = offlineCtx.createOscillator();
      transOsc.type = 'triangle';
      transOsc.frequency.setValueAtTime(params.transientTone * 1.5, startTime);
      transOsc.frequency.exponentialRampToValueAtTime(Math.max(60, params.transientTone * 0.3), startTime + params.transientDecay);

      const transGain = offlineCtx.createGain();
      transGain.gain.setValueAtTime(params.transientLevel * velNorm, startTime);
      transGain.gain.exponentialRampToValueAtTime(0.0001, startTime + params.transientDecay);

      transOsc.connect(transGain);

      // Connect to bus
      bodyGain.connect(shaper);
      subGain.connect(shaper);
      transGain.connect(shaper);

      shaper.connect(filter);
      filter.connect(voiceGain);
      voiceGain.connect(masterGain);

      bodyOsc.start(startTime);
      subOsc.start(startTime);
      transOsc.start(startTime);

      const stopTime = startTime + decayDuration + params.bodyRelease + 0.1;
      bodyOsc.stop(stopTime);
      subOsc.stop(stopTime);
      transOsc.stop(startTime + 0.1);

      lastNote = step.note;
      lastTime = startTime;
    });

    const renderedBuffer = await offlineCtx.startRendering();
    return this.audioBufferToWav(renderedBuffer);
  }

  /**
   * Triggers client download of rendered audio
   */
  public static async downloadPatternWav(
    pattern: SequencerPattern,
    params: SynthParameters,
    macros: MacroParameters,
    filename?: string
  ) {
    const bytes = await this.renderPatternToWav(pattern, params, macros);
    const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `LoDrum_${pattern.name.replace(/\s+/g, '_')}_24bit.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
