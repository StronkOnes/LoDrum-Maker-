/**
 * LoDrum Maker - Mode B: Step Sequencer & Pattern Creator
 * The Plugin Foundry | Section 6
 * Interactive 16/32 step grid, pitch lane, velocity bars, accents, slides, and algorithmic generator
 */

import React, { useState } from 'react';
import { SequencerPattern, SequencerStep } from '../audio/types';
import { ROOT_NOTES, SCALES, midiToNoteName, quantizeToScale } from '../sequencer/scales';
import { PatternGenerator, GenreStyle } from '../sequencer/patternGenerators';
import { Play, Pause, Square, Wand2, RefreshCw, ChevronLeft, ChevronRight, Volume2 } from 'lucide-react';
import { LoDrumEngine } from '../audio/LoDrumEngine';

interface PatternSequencerProps {
  pattern: SequencerPattern;
  currentStep: number;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onPatternChange: (pat: SequencerPattern) => void;
  onStepUpdate: (index: number, step: Partial<SequencerStep>) => void;
}

export const PatternSequencer: React.FC<PatternSequencerProps> = ({
  pattern,
  currentStep,
  isPlaying,
  onPlay,
  onPause,
  onStop,
  onPatternChange,
  onStepUpdate
}) => {
  const [showGenModal, setShowGenModal] = useState(false);
  const [genGenre, setGenGenre] = useState<GenreStyle>('amapiano_bounce');
  const [genDensity, setGenDensity] = useState(60);
  const [genComplexity, setGenComplexity] = useState(50);
  const [activePitchStep, setActivePitchStep] = useState<number | null>(null);

  const engine = LoDrumEngine.getInstance();

  const handleStepToggle = (index: number) => {
    const step = pattern.steps[index];
    const nextActive = !step.active;
    onStepUpdate(index, { active: nextActive });
    if (nextActive) {
      engine.triggerNote(step.note, step.velocity, step.slide);
    }
  };

  const handleVelocityChange = (index: number, val: number) => {
    onStepUpdate(index, { velocity: Math.max(1, Math.min(127, val)) });
  };

  const handleAccentToggle = (index: number) => {
    const step = pattern.steps[index];
    onStepUpdate(index, { accent: !step.accent });
  };

  const handleSlideToggle = (index: number) => {
    const step = pattern.steps[index];
    onStepUpdate(index, { slide: !step.slide });
  };

  const handlePitchSelect = (stepIndex: number, midiNote: number) => {
    onStepUpdate(stepIndex, { note: midiNote });
    engine.triggerNote(midiNote, 100);
    setActivePitchStep(null);
  };

  const handleGenerate = () => {
    const newPat = PatternGenerator.generate(genGenre, {
      length: pattern.length,
      bpm: pattern.bpm,
      swing: pattern.swing,
      density: genDensity,
      complexity: genComplexity,
      accentStrength: 65,
      rootNote: pattern.scaleRoot,
      scale: pattern.scaleType,
      baseOctave: 1
    });
    onPatternChange(newPat);
    setShowGenModal(false);
  };

  const handleClear = () => {
    const cleared = pattern.steps.map(s => ({ ...s, active: false }));
    onPatternChange({ ...pattern, steps: cleared });
  };

  const handleShift = (direction: 'left' | 'right') => {
    const len = pattern.steps.length;
    const newSteps = [...pattern.steps];
    if (direction === 'left') {
      const first = newSteps.shift();
      if (first) newSteps.push(first);
    } else {
      const last = newSteps.pop();
      if (last) newSteps.unshift(last);
    }
    onPatternChange({ ...pattern, steps: newSteps });
  };

  // Generate selectable pitches in octave 1 and 2
  const selectablePitches: number[] = [];
  for (let note = 24; note <= 60; note++) { // C0 to C3
    selectablePitches.push(note);
  }

  return (
    <div className="w-full bg-[#11131a] border border-[#212532] rounded-xl p-4 shadow-xl flex flex-col gap-4">
      {/* 1. Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#1d222e]">
        {/* Transport Controls */}
        <div className="flex items-center gap-2">
          {isPlaying ? (
            <button
              onClick={onPause}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold rounded-lg transition-colors shadow-sm"
              title="Pause Sequencer"
            >
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Pause</span>
            </button>
          ) : (
            <button
              onClick={onPlay}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-neutral-950 text-xs font-bold rounded-lg transition-colors shadow-sm"
              title="Play Sequencer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Play</span>
            </button>
          )}

          <button
            onClick={onStop}
            className="p-1.5 bg-[#171a24] hover:bg-[#202534] text-neutral-300 rounded-lg transition-colors border border-[#232838]"
            title="Stop & Reset to Step 1"
          >
            <Square className="w-3.5 h-3.5" />
          </button>

          <div className="h-5 w-px bg-[#202534] mx-1" />

          {/* BPM & Swing */}
          <div className="flex items-center gap-2 bg-[#0c0e14] px-2.5 py-1 rounded-lg border border-[#1e222e]">
            <span className="text-[10px] font-bold text-neutral-400 uppercase">BPM</span>
            <input
              type="number"
              min={50}
              max={220}
              value={pattern.bpm}
              onChange={(e) => onPatternChange({ ...pattern, bpm: Number(e.target.value) })}
              className="w-12 bg-transparent text-xs font-mono text-amber-400 font-bold focus:outline-none tabular-nums text-center"
            />
          </div>

          <div className="flex items-center gap-2 bg-[#0c0e14] px-2.5 py-1 rounded-lg border border-[#1e222e]">
            <span className="text-[10px] font-bold text-neutral-400 uppercase">Swing</span>
            <input
              type="range"
              min={0}
              max={75}
              value={pattern.swing}
              onChange={(e) => onPatternChange({ ...pattern, swing: Number(e.target.value) })}
              className="w-14 accent-amber-500 h-1.5 bg-neutral-800 rounded cursor-pointer"
            />
            <span className="text-[11px] font-mono text-neutral-300 tabular-nums w-7 text-right">
              {pattern.swing}%
            </span>
          </div>
        </div>

        {/* Musical Context & Length */}
        <div className="flex items-center gap-2">
          {/* Root Note */}
          <select
            value={pattern.scaleRoot}
            onChange={(e) => onPatternChange({ ...pattern, scaleRoot: e.target.value })}
            className="bg-[#0c0e14] text-neutral-200 text-xs px-2 py-1.5 rounded-lg border border-[#1e222e] focus:outline-none cursor-pointer"
          >
            {ROOT_NOTES.map((r) => (
              <option key={r} value={r}>
                Key: {r}
              </option>
            ))}
          </select>

          {/* Scale */}
          <select
            value={pattern.scaleType}
            onChange={(e) => onPatternChange({ ...pattern, scaleType: e.target.value })}
            className="bg-[#0c0e14] text-neutral-200 text-xs px-2 py-1.5 rounded-lg border border-[#1e222e] focus:outline-none cursor-pointer"
          >
            {SCALES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Pattern Length */}
          <div className="flex items-center p-0.5 bg-[#0c0e14] rounded-lg border border-[#1e222e]">
            <button
              onClick={() => {
                if (pattern.length !== 16) {
                  onPatternChange({
                    ...pattern,
                    length: 16,
                    steps: pattern.steps.slice(0, 16)
                  });
                }
              }}
              className={`px-2 py-1 text-[11px] font-semibold rounded ${
                pattern.length === 16 ? 'bg-amber-500 text-neutral-950' : 'text-neutral-400 hover:text-white'
              }`}
            >
              16
            </button>
            <button
              onClick={() => {
                if (pattern.length !== 32) {
                  const newSteps = [...pattern.steps];
                  while (newSteps.length < 32) {
                    newSteps.push({ ...newSteps[newSteps.length % 16] });
                  }
                  onPatternChange({ ...pattern, length: 32, steps: newSteps });
                }
              }}
              className={`px-2 py-1 text-[11px] font-semibold rounded ${
                pattern.length === 32 ? 'bg-amber-500 text-neutral-950' : 'text-neutral-400 hover:text-white'
              }`}
            >
              32
            </button>
          </div>

          {/* Generator Modal Button */}
          <button
            onClick={() => setShowGenModal(!showGenModal)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-neutral-950 text-xs font-bold rounded-lg transition-all shadow-sm"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Generate</span>
          </button>
        </div>
      </div>

      {/* Algorithmic Generator Drawer / Inline Panel */}
      {showGenModal && (
        <div className="bg-[#0e1017] border border-amber-500/30 rounded-xl p-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#1e2330]">
            <div className="flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-bold text-neutral-100 uppercase tracking-wide">
                Genre Pattern Generator
              </span>
            </div>
            <span className="text-[11px] text-neutral-400">
              Generates editable rhythmic phrases
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            {/* Style Selector */}
            <div>
              <label className="text-[10px] font-medium text-neutral-400 uppercase tracking-wide block mb-1">
                Genre Style
              </label>
              <select
                value={genGenre}
                onChange={(e) => setGenGenre(e.target.value as GenreStyle)}
                className="w-full bg-[#141822] text-xs text-neutral-200 p-2 rounded-lg border border-[#232838] focus:outline-none"
              >
                <option value="amapiano_bounce">Amapiano Bounce (3-3-2 Slide)</option>
                <option value="gqom_bass">Gqom Percussive Bass (Heavy Pulse)</option>
                <option value="deep_log">Deep Log Drum (Sparse Sub)</option>
                <option value="dark_pulse">Dark Club Pulse (Driving 8ths)</option>
                <option value="rolling_phrase">Rolling Phrase (Log Rolls)</option>
                <option value="minimal_groove">Minimal Groove (Pocket Sub)</option>
                <option value="experimental_bounce">Experimental Bounce (Polyrhythm)</option>
              </select>
            </div>

            {/* Density */}
            <div>
              <div className="flex justify-between text-[10px] text-neutral-400 uppercase mb-1">
                <span>Rhythmic Density</span>
                <span className="font-mono text-neutral-200">{genDensity}%</span>
              </div>
              <input
                type="range"
                min={20}
                max={90}
                value={genDensity}
                onChange={(e) => setGenDensity(Number(e.target.value))}
                className="w-full accent-amber-500 h-1.5 bg-[#141822] rounded cursor-pointer"
              />
            </div>

            {/* Complexity */}
            <div>
              <div className="flex justify-between text-[10px] text-neutral-400 uppercase mb-1">
                <span>Pitch Variation & Slides</span>
                <span className="font-mono text-neutral-200">{genComplexity}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={90}
                value={genComplexity}
                onChange={(e) => setGenComplexity(Number(e.target.value))}
                className="w-full accent-cyan-500 h-1.5 bg-[#141822] rounded cursor-pointer"
              />
            </div>

            {/* Action */}
            <div className="flex items-center gap-2 pt-3">
              <button
                onClick={handleGenerate}
                className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-md"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Create Pattern</span>
              </button>
              <button
                onClick={() => setShowGenModal(false)}
                className="px-3 py-2 bg-[#1b1f2b] hover:bg-[#252a3a] text-neutral-300 text-xs rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Step Grid Visualizer */}
      <div className="overflow-x-auto custom-scrollbar pb-2">
        <div className="min-w-[700px] flex flex-col gap-2">
          {/* Beat Numbers Bar */}
          <div className="grid grid-cols-16 gap-1.5">
            {pattern.steps.slice(0, pattern.length).map((_, i) => {
              const isBarStart = i % 4 === 0;
              const isPlayhead = isPlaying && currentStep === i;
              return (
                <div
                  key={i}
                  className={`text-center py-1 text-[10px] font-mono rounded transition-colors ${
                    isPlayhead
                      ? 'bg-cyan-500 text-neutral-950 font-bold shadow-sm'
                      : isBarStart
                      ? 'bg-[#181c26] text-neutral-300 font-semibold'
                      : 'text-neutral-400'
                  }`}
                >
                  {i + 1}
                </div>
              );
            })}
          </div>

          {/* Trigger Step Buttons */}
          <div className="grid grid-cols-16 gap-1.5">
            {pattern.steps.slice(0, pattern.length).map((step, i) => {
              const isPlayhead = isPlaying && currentStep === i;
              const isBarStart = i % 4 === 0;

              return (
                <button
                  key={i}
                  onClick={() => handleStepToggle(i)}
                  className={`h-14 rounded-lg flex flex-col items-center justify-between p-1.5 transition-all relative border ${
                    step.active
                      ? step.accent
                        ? 'bg-amber-500 text-neutral-950 border-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                        : 'bg-amber-600 text-neutral-950 border-amber-500'
                      : isBarStart
                      ? 'bg-[#151822] border-[#252b3b] hover:bg-[#1c202e]'
                      : 'bg-[#0f1118] border-[#1d212c] hover:bg-[#181b24]'
                  } ${isPlayhead ? 'ring-2 ring-cyan-400 scale-[1.02]' : ''}`}
                >
                  {/* Step Active LED */}
                  <div
                    className={`w-2 h-2 rounded-full ${
                      step.active
                        ? step.accent
                          ? 'bg-neutral-950'
                          : 'bg-amber-200'
                        : 'bg-neutral-800'
                    }`}
                  />

                  {/* Note Label */}
                  <span
                    className={`text-[10px] font-mono font-bold ${
                      step.active ? 'text-neutral-950' : 'text-neutral-400'
                    }`}
                  >
                    {step.active ? midiToNoteName(step.note) : '—'}
                  </span>

                  {/* Slide Indicator */}
                  {step.slide && step.active && (
                    <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-cyan-300" title="Slide active" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Pitch Editor Lane */}
          <div className="grid grid-cols-16 gap-1.5 items-center">
            {pattern.steps.slice(0, pattern.length).map((step, i) => (
              <div key={i} className="relative">
                <button
                  onClick={() => setActivePitchStep(activePitchStep === i ? null : i)}
                  className={`w-full py-1 text-[10px] font-mono rounded border transition-colors ${
                    step.active
                      ? 'bg-[#181d28] text-amber-300 border-amber-500/40 hover:bg-[#202736]'
                      : 'bg-[#10121a] text-neutral-400 border-transparent'
                  }`}
                  title="Change Note Pitch"
                >
                  {midiToNoteName(step.note)}
                </button>

                {/* Pitch Dropdown Popover */}
                {activePitchStep === i && (
                  <div className="absolute bottom-full mb-1 left-0 z-30 w-32 max-h-48 overflow-y-auto custom-scrollbar bg-[#161a25] border border-[#2b3244] rounded-lg shadow-2xl p-1">
                    <div className="text-[9px] font-bold text-neutral-400 uppercase p-1">
                      Select Pitch
                    </div>
                    {selectablePitches.map((p) => {
                      const isCurrent = step.note === p;
                      const noteName = midiToNoteName(p);
                      return (
                        <button
                          key={p}
                          onClick={() => handlePitchSelect(i, p)}
                          className={`w-full text-left px-2 py-1 text-[11px] font-mono rounded flex items-center justify-between ${
                            isCurrent
                              ? 'bg-amber-500 text-neutral-950 font-bold'
                              : 'text-neutral-300 hover:bg-[#222838]'
                          }`}
                        >
                          <span>{noteName}</span>
                          <span className="text-[9px] opacity-60">MIDI {p}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Accent & Slide Toggles */}
          <div className="grid grid-cols-16 gap-1.5">
            {pattern.steps.slice(0, pattern.length).map((step, i) => (
              <div key={i} className="flex gap-1">
                <button
                  onClick={() => handleAccentToggle(i)}
                  className={`flex-1 py-0.5 text-[9px] font-bold rounded transition-colors uppercase ${
                    step.accent && step.active
                      ? 'bg-amber-500 text-neutral-950'
                      : 'bg-[#12141c] text-neutral-400 hover:text-neutral-300'
                  }`}
                  title="Toggle Accent"
                >
                  Acc
                </button>
                <button
                  onClick={() => handleSlideToggle(i)}
                  className={`flex-1 py-0.5 text-[9px] font-bold rounded transition-colors uppercase ${
                    step.slide && step.active
                      ? 'bg-cyan-500 text-neutral-950'
                      : 'bg-[#12141c] text-neutral-400 hover:text-neutral-300'
                  }`}
                  title="Toggle Slide"
                >
                  Sld
                </button>
              </div>
            ))}
          </div>

          {/* Velocity Sliders Lane */}
          <div className="grid grid-cols-16 gap-1.5 items-end h-16 pt-2 bg-[#0c0e14] rounded-lg p-1.5 border border-[#1b1f2b]">
            {pattern.steps.slice(0, pattern.length).map((step, i) => {
              const velHeight = `${Math.round((step.velocity / 127) * 100)}%`;
              return (
                <div
                  key={i}
                  className="h-full flex flex-col justify-end items-center cursor-pointer group"
                  onClick={() => {
                    const nextVel = step.velocity > 100 ? 60 : 115;
                    handleVelocityChange(i, nextVel);
                  }}
                  title={`Velocity: ${step.velocity}`}
                >
                  <div
                    className={`w-full rounded-t transition-all ${
                      step.active
                        ? step.accent
                          ? 'bg-amber-400 group-hover:bg-amber-300'
                          : 'bg-amber-600 group-hover:bg-amber-500'
                        : 'bg-neutral-800'
                    }`}
                    style={{ height: step.active ? velHeight : '15%' }}
                  />
                  <span className="text-[8px] font-mono text-neutral-400 mt-1 tabular-nums">
                    {step.active ? step.velocity : '·'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Footer Helpers */}
      <div className="flex items-center justify-between pt-2 border-t border-[#1d222e] text-xs text-neutral-400">
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleShift('left')}
            className="flex items-center gap-1 hover:text-neutral-200 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Shift Left</span>
          </button>
          <button
            onClick={() => handleShift('right')}
            className="flex items-center gap-1 hover:text-neutral-200 transition-colors"
          >
            <span>Shift Right</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <span>·</span>
          <button
            onClick={handleClear}
            className="hover:text-red-400 transition-colors"
          >
            Clear Grid
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-neutral-400">
            Click step to toggle · Click note for pitch · Click bar for velocity
          </span>
        </div>
      </div>
    </div>
  );
};
