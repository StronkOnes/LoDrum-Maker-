/**
 * LoDrum Maker - Mode A: Deep Sound Design Workstation
 * The Plugin Foundry | Hybrid Log Drum Synthesis Architecture
 */

import React from 'react';
import { Knob } from './Knob';
import { SynthParameters } from '../audio/types';

interface SoundDesignPanelProps {
  params: SynthParameters;
  onParamChange: <K extends keyof SynthParameters>(key: K, val: SynthParameters[K]) => void;
}

export const SoundDesignPanel: React.FC<SoundDesignPanelProps> = ({ params, onParamChange }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* 1. Tuned Body Oscillator */}
      <div className="bg-[#11131a] border border-[#212532] rounded-xl p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#1c202b]">
            <h3 className="text-xs font-bold tracking-wider uppercase text-amber-500">
              1. Tuned Body Oscillator
            </h3>
            <span className="text-[10px] text-neutral-400 font-mono">Pitched Foundation</span>
          </div>

          {/* Waveform Selector */}
          <div className="mb-4">
            <label className="text-[10px] font-medium text-neutral-400 uppercase tracking-wide block mb-1.5">
              Body Waveform
            </label>
            <div className="grid grid-cols-4 gap-1 p-1 bg-[#0c0e14] rounded-lg border border-[#1e222e]">
              {(['sine', 'triangle', 'harmonics', 'hybrid'] as const).map((wf) => (
                <button
                  key={wf}
                  onClick={() => onParamChange('bodyWaveform', wf)}
                  className={`py-1 text-[11px] font-medium rounded transition-colors capitalize ${
                    params.bodyWaveform === wf
                      ? 'bg-amber-500 text-neutral-950 font-semibold shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {wf}
                </button>
              ))}
            </div>
          </div>

          {/* Knobs */}
          <div className="grid grid-cols-3 gap-2 justify-items-center">
            <Knob
              label="Tune"
              value={params.bodyPitch}
              min={-12}
              max={12}
              defaultValue={0}
              unit="st"
              color="amber"
              onChange={(v) => onParamChange('bodyPitch', v)}
            />
            <Knob
              label="Sub Level"
              value={Math.round(params.bodySubLevel * 100)}
              defaultValue={45}
              unit="%"
              color="amber"
              onChange={(v) => onParamChange('bodySubLevel', v / 100)}
            />
            <Knob
              label="Body Decay"
              value={params.bodyDecay}
              min={0.05}
              max={2.5}
              step={0.01}
              defaultValue={0.65}
              unit="s"
              color="amber"
              onChange={(v) => onParamChange('bodyDecay', v)}
            />
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-[#1c202b] flex items-center justify-between text-[11px] text-neutral-400">
          <span>Release Time</span>
          <span className="font-mono text-neutral-200">{Math.round(params.bodyRelease * 1000)}ms</span>
        </div>
      </div>

      {/* 2. Pitch-Drop Engine */}
      <div className="bg-[#11131a] border border-[#212532] rounded-xl p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#1c202b]">
            <h3 className="text-xs font-bold tracking-wider uppercase text-amber-500">
              2. Pitch-Drop Engine
            </h3>
            <span className="text-[10px] text-neutral-400 font-mono">Characteristic Descent</span>
          </div>

          {/* Curve Selector */}
          <div className="mb-4">
            <label className="text-[10px] font-medium text-neutral-400 uppercase tracking-wide block mb-1.5">
              Descent Curve
            </label>
            <div className="grid grid-cols-4 gap-1 p-1 bg-[#0c0e14] rounded-lg border border-[#1e222e]">
              {(['punchy', 'exponential', 'fast', 'linear'] as const).map((curve) => (
                <button
                  key={curve}
                  onClick={() => onParamChange('pitchDropCurve', curve)}
                  className={`py-1 text-[11px] font-medium rounded transition-colors capitalize ${
                    params.pitchDropCurve === curve
                      ? 'bg-amber-500 text-neutral-950 font-semibold shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {curve}
                </button>
              ))}
            </div>
          </div>

          {/* Knobs */}
          <div className="grid grid-cols-2 gap-4 justify-items-center">
            <Knob
              label="Drop Amount"
              value={params.pitchDropAmount}
              min={0}
              max={48}
              defaultValue={24}
              unit="st"
              color="amber"
              onChange={(v) => onParamChange('pitchDropAmount', v)}
            />
            <Knob
              label="Drop Speed"
              value={Math.round(params.pitchDropTime * 1000)}
              min={10}
              max={400}
              defaultValue={85}
              unit="ms"
              color="amber"
              onChange={(v) => onParamChange('pitchDropTime', v / 1000)}
            />
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-[#1c202b] flex items-center justify-between text-[11px] text-neutral-400">
          <span>Downward Range</span>
          <span className="font-mono text-neutral-200">+{params.pitchDropAmount} Semitones</span>
        </div>
      </div>

      {/* 3. Transient Generator */}
      <div className="bg-[#11131a] border border-[#212532] rounded-xl p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#1c202b]">
            <h3 className="text-xs font-bold tracking-wider uppercase text-amber-500">
              3. Transient Knock & Attack
            </h3>
            <span className="text-[10px] text-neutral-400 font-mono">Slap / Click Layer</span>
          </div>

          <div className="grid grid-cols-3 gap-2 justify-items-center mb-3">
            <Knob
              label="Knock Vol"
              value={Math.round(params.transientLevel * 100)}
              defaultValue={60}
              unit="%"
              color="amber"
              onChange={(v) => onParamChange('transientLevel', v / 100)}
            />
            <Knob
              label="Click Decay"
              value={Math.round(params.transientDecay * 1000)}
              min={2}
              max={80}
              defaultValue={25}
              unit="ms"
              color="amber"
              onChange={(v) => onParamChange('transientDecay', v / 1000)}
            />
            <Knob
              label="Tone Freq"
              value={params.transientTone}
              min={200}
              max={5000}
              step={50}
              defaultValue={1400}
              unit="Hz"
              color="amber"
              onChange={(v) => onParamChange('transientTone', v)}
            />
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-[#1c202b] flex items-center justify-between">
          <span className="text-[11px] text-neutral-400">Acoustic Wood Slap</span>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(params.transientNoiseLevel * 100)}
              onChange={(e) => onParamChange('transientNoiseLevel', Number(e.target.value) / 100)}
              className="w-20 accent-amber-500 h-1.5 bg-[#0c0e14] rounded-lg cursor-pointer"
            />
            <span className="text-[10px] font-mono text-neutral-200">
              {Math.round(params.transientNoiseLevel * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* 4. Harmonic Generator & Saturation */}
      <div className="bg-[#11131a] border border-[#212532] rounded-xl p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#1c202b]">
            <h3 className="text-xs font-bold tracking-wider uppercase text-amber-500">
              4. Harmonic Saturation
            </h3>
            <span className="text-[10px] text-neutral-400 font-mono">Waveshaper & Color</span>
          </div>

          <div className="mb-4">
            <label className="text-[10px] font-medium text-neutral-400 uppercase tracking-wide block mb-1.5">
              Saturation Character
            </label>
            <div className="grid grid-cols-4 gap-1 p-1 bg-[#0c0e14] rounded-lg border border-[#1e222e]">
              {(['warm', 'metallic', 'growl', 'crunch'] as const).map((color) => (
                <button
                  key={color}
                  onClick={() => onParamChange('harmonicColor', color)}
                  className={`py-1 text-[11px] font-medium rounded transition-colors capitalize ${
                    params.harmonicColor === color
                      ? 'bg-amber-500 text-neutral-950 font-semibold shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 justify-items-center">
            <Knob
              label="Drive"
              value={Math.round(params.harmonicDrive * 100)}
              defaultValue={30}
              unit="%"
              color="copper"
              onChange={(v) => onParamChange('harmonicDrive', v / 100)}
            />
            <Knob
              label="Odd/Even"
              value={Math.round((params.harmonicOddEven + 1) * 50)}
              defaultValue={60}
              unit="%"
              color="copper"
              onChange={(v) => onParamChange('harmonicOddEven', (v / 50) - 1)}
            />
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-[#1c202b] flex items-center justify-between text-[11px] text-neutral-400">
          <span>Oversampling</span>
          <span className="font-mono text-neutral-200">2x Non-Aliasing</span>
        </div>
      </div>

      {/* 5. Filter Section */}
      <div className="bg-[#11131a] border border-[#212532] rounded-xl p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#1c202b]">
            <h3 className="text-xs font-bold tracking-wider uppercase text-amber-500">
              5. Resonant Filter
            </h3>
            <span className="text-[10px] text-neutral-400 font-mono">Biquad Sculpting</span>
          </div>

          <div className="mb-4">
            <label className="text-[10px] font-medium text-neutral-400 uppercase tracking-wide block mb-1.5">
              Filter Mode
            </label>
            <div className="grid grid-cols-3 gap-1 p-1 bg-[#0c0e14] rounded-lg border border-[#1e222e]">
              {(['lowpass', 'bandpass', 'highcut'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => onParamChange('filterType', type)}
                  className={`py-1 text-[11px] font-medium rounded transition-colors capitalize ${
                    params.filterType === type
                      ? 'bg-amber-500 text-neutral-950 font-semibold shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 justify-items-center">
            <Knob
              label="Cutoff"
              value={params.filterCutoff}
              min={100}
              max={16000}
              step={50}
              defaultValue={3800}
              unit="Hz"
              color="amber"
              onChange={(v) => onParamChange('filterCutoff', v)}
            />
            <Knob
              label="Resonance"
              value={params.filterResonance}
              min={0.5}
              max={10.0}
              step={0.1}
              defaultValue={2.2}
              unit="Q"
              color="amber"
              onChange={(v) => onParamChange('filterResonance', v)}
            />
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-[#1c202b] flex items-center justify-between text-[11px] text-neutral-400">
          <span>Slope</span>
          <span className="font-mono text-neutral-200">-12 dB/Octave</span>
        </div>
      </div>

      {/* 6. Performance, Glide & Master Bus */}
      <div className="bg-[#11131a] border border-[#212532] rounded-xl p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#1c202b]">
            <h3 className="text-xs font-bold tracking-wider uppercase text-cyan-500">
              6. Performance & Master
            </h3>
            <span className="text-[10px] text-neutral-400 font-mono">Legato & Dynamics</span>
          </div>

          <div className="mb-4">
            <label className="text-[10px] font-medium text-neutral-400 uppercase tracking-wide block mb-1.5">
              Voice Mode
            </label>
            <div className="grid grid-cols-3 gap-1 p-1 bg-[#0c0e14] rounded-lg border border-[#1e222e]">
              {(['legato', 'mono', 'poly'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => onParamChange('polyphonyMode', mode)}
                  className={`py-1 text-[11px] font-medium rounded transition-colors uppercase ${
                    params.polyphonyMode === mode
                      ? 'bg-cyan-500 text-neutral-950 font-bold shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 justify-items-center">
            <Knob
              label="Glide Time"
              value={Math.round(params.glideTime * 1000)}
              min={0}
              max={250}
              defaultValue={40}
              unit="ms"
              color="cyan"
              onChange={(v) => onParamChange('glideTime', v / 1000)}
            />
            <Knob
              label="Velocity Sens"
              value={Math.round(params.velocitySensitivity * 100)}
              defaultValue={75}
              unit="%"
              color="cyan"
              onChange={(v) => onParamChange('velocitySensitivity', v / 100)}
            />
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-[#1c202b] flex items-center justify-between">
          <span className="text-[11px] text-neutral-400">Master Limiter Ceiling</span>
          <span className="text-[10px] font-mono text-cyan-400 font-bold">0.0 dBFS Safe</span>
        </div>
      </div>
    </div>
  );
};
